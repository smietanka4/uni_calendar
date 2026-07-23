package com.unicalendar.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "calendar_members")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class CalendarMember {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "calendar_id", nullable = false)
    private Calendar calendar;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private CalendarRole role;
}
