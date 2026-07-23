package com.unicalendar.repository;

import com.unicalendar.model.Notice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface NoticeRepository extends JpaRepository<Notice, Long> {
    List<Notice> findAllByCalendarIdOrderByCreatedAtDesc(UUID calendarId);
}
