package com.unicalendar.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "template_subscriptions", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"template_id", "subscriber_id"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TemplateSubscription {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "template_id", nullable = false)
    private Calendar template;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subscriber_id", nullable = false)
    private User subscriber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "target_calendar_id", nullable = false)
    private Calendar targetCalendar;

    @Column(name = "auto_sync", nullable = false)
    @Builder.Default
    private Boolean autoSync = true;

    @CreationTimestamp
    @Column(name = "subscribed_at", nullable = false, updatable = false)
    private LocalDateTime subscribedAt;
}
