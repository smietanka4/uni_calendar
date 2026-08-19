package com.unicalendar.controller;

import com.unicalendar.dto.ActivityEventDto;
import com.unicalendar.model.User;
import com.unicalendar.service.ActivityEventService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/feed")
@RequiredArgsConstructor
public class FeedController {

    private final ActivityEventService activityEventService;

    @GetMapping
    public Page<ActivityEventDto> getFeed(@AuthenticationPrincipal User user, Pageable pageable) {
        return activityEventService.getFeedForUser(user, pageable);
    }
}
