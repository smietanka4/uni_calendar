package com.unicalendar.model;

import jakarta.persistence.*;
import lombok.*;

/**
 * Preferencje warstwy per użytkownik – przechowuje widoczność i nadpisanie
 * koloru każdego kalendarza dla konkretnego użytkownika.
 * Jeden rekord = jedna warstwa użytkownika.
 */
@Entity
@Table(
    name = "user_layer_preferences",
    uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "calendar_id"})
)
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class UserLayerPreference {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "calendar_id", nullable = false)
    private Calendar calendar;

    /** Czy warstwa jest aktualnie widoczna w widoku tygodniowym */
    @Builder.Default
    @Column(nullable = false)
    private boolean visible = true;

    /** Nadpisanie koloru kalendarza dla tego użytkownika (opcjonalne) */
    @Column(name = "color_override", length = 7)
    private String colorOverride;

    /** Kolejność warstw na liście */
    @Builder.Default
    @Column(name = "sort_order")
    private Integer sortOrder = 0;
}
