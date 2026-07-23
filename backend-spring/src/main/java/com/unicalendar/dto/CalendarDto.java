package com.unicalendar.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
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

    @Data
    @Builder
    @AllArgsConstructor
    public static class SubscriberDto {
        private Long id;
        private String username;
    }
}
