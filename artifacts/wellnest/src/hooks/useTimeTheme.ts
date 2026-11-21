import { useState, useEffect } from "react";

export type Theme = "day" | "night";

function getUKTheme(): Theme {
  const now = new Date();
  const ukHour = new Date(now.toLocaleString("en-GB", { timeZone: "Europe/London" })).getHours();
  return ukHour >= 7 && ukHour < 19 ? "day" : "night";
}

export function useTimeTheme(): Theme {
  const [theme, setTheme] = useState<Theme>(getUKTheme);
  useEffect(() => {
    const interval = setInterval(() => { setTheme(getUKTheme()); }, 60_000);
    return () => clearInterval(interval);
  }, []);
  return theme;
}
