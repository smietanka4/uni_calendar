package com.unicalendar.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ActivityEventDto {
    private Long id;

    @JsonProperty("actor_id")
    private Long actorId;

    @JsonProperty("actor_name")
    private String actorName;

    @JsonProperty("verb")
    private String verb;

    @JsonProperty("target_type")
    private String targetType;

    @JsonProperty("target_id")
    private String targetId;

    @JsonProperty("calendar_id")
    private UUID calendarId;

    @JsonProperty("calendar_name")
    private String calendarName;

    @JsonProperty("metadata")
    private String metadata; // JSON string with additional data

    @JsonProperty("created_at")
    private LocalDateTime createdAt;
}
