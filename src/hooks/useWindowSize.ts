import { useState, useEffect } from 'react';

export interface WindowDimensions {
  width: number;
  height: number;
}

/**
 * Custom hook to monitor window resize events
 */
export function useWindowSize(): WindowDimensions {
  const [size, setSize] = useState<WindowDimensions>(() => ({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  }));

  useEffect(() => {
    function handleResize(): void {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return size;
}
