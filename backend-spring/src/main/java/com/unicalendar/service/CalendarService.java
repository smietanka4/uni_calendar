package com.unicalendar.service;

import com.unicalendar.dto.CalendarCreateRequest;
import com.unicalendar.dto.CalendarDto;
import com.unicalendar.dto.LayerPreferenceDto;
import com.unicalendar.exception.BadRequestException;
import com.unicalendar.exception.ForbiddenException;
import com.unicalendar.exception.ResourceNotFoundException;
import com.unicalendar.model.*;
import com.unicalendar.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Serwis kalendarzy z systemem ról (COLLABORATOR, FOLLOWER),
 * limitem 5 sztuk, publicznym dostępem i preferencjami warstw.
 */
@Service
@RequiredArgsConstructor
public class CalendarService {

    private final CalendarRepository calendarRepository;
    private final CalendarMemberRepository calendarMemberRepository;
    private final UserRepository userRepository;
    private final UserLayerPreferenceRepository layerPreferenceRepository;
    private final ActivityEventService activityEventService;
    private final CourseRepository courseRepository;
    private final TemplateSubscriptionRepository templateSubscriptionRepository;

    // ── Podstawowe operacje CRUD ──────────────────────────────────────────

    public List<CalendarDto> getCalendars(User user) {
        List<Calendar> calendars = calendarRepository.findAllByOwnerOrSubscriber(user);
        return calendars.stream()
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
                .description(request.getDescription())
                .color(request.getColor() != null ? request.getColor() : "#3b82f6")
                .isPublic(request.getIsPublic() != null && request.getIsPublic())
                .calendarType(request.getCalendarType() != null
                        ? request.getCalendarType() : CalendarType.PERSONAL)
                .build();
        calendar = calendarRepository.save(calendar);

        // Automatycznie utwórz preferencję warstwy dla właściciela
        ensureLayerPreference(user, calendar);

        return toDto(calendar, user);
    }

    @Transactional
    public CalendarDto updateCalendar(UUID id, CalendarCreateRequest request, User user) {
        Calendar calendar = findCalendarOrThrow(id);
        checkOwner(calendar, user);

        calendar.setName(request.getName());
        if (request.getPassword() != null) calendar.setPassword(request.getPassword());
        if (request.getDescription() != null) calendar.setDescription(request.getDescription());
        if (request.getColor() != null) calendar.setColor(request.getColor());
        if (request.getIsPublic() != null) calendar.setPublic(request.getIsPublic());
        if (request.getCalendarType() != null) calendar.setCalendarType(request.getCalendarType());

        calendar = calendarRepository.save(calendar);
        return toDto(calendar, user);
    }

    @Transactional
    public void deleteCalendar(UUID id, User user) {
        Calendar calendar = findCalendarOrThrow(id);
        checkOwner(calendar, user);
        calendarRepository.delete(calendar);
    }

    // ── Dołączanie / opuszczanie ──────────────────────────────────────────

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
                .role(CalendarRole.FOLLOWER)
                .build();
        calendar.getMembers().add(member);
        calendarRepository.save(calendar);

        // Automatycznie utwórz preferencję warstwy dla nowego subskrybenta
        ensureLayerPreference(user, calendar);

        activityEventService.logEvent(user, "JOINED", "CALENDAR", String.valueOf(calendar.getId()), calendar,
                java.util.Map.of("calendar_name", calendar.getName()));

        return "Dołączono do kalendarza.";
    }

    @Transactional
    public String leaveCalendar(UUID id, User user) {
        Calendar calendar = findCalendarOrThrow(id);

        if (calendar.getOwner().getId().equals(user.getId())) {
            throw new BadRequestException("Nie możesz opuścić własnego kalendarza.");
        }

        calendarMemberRepository.deleteByCalendarIdAndUser(id, user);
        return "Opuszczono kalendarz.";
    }

    @Transactional
    public CalendarDto forkCalendar(UUID templateId, User user) {
        Calendar template = findCalendarOrThrow(templateId);
        
        boolean isMember = template.getMembers().stream().anyMatch(m -> m.getUser().getId().equals(user.getId()));
        boolean isOwner = template.getOwner().getId().equals(user.getId());
        
        if (!template.isPublic() && !isMember && !isOwner) {
            throw new ForbiddenException("Nie masz dostępu do tego kalendarza.");
        }

        if (calendarRepository.countByOwner(user) >= 5) {
            throw new BadRequestException("Osiągnąłeś limit 5 własnych kalendarzy.");
        }

        Calendar forked = Calendar.builder()
                .name(template.getName() + " (Fork)")
                .owner(user)
                .color(template.getColor())
                .calendarType(CalendarType.PERSONAL)
                .sourceTemplateId(templateId)
                .build();
        forked = calendarRepository.save(forked);
        ensureLayerPreference(user, forked);

        List<Course> courses = courseRepository.findAllByCalendarId(templateId);
        for (Course c : courses) {
            Course newCourse = Course.builder()
                    .calendar(forked)
                    .name(c.getName())
                    .instructor(c.getInstructor())
                    .room(c.getRoom())
                    .dayOfWeek(c.getDayOfWeek())
                    .startTime(c.getStartTime())
                    .durationMinutes(c.getDurationMinutes())
                    .type(c.getType())
                    .notes(c.getNotes())
                    .dateFrom(c.getDateFrom())
                    .dateTo(c.getDateTo())
                    .sourceCourseId(c.getId())
                    .build();
            courseRepository.save(newCourse);
        }

        TemplateSubscription sub = TemplateSubscription.builder()
                .template(template)
                .subscriber(user)
                .targetCalendar(forked)
                .autoSync(true)
                .build();
        templateSubscriptionRepository.save(sub);

        activityEventService.logEvent(user, "FORKED", "CALENDAR", String.valueOf(templateId), template,
                java.util.Map.of("forked_calendar_id", String.valueOf(forked.getId())));

        return toDto(forked, user);
    }

    // ── Zapraszanie / Usuwanie użytkowników ──────────────────────────────

    @Transactional
    public String inviteUser(UUID calendarId, String username, CalendarRole role, User currentUser) {
        Calendar calendar = findCalendarOrThrow(calendarId);
        checkOwner(calendar, currentUser);

        User invitedUser = userRepository.findByUsername(username.trim())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Użytkownik \"" + username + "\" nie istnieje."));

        if (invitedUser.getId().equals(currentUser.getId())) {
            throw new BadRequestException("Nie możesz zaprosić samego siebie.");
        }

        // Jeśli już istnieje – zaktualizuj rolę zamiast rzucać błędem
        Optional<CalendarMember> existing = calendarMemberRepository.findByCalendarIdAndUser(calendarId, invitedUser);
        if (existing.isPresent()) {
            existing.get().setRole(role != null ? role : CalendarRole.COLLABORATOR);
            calendarMemberRepository.save(existing.get());
            return "Rola użytkownika \"" + username + "\" została zaktualizowana.";
        }

        CalendarRole effectiveRole = role != null ? role : CalendarRole.COLLABORATOR;
        CalendarMember member = CalendarMember.builder()
                .calendar(calendar)
                .user(invitedUser)
                .role(effectiveRole)
                .build();
        calendar.getMembers().add(member);
        calendarRepository.save(calendar);

        ensureLayerPreference(invitedUser, calendar);

        String roleLabel = effectiveRole == CalendarRole.COLLABORATOR ? "współtwórca (zapis)" : "obserwator (tylko odczyt)";
        return "Użytkownik \"" + username + "\" został zaproszony jako " + roleLabel + ".";
    }

    @Transactional
    public String changeRole(UUID calendarId, String username, CalendarRole newRole, User currentUser) {
        Calendar calendar = findCalendarOrThrow(calendarId);
        checkOwner(calendar, currentUser);

        User targetUser = userRepository.findByUsername(username.trim())
                .orElseThrow(() -> new ResourceNotFoundException("Użytkownik \"" + username + "\" nie istnieje."));

        CalendarMember member = calendarMemberRepository.findByCalendarIdAndUser(calendarId, targetUser)
                .orElseThrow(() -> new BadRequestException("Użytkownik \"" + username + "\" nie jest w tym planie."));

        member.setRole(newRole);
        calendarMemberRepository.save(member);

        String roleLabel = newRole == CalendarRole.COLLABORATOR ? "współtwórca (zapis)" : "obserwator (tylko odczyt)";
        return "Rola użytkownika \"" + username + "\" zmieniona na: " + roleLabel + ".";
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

    // ── Preferencje Warstw ────────────────────────────────────────────────

    public List<LayerPreferenceDto> getLayerPreferences(User user) {
        // Upewnij się że istnieją preferencje dla wszystkich kalendarzy użytkownika
        List<Calendar> userCalendars = calendarRepository.findAllByOwnerOrSubscriber(user);
        for (Calendar cal : userCalendars) {
            ensureLayerPreference(user, cal);
        }

        return layerPreferenceRepository.findAllByUserOrderBySortOrderAsc(user).stream()
                .map(p -> toLayerDto(p))
                .collect(Collectors.toList());
    }

    @Transactional
    public LayerPreferenceDto updateLayerPreference(UUID calendarId, boolean visible,
                                                     String colorOverride, User user) {
        Calendar calendar = findCalendarOrThrow(calendarId);

        UserLayerPreference pref = layerPreferenceRepository
                .findByUserAndCalendarId(user, calendarId)
                .orElseGet(() -> UserLayerPreference.builder()
                        .user(user)
                        .calendar(calendar)
                        .build());

        pref.setVisible(visible);
        if (colorOverride != null) pref.setColorOverride(colorOverride);

        pref = layerPreferenceRepository.save(pref);
        return toLayerDto(pref);
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

    /** Tworzy preferencję warstwy jeśli jeszcze nie istnieje */
    private void ensureLayerPreference(User user, Calendar calendar) {
        if (layerPreferenceRepository.findByUserAndCalendar(user, calendar).isEmpty()) {
            layerPreferenceRepository.save(UserLayerPreference.builder()
                    .user(user)
                    .calendar(calendar)
                    .visible(true)
                    .build());
        }
    }

    // ── Mapowanie na DTO ──────────────────────────────────────────────────

    public CalendarDto toDto(Calendar cal, User currentUser) {
        boolean isOwner = cal.getOwner().getId().equals(currentUser.getId());
        boolean isSubscriber = cal.getMembers().stream()
                .anyMatch(m -> m.getUser().getId().equals(currentUser.getId()));

        // Pobierz preferencje warstwy dla tego użytkownika
        Optional<UserLayerPreference> pref = layerPreferenceRepository
                .findByUserAndCalendar(currentUser, cal);

        String effectiveColor = pref
                .map(p -> p.getColorOverride() != null ? p.getColorOverride() : cal.getColor())
                .orElse(cal.getColor());
        boolean visible = pref.map(UserLayerPreference::isVisible).orElse(true);

        List<CalendarDto.SubscriberDto> subscribersList = isOwner
                ? cal.getMembers().stream()
                    .map(m -> CalendarDto.SubscriberDto.builder()
                            .id(m.getUser().getId())
                            .username(m.getUser().getUsername())
                            .role(m.getRole().name())
                            .build())
                    .collect(Collectors.toList())
                : List.of();

        return CalendarDto.builder()
                .id(cal.getId())
                .name(cal.getName())
                .description(cal.getDescription())
                .ownerId(cal.getOwner().getId())
                .ownerName(cal.getOwner().getUsername())
                .isOwner(isOwner)
                .isSubscriber(isSubscriber)
                .subscribers(subscribersList)
                .color(effectiveColor)
                .visible(visible)
                .isPublic(cal.isPublic())
                .calendarType(cal.getCalendarType())
                .build();
    }

    private LayerPreferenceDto toLayerDto(UserLayerPreference pref) {
        String color = pref.getColorOverride() != null
                ? pref.getColorOverride()
                : pref.getCalendar().getColor();
        return LayerPreferenceDto.builder()
                .id(pref.getId())
                .calendarId(pref.getCalendar().getId())
                .calendarName(pref.getCalendar().getName())
                .color(color)
                .visible(pref.isVisible())
                .sortOrder(pref.getSortOrder())
                .build();
    }
}
