import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Enhanced automatic learning timer hook
 * Tracks time spent on learning activities with smart activity detection
 */
export default function useLearningTimer() {
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [totalMinutesTracked, setTotalMinutesTracked] = useState(0);

  const intervalRef = useRef(null);
  const secondsRef = useRef(0);
  const lastActivityRef = useRef(Date.now());
  const sessionStartRef = useRef(null);

  const INACTIVITY_THRESHOLD = 2 * 60 * 1000;
  const SAVE_INTERVAL = 5 * 60;
  const MIN_SESSION_SECONDS = 60;

  const saveCurrentProgress = useCallback(async () => {
    const minutes = Math.floor(secondsRef.current / 60);

    if (minutes <= 0) {
      console.log("Skipping save - less than 1 minute tracked");
      return;
    }

    try {
      const backendUrl =
        import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";
      const token = localStorage.getItem("token");

      console.log(`Saving learning progress: ${minutes} minutes...`);

      const response = await fetch(`${backendUrl}/student/progress`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ minutes }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log(`Learning progress tracked: ${minutes} minutes`, data);
        setTotalMinutesTracked((prev) => prev + minutes);
        secondsRef.current = 0;
        setSeconds(0);
        sessionStartRef.current = Date.now();
      } else {
        console.error(
          "Failed to track learning progress:",
          response.statusText,
          data
        );
      }
    } catch (error) {
      console.error("Error tracking learning progress:", error);
    }
  }, []);

  const handleActivity = useCallback(() => {
    lastActivityRef.current = Date.now();

    if (intervalRef.current) {
      return;
    }

    console.log("Learning session started");
    setIsActive(true);
    sessionStartRef.current = Date.now();

    intervalRef.current = setInterval(() => {
      setSeconds((prev) => {
        const next = prev + 1;
        secondsRef.current = next;

        if (next > 0 && next % SAVE_INTERVAL === 0) {
          void saveCurrentProgress();
        }

        return next;
      });
    }, 1000);

    const events = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
      "click",
    ];

    events.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true });
    });
  }, [SAVE_INTERVAL, saveCurrentProgress]);

  const stopTimer = useCallback(
    async (saveProgress = true) => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      setIsActive(false);

      const events = [
        "mousedown",
        "mousemove",
        "keypress",
        "scroll",
        "touchstart",
        "click",
      ];

      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });

      if (saveProgress && secondsRef.current >= MIN_SESSION_SECONDS) {
        await saveCurrentProgress();
      }

      console.log("Learning session ended");
    },
    [MIN_SESSION_SECONDS, handleActivity, saveCurrentProgress]
  );

  const checkInactivity = useCallback(() => {
    if (
      intervalRef.current &&
      Date.now() - lastActivityRef.current > INACTIVITY_THRESHOLD
    ) {
      console.log("Session paused due to inactivity");
      void stopTimer();
    }
  }, [INACTIVITY_THRESHOLD, stopTimer]);

  const handleVisibilityChange = useCallback(() => {
    if (document.hidden && intervalRef.current) {
      console.log("Page hidden, pausing session");
      void stopTimer();
    }
  }, [stopTimer]);

  const handleUnload = useCallback(() => {
    if (!intervalRef.current || secondsRef.current < MIN_SESSION_SECONDS) {
      return;
    }

    const minutes = Math.floor(secondsRef.current / 60);
    if (minutes <= 0) {
      return;
    }

    const backendUrl =
      import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";
    const token = localStorage.getItem("token");
    const blob = new Blob([JSON.stringify({ minutes, token })], {
      type: "application/json",
    });

    navigator.sendBeacon(`${backendUrl}/student/progress?token=${token}`, blob);
    console.log(`Sent ${minutes} minutes via beacon on page unload`);
  }, [MIN_SESSION_SECONDS]);

  useEffect(() => {
    handleActivity();

    const inactivityChecker = setInterval(checkInactivity, 30000);

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleUnload);

    return () => {
      clearInterval(inactivityChecker);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleUnload);
      void stopTimer(true);
    };
  }, [
    checkInactivity,
    handleActivity,
    handleUnload,
    handleVisibilityChange,
    stopTimer,
  ]);

  const pauseTracking = useCallback(() => {
    void stopTimer(false);
  }, [stopTimer]);

  const resumeTracking = useCallback(() => {
    handleActivity();
  }, [handleActivity]);

  const getFormattedTime = () => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  return {
    startTimer: handleActivity,
    stopTimer: () => stopTimer(true),
    pauseTracking,
    resumeTracking,
    seconds,
    isActive,
    totalMinutesTracked,
    formattedTime: getFormattedTime(),
    currentSessionMinutes: Math.floor(seconds / 60),
  };
}
