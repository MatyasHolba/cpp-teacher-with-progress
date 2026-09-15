import { useState, useEffect, useRef } from 'react';

interface UseTimeTrackerProps {
  currentLessonSlug: string;
  onTick: (lessonSlug: string, deltaSeconds: number) => void;
}

export function useTimeTracker({ currentLessonSlug, onTick }: UseTimeTrackerProps) {
  const [isActive, setIsActive] = useState(true);
  const [idleReason, setIdleReason] = useState<string | null>(null);
  const [lessonSeconds, setLessonSeconds] = useState(0);

  const lastActivityRef = useRef(Date.now());
  const currentSlugRef = useRef(currentLessonSlug);
  currentSlugRef.current = currentLessonSlug;

  const IDLE_TIMEOUT_MS = 60 * 1000; // 60 seconds

  // Reset lesson seconds counter when changing lesson
  useEffect(() => {
    setLessonSeconds(0);
  }, [currentLessonSlug]);

  useEffect(() => {
    const handleActivity = () => {
      lastActivityRef.current = Date.now();
      if (!isActive && idleReason === 'idle') {
        setIsActive(true);
        setIdleReason(null);
      }
    };

    const handleFocus = () => {
      lastActivityRef.current = Date.now();
      setIsActive(true);
      setIdleReason(null);
    };

    const handleBlur = () => {
      setIsActive(false);
      setIdleReason('blur');
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsActive(false);
        setIdleReason('hidden');
      } else {
        lastActivityRef.current = Date.now();
        setIsActive(true);
        setIdleReason(null);
      }
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('scroll', handleActivity);
    window.addEventListener('click', handleActivity);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // 1-second interval timer
    const interval = setInterval(() => {
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
        onTick(currentSlugRef.current, 1);
      }
    }, 1000);

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('scroll', handleActivity);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(interval);
    };
  }, [isActive, idleReason, onTick]);

  return {
    isActive,
    idleReason,
    lessonSeconds
  };
}
