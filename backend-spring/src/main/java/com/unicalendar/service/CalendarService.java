package com.unicalendar.service;

import com.unicalendar.dto.CalendarCreateRequest;
import com.unicalendar.dto.CalendarDto;
import com.unicalendar.exception.BadRequestException;
import com.unicalendar.exception.ForbiddenException;
import com.unicalendar.exception.ResourceNotFoundException;
import com.unicalendar.model.Calendar;
import com.unicalendar.model.CalendarMember;
import com.unicalendar.model.CalendarRole;
import com.unicalendar.model.User;
import com.unicalendar.repository.CalendarMemberRepository;
import com.unicalendar.repository.CalendarRepository;
import com.unicalendar.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Serwis kalendarzy z systemem ról (COLLABORATOR, FOLLOWER) i limitem 5 sztuk.
 */
@Service
@RequiredArgsConstructor
public class CalendarService {

    private final CalendarRepository calendarRepository;
    private final CalendarMemberRepository calendarMemberRepository;
    private final UserRepository userRepository;

    public List<CalendarDto> getCalendars(User user) {
        return calendarRepository.findAllByOwnerOrSubscriber(user).stream()
                .map(cal -> toDto(cal, user))
                .collect(Collectors.toList());
    }

    public CalendarDto getCalendar(UUID id, User user) {
        Calendar cal = findCalendarOrThrow(id);
        return toDto(cal, user);
    }

    @Transactional
    public CalendarDto createCalendar(CalendarCreateRequest request, User user) {
        if (calendarRepository.countByOwner(user) >= 5) {
            throw new BadRequestException("Osiągnąłeś limit 5 własnych kalendarzy.");
        }

        Calendar calendar = Calendar.builder()
                .name(request.getName())
                .owner(user)
                .password(request.getPassword())
                .build();
        calendar = calendarRepository.save(calendar);
        return toDto(calendar, user);
    }

    @Transactional
    public CalendarDto updateCalendar(UUID id, CalendarCreateRequest request, User user) {
        Calendar calendar = findCalendarOrThrow(id);
        checkOwner(calendar, user);

        calendar.setName(request.getName());
        if (request.getPassword() != null) {
            calendar.setPassword(request.getPassword());
        }
        calendar = calendarRepository.save(calendar);
        return toDto(calendar, user);
    }

    @Transactional
    public void deleteCalendar(UUID id, User user) {
        Calendar calendar = findCalendarOrThrow(id);
        checkOwner(calendar, user);
        calendarRepository.delete(calendar);
    }

    @Transactional
    public String joinCalendar(UUID calendarId, String password, User user) {
        Calendar calendar = findCalendarOrThrow(calendarId);

        if (calendar.getPassword() != null && !calendar.getPassword().isBlank()
                && !calendar.getPassword().equals(password)) {
            throw new ForbiddenException("Nieprawidłowe hasło.");
        }

        if (calendar.getOwner().getId().equals(user.getId())) {
            throw new BadRequestException("Jesteś właścicielem tego kalendarza.");
        }

        if (calendarMemberRepository.findByCalendarIdAndUser(calendarId, user).isPresent()) {
            throw new BadRequestException("Już jesteś w tym kalendarzu.");
        }

        CalendarMember member = CalendarMember.builder()
                .calendar(calendar)
                .user(user)
                .role(CalendarRole.FOLLOWER) // Domyślna rola przy dołączaniu hasłem
                .build();
        calendar.getMembers().add(member);
        calendarRepository.save(calendar);

        return "Dołączono do kalendarza.";
    }

    @Transactional
    public String leaveCalendar(UUID id, User user) {
        Calendar calendar = findCalendarOrThrow(id);

        if (calendar.getOwner().getId().equals(user.getId())) {
            throw new BadRequestException("Nie możesz opuścić powiązanego własnego kalendarza.");
        }

        calendarMemberRepository.deleteByCalendarIdAndUser(id, user);
        return "Opuszczono kalendarz.";
    }

    @Transactional
    public String inviteUser(UUID calendarId, String username, User currentUser) {
        Calendar calendar = findCalendarOrThrow(calendarId);
        checkOwner(calendar, currentUser);

        User invitedUser = userRepository.findByUsername(username.trim())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Użytkownik \"" + username + "\" nie istnieje."
                ));

        if (invitedUser.getId().equals(currentUser.getId())) {
            throw new BadRequestException("Nie możesz zaprosić samego siebie.");
        }

        if (calendarMemberRepository.findByCalendarIdAndUser(calendarId, invitedUser).isPresent()) {
            throw new BadRequestException("Użytkownik \"" + username + "\" już ma dostęp do tego planu.");
        }

        // Zapraszamy jako COLLABORATOR
        CalendarMember member = CalendarMember.builder()
                .calendar(calendar)
                .user(invitedUser)
                .role(CalendarRole.COLLABORATOR)
                .build();
        calendar.getMembers().add(member);
        calendarRepository.save(calendar);

        return "Użytkownik \"" + username + "\" został zaproszony jako współtwórca.";
    }

    @Transactional
    public String kickUser(UUID calendarId, String username, User currentUser) {
        Calendar calendar = findCalendarOrThrow(calendarId);
        checkOwner(calendar, currentUser);

        User targetUser = userRepository.findByUsername(username.trim())
                .orElseThrow(() -> new ResourceNotFoundException("Użytkownik \"" + username + "\" nie istnieje."));

        CalendarMember member = calendarMemberRepository.findByCalendarIdAndUser(calendarId, targetUser)
                .orElseThrow(() -> new BadRequestException("Użytkownik \"" + username + "\" nie jest w tym planie."));

        calendar.getMembers().remove(member);
        calendarMemberRepository.delete(member);

        return "Użytkownik \"" + username + "\" został usunięty z planu.";
    }

    // ── Helpery ──────────────────────────────────────────────────────────

    private Calendar findCalendarOrThrow(UUID id) {
        return calendarRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Kalendarz nie istnieje."));
    }

    private void checkOwner(Calendar calendar, User user) {
        if (!calendar.getOwner().getId().equals(user.getId())) {
            throw new ForbiddenException("Tylko właściciel może wykonać tę operację.");
        }
    }

    public CalendarDto toDto(Calendar cal, User currentUser) {
        boolean isOwner = cal.getOwner().getId().equals(currentUser.getId());
        boolean isSubscriber = cal.getMembers().stream()
                .anyMatch(m -> m.getUser().getId().equals(currentUser.getId()));

        List<CalendarDto.SubscriberDto> subscribersList = isOwner
                ? cal.getMembers().stream()
                    .map(m -> CalendarDto.SubscriberDto.builder()
                            .id(m.getUser().getId())
                            .username(m.getUser().getUsername() + " (" + m.getRole().name() + ")")
                            .build())
                    .collect(Collectors.toList())
                : List.of();

        return CalendarDto.builder()
                .id(cal.getId())
                .name(cal.getName())
                .ownerId(cal.getOwner().getId())
                .ownerName(cal.getOwner().getUsername())
                .isOwner(isOwner)
                .isSubscriber(isSubscriber)
                .subscribers(subscribersList)
                .build();
    }
}
