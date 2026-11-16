package com.unicalendar.controller;

import com.unicalendar.dto.CalendarCreateRequest;
import com.unicalendar.dto.CalendarDto;
import com.unicalendar.model.CalendarType;
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

@RestController
@RequestMapping("/api/spaces")
@RequiredArgsConstructor
@Tag(name = "spaces", description = "Zarządzanie pokojami (Spaces)")
public class SpaceController {

    private final CalendarService calendarService;

    @PostMapping
    @Operation(summary = "Utwórz nowy Pokój (Space)")
    public ResponseEntity<CalendarDto> createSpace(
            @Valid @RequestBody CalendarCreateRequest request,
            @AuthenticationPrincipal User user) {
        
        request.setCalendarType(CalendarType.SPACE);
        CalendarDto dto = calendarService.createCalendar(request, user);
        return ResponseEntity.status(HttpStatus.CREATED).body(dto);
    }
}
