package com.unicalendar.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.unicalendar.model.CourseType;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;

/**
 * Request DTO dla tworzenia/aktualizacji zajęć.
 * Akceptuje zarówno polskie nazwy pól (z frontendu) jak i angielskie.
 */
@Data
public class CourseCreateRequest {

    @NotBlank(message = "Nazwa zajęć jest wymagana.")
    @Size(max = 200)
    @JsonProperty("nazwa")
    private String name;

    @NotNull(message = "Typ zajęć jest wymagany.")
    @JsonProperty("typ")
    private CourseType type;

    @NotNull(message = "Dzień tygodnia jest wymagany.")
    @Min(value = 0, message = "Dzień tygodnia musi być od 0 (Poniedziałek) do 6 (Niedziela).")
    @Max(value = 6, message = "Dzień tygodnia musi być od 0 (Poniedziałek) do 6 (Niedziela).")
    @JsonProperty("dzien_tygodnia")
    private Integer dayOfWeek;

    @NotNull(message = "Godzina rozpoczęcia jest wymagana.")
    @JsonProperty("godzina_start")
    private LocalTime startTime;

    @Min(value = 15, message = "Czas trwania musi wynosić co najmniej 15 minut.")
    @Max(value = 480, message = "Czas trwania nie może przekraczać 480 minut.")
    @JsonProperty("czas_trwania_min")
    private Integer durationMinutes = 90;

    @NotNull(message = "Data rozpoczęcia jest wymagana.")
    @JsonProperty("data_od")
    private LocalDate dateFrom;

    @NotNull(message = "Data zakończenia jest wymagana.")
    @JsonProperty("data_do")
    private LocalDate dateTo;

    @Size(max = 50)
    @JsonProperty("sala")
    private String room;

    @Size(max = 100)
    @JsonProperty("prowadzacy")
    private String instructor;

    @JsonProperty("notatki")
    private String notes;
}
