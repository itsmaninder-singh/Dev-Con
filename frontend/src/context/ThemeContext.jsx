import { createContext, useContext, useEffect, useState } from "react";

const THEME_KEY = "dc_theme";
const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    try {
      const saved = localStorage.getItem(THEME_KEY);
      if (saved === "light" || saved === "dark") return saved;
      return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
    } catch {
      return "dark";
    }
  });

  const setTheme = (newTheme) => {
    if (!newTheme || newTheme === theme) return;

    const commitTheme = () => {
      setThemeState(newTheme);
      try {
        localStorage.setItem(THEME_KEY, newTheme);
      } catch {}
      document.documentElement.setAttribute("data-theme", newTheme);
    };

    // Modern View Transitions API (ultra-clean minimalist transition)
    if (document.startViewTransition && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      document.startViewTransition(() => {
        commitTheme();
      });
      return;
    }

    // Fallback: smooth minimalist class transition across all elements
    document.documentElement.classList.add("theme-transitioning");
    commitTheme();
    setTimeout(() => {
      document.documentElement.classList.remove("theme-transitioning");
    }, 450);
  };

  useEffect(() => {
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      // ignore
    }
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
