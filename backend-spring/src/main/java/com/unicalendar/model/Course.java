package com.unicalendar.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalTime;

/**
 * Course (Zajęcia) – odpowiednik Django model Zajecia.
 */
@Entity
@Table(name = "courses")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Course {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "calendar_id", nullable = false)
    private Calendar calendar;

    @Column(nullable = false, length = 200)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 3)
    private CourseType type;

    @Column(name = "day_of_week", nullable = false)
    private Integer dayOfWeek;   // 0 = Poniedziałek, 6 = Niedziela

    @Column(name = "start_time", nullable = false)
    private LocalTime startTime;

    @Builder.Default
    @Column(name = "duration_minutes", nullable = false)
    private Integer durationMinutes = 90;

    @Column(name = "date_from", nullable = false)
    private LocalDate dateFrom;

    @Column(name = "date_to", nullable = false)
    private LocalDate dateTo;

    @Column(length = 50)
    private String room;

    @Column(length = 100)
    private String instructor;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "source_course_id")
    private Long sourceCourseId;

    /**
     * Oblicza godzinę zakończenia na podstawie startTime + durationMinutes.
     */
    public LocalTime getEndTime() {
        return startTime.plusMinutes(durationMinutes);
    }
}
