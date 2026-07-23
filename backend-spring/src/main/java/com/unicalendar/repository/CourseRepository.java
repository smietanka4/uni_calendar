package com.unicalendar.repository;

import com.unicalendar.model.Course;
import com.unicalendar.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface CourseRepository extends JpaRepository<Course, Long> {

    /**
     * Zajęcia z kalendarzy, których użytkownik jest właścicielem LUB subskrybentem.
     * Odpowiednik Django: Zajecia.objects.filter(Q(kalendarz__wlasciciel=user) | Q(kalendarz__subskrybenci=user)).distinct()
     */
    @Query("SELECT DISTINCT co FROM Course co " +
           "LEFT JOIN FETCH co.calendar c " +
           "LEFT JOIN FETCH c.owner " +
           "LEFT JOIN c.members m " +
           "WHERE c.owner = :user OR m.user = :user " +
           "ORDER BY co.dayOfWeek, co.startTime")
    List<Course> findAllByUser(@Param("user") User user);

    /**
     * Zajęcia z kalendarzy użytkownika, przefiltrowane po ID kalendarza.
     */
    @Query("SELECT DISTINCT co FROM Course co " +
           "LEFT JOIN FETCH co.calendar c " +
           "LEFT JOIN FETCH c.owner " +
           "LEFT JOIN c.members m " +
           "WHERE (c.owner = :user OR m.user = :user) AND c.id = :calendarId " +
           "ORDER BY co.dayOfWeek, co.startTime")
    List<Course> findAllByUserAndCalendar(@Param("user") User user,
                                          @Param("calendarId") UUID calendarId);

    /**
     * Wyszukiwanie zajęć po frazie (nazwa, prowadzący, sala, notatki).
     */
    @Query("SELECT DISTINCT co FROM Course co " +
           "LEFT JOIN FETCH co.calendar c " +
           "LEFT JOIN FETCH c.owner " +
           "LEFT JOIN c.members m " +
           "WHERE (c.owner = :user OR m.user = :user) " +
           "AND (LOWER(co.name) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "  OR LOWER(co.instructor) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "  OR LOWER(co.room) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "  OR LOWER(co.notes) LIKE LOWER(CONCAT('%', :query, '%'))) " +
           "ORDER BY co.dayOfWeek, co.startTime")
    List<Course> searchByUser(@Param("user") User user,
                              @Param("query") String query);
}
