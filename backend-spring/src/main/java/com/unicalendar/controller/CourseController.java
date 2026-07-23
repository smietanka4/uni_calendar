package com.unicalendar.controller;

import com.unicalendar.dto.CourseCreateRequest;
import com.unicalendar.dto.CourseDto;
import com.unicalendar.model.User;
import com.unicalendar.service.CourseService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Kontroler zajęć – odpowiednik Django ZajeciaViewSet.
 */
@RestController
@RequestMapping("/api/courses")
@RequiredArgsConstructor
@Tag(name = "courses", description = "Zajęcia dydaktyczne")
public class CourseController {

    private final CourseService courseService;

    @GetMapping
    @Operation(summary = "Lista zajęć (własne + subskrybowane)")
    public ResponseEntity<List<CourseDto>> list(
            @AuthenticationPrincipal User user,
            @RequestParam(required = false, name = "calendar") UUID calendarId,
            @RequestParam(required = false) String q) {
        return ResponseEntity.ok(courseService.getCourses(user, calendarId, q));
    }

    @PostMapping
    @Operation(summary = "Dodaj zajęcia (do własnego kalendarza)")
    public ResponseEntity<CourseDto> create(
            @Valid @RequestBody CourseCreateRequest request,
            @AuthenticationPrincipal User user) {
        CourseDto dto = courseService.createCourse(request, user);
        return ResponseEntity.status(HttpStatus.CREATED).body(dto);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Pobierz zajęcia")
    public ResponseEntity<CourseDto> get(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(courseService.getCourse(id, user));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Zaktualizuj zajęcia")
    public ResponseEntity<CourseDto> update(
            @PathVariable Long id,
            @Valid @RequestBody CourseCreateRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(courseService.updateCourse(id, request, user));
    }

    @PatchMapping("/{id}")
    @Operation(summary = "Częściowa aktualizacja zajęć")
    public ResponseEntity<CourseDto> patch(
            @PathVariable Long id,
            @RequestBody CourseCreateRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(courseService.updateCourse(id, request, user));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Usuń zajęcia")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        courseService.deleteCourse(id, user);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/week")
    @Operation(summary = "Zajęcia na wybrany tydzień")
    public ResponseEntity<List<CourseDto>> week(
            @AuthenticationPrincipal User user,
            @RequestParam(required = false, name = "data")
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false, name = "calendar") UUID calendarId) {
        return ResponseEntity.ok(courseService.getWeekView(user, date, calendarId));
    }
}
