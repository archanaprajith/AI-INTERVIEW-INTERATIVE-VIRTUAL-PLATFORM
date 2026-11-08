'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import type { Interview, Question, Answer, Evaluation, InterviewSession } from '@/lib/types';

interface InterviewContextType {
  session: InterviewSession | null;
  setSession: (session: InterviewSession | null) => void;
  updateCurrentQuestion: (index: number) => void;
  addAnswer: (answer: Answer, evaluation: Evaluation) => void;
  completeInterview: (overallScore: number) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  error: string | undefined;
  setError: (error: string | undefined) => void;
}

const InterviewContext = createContext<InterviewContextType | undefined>(undefined);

export function InterviewProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const updateCurrentQuestion = useCallback((index: number) => {
    setSession(prev => prev ? { ...prev, currentQuestionIndex: index } : null);
  }, []);

  const addAnswer = useCallback((answer: Answer, evaluation: Evaluation) => {
    setSession(prev => {
      if (!prev) return null;
      return {
        ...prev,
        answers: [...prev.answers, answer],
        evaluations: [...prev.evaluations, evaluation],
      };
    });
  }, []);

  const completeInterview = useCallback((overallScore: number) => {
    setSession(prev => {
      if (!prev) return null;
      return {
        ...prev,
        interview: {
          ...prev.interview,
          status: 'completed',
          endTime: new Date(),
          overallScore,
        },
      };
    });
  }, []);

  const value: InterviewContextType = {
    session,
    setSession,
    updateCurrentQuestion,
    addAnswer,
    completeInterview,
    isLoading,
    setIsLoading,
    error,
    setError,
  };

  return (
    <InterviewContext.Provider value={value}>
      {children}
    </InterviewContext.Provider>
  );
}

export function useInterview() {
  const context = useContext(InterviewContext);
  if (context === undefined) {
    throw new Error('useInterview must be used within InterviewProvider');
  }
  return context;
}
