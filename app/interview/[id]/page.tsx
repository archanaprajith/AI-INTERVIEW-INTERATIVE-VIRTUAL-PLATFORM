'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { InterviewInterface } from '@/components/interview/InterviewInterface';
import type { Interview, Question } from '@/lib/types';

export default function InterviewPage() {
  const router = useRouter();
  const params = useParams();
  const interviewId = params.id as string;

  const [interview, setInterview] = useState<Interview | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>();

  useEffect(() => {
    const loadInterview = async () => {
      try {
        // Check session storage first
        const stored = sessionStorage.getItem('interviewData');
        if (stored) {
          const data = JSON.parse(stored);
          setInterview(data.interview);
          setQuestions(data.questions);
          sessionStorage.removeItem('interviewData');
        } else {
          // Fetch from API
          const response = await fetch(`/api/interviews/${interviewId}`);
          if (!response.ok) throw new Error('Failed to load interview');
          
          const data = await response.json();
          setInterview(data.interview);
          setQuestions(data.questions);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load interview');
      } finally {
        setIsLoading(false);
      }
    };

    loadInterview();
  }, [interviewId]);

  const handleInterviewComplete = async () => {
    // Calculate overall score
    const response = await fetch(`/api/interviews/${interviewId}`);
    const data = await response.json();
    
    sessionStorage.setItem('interviewResults', JSON.stringify(data));
    router.push(`/interview/results/${interviewId}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center py-12 px-4">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading your interview...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center py-12 px-4">
        <Card className="p-8 max-w-md text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => router.push('/interview/setup')}>
            Start New Interview
          </Button>
        </Card>
      </div>
    );
  }

  if (!interview || questions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center py-12 px-4">
        <Card className="p-8 max-w-md text-center">
          <p className="text-gray-600 mb-4">No interview data available</p>
          <Button onClick={() => router.push('/interview/setup')}>
            Start New Interview
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Interview Session</h1>
          <p className="text-gray-600 mt-1">
            {interview.category.charAt(0).toUpperCase() + interview.category.slice(1)} Interview • {interview.difficulty.toUpperCase()} Level
          </p>
        </div>

        {/* Interview Interface */}
        <InterviewInterface
          interview={interview}
          questions={questions}
          onAnswerSubmit={async (questionId, answerText, duration) => {
            // Handled in the component
          }}
          onInterviewComplete={handleInterviewComplete}
        />
      </div>
    </div>
  );
}
