import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';

export function useSessionTimer() {
  const auth = useAuth();
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    if (!auth.user) return;

    let idleTimer: ReturnType<typeof setTimeout>;
    let logoutTimer: ReturnType<typeof setTimeout>;

    const resetTimers = () => {
      clearTimeout(idleTimer);
      clearTimeout(logoutTimer);
      
      // 30 mins idle
      idleTimer = setTimeout(() => setShowPrompt(true), 30 * 60 * 1000);
      // 15 mins after prompt
      logoutTimer = setTimeout(() => auth.logout(), (30 + 15) * 60 * 1000);
    };

    window.addEventListener('mousemove', resetTimers);
    window.addEventListener('keydown', resetTimers);
    resetTimers();

    return () => {
      window.removeEventListener('mousemove', resetTimers);
      window.removeEventListener('keydown', resetTimers);
      clearTimeout(idleTimer);
      clearTimeout(logoutTimer);
    };
  }, [auth.user]);

  return { showPrompt, setShowPrompt, reset: () => setShowPrompt(false) };
}
