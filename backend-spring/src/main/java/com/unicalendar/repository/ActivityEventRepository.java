package com.unicalendar.repository;

import com.unicalendar.model.ActivityEvent;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface ActivityEventRepository extends JpaRepository<ActivityEvent, Long> {

    /**
     * Feed użytkownika: aktywność ze wszystkich kalendarzy, które obserwuje lub jest właścicielem.
     */
    @Query("""
        SELECT a FROM ActivityEvent a
        WHERE a.calendar.id IN (
            SELECT c.id FROM Calendar c WHERE c.owner.id = :userId
            UNION
            SELECT m.calendar.id FROM CalendarMember m WHERE m.user.id = :userId
        )
        ORDER BY a.createdAt DESC
        """)
    Page<ActivityEvent> findFeedForUser(@Param("userId") Long userId, Pageable pageable);

    Page<ActivityEvent> findByCalendarIdOrderByCreatedAtDesc(UUID calendarId, Pageable pageable);
}
