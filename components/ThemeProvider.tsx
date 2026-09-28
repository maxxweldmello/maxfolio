"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type Theme = "light" | "dark";

type ThemeContextValue = { theme: Theme; toggle: () => void };

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = "site-theme";

/**
 * Wraps the whole app. Sets `data-theme="dark"` on <html> — every color in
 * globals.css is a CSS variable, so this one attribute retints Nav, every
 * inner page (career/work/learning/contact/resume/tasks), and every
 * component that reads var(--paper)/var(--ink)/etc.
 *
 * The home page hardcodes its own black background + white text via inline
 * styles (it's always a dark hero, by design), so it stays visually
 * unaffected either way — nothing extra to guard here.
 *
 * A tiny inline script in layout.tsx applies the stored theme to <html>
 * BEFORE hydration, so there's no flash of the wrong theme on load; this
 * component just keeps React state in sync with that and persists changes.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const current = document.documentElement.getAttribute("data-theme");
    if (current === "dark") setTheme("dark");
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // localStorage unavailable (private mode etc) — theme just won't persist
    }
  }, [theme]);

  const toggle = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>");
  return ctx;
}
