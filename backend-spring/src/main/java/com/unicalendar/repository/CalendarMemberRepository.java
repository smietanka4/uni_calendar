package com.unicalendar.repository;

import com.unicalendar.model.CalendarMember;
import com.unicalendar.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface CalendarMemberRepository extends JpaRepository<CalendarMember, Long> {
    Optional<CalendarMember> findByCalendarIdAndUser(UUID calendarId, User user);
    void deleteByCalendarIdAndUser(UUID calendarId, User user);
}
