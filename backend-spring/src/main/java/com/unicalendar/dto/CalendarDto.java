package com.unicalendar.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.unicalendar.model.CalendarType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.util.List;
import java.util.UUID;

/**
 * DTO kalendarza – odpowiednik Django KalendarzSerializer.
 * Nazwy pól JSON zachowują kompatybilność z frontendem (polskie klucze).
 */
@Data
@Builder
@AllArgsConstructor
public class CalendarDto {
    private UUID id;

    @JsonProperty("nazwa")
    private String name;

    @JsonProperty("opis")
    private String description;

    @JsonProperty("wlasciciel")
    private Long ownerId;

    @JsonProperty("wlasciciel_nazwa")
    private String ownerName;

    @JsonProperty("czy_wlasciciel")
    private boolean isOwner;

    @JsonProperty("jest_subskrybentem")
    private boolean isSubscriber;

    @JsonProperty("subskrybenci_lista")
    private List<SubscriberDto> subscribers;

    /** Kolor warstwy (hex) – z preferencji lub domyślny z kalendarza */
    @Builder.Default
    @JsonProperty("kolor")
    private String color = "#3b82f6";

    /** Czy warstwa jest włączona w widoku (z preferencji użytkownika) */
    @Builder.Default
    @JsonProperty("widoczna")
    private boolean visible = true;

    /** Czy kalendarz jest publiczny */
    @JsonProperty("publiczny")
    private boolean isPublic;

    /** Typ: PERSONAL, SPACE, TEMPLATE */
    @JsonProperty("typ")
    private CalendarType calendarType;

    @Data
    @Builder
    @AllArgsConstructor
    public static class SubscriberDto {
        private Long id;
        private String username;
        private String role; // "COLLABORATOR" lub "FOLLOWER"
    }
}
