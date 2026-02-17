import { useState, useEffect } from "react";
import { ActiveTimer } from "@/types";

export function useActiveTimer(activeTimer: ActiveTimer | null) {
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    if (!activeTimer) {
      setElapsedTime(0);
      return;
    }

    // Calculate initial elapsed time immediately
    const calculateElapsed = () => {
      return Math.floor(
        (Date.now() - new Date(activeTimer.start_time).getTime()) / 1000
      );
    };

    // Set initial value immediately to avoid showing zeros
    setElapsedTime(calculateElapsed());

    // Then update every second
    const interval = setInterval(() => {
      setElapsedTime(calculateElapsed());
    }, 1000);

    return () => clearInterval(interval);
  }, [activeTimer]);

  return { elapsedTime };
}
