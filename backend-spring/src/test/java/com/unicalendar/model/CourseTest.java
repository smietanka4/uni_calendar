package com.unicalendar.model;

import org.junit.jupiter.api.Test;
import java.time.LocalTime;
import static org.junit.jupiter.api.Assertions.*;

class CourseTest {

    @Test
    void testGetEndTime() {
        Course course = Course.builder()
                .startTime(LocalTime.of(10, 0))
                .durationMinutes(90)
                .build();
        
        assertEquals(LocalTime.of(11, 30), course.getEndTime());
    }
    
    @Test
    void testGetEndTimeOvernight() {
        Course course = Course.builder()
                .startTime(LocalTime.of(23, 0))
                .durationMinutes(120)
                .build();
        
        assertEquals(LocalTime.of(1, 0), course.getEndTime());
    }

    @Test
    void testCourseTypeEnum() {
        assertEquals("Wykład", CourseType.WYK.getDisplayName());
        assertEquals("Laboratorium", CourseType.LAB.getDisplayName());
        assertEquals("Ćwiczenia", CourseType.CWI.getDisplayName());
        assertEquals("Seminarium", CourseType.SEM.getDisplayName());
        assertEquals("Projekt", CourseType.PRO.getDisplayName());
        assertEquals("Inne", CourseType.INN.getDisplayName());
    }

    @Test
    void testCourseBuilder() {
        Course course = Course.builder()
                .name("Matematyka")
                .type(CourseType.WYK)
                .dayOfWeek(1)
                .durationMinutes(45)
                .build();

        assertEquals("Matematyka", course.getName());
        assertEquals(CourseType.WYK, course.getType());
        assertEquals(1, course.getDayOfWeek());
        assertEquals(45, course.getDurationMinutes());
    }
}
