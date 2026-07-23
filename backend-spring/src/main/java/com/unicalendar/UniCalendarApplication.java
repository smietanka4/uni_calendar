package com.unicalendar;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;

@SpringBootApplication
@EnableCaching
public class UniCalendarApplication {

    public static void main(String[] args) {
        SpringApplication.run(UniCalendarApplication.class, args);
    }
}
