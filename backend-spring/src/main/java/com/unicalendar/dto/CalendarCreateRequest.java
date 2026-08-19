package com.unicalendar.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.unicalendar.model.CalendarType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * Request DTO do tworzenia/aktualizacji kalendarza.
 */
@Data
public class CalendarCreateRequest {

    @NotBlank(message = "Nazwa kalendarza jest wymagana.")
    @Size(max = 200)
    @JsonProperty("nazwa")
    private String name;

    @JsonProperty("haslo")
    private String password;

    @JsonProperty("opis")
    private String description;

    /** Kolor warstwy (hex, np. #3b82f6) */
    @JsonProperty("kolor")
    private String color;

    /** Czy kalendarz ma być publicznie dostępny */
    @JsonProperty("publiczny")
    private Boolean isPublic;

    /** Typ kalendarza */
    @JsonProperty("typ")
    private CalendarType calendarType;
}
