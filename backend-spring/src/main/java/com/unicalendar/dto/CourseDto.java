package com.unicalendar.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.unicalendar.model.CourseType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

/**
 * DTO zajęć – odpowiednik Django ZajeciaSerializer.
 * Nazwy pól JSON zachowują kompatybilność z frontendem (polskie klucze).
 */
@Data
@Builder
@AllArgsConstructor
public class CourseDto {
    private Long id;

    @JsonProperty("kalendarz")
    private UUID calendarId;

    @JsonProperty("kalendarz_nazwa")
    private String calendarName;

    @JsonProperty("nazwa")
    private String name;

    @JsonProperty("typ")
    private CourseType type;

    @JsonProperty("typ_display")
    private String typeDisplay;

    @JsonProperty("dzien_tygodnia")
    private Integer dayOfWeek;

    @JsonProperty("godzina_start")
    private LocalTime startTime;

    @JsonProperty("godzina_koniec")
    private String endTime;

    @JsonProperty("czas_trwania_min")
    private Integer durationMinutes;

    @JsonProperty("data_od")
    private LocalDate dateFrom;

    @JsonProperty("data_do")
    private LocalDate dateTo;

    @JsonProperty("sala")
    private String room;

    @JsonProperty("prowadzacy")
    private String instructor;

    @JsonProperty("notatki")
    private String notes;

    @JsonProperty("czy_wlasciciel")
    private boolean isOwner;

    // Opcjonalne – używane w widoku tygodniowym
    @JsonProperty("data_wystapienia")
    private String occurrenceDate;

    @JsonProperty("source_course_id")
    private Long sourceCourseId;
}
