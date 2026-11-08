'use client';

import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface InterviewTimerProps {
  onTimeChange?: (seconds: number) => void;
  isRunning: boolean;
}

export function InterviewTimer({ onTimeChange, isRunning }: InterviewTimerProps) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setSeconds(prev => {
        const newSeconds = prev + 1;
        onTimeChange?.(newSeconds);
        return newSeconds;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, onTimeChange]);

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg">
      <Clock className="h-4 w-4 text-gray-600" />
      <span className="text-sm font-mono font-semibold text-gray-800">
        {formatTime(seconds)}
      </span>
    </div>
  );
}
