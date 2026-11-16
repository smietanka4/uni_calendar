package com.unicalendar.controller;

import com.unicalendar.dto.LayerPreferenceDto;
import com.unicalendar.model.User;
import com.unicalendar.service.CalendarService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Kontroler preferencji warstw – zarządza widocznością i kolorami
 * kalendarzy (warstw) w widoku tygodniowym dla zalogowanego użytkownika.
 */
@RestController
@RequestMapping("/api/layer-preferences")
@RequiredArgsConstructor
@Tag(name = "layers", description = "Preferencje warstw kalendarzy")
public class LayerPreferenceController {

    private final CalendarService calendarService;

    @GetMapping
    @Operation(summary = "Pobierz preferencje warstw zalogowanego użytkownika")
    public ResponseEntity<List<LayerPreferenceDto>> getLayerPreferences(
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(calendarService.getLayerPreferences(user));
    }

    @PutMapping("/{calendarId}")
    @Operation(summary = "Zaktualizuj widoczność/kolor warstwy")
    public ResponseEntity<LayerPreferenceDto> updateLayerPreference(
            @PathVariable UUID calendarId,
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal User user) {

        boolean visible = body.containsKey("widoczna")
                ? (boolean) body.get("widoczna") : true;
        String colorOverride = (String) body.getOrDefault("kolor", null);

        LayerPreferenceDto result = calendarService.updateLayerPreference(
                calendarId, visible, colorOverride, user);

        return ResponseEntity.ok(result);
    }
}
