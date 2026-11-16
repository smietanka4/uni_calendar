package com.unicalendar.repository;

import com.unicalendar.model.Notice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface NoticeRepository extends JpaRepository<Notice, Long> {

    @Query("SELECT n FROM Notice n JOIN FETCH n.author WHERE n.calendar.id = :calendarId ORDER BY n.createdAt DESC")
    List<Notice> findAllByCalendarIdOrderByCreatedAtDesc(@Param("calendarId") UUID calendarId);
}
