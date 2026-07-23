package com.unicalendar.model;

/**
 * Typy zajęć – odpowiednik Django TYPY_ZAJEC.
 */
public enum CourseType {
    WYK("Wykład"),
    LAB("Laboratorium"),
    CWI("Ćwiczenia"),
    SEM("Seminarium"),
    PRO("Projekt"),
    INN("Inne");

    private final String displayName;

    CourseType(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
