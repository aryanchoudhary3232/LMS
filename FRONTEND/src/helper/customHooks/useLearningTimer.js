import { useEffect, useRef, useState } from "react";

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
  
  const INACTIVITY_THRESHOLD = 2 * 60 * 1000; // 2 minutes
  const SAVE_INTERVAL = 5 * 60; // Save every 5 minutes
  const MIN_SESSION_SECONDS = 60; // Minimum 60 seconds before saving

  // Track user activity
  const handleActivity = () => {
    lastActivityRef.current = Date.now();
    if (!isActive) {
      startTimer();
    }
  };

  const startTimer = () => {
    if (!isActive && !intervalRef.current) {
      console.log('🚀 Learning session started');
      setIsActive(true);
      sessionStartRef.current = Date.now();
      
      intervalRef.current = setInterval(() => {
        setSeconds((prev) => {
          secondsRef.current = prev + 1;
          
          // Auto-save every 5 minutes
          if (secondsRef.current > 0 && secondsRef.current % SAVE_INTERVAL === 0) {
            saveCurrentProgress();
          }
          
          return prev + 1;
        });
      }, 1000);

      // Add activity listeners
      const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
      events.forEach(event => {
        window.addEventListener(event, handleActivity, { passive: true });
      });
    }
  };

  const stopTimer = async (saveProgress = true) => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    setIsActive(false);
    
    // Remove activity listeners
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      window.removeEventListener(event, handleActivity);
    });

    if (saveProgress && secondsRef.current >= MIN_SESSION_SECONDS) {
      await saveCurrentProgress();
    }

    console.log('⏹️ Learning session ended');
  };

  const saveCurrentProgress = async () => {
    const minutes = Math.floor(secondsRef.current / 60);
    
    if (minutes > 0) {
      try {
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
        const token = localStorage.getItem("token");
        
        console.log(`📤 Saving learning progress: ${minutes} minutes...`);
        
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
          console.log(`✅ Learning progress tracked: ${minutes} minutes`, data);
          setTotalMinutesTracked(prev => prev + minutes);
          // Reset timer after successful save
          secondsRef.current = 0;
          setSeconds(0);
          sessionStartRef.current = Date.now();
        } else {
          console.error('❌ Failed to track learning progress:', response.statusText, data);
        }
      } catch (error) {
        console.error('❌ Error tracking learning progress:', error);
      }
    } else {
      console.log('⏭️ Skipping save - less than 1 minute tracked');
    }
  };

  // Check for inactivity
  const checkInactivity = () => {
    if (isActive && Date.now() - lastActivityRef.current > INACTIVITY_THRESHOLD) {
      console.log('😴 Session paused due to inactivity');
      stopTimer();
    }
  };

  // Handle page visibility
  const handleVisibilityChange = () => {
    if (document.hidden && isActive) {
      console.log('📱 Page hidden, pausing session');
      stopTimer();
    } else if (!document.hidden && !isActive) {
      console.log('👁️ Page visible, resuming if user is active');
      // Don't auto-start, wait for user activity
    }
  };

  // Handle page unload
  const handleUnload = () => {
    if (isActive && secondsRef.current >= MIN_SESSION_SECONDS) {
      // Use synchronous approach for page unload
      const minutes = Math.floor(secondsRef.current / 60);
      if (minutes > 0) {
        // Use navigator.sendBeacon for reliable data transmission with JSON
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
        const token = localStorage.getItem('token');
        
        // Create blob with JSON data and auth header
        const blob = new Blob(
          [JSON.stringify({ minutes, token })],
          { type: 'application/json' }
        );
        
        navigator.sendBeacon(`${backendUrl}/student/progress?token=${token}`, blob);
        console.log(`🚀 Sent ${minutes} minutes via beacon on page unload`);
      }
    }
  };

  useEffect(() => {
    // Start tracking immediately
    handleActivity();
    
    // Set up inactivity checker
    const inactivityChecker = setInterval(checkInactivity, 30000); // Check every 30 seconds
    
    // Page visibility listener
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Page unload listener
    window.addEventListener('beforeunload', handleUnload);

    return () => {
      clearInterval(inactivityChecker);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleUnload);
      stopTimer(true);
    };
  }, []);

  // Manual controls
  const pauseTracking = () => stopTimer(false);
  const resumeTracking = () => handleActivity();
  
  // Get formatted time display
  const getFormattedTime = () => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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
    currentSessionMinutes: Math.floor(seconds / 60)
  };
}
