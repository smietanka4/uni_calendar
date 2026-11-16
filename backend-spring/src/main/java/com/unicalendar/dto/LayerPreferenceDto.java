package com.unicalendar.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * DTO preferencji warstwy – co i jak wyświetlić per użytkownik.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LayerPreferenceDto {

    private Long id;

    @JsonProperty("calendar_id")
    private UUID calendarId;

    @JsonProperty("calendar_name")
    private String calendarName;

    /** Kolor efektywny – colorOverride jeśli ustawiony, inaczej kolor z Calendar */
    @JsonProperty("kolor")
    private String color;

    @JsonProperty("widoczna")
    private boolean visible;

    @JsonProperty("sort_order")
    private Integer sortOrder;
}
