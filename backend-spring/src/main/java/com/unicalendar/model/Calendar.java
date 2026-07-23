package com.unicalendar.model;

import jakarta.persistence.*;
import lombok.*;

import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

/**
 * Kalendarz – odpowiednik Django model Kalendarz.
 * UUID jako klucz główny, ManyToMany subskrybenci.
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

    @Builder.Default
    @OneToMany(mappedBy = "calendar", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<CalendarMember> members = new HashSet<>();
}
