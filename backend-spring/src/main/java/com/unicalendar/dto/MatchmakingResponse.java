package com.unicalendar.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Data
@Builder
public class MatchmakingResponse {
    private List<Slot> slots;
    private List<String> participants;

    @Data
    @Builder
    public static class Slot {
        private LocalDate date;
        private LocalTime start;
        private LocalTime end;
        private int duration;
    }
}
