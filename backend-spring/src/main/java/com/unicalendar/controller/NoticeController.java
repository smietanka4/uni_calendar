package com.unicalendar.controller;

import com.unicalendar.dto.NoticeCreateRequest;
import com.unicalendar.dto.NoticeDto;
import com.unicalendar.model.User;
import com.unicalendar.service.NoticeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/calendars/{calendarId}/notices")
@RequiredArgsConstructor
@Tag(name = "notices", description = "Tablica ogłoszeń w kalendarzu")
@SecurityRequirement(name = "BearerAuth")
public class NoticeController {

    private final NoticeService noticeService;

    @GetMapping
    @Operation(summary = "Pobierz ogłoszenia kalendarza")
    public ResponseEntity<List<NoticeDto>> getNotices(
            @PathVariable UUID calendarId,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(noticeService.getNotices(calendarId, user));
    }

    @PostMapping
    @Operation(summary = "Dodaj nowe ogłoszenie (Właściciel / Collaborator)")
    public ResponseEntity<NoticeDto> createNotice(
            @PathVariable UUID calendarId,
            @Valid @RequestBody NoticeCreateRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(noticeService.createNotice(calendarId, request, user));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Usuń ogłoszenie")
    public ResponseEntity<Void> deleteNotice(
            @PathVariable UUID calendarId,
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        noticeService.deleteNotice(id, user);
        return ResponseEntity.noContent().build();
    }
}
