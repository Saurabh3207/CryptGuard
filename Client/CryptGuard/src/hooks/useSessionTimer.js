import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'react-hot-toast';
import logger from '../utils/logger';

/**
 * Session Timer Hook
 * Manages session expiry, warnings, and auto-logout
 */
export const useSessionTimer = (isAuthenticated) => {
  // NOTE: do NOT use react-router navigation here because Web3Provider
  // mounts before the Router in our app. Use a safe window.location redirect
  // so this hook can be used at top-level provider.
  
  // Session configuration (in milliseconds)
  const SESSION_DURATION = 15 * 60 * 1000; // 15 minutes
  const WARNING_TIME = 14 * 60 * 1000; // 14 minutes (warn 1 min before expiry)
  const ACTIVITY_RESET_THRESHOLD = 5 * 60 * 1000; // Reset if activity detected within 5 min
  
  const [sessionTimeRemaining, setSessionTimeRemaining] = useState(SESSION_DURATION);
  const [showWarning, setShowWarning] = useState(false);
  const [isSessionActive, setIsSessionActive] = useState(false);
  
  const sessionTimerRef = useRef(null);
  const warningTimerRef = useRef(null);
  const lastActivityRef = useRef(Date.now());
  const loginTimeRef = useRef(null);

  /**
   * Start session timer
   */
  const startSession = useCallback(() => {
    const now = Date.now();
    loginTimeRef.current = now;
    lastActivityRef.current = now;
    localStorage.setItem('sessionStartTime', now.toString());
    setIsSessionActive(true);
    setShowWarning(false);
    
    logger.debug('Session started', { startTime: new Date(now).toISOString() });
    
    // Clear any existing timers
    if (sessionTimerRef.current) clearInterval(sessionTimerRef.current);
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    
    // Set warning timer (fires 1 minute before expiry)
    warningTimerRef.current = setTimeout(() => {
      setShowWarning(true);
      logger.debug('Session expiry warning displayed');
      
      toast('⏰ Your session will expire in 1 minute!', {
        duration: 5000,
        icon: '⚠️',
        style: {
          background: '#f59e0b',
          color: '#fff',
          fontSize: '14px',
        }
      });
    }, WARNING_TIME);
    
    // Set session expiry timer
    sessionTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - loginTimeRef.current;
      const remaining = SESSION_DURATION - elapsed;
      
      setSessionTimeRemaining(remaining);
      
      if (remaining <= 0) {
        endSession();
      }
    }, 1000); // Update every second
    
  }, []);

  /**
   * End session and redirect to wallet
   */
  const endSession = useCallback(() => {
    logger.debug('Session ended');
    
    // Clear timers
    if (sessionTimerRef.current) clearInterval(sessionTimerRef.current);
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    
    // Clear state
    setIsSessionActive(false);
    setShowWarning(false);
    setSessionTimeRemaining(SESSION_DURATION);
    localStorage.removeItem('sessionStartTime');
    localStorage.removeItem('address');
    
    // Show expiry notification
    toast.error('⏰ Session expired! Please reconnect your wallet.', {
      duration: 4000,
      style: {
        background: '#ef4444',
        color: '#fff',
        fontSize: '14px',
      }
    });
    
    // Redirect to wallet page (use full navigation to work outside Router)
    setTimeout(() => {
      window.location.href = '/wallet';
    }, 1500);
  }, []);

  /**
   * Extend session (called when user clicks "Stay logged in")
   */
  const extendSession = useCallback(() => {
    logger.debug('Session extended by user action');
    
    // Reset timers
    startSession();
    
    toast.success('✅ Session extended for 15 more minutes!', {
      duration: 3000,
      style: {
        background: '#10b981',
        color: '#fff',
        fontSize: '14px',
      }
    });
  }, [startSession]);

  /**
   * Record user activity to potentially reset timer
   */
  const recordActivity = useCallback(() => {
    const now = Date.now();
    const timeSinceLastActivity = now - lastActivityRef.current;
    
    // Only reset if significant time has passed and user is still within session
    if (timeSinceLastActivity > ACTIVITY_RESET_THRESHOLD && isSessionActive) {
      const elapsed = now - loginTimeRef.current;
      
      // Only extend if we're past 5 minutes but before expiry
      if (elapsed > ACTIVITY_RESET_THRESHOLD && elapsed < SESSION_DURATION) {
        logger.debug('Activity detected, extending session');
        startSession(); // Reset the timer
      }
    }
    
    lastActivityRef.current = now;
  }, [isSessionActive, startSession]);

  /**
   * Restore session from localStorage if page reloads
   */
  useEffect(() => {
    if (isAuthenticated && !isSessionActive) {
      const storedStartTime = localStorage.getItem('sessionStartTime');
      
      if (storedStartTime) {
        const startTime = parseInt(storedStartTime, 10);
        const elapsed = Date.now() - startTime;
        
        if (elapsed < SESSION_DURATION) {
          // Session still valid, restore it
          loginTimeRef.current = startTime;
          startSession();
          logger.debug('Session restored from localStorage');
        } else {
          // Session expired during reload
          endSession();
        }
      } else {
        // No stored session, start new one
        startSession();
      }
    }
  }, [isAuthenticated, isSessionActive, startSession, endSession]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (sessionTimerRef.current) clearInterval(sessionTimerRef.current);
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    };
  }, []);

  /**
   * Format time remaining for display
   */
  const formatTimeRemaining = useCallback(() => {
    const minutes = Math.floor(sessionTimeRemaining / 60000);
    const seconds = Math.floor((sessionTimeRemaining % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, [sessionTimeRemaining]);

  /**
   * Get session status color
   */
  const getSessionStatusColor = useCallback(() => {
    const percentRemaining = (sessionTimeRemaining / SESSION_DURATION) * 100;
    
    if (percentRemaining > 50) return 'green';
    if (percentRemaining > 20) return 'yellow';
    return 'red';
  }, [sessionTimeRemaining]);

  return {
    sessionTimeRemaining,
    showWarning,
    isSessionActive,
    startSession,
    endSession,
    extendSession,
    recordActivity,
    formatTimeRemaining,
    getSessionStatusColor,
  };
};
