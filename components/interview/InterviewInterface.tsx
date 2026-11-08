'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Loader2, CheckCircle, Mic, MicOff, Volume2 } from 'lucide-react';
import type { Interview, Question } from '@/lib/types';

interface InterviewInterfaceProps {
  interview: Interview;
  questions: Question[];
  onAnswerSubmit: (questionId: string, answerText: string, duration: number) => Promise<void>;
  onInterviewComplete: () => void;
}

export function InterviewInterface({
  interview,
  questions,
  onAnswerSubmit,
  onInterviewComplete,
}: InterviewInterfaceProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answerText, setAnswerText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedAnswers, setSubmittedAnswers] = useState<Set<string>>(new Set());
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [error, setError] = useState<string>();
  const [showFeedback, setShowFeedback] = useState(false);
  const [lastFeedback, setLastFeedback] = useState<any>();

  // Speech Recognition State
  const [isListening, setIsListening] = useState(false);
  const [interimResult, setInterimResult] = useState('');
  const recognitionRef = React.useRef<any>(null);
  const isListeningRef = React.useRef(false);

  const currentQuestion = questions[currentIndex];
  const progress = ((submittedAnswers.size) / questions.length) * 100;
  const isLastQuestion = currentIndex === questions.length - 1;

  // Sync state with ref for handlers
  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  // Initialize Speech Recognition on Mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognitionImpl = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognitionImpl) {
        const rec = new SpeechRecognitionImpl();
        rec.continuous = true;
        rec.interimResults = true;

        rec.onresult = (event: any) => {
          let finalTranscript = '';
          let interimTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            } else {
              interimTranscript += event.results[i][0].transcript;
            }
          }

          if (finalTranscript) {
            setAnswerText(prev => prev ? prev + ' ' + finalTranscript : finalTranscript);
          }
          setInterimResult(interimTranscript);
        };

        rec.onerror = (event: any) => {
          console.error('Speech recognition error', event.error);
          if (event.error === 'not-allowed') {
            setError('Microphone access denied. Please allow microphone access in your browser to use voice answers.');
            setIsListening(false);
          } else if (event.error !== 'no-speech') {
            setError(`Speech recognition error: ${event.error}`);
            setIsListening(false);
          }
        };

        rec.onend = () => {
          // Auto-restart if it was supposed to be listening but stopped (e.g., due to pause)
          if (isListeningRef.current && recognitionRef.current) {
            try {
              recognitionRef.current.start();
            } catch (e) {
              setIsListening(false);
            }
          } else {
            setIsListening(false);
          }
        };

        recognitionRef.current = rec;
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const toggleListening = () => {
    setError(undefined);
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in this browser. Please use Chrome or Edge.");
      return;
    }

    if (isListening) {
      setIsListening(false); // Update state first so onend cleanup doesn't restart it
      recognitionRef.current.stop();
    } else {
      setInterimResult('');
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        console.error('Failed to start recording', e);
      }
    }
  };

  const speakQuestion = () => {
    if (!currentQuestion || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel(); // clear previous
    const utterance = new SpeechSynthesisUtterance(currentQuestion.questionText);
    window.speechSynthesis.speak(utterance);
  };


  useEffect(() => {
    setStartTime(Date.now());
    setAnswerText('');
    setInterimResult('');
    setShowFeedback(false);
    setError(undefined);

    // Auto-read the question when it changes (optional feature)
    // speakQuestion();

    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (isListeningRef.current && recognitionRef.current) {
        setIsListening(false);
        recognitionRef.current.stop();
      }
    };
  }, [currentIndex]);

  const handleSubmit = async () => {
    if (!answerText.trim()) {
      setError('Please provide an answer');
      return;
    }

    setIsSubmitting(true);
    setError(undefined);

    try {
      const duration = Math.round((Date.now() - startTime) / 1000);

      const response = await fetch('/api/interviews/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: currentQuestion.id,
          answerText,
          duration,
        }),
      });

      if (!response.ok) throw new Error('Failed to submit answer');

      const data = await response.json();
      setLastFeedback(data.evaluation);
      setSubmittedAnswers(prev => new Set([...prev, currentQuestion.id]));
      setShowFeedback(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit answer');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = () => {
    if (isLastQuestion && submittedAnswers.has(currentQuestion.id)) {
      onInterviewComplete();
    } else if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setAnswerText('');
    }
  };

  if (!currentQuestion) {
    return (
      <Card className="p-8 text-center">
        <p className="text-gray-500">No questions available</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">Question {currentIndex + 1} of {questions.length}</span>
          <span className="text-sm text-gray-500">{Math.round(progress)}% Complete</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Question Card */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <div className="flex items-start gap-4">
          <div className="flex-1">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-lg font-semibold">Question {currentIndex + 1}</h3>
              <Button variant="ghost" size="sm" onClick={speakQuestion} className="text-blue-700 hover:bg-blue-100 hover:text-blue-800">
                <Volume2 className="h-4 w-4 mr-2" />
                Read Aloud
              </Button>
            </div>
            <p className="text-gray-800 text-base leading-relaxed">{currentQuestion.questionText}</p>
            <div className="flex gap-2 mt-4">
              <Badge variant="secondary">{currentQuestion.difficulty}</Badge>
              <Badge variant="outline">{currentQuestion.category}</Badge>
            </div>
          </div>
        </div>
      </Card>

      {/* Answer Input */}
      {!showFeedback ? (
        <Card className="p-6 space-y-4">
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium">Your Answer</label>
              <Button
                variant={isListening ? "destructive" : "secondary"}
                size="sm"
                onClick={toggleListening}
                disabled={isSubmitting}
              >
                {isListening ? (
                  <><MicOff className="h-4 w-4 mr-2" /> Stop Recording</>
                ) : (
                  <><Mic className="h-4 w-4 mr-2" /> Answer with Voice</>
                )}
              </Button>
            </div>
            <Textarea
              placeholder="Type your answer here. Take your time to think through your response..."
              value={answerText + (interimResult ? (answerText ? ' ' : '') + interimResult : '')}
              onChange={(e) => setAnswerText(e.target.value)}
              disabled={isSubmitting || isListening}
              className="min-h-[128px]"
            />
            <p className="text-xs text-gray-500 mt-2">
              Word count: {answerText.split(/\s+/).filter(w => w).length}
            </p>
          </div>

          {error && (
            <div className="flex gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentIndex === 0 || isSubmitting}
            >
              Previous
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !answerText.trim()}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Evaluating...
                </>
              ) : (
                'Submit Answer'
              )}
            </Button>
          </div>
        </Card>
      ) : (
        /* Feedback Display */
        <Card className="p-6 space-y-4 border-green-200 bg-green-50">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <h4 className="font-semibold text-green-900">Answer Evaluated</h4>
          </div>

          {lastFeedback && (
            <div className="space-y-4">
              {/* Scores */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-white rounded border">
                  <p className="text-xs text-gray-600">Content Quality</p>
                  <p className="text-2xl font-bold text-blue-600">{lastFeedback.contentScore}</p>
                </div>
                <div className="p-3 bg-white rounded border">
                  <p className="text-xs text-gray-600">Clarity</p>
                  <p className="text-2xl font-bold text-green-600">{lastFeedback.clarityScore}</p>
                </div>
                <div className="p-3 bg-white rounded border">
                  <p className="text-xs text-gray-600">Confidence</p>
                  <p className="text-2xl font-bold text-purple-600">{lastFeedback.confidenceScore}</p>
                </div>
                <div className="p-3 bg-white rounded border">
                  <p className="text-xs text-gray-600">Completeness</p>
                  <p className="text-2xl font-bold text-orange-600">{lastFeedback.completenessScore}</p>
                </div>
              </div>

              {/* Feedback Text */}
              <div className="p-3 bg-white rounded border">
                <p className="text-sm font-medium mb-2">Feedback</p>
                <p className="text-sm text-gray-700">{lastFeedback.feedbackText}</p>
              </div>

              {/* Strengths */}
              {lastFeedback.strengths?.length > 0 && (
                <div className="p-3 bg-white rounded border">
                  <p className="text-sm font-medium mb-2 text-green-700">Strengths</p>
                  <ul className="text-sm text-gray-700 space-y-1">
                    {lastFeedback.strengths.map((s: string, i: number) => (
                      <li key={i}>• {s}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Areas for Improvement */}
              {lastFeedback.improvements?.length > 0 && (
                <div className="p-3 bg-white rounded border">
                  <p className="text-sm font-medium mb-2 text-orange-700">Areas for Improvement</p>
                  <ul className="text-sm text-gray-700 space-y-1">
                    {lastFeedback.improvements.map((i: string, idx: number) => (
                      <li key={idx}>• {i}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button variant="outline" onClick={() => setShowFeedback(false)}>
              Review Answer
            </Button>
            <Button onClick={handleNext}>
              {isLastQuestion ? 'Complete Interview' : 'Next Question'}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
