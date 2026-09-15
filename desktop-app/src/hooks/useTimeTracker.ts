import { useState, useEffect, useRef } from 'react';

interface UseTimeTrackerProps {
  currentLessonSlug: string;
  onTick: (lessonSlug: string, deltaSeconds: number, type: 'reading' | 'coding') => void;
}

export function useTimeTracker({ currentLessonSlug, onTick }: UseTimeTrackerProps) {
  const [isActive, setIsActive] = useState(true);
  const [isCodingMode, setIsCodingMode] = useState(false);
  const [idleReason, setIdleReason] = useState<string | null>(null);
  const [lessonSeconds, setLessonSeconds] = useState(0);
  const [codingSeconds, setCodingSeconds] = useState(0);

  const lastActivityRef = useRef(Date.now());
  const currentSlugRef = useRef(currentLessonSlug);
  currentSlugRef.current = currentLessonSlug;
  const isCodingModeRef = useRef(isCodingMode);
  isCodingModeRef.current = isCodingMode;

  const IDLE_TIMEOUT_MS = 60 * 1000; // 60 seconds

  // Reset counters when changing lesson
  useEffect(() => {
    setLessonSeconds(0);
    setCodingSeconds(0);
    setIsCodingMode(false);
  }, [currentLessonSlug]);

  const resumeTracking = () => {
    lastActivityRef.current = Date.now();
    setIsCodingMode(false);
    setIsActive(true);
    setIdleReason(null);
  };

  const startCodingMode = () => {
    setIsCodingMode(true);
    setIsActive(false);
    setIdleReason('coding');
  };

  const stopCodingMode = () => {
    setIsCodingMode(false);
    setIsActive(true);
    setIdleReason(null);
    lastActivityRef.current = Date.now();
  };

  useEffect(() => {
    const handleActivity = () => {
      lastActivityRef.current = Date.now();
    };

    const handleBlur = () => {
      if (!isCodingModeRef.current) {
        setIsActive(false);
        setIdleReason('away');
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden && !isCodingModeRef.current) {
        setIsActive(false);
        setIdleReason('away');
      }
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('scroll', handleActivity);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // 1-second interval timer
    const interval = setInterval(() => {
      // If user is in coding mode (even in background/IDE): count coding time!
      if (isCodingModeRef.current) {
        setCodingSeconds(prev => prev + 1);
        onTick(currentSlugRef.current, 1, 'coding');
        return;
      }

      const now = Date.now();
      const idleTime = now - lastActivityRef.current;

      if (idleTime > IDLE_TIMEOUT_MS) {
        if (isActive) {
          setIsActive(false);
          setIdleReason('idle');
        }
        return;
      }

      if (isActive && !document.hidden && document.hasFocus()) {
        setLessonSeconds(prev => prev + 1);
        onTick(currentSlugRef.current, 1, 'reading');
      }
    }, 1000);

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('scroll', handleActivity);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(interval);
    };
  }, [isActive, isCodingMode, idleReason, onTick]);

  return {
    isActive,
    isCodingMode,
    idleReason,
    lessonSeconds,
    codingSeconds,
    resumeTracking,
    startCodingMode,
    stopCodingMode
  };
}
