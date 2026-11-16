package com.unicalendar.service;

import com.unicalendar.dto.CourseCreateRequest;
import com.unicalendar.dto.CourseDto;
import com.unicalendar.exception.BadRequestException;
import com.unicalendar.exception.ForbiddenException;
import com.unicalendar.exception.ResourceNotFoundException;
import com.unicalendar.model.Calendar;
import com.unicalendar.model.Course;
import com.unicalendar.model.User;
import com.unicalendar.repository.CalendarRepository;
import com.unicalendar.repository.CourseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Serwis zajęć – odpowiednik Django ZajeciaViewSet.
 */
@Service
@RequiredArgsConstructor
public class CourseService {

    private final CourseRepository courseRepository;
    private final CalendarRepository calendarRepository;
    private final org.springframework.messaging.simp.SimpMessagingTemplate messagingTemplate;
    private final ActivityEventService activityEventService;
    private final com.unicalendar.repository.TemplateSubscriptionRepository templateSubscriptionRepository;

    /**
     * Lista zajęć użytkownika (z filtrami).
     */
    public List<CourseDto> getCourses(User user, UUID calendarId, String query) {
        List<Course> courses;

        if (query != null && !query.isBlank()) {
            courses = courseRepository.searchByUser(user, query);
        } else if (calendarId != null) {
            courses = courseRepository.findAllByUserAndCalendar(user, calendarId);
        } else {
            courses = courseRepository.findAllByUser(user);
        }

        // Dodatkowy filtr po kalendarzu, jeśli podano razem z query
        if (query != null && !query.isBlank() && calendarId != null) {
            courses = courses.stream()
                    .filter(c -> c.getCalendar().getId().equals(calendarId))
                    .collect(Collectors.toList());
        }

        return courses.stream()
                .map(c -> toDto(c, user))
                .collect(Collectors.toList());
    }

    /**
     * Pobierz jedno zajęcie.
     */
    public CourseDto getCourse(Long id, User user) {
        Course course = findCourseOrThrow(id);
        return toDto(course, user);
    }

    /**
     * Utwórz zajęcia – automatycznie przypisuje do kalendarza użytkownika.
     * Odpowiednik Django perform_create.
     */
    @Transactional
    public CourseDto createCourse(CourseCreateRequest request, User user) {
        if (request.getDateTo().isBefore(request.getDateFrom())) {
            throw new BadRequestException("Data zakończenia musi być późniejsza niż data rozpoczęcia.");
        }

        // Automatyczne znalezienie lub stworzenie kalendarza (jak w Django)
        Calendar calendar = calendarRepository.findFirstByOwner(user)
                .orElseGet(() -> {
                    Calendar newCal = Calendar.builder()
                            .name("Plan zajęć (" + user.getUsername() + ")")
                            .owner(user)
                            .build();
                    return calendarRepository.save(newCal);
                });

        Course course = Course.builder()
                .calendar(calendar)
                .name(request.getName())
                .type(request.getType())
                .dayOfWeek(request.getDayOfWeek())
                .startTime(request.getStartTime())
                .durationMinutes(request.getDurationMinutes() != null ? request.getDurationMinutes() : 90)
                .dateFrom(request.getDateFrom())
                .dateTo(request.getDateTo())
                .room(request.getRoom())
                .instructor(request.getInstructor())
                .notes(request.getNotes())
                .build();

        course = courseRepository.save(course);
        CourseDto dto = toDto(course, user);
        // Notify via WebSocket
        messagingTemplate.convertAndSend("/topic/calendar/" + calendar.getId(), 
                java.util.Map.of("type", "COURSE_CREATED", "payload", dto));

        activityEventService.logEvent(user, "CREATED", "COURSE", String.valueOf(course.getId()), calendar, 
                java.util.Map.of("name", course.getName(), "type", course.getType().name()));
                
        propagateCourseCreate(course);
        return dto;
    }

    /**
     * Zaktualizuj zajęcia (tylko właściciel kalendarza).
     */
    @Transactional
    public CourseDto updateCourse(Long id, CourseCreateRequest request, User user) {
        Course course = findCourseOrThrow(id);
        checkCanModify(course, user);

        if (request.getDateTo() != null && request.getDateFrom() != null
                && request.getDateTo().isBefore(request.getDateFrom())) {
            throw new BadRequestException("Data zakończenia musi być późniejsza niż data rozpoczęcia.");
        }

        if (request.getName() != null) course.setName(request.getName());
        if (request.getType() != null) course.setType(request.getType());
        if (request.getDayOfWeek() != null) course.setDayOfWeek(request.getDayOfWeek());
        if (request.getStartTime() != null) course.setStartTime(request.getStartTime());
        if (request.getDurationMinutes() != null) course.setDurationMinutes(request.getDurationMinutes());
        if (request.getDateFrom() != null) course.setDateFrom(request.getDateFrom());
        if (request.getDateTo() != null) course.setDateTo(request.getDateTo());
        if (request.getRoom() != null) course.setRoom(request.getRoom());
        if (request.getInstructor() != null) course.setInstructor(request.getInstructor());
        if (request.getNotes() != null) course.setNotes(request.getNotes());

        course = courseRepository.save(course);
        CourseDto dto = toDto(course, user);
        messagingTemplate.convertAndSend("/topic/calendar/" + course.getCalendar().getId(), 
                java.util.Map.of("type", "COURSE_UPDATED", "payload", dto));

        activityEventService.logEvent(user, "UPDATED", "COURSE", String.valueOf(course.getId()), course.getCalendar(), 
                java.util.Map.of("name", course.getName(), "type", course.getType().name()));
                
        propagateCourseUpdate(course);
        return dto;
    }

    /**
     * Usuń zajęcia (tylko właściciel kalendarza).
     */
    @Transactional
    public void deleteCourse(Long id, User user) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Nie znaleziono zajęć"));
        
        checkCanModify(course, user);
        UUID calendarId = course.getCalendar().getId();
        courseRepository.delete(course);
        messagingTemplate.convertAndSend("/topic/calendar/" + calendarId, 
                java.util.Map.of("type", "COURSE_DELETED", "payload", java.util.Map.of("id", id)));

        activityEventService.logEvent(user, "DELETED", "COURSE", String.valueOf(id), course.getCalendar(), 
                java.util.Map.of("name", course.getName()));
        
        propagateCourseDelete(id, calendarId);
    }

    @Transactional
    public CourseDto forkCourse(Long courseId, User user) {
        Course original = courseRepository.findById(courseId)
                .orElseThrow(() -> new IllegalArgumentException("Nie znaleziono zajęć"));
        
        Calendar myCalendar = calendarRepository.findFirstByOwner(user)
                .orElseThrow(() -> new IllegalStateException("Nie posiadasz własnego kalendarza."));

        Course copied = Course.builder()
                .calendar(myCalendar)
                .name(original.getName())
                .type(original.getType())
                .dayOfWeek(original.getDayOfWeek())
                .startTime(original.getStartTime())
                .durationMinutes(original.getDurationMinutes())
                .dateFrom(original.getDateFrom())
                .dateTo(original.getDateTo())
                .room(original.getRoom())
                .instructor(original.getInstructor())
                .notes(original.getNotes() + "\n[Skopiowane z " + original.getCalendar().getName() + "]")
                .build();
        
        copied = courseRepository.save(copied);
        CourseDto dto = toDto(copied, user);

        messagingTemplate.convertAndSend("/topic/calendar/" + myCalendar.getId(), 
                java.util.Map.of("type", "COURSE_CREATED", "payload", dto));

        activityEventService.logEvent(user, "FORKED", "COURSE", String.valueOf(copied.getId()), myCalendar, 
                java.util.Map.of("name", copied.getName(), "original_calendar", original.getCalendar().getName()));

        return dto;
    }

    /**
     * Widok tygodniowy – odpowiednik Django ZajeciaViewSet.tydzien().
     * Identyczna logika: iteruje po zajęciach i sprawdza czy wypadają w danym tygodniu.
     */
    public List<CourseDto> getWeekView(User user, LocalDate date, UUID calendarId) {
        LocalDate targetDate = (date != null) ? date : LocalDate.now();

        // Poniedziałek wybranego tygodnia
        LocalDate monday = targetDate.minusDays(targetDate.getDayOfWeek().getValue() - DayOfWeek.MONDAY.getValue());
        LocalDate sunday = monday.plusDays(6);

        List<Course> courses;
        if (calendarId != null) {
            courses = courseRepository.findAllByUserAndCalendar(user, calendarId);
        } else {
            courses = courseRepository.findAllByUser(user);
        }

        List<CourseDto> results = new ArrayList<>();

        for (Course course : courses) {
            // Logika identyczna z Django: znajdź pierwszy dzień w tygodniu, kiedy są zajęcia
            int delta = Math.floorMod(course.getDayOfWeek() - course.getDateFrom().getDayOfWeek().getValue() + 1, 7);
            LocalDate current = course.getDateFrom().plusDays(delta);

            while (!current.isAfter(course.getDateTo())) {
                if (!current.isBefore(monday) && !current.isAfter(sunday)) {
                    CourseDto dto = toDto(course, user);
                    dto.setOccurrenceDate(current.toString());
                    results.add(dto);
                    break;
                }
                current = current.plusWeeks(1);
            }
        }

        // Sortuj po dacie wystąpienia i godzinie
        results.sort(Comparator
                .comparing(CourseDto::getOccurrenceDate)
                .thenComparing(CourseDto::getStartTime));

        return results;
    }

    // ── Helpery ──────────────────────────────────────────────────────────

    private Course findCourseOrThrow(Long id) {
        return courseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Zajęcia nie istnieją."));
    }

    private void checkCanModify(Course course, User user) {
        if (course.getCalendar().getOwner().getId().equals(user.getId())) {
            return;
        }
        
        boolean isCollaborator = course.getCalendar().getMembers().stream()
                .anyMatch(m -> m.getUser().getId().equals(user.getId()) 
                        && m.getRole() == com.unicalendar.model.CalendarRole.COLLABORATOR);
                        
        if (!isCollaborator) {
            throw new ForbiddenException("Tylko właściciel kalendarza lub współtwórca może modyfikować zajęcia.");
        }
    }

    /**
     * Konwersja encji na DTO – odpowiednik Django ZajeciaSerializer.
     */
    public CourseDto toDto(Course course, User currentUser) {
        boolean isOwner = course.getCalendar().getOwner().getId().equals(currentUser.getId());
        boolean isCollaborator = course.getCalendar().getMembers().stream()
                .anyMatch(m -> m.getUser().getId().equals(currentUser.getId()) 
                        && m.getRole() == com.unicalendar.model.CalendarRole.COLLABORATOR);
        return CourseDto.builder()
                .id(course.getId())
                .calendarId(course.getCalendar().getId())
                .calendarName(course.getCalendar().getName())
                .name(course.getName())
                .type(course.getType())
                .typeDisplay(course.getType().getDisplayName())
                .dayOfWeek(course.getDayOfWeek())
                .startTime(course.getStartTime())
                .endTime(course.getEndTime().toString().substring(0, 5))  // HH:MM
                .durationMinutes(course.getDurationMinutes())
                .dateFrom(course.getDateFrom())
                .dateTo(course.getDateTo())
                .room(course.getRoom())
                .instructor(course.getInstructor())
                .notes(course.getNotes())
                .isOwner(isOwner || isCollaborator) // Frontend treats isOwner as "can edit"
                .sourceCourseId(course.getSourceCourseId())
                .build();
    }

    /**
     * Konwersja encji na DTO dla widoku publicznego (brak uprawnień edycji).
     */
    public CourseDto toDtoPublic(Course course) {
        return CourseDto.builder()
                .id(course.getId())
                .calendarId(course.getCalendar().getId())
                .calendarName(course.getCalendar().getName())
                .name(course.getName())
                .type(course.getType())
                .typeDisplay(course.getType().getDisplayName())
                .dayOfWeek(course.getDayOfWeek())
                .startTime(course.getStartTime())
                .endTime(course.getEndTime().toString().substring(0, 5))  // HH:MM
                .durationMinutes(course.getDurationMinutes())
                .dateFrom(course.getDateFrom())
                .dateTo(course.getDateTo())
                .room(course.getRoom())
                .instructor(course.getInstructor())
                .notes(course.getNotes())
                .isOwner(false)
                .sourceCourseId(course.getSourceCourseId())
                .build();
    }

    private void propagateCourseCreate(Course course) {
        List<com.unicalendar.model.TemplateSubscription> subs = templateSubscriptionRepository.findByTemplateId(course.getCalendar().getId());
        for (var sub : subs) {
            if (!sub.getAutoSync()) continue;
            Course newCourse = Course.builder()
                    .calendar(sub.getTargetCalendar())
                    .name(course.getName())
                    .type(course.getType())
                    .dayOfWeek(course.getDayOfWeek())
                    .startTime(course.getStartTime())
                    .durationMinutes(course.getDurationMinutes())
                    .dateFrom(course.getDateFrom())
                    .dateTo(course.getDateTo())
                    .room(course.getRoom())
                    .instructor(course.getInstructor())
                    .notes(course.getNotes())
                    .sourceCourseId(course.getId())
                    .build();
            newCourse = courseRepository.save(newCourse);
            
            CourseDto dto = toDto(newCourse, sub.getSubscriber());
            messagingTemplate.convertAndSend("/topic/calendar/" + sub.getTargetCalendar().getId(), 
                    java.util.Map.of("type", "COURSE_CREATED", "payload", dto));
            messagingTemplate.convertAndSend("/topic/user/" + sub.getSubscriber().getId(), 
                    java.util.Map.of("type", "TEMPLATE_UPDATED", "payload", "Harmonogram " + course.getCalendar().getName() + " został zaktualizowany."));
        }
    }

    private void propagateCourseUpdate(Course course) {
        List<com.unicalendar.model.TemplateSubscription> subs = templateSubscriptionRepository.findByTemplateId(course.getCalendar().getId());
        for (var sub : subs) {
            if (!sub.getAutoSync()) continue;
            List<Course> targets = courseRepository.findBySourceCourseIdAndCalendarId(course.getId(), sub.getTargetCalendar().getId());
            for (Course target : targets) {
                target.setName(course.getName());
                target.setType(course.getType());
                target.setDayOfWeek(course.getDayOfWeek());
                target.setStartTime(course.getStartTime());
                target.setDurationMinutes(course.getDurationMinutes());
                target.setDateFrom(course.getDateFrom());
                target.setDateTo(course.getDateTo());
                target.setRoom(course.getRoom());
                target.setInstructor(course.getInstructor());
                target.setNotes(course.getNotes());
                courseRepository.save(target);

                CourseDto dto = toDto(target, sub.getSubscriber());
                messagingTemplate.convertAndSend("/topic/calendar/" + sub.getTargetCalendar().getId(), 
                        java.util.Map.of("type", "COURSE_UPDATED", "payload", dto));
                messagingTemplate.convertAndSend("/topic/user/" + sub.getSubscriber().getId(), 
                        java.util.Map.of("type", "TEMPLATE_UPDATED", "payload", "Harmonogram " + course.getCalendar().getName() + " został zaktualizowany."));
            }
        }
    }

    private void propagateCourseDelete(Long courseId, UUID calendarId) {
        List<com.unicalendar.model.TemplateSubscription> subs = templateSubscriptionRepository.findByTemplateId(calendarId);
        for (var sub : subs) {
            if (!sub.getAutoSync()) continue;
            List<Course> targets = courseRepository.findBySourceCourseIdAndCalendarId(courseId, sub.getTargetCalendar().getId());
            for (Course target : targets) {
                Long targetId = target.getId();
                courseRepository.delete(target);
                messagingTemplate.convertAndSend("/topic/calendar/" + sub.getTargetCalendar().getId(), 
                        java.util.Map.of("type", "COURSE_DELETED", "payload", java.util.Map.of("id", targetId)));
                messagingTemplate.convertAndSend("/topic/user/" + sub.getSubscriber().getId(), 
                        java.util.Map.of("type", "TEMPLATE_UPDATED", "payload", "Harmonogram z którego korzystasz został zaktualizowany."));
            }
        }
    }
}
