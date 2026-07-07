import { useState, useEffect } from 'react';

// Persists state to localStorage so data survives page refreshes.
export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored !== null ? JSON.parse(stored) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // storage full or unavailable — app keeps working in-memory
    }
  }, [key, value]);

  return [value, setValue];
}
