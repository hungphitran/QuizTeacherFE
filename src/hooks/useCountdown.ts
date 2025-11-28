'use client';

import { useEffect, useState } from "react";

export const useCountdown = (endTime: Date | null) => {
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (!endTime) return;
    const tick = () => {
      const diff = endTime.getTime() - Date.now();
      setTimeLeft(Math.max(diff, 0));
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [endTime]);

  const minutes = Math.floor(timeLeft / 1000 / 60);
  const seconds = Math.floor((timeLeft / 1000) % 60);

  return { minutes, seconds, isExpired: timeLeft <= 0 };
};

