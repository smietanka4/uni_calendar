package com.unicalendar.controller;

import com.unicalendar.dto.CalendarDto;
import com.unicalendar.dto.CourseDto;
import com.unicalendar.exception.ResourceNotFoundException;
import com.unicalendar.model.Calendar;
import com.unicalendar.model.CalendarType;
import com.unicalendar.model.Course;
import com.unicalendar.repository.CalendarRepository;
import com.unicalendar.repository.CourseRepository;
import com.unicalendar.service.CourseService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;

/**
 * Publiczny kontroler – dostęp do kalendarzy BEZ logowania.
 * Pozwala przeglądać harmonogramy publiczne (isPublic=true).
 */
@RestController
@RequestMapping("/api/public")
@RequiredArgsConstructor
@Tag(name = "public", description = "Publiczny dostęp do kalendarzy (bez logowania)")
public class PublicCalendarController {

    private final CalendarRepository calendarRepository;
    private final CourseRepository courseRepository;
    private final CourseService courseService;

    @GetMapping("/calendars/{id}")
    @Operation(summary = "Pobierz publiczny kalendarz (bez JWT)")
    public ResponseEntity<CalendarDto> getPublicCalendar(@PathVariable UUID id) {
        Calendar cal = calendarRepository.findByIdAndIsPublicTrue(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Publiczny kalendarz nie istnieje lub nie jest udostępniony."));

        CalendarDto dto = CalendarDto.builder()
                .id(cal.getId())
                .name(cal.getName())
                .description(cal.getDescription())
                .ownerId(cal.getOwner().getId())
                .ownerName(cal.getOwner().getUsername())
                .isOwner(false)
                .isSubscriber(false)
                .subscribers(List.of())
                .color(cal.getColor())
                .visible(true)
                .isPublic(true)
                .calendarType(cal.getCalendarType() != null ? cal.getCalendarType() : CalendarType.PERSONAL)
                .build();

        return ResponseEntity.ok(dto);
    }

    @GetMapping("/calendars/{id}/week")
    @Operation(summary = "Publiczny widok tygodniowy (bez JWT)")
    public ResponseEntity<List<CourseDto>> getPublicWeekView(
            @PathVariable UUID id,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate data) {

        calendarRepository.findByIdAndIsPublicTrue(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Publiczny kalendarz nie istnieje lub nie jest udostępniony."));

        LocalDate targetDate = data != null ? data : LocalDate.now();
        LocalDate monday = targetDate.minusDays(
                targetDate.getDayOfWeek().getValue() - DayOfWeek.MONDAY.getValue());
        LocalDate sunday = monday.plusDays(6);

        List<Course> courses = courseRepository.findAllByCalendarId(id);

        List<CourseDto> results = courses.stream()
                .flatMap(course -> {
                    int delta = Math.floorMod(
                            course.getDayOfWeek() - course.getDateFrom().getDayOfWeek().getValue() + 1, 7);
                    LocalDate current = course.getDateFrom().plusDays(delta);
                    while (!current.isAfter(course.getDateTo())) {
                        if (!current.isBefore(monday) && !current.isAfter(sunday)) {
                            CourseDto dto = courseService.toDtoPublic(course);
                            dto.setOccurrenceDate(current.toString());
                            return Stream.of(dto);
                        }
                        current = current.plusWeeks(1);
                    }
                    return Stream.empty();
                })
                .sorted(Comparator.comparing(CourseDto::getOccurrenceDate)
                        .thenComparing(CourseDto::getStartTime))
                .collect(Collectors.toList());

        return ResponseEntity.ok(results);
    }

    @GetMapping("/calendars")
    @Operation(summary = "Lista wszystkich publicznych kalendarzy")
    public ResponseEntity<List<CalendarDto>> listPublicCalendars() {
        List<CalendarDto> dtos = calendarRepository.findByIsPublicTrueOrderByIdAsc().stream()
                .map(cal -> CalendarDto.builder()
                        .id(cal.getId())
                        .name(cal.getName())
                        .description(cal.getDescription())
                        .ownerId(cal.getOwner().getId())
                        .ownerName(cal.getOwner().getUsername())
                        .isOwner(false)
                        .isSubscriber(false)
                        .subscribers(List.of())
                        .color(cal.getColor())
                        .visible(true)
                        .isPublic(true)
                        .calendarType(cal.getCalendarType() != null ? cal.getCalendarType() : CalendarType.PERSONAL)
                        .build())
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }
}
