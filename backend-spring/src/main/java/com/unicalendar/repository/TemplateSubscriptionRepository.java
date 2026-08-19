package com.unicalendar.repository;

import com.unicalendar.model.Calendar;
import com.unicalendar.model.TemplateSubscription;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface TemplateSubscriptionRepository extends JpaRepository<TemplateSubscription, Long> {
    List<TemplateSubscription> findByTemplate(Calendar template);
    List<TemplateSubscription> findByTemplateId(UUID templateId);
}
