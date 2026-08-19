package com.unicalendar.controller;

import com.unicalendar.dto.CalendarCreateRequest;
import com.unicalendar.dto.CalendarDto;
import com.unicalendar.dto.InviteKickRequest;
import com.unicalendar.dto.JoinRequest;
import com.unicalendar.model.User;
import com.unicalendar.service.CalendarService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Kontroler kalendarzy – odpowiednik Django KalendarzViewSet.
 */
@RestController
@RequestMapping("/api/calendars")
@RequiredArgsConstructor
@Tag(name = "calendars", description = "Zarządzanie planami i zaproszeniami")
public class CalendarController {

    private final CalendarService calendarService;

    @GetMapping
    @Operation(summary = "Lista własnych i subskrybowanych planów")
    public ResponseEntity<List<CalendarDto>> list(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(calendarService.getCalendars(user));
    }

    @PostMapping
    @Operation(summary = "Utwórz nowy kalendarz")
    public ResponseEntity<CalendarDto> create(
            @Valid @RequestBody CalendarCreateRequest request,
            @AuthenticationPrincipal User user) {
        CalendarDto dto = calendarService.createCalendar(request, user);
        return ResponseEntity.status(HttpStatus.CREATED).body(dto);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Pobierz kalendarz")
    public ResponseEntity<CalendarDto> get(
            @PathVariable UUID id,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(calendarService.getCalendar(id, user));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Zaktualizuj kalendarz")
    public ResponseEntity<CalendarDto> update(
            @PathVariable UUID id,
            @Valid @RequestBody CalendarCreateRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(calendarService.updateCalendar(id, request, user));
    }

    @PatchMapping("/{id}")
    @Operation(summary = "Częściowa aktualizacja kalendarza")
    public ResponseEntity<CalendarDto> patch(
            @PathVariable UUID id,
            @RequestBody CalendarCreateRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(calendarService.updateCalendar(id, request, user));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Usuń kalendarz")
    public ResponseEntity<Void> delete(
            @PathVariable UUID id,
            @AuthenticationPrincipal User user) {
        calendarService.deleteCalendar(id, user);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/join")
    @Operation(summary = "Dołącz do cudzego planu przez ID")
    public ResponseEntity<Map<String, String>> join(
            @RequestBody JoinRequest request,
            @AuthenticationPrincipal User user) {
        String message = calendarService.joinCalendar(request.getId(), request.getPassword(), user);
        return ResponseEntity.ok(Map.of("message", message));
    }

    @PostMapping("/{id}/leave")
    @Operation(summary = "Opuść subskrybowany plan")
    public ResponseEntity<Map<String, String>> leave(
            @PathVariable UUID id,
            @AuthenticationPrincipal User user) {
        String message = calendarService.leaveCalendar(id, user);
        return ResponseEntity.ok(Map.of("message", message));
    }

    @PostMapping("/{id}/invite")
    @Operation(summary = "Zaproś użytkownika po nazwie (z rolą: COLLABORATOR lub FOLLOWER)")
    public ResponseEntity<Map<String, String>> invite(
            @PathVariable UUID id,
            @Valid @RequestBody InviteKickRequest request,
            @AuthenticationPrincipal User user) {
        String message = calendarService.inviteUser(id, request.getUsername(), request.getRole(), user);
        return ResponseEntity.ok(Map.of("message", message));
    }

    @PostMapping("/{id}/change-role")
    @Operation(summary = "Zmień rolę użytkownika w planie (COLLABORATOR / FOLLOWER)")
    public ResponseEntity<Map<String, String>> changeRole(
            @PathVariable UUID id,
            @Valid @RequestBody InviteKickRequest request,
            @AuthenticationPrincipal User user) {
        String message = calendarService.changeRole(id, request.getUsername(), request.getRole(), user);
        return ResponseEntity.ok(Map.of("message", message));
    }

    @PostMapping("/{id}/kick")
    @Operation(summary = "Usuń użytkownika z planu")
    public ResponseEntity<Map<String, String>> kick(
            @PathVariable UUID id,
            @Valid @RequestBody InviteKickRequest request,
            @AuthenticationPrincipal User user) {
        String message = calendarService.kickUser(id, request.getUsername(), user);
        return ResponseEntity.ok(Map.of("message", message));
    }

    @PostMapping("/{id}/fork")
    @Operation(summary = "Sklonuj kalendarz (szablon) do swoich planów")
    public ResponseEntity<CalendarDto> fork(
            @PathVariable UUID id,
            @AuthenticationPrincipal User user) {
        CalendarDto dto = calendarService.forkCalendar(id, user);
        return ResponseEntity.status(HttpStatus.CREATED).body(dto);
    }
}
