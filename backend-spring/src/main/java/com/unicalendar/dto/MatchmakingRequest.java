package com.unicalendar.dto;

import lombok.Data;
import java.time.LocalDate;
import java.util.List;

@Data
public class MatchmakingRequest {
    private List<Long> userIds;
    private LocalDate dateFrom;
    private LocalDate dateTo;
    private Integer minDurationMinutes = 30;
}
