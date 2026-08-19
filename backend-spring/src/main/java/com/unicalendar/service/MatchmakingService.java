package com.unicalendar.service;

import com.unicalendar.dto.MatchmakingRequest;
import com.unicalendar.dto.MatchmakingResponse;
import com.unicalendar.model.Course;
import com.unicalendar.model.User;
import com.unicalendar.model.UserLayerPreference;
import com.unicalendar.repository.CourseRepository;
import com.unicalendar.repository.UserLayerPreferenceRepository;
import com.unicalendar.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MatchmakingService {

    private final UserRepository userRepository;
    private final UserLayerPreferenceRepository layerPreferenceRepository;
    private final CourseRepository courseRepository;

    private static final LocalTime DAY_START = LocalTime.of(8, 0);
    private static final LocalTime DAY_END = LocalTime.of(22, 0);

    public MatchmakingResponse findSlots(MatchmakingRequest request) {
        List<User> users = userRepository.findAllById(request.getUserIds());
        List<String> participantNames = users.stream().map(User::getUsername).collect(Collectors.toList());

        List<UUID> visibleCalendarIds = new ArrayList<>();
        for (User user : users) {
            List<UserLayerPreference> prefs = layerPreferenceRepository.findAllByUserOrderBySortOrderAsc(user);
            for (UserLayerPreference pref : prefs) {
                if (pref.isVisible()) {
                    visibleCalendarIds.add(pref.getCalendar().getId());
                }
            }
        }

        // Pobierz wszystkie zajęcia z widocznych kalendarzy
        List<Course> allCourses = new ArrayList<>();
        if (!visibleCalendarIds.isEmpty()) {
            allCourses = courseRepository.findByCalendarIdIn(visibleCalendarIds);
        }

        List<MatchmakingResponse.Slot> availableSlots = new ArrayList<>();

        // Iteruj po dniach
        LocalDate current = request.getDateFrom();
        while (!current.isAfter(request.getDateTo())) {
            int dayOfWeek = current.getDayOfWeek().getValue() % 7; // 0=Pon, 6=Nie (w modelu Course)
            // Model: 0=Pon, ale standardowo getDayOfWeek().getValue() dla Poniedziałku = 1.
            // Zakładam, że w modelu: 0=Poniedziałek, 1=Wtorek... 6=Niedziela.
            int modelDayOfWeek = current.getDayOfWeek().getValue() - 1;

            final LocalDate finalCurrent = current;
            
            // Znajdź kursy, które wypadają w tym dniu tygodnia i mieszczą się w datach
            List<Course> dailyCourses = allCourses.stream()
                    .filter(c -> c.getDayOfWeek() == modelDayOfWeek)
                    .filter(c -> !finalCurrent.isBefore(c.getDateFrom()) && !finalCurrent.isAfter(c.getDateTo()))
                    .collect(Collectors.toList());

            // Merge intervals
            List<Interval> busyIntervals = dailyCourses.stream()
                    .map(c -> new Interval(c.getStartTime(), c.getEndTime()))
                    .sorted(Comparator.comparing(Interval::getStart))
                    .collect(Collectors.toList());

            List<Interval> mergedBusy = mergeIntervals(busyIntervals);

            // Invert intervals to find free slots
            List<Interval> freeIntervals = invertIntervals(mergedBusy, DAY_START, DAY_END);

            // Filtruj po minDurationMinutes
            for (Interval free : freeIntervals) {
                int duration = free.getDurationMinutes();
                if (duration >= request.getMinDurationMinutes()) {
                    availableSlots.add(MatchmakingResponse.Slot.builder()
                            .date(current)
                            .start(free.getStart())
                            .end(free.getEnd())
                            .duration(duration)
                            .build());
                }
            }

            current = current.plusDays(1);
        }

        return MatchmakingResponse.builder()
                .slots(availableSlots)
                .participants(participantNames)
                .build();
    }

    private List<Interval> mergeIntervals(List<Interval> intervals) {
        if (intervals.isEmpty()) return new ArrayList<>();

        List<Interval> merged = new ArrayList<>();
        Interval current = intervals.get(0);

        for (int i = 1; i < intervals.size(); i++) {
            Interval next = intervals.get(i);
            if (!current.getEnd().isBefore(next.getStart())) {
                // Overlap
                if (next.getEnd().isAfter(current.getEnd())) {
                    current.setEnd(next.getEnd());
                }
            } else {
                merged.add(current);
                current = next;
            }
        }
        merged.add(current);
        return merged;
    }

    private List<Interval> invertIntervals(List<Interval> busy, LocalTime startOfDay, LocalTime endOfDay) {
        List<Interval> free = new ArrayList<>();
        LocalTime currentStart = startOfDay;

        for (Interval b : busy) {
            if (b.getStart().isAfter(currentStart)) {
                free.add(new Interval(currentStart, b.getStart()));
            }
            if (b.getEnd().isAfter(currentStart)) {
                currentStart = b.getEnd();
            }
        }

        if (currentStart.isBefore(endOfDay)) {
            free.add(new Interval(currentStart, endOfDay));
        }

        return free;
    }

    @lombok.Data
    @lombok.AllArgsConstructor
    private static class Interval {
        private LocalTime start;
        private LocalTime end;

        public int getDurationMinutes() {
            return (int) java.time.Duration.between(start, end).toMinutes();
        }
    }
}
