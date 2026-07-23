package com.unicalendar.service;

import com.unicalendar.dto.NoticeCreateRequest;
import com.unicalendar.dto.NoticeDto;
import com.unicalendar.exception.ForbiddenException;
import com.unicalendar.exception.ResourceNotFoundException;
import com.unicalendar.model.Calendar;
import com.unicalendar.model.CalendarRole;
import com.unicalendar.model.Notice;
import com.unicalendar.model.User;
import com.unicalendar.repository.CalendarRepository;
import com.unicalendar.repository.NoticeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NoticeService {

    private final NoticeRepository noticeRepository;
    private final CalendarRepository calendarRepository;
    private final org.springframework.messaging.simp.SimpMessagingTemplate messagingTemplate;

    public List<NoticeDto> getNotices(UUID calendarId, User user) {
        Calendar calendar = calendarRepository.findById(calendarId)
                .orElseThrow(() -> new ResourceNotFoundException("Kalendarz nie istnieje."));
        
        checkCanView(calendar, user);

        return noticeRepository.findAllByCalendarIdOrderByCreatedAtDesc(calendarId).stream()
                .map(n -> toDto(n, user, canModify(calendar, user)))
                .collect(Collectors.toList());
    }

    @Transactional
    public NoticeDto createNotice(UUID calendarId, NoticeCreateRequest request, User user) {
        Calendar calendar = calendarRepository.findById(calendarId)
                .orElseThrow(() -> new ResourceNotFoundException("Kalendarz nie istnieje."));

        if (!canModify(calendar, user)) {
            throw new ForbiddenException("Tylko właściciel kalendarza lub współtwórca może dodawać ogłoszenia.");
        }

        Notice notice = Notice.builder()
                .calendar(calendar)
                .author(user)
                .content(request.getContent())
                .createdAt(LocalDateTime.now())
                .build();

        notice = noticeRepository.save(notice);
        NoticeDto dto = toDto(notice, user, true);
        
        messagingTemplate.convertAndSend("/topic/calendar/" + calendarId, 
                java.util.Map.of("type", "NOTICE_CREATED", "payload", dto));
                
        return dto;
    }

    @Transactional
    public void deleteNotice(Long id, User user) {
        Notice notice = noticeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ogłoszenie nie istnieje."));

        if (!canModify(notice.getCalendar(), user)) {
            throw new ForbiddenException("Tylko właściciel kalendarza lub współtwórca może usuwać ogłoszenia.");
        }

        UUID calendarId = notice.getCalendar().getId();
        noticeRepository.delete(notice);
        
        messagingTemplate.convertAndSend("/topic/calendar/" + calendarId, 
                java.util.Map.of("type", "NOTICE_DELETED", "payload", java.util.Map.of("id", id)));
    }

    private void checkCanView(Calendar calendar, User user) {
        boolean isOwner = calendar.getOwner().getId().equals(user.getId());
        boolean isMember = calendar.getMembers().stream()
                .anyMatch(m -> m.getUser().getId().equals(user.getId()));
        
        if (!isOwner && !isMember) {
            throw new ForbiddenException("Nie masz dostępu do tego kalendarza.");
        }
    }

    private boolean canModify(Calendar calendar, User user) {
        if (calendar.getOwner().getId().equals(user.getId())) return true;
        return calendar.getMembers().stream()
                .anyMatch(m -> m.getUser().getId().equals(user.getId()) 
                        && m.getRole() == CalendarRole.COLLABORATOR);
    }

    private NoticeDto toDto(Notice notice, User user, boolean canModify) {
        return NoticeDto.builder()
                .id(notice.getId())
                .content(notice.getContent())
                .authorId(notice.getAuthor().getId())
                .authorName(notice.getAuthor().getUsername())
                .createdAt(notice.getCreatedAt())
                .canEdit(canModify)
                .build();
    }
}
