"use client";
import { useEffect } from "react";

// Returns the time-of-day slot and applies CSS variable overrides to :root
export type TimeSlot = "morning" | "afternoon" | "evening" | "night" | "latenight";

function getSlot(hour: number): TimeSlot {
  if (hour >= 6  && hour < 11) return "morning";
  if (hour >= 11 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 21) return "evening";
  if (hour >= 21 && hour < 24) return "night";
  return "latenight";                              // 0–5
}

const THEMES: Record<TimeSlot, Record<string, string>> = {
  morning: {
    "--gold":     "#D4A843",
    "--gold-hi":  "#EDBE5A",
    "--bg-page":  "#0E0A04",
    "--bg-base":  "#080502",
    "--bg-card":  "#1C1408",
    "--cream":    "#F5EDD8",
    "--time-label": "Breakfast Service",
  },
  afternoon: {
    "--gold":     "#C8913A",
    "--gold-hi":  "#E4AD52",
    "--bg-page":  "#0C0805",
    "--bg-base":  "#060402",
    "--bg-card":  "#1B1309",
    "--cream":    "#F0E6CE",
    "--time-label": "Lunch Rush",
  },
  evening: {
    "--gold":     "#C87A28",
    "--gold-hi":  "#E09240",
    "--bg-page":  "#090604",
    "--bg-base":  "#050302",
    "--bg-card":  "#160E06",
    "--cream":    "#EDE0C8",
    "--time-label": "Dinner Service",
  },
  night: {
    "--gold":     "#7FC8D4",          // cyberpunk teal-blue shift
    "--gold-hi":  "#A0E4EE",
    "--bg-page":  "#04080C",
    "--bg-base":  "#020406",
    "--bg-card":  "#080E14",
    "--cream":    "#D8EEF5",
    "--time-label": "Late Night Kitchen",
  },
  latenight: {
    "--gold":     "#9B6EFF",          // purple debugging mode
    "--gold-hi":  "#BC98FF",
    "--bg-page":  "#060408",
    "--bg-base":  "#030205",
    "--bg-card":  "#0E0A14",
    "--cream":    "#E8DEFF",
    "--time-label": "Debugging Shift",
  },
};

export function useTimeTheme() {
  useEffect(() => {
    const slot = getSlot(new Date().getHours());
    const vars = THEMES[slot];
    const root = document.documentElement;
    Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v));
    root.dataset.timeSlot = slot;

    // Clean up on unmount (hmr reloads)
    return () => {
      Object.keys(vars).forEach((k) => root.style.removeProperty(k));
      delete root.dataset.timeSlot;
    };
  }, []);
}
