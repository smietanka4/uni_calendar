package com.unicalendar.repository;

import com.unicalendar.model.Calendar;
import com.unicalendar.model.User;
import com.unicalendar.model.UserLayerPreference;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserLayerPreferenceRepository extends JpaRepository<UserLayerPreference, Long> {

    List<UserLayerPreference> findAllByUserOrderBySortOrderAsc(User user);

    Optional<UserLayerPreference> findByUserAndCalendar(User user, Calendar calendar);

    @Query("SELECT p FROM UserLayerPreference p WHERE p.user = :user AND p.calendar.id = :calendarId")
    Optional<UserLayerPreference> findByUserAndCalendarId(@Param("user") User user,
                                                           @Param("calendarId") UUID calendarId);

    void deleteByUserAndCalendar(User user, Calendar calendar);
}
