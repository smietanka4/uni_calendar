package com.unicalendar.controller;

import com.unicalendar.dto.MatchmakingRequest;
import com.unicalendar.dto.MatchmakingResponse;
import com.unicalendar.service.MatchmakingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/matchmaking")
@RequiredArgsConstructor
@Tag(name = "matchmaking", description = "Inteligentne wyszukiwanie wspólnych wolnych terminów")
public class MatchmakingController {

    private final MatchmakingService matchmakingService;

    @PostMapping("/find-slots")
    @Operation(summary = "Znajdź wspólne wolne okienka dla wielu użytkowników")
    public ResponseEntity<MatchmakingResponse> findSlots(@RequestBody MatchmakingRequest request) {
        return ResponseEntity.ok(matchmakingService.findSlots(request));
    }
}
