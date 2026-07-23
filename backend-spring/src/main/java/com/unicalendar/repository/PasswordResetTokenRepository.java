package com.unicalendar.repository;

import com.unicalendar.model.PasswordResetToken;
import com.unicalendar.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, UUID> {
    void deleteByUser(User user);
}
