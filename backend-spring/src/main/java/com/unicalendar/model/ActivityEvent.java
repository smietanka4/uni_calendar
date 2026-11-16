package com.unicalendar.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Zdarzenie aktywności społecznościowej – podstawa pod "The Feed" (Sprint 2).
 * Przechowuje kto, co zrobił, z czym i kiedy.
 */
@Entity
@Table(
    name = "activity_events",
    indexes = {
        @Index(name = "idx_activity_calendar", columnList = "calendar_id, created_at DESC"),
        @Index(name = "idx_activity_actor",   columnList = "actor_id, created_at DESC")
    }
)
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class ActivityEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "actor_id", nullable = false)
    private User actor;

    /**
     * Czasownik akcji: JOINED, CREATED, UPDATED, DELETED, FORKED, FOLLOWED
     */
    @Column(nullable = false, length = 50)
    private String verb;

    /**
     * Typ celu: COURSE, CALENDAR, NOTICE
     */
    @Column(name = "target_type", nullable = false, length = 30)
    private String targetType;

    /**
     * ID celu (polimorficzny – Long lub UUID jako String)
     */
    @Column(name = "target_id", length = 100)
    private String targetId;

    /**
     * Kalendarz, w kontekście którego zaszła akcja (do filtrowania feedu)
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "calendar_id")
    private Calendar calendar;

    /**
     * Dodatkowe metadane w formacie JSON (nazwa eventu, stare/nowe wartości, itp.)
     */
    @Column(columnDefinition = "TEXT")
    private String metadata;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
    }
}
