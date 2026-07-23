package com.unicalendar.repository;

import com.unicalendar.model.Calendar;
import com.unicalendar.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CalendarRepository extends JpaRepository<Calendar, UUID> {

    /**
     * Kalendarze, których użytkownik jest właścicielem LUB subskrybentem.
     * Odpowiednik Django: Kalendarz.objects.filter(Q(wlasciciel=user) | Q(subskrybenci=user)).distinct()
     */
    @Query("SELECT DISTINCT c FROM Calendar c " +
           "LEFT JOIN FETCH c.owner " +
           "LEFT JOIN FETCH c.members m " +
           "LEFT JOIN FETCH m.user " +
           "WHERE c.owner = :user OR m.user = :user")
    List<Calendar> findAllByOwnerOrSubscriber(@Param("user") User user);

    Optional<Calendar> findFirstByOwner(User owner);
    long countByOwner(User owner);
}
