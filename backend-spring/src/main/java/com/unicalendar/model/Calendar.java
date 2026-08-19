package com.unicalendar.model;

import jakarta.persistence.*;
import lombok.*;

import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

/**
 * Kalendarz – obsługuje role: PERSONAL, SPACE, TEMPLATE.
 * Pełni jednocześnie funkcję "warstwy" (Layer) w widoku tygodniowym.
 */
@Entity
@Table(name = "calendars")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Calendar {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 200)
    private String name;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @Column(length = 128)
    private String password;

    /** Kolor warstwy w widoku – hex, np. #3b82f6 */
    @Builder.Default
    @Column(length = 7)
    private String color = "#3b82f6";

    /** Czy kalendarz jest publicznie dostępny (bez logowania) */
    @Builder.Default
    @Column(name = "is_public")
    private boolean isPublic = false;

    /** Typ kalendarza: PERSONAL, SPACE, TEMPLATE */
    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "calendar_type", length = 20)
    private CalendarType calendarType = CalendarType.PERSONAL;

    /** Opis kalendarza (widoczny publicznie) */
    @Column(columnDefinition = "TEXT")
    private String description;

    /** Źródłowy szablon, jeśli kalendarz został sforkowany */
    @Column(name = "source_template_id")
    private UUID sourceTemplateId;

    @Builder.Default
    @OneToMany(mappedBy = "calendar", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<CalendarMember> members = new HashSet<>();
}

