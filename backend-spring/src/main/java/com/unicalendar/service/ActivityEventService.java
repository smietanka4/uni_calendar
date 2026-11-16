package com.unicalendar.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.unicalendar.dto.ActivityEventDto;
import com.unicalendar.model.ActivityEvent;
import com.unicalendar.model.Calendar;
import com.unicalendar.model.User;
import com.unicalendar.repository.ActivityEventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class ActivityEventService {

    private final ActivityEventRepository repository;
    private final SimpMessagingTemplate messagingTemplate;
    private final ObjectMapper objectMapper;

    @Transactional
    public void logEvent(User actor, String verb, String targetType, String targetId, Calendar calendar, Object metadata) {
        String metadataJson = null;
        if (metadata != null) {
            try {
                metadataJson = objectMapper.writeValueAsString(metadata);
            } catch (JsonProcessingException e) {
                log.error("Failed to serialize metadata for activity event", e);
            }
        }

        ActivityEvent event = ActivityEvent.builder()
                .actor(actor)
                .verb(verb)
                .targetType(targetType)
                .targetId(targetId)
                .calendar(calendar)
                .metadata(metadataJson)
                .build();

        event = repository.save(event);
        ActivityEventDto dto = toDto(event);

        // Broadcast to followers of this calendar
        // Only if it's a public/group action. For now, send to a generic feed topic for the calendar
        if (calendar != null) {
            messagingTemplate.convertAndSend("/topic/feed/calendar/" + calendar.getId(), dto);
        }
    }

    public Page<ActivityEventDto> getFeedForUser(User user, Pageable pageable) {
        return repository.findFeedForUser(user.getId(), pageable).map(this::toDto);
    }

    private ActivityEventDto toDto(ActivityEvent event) {
        return ActivityEventDto.builder()
                .id(event.getId())
                .actorId(event.getActor().getId())
                .actorName(event.getActor().getUsername())
                .verb(event.getVerb())
                .targetType(event.getTargetType())
                .targetId(event.getTargetId())
                .calendarId(event.getCalendar() != null ? event.getCalendar().getId() : null)
                .calendarName(event.getCalendar() != null ? event.getCalendar().getName() : null)
                .metadata(event.getMetadata())
                .createdAt(event.getCreatedAt())
                .build();
    }
}
