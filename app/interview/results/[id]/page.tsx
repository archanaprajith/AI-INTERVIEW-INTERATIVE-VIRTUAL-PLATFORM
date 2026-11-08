'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import type { Interview, Question, Evaluation } from '@/lib/types';

export default function ResultsPage() {
  const router = useRouter();
  const params = useParams();
  const interviewId = params.id as string;

  const [interview, setInterview] = useState<Interview | null>(null);
  const [questions, setQuestions] = useState<any[]>([]); // Enriched with evaluation and answer
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadResults = async () => {
      try {
        // Check session storage first
        const stored = sessionStorage.getItem('interviewResults');
        if (stored) {
          const data = JSON.parse(stored);
          setInterview(data.interview);
          setQuestions(data.questions);
          sessionStorage.removeItem('interviewResults');
        }

        // Fetch detailed evaluation data
        const response = await fetch(`/api/interviews/${interviewId}`);
        if (response.ok) {
          const data = await response.json();
          setInterview(data.interview);
          setQuestions(data.questions || []);
        }
      } catch (error) {
        console.error('Failed to load results:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadResults();
  }, [interviewId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center py-12 px-4">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading your results...</p>
        </div>
      </div>
    );
  }

  if (!interview) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center py-12 px-4">
        <Card className="p-8 max-w-md text-center">
          <p className="text-gray-600 mb-4">Results not available</p>
          <Button onClick={() => router.push('/interview/setup')}>
            Start New Interview
          </Button>
        </Card>
      </div>
    );
  }

  const overallScore = interview.overallScore || 0;
  const scoreColor = overallScore >= 80 ? 'text-green-600' : overallScore >= 60 ? 'text-blue-600' : 'text-orange-600';
  const scoreLabel = overallScore >= 80 ? 'Excellent' : overallScore >= 60 ? 'Good' : 'Needs Improvement';

  // Dynamic chart data from enriched questions
  const chartData = questions.map((q, i) => {
    const e = q.evaluation;
    return { 
      question: `Q${i+1}`, 
      score: e ? Math.round(e.contentScore * 0.4 + e.clarityScore * 0.3 + e.confidenceScore * 0.2 + e.completenessScore * 0.1) : 0 
    };
  });

  const validEvals = questions.map(q => q.evaluation).filter(Boolean);
  const metricsData = validEvals.length > 0 ? [
    { name: 'Content', value: Math.round(validEvals.reduce((s, e: any) => s + e.contentScore, 0) / validEvals.length) },
    { name: 'Clarity', value: Math.round(validEvals.reduce((s, e: any) => s + e.clarityScore, 0) / validEvals.length) },
    { name: 'Confidence', value: Math.round(validEvals.reduce((s, e: any) => s + e.confidenceScore, 0) / validEvals.length) },
    { name: 'Completeness', value: Math.round(validEvals.reduce((s, e: any) => s + e.completenessScore, 0) / validEvals.length) },
  ] : [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Interview Complete! 🎉</h1>
          <p className="text-lg text-gray-600">Here's your detailed performance analysis</p>
        </div>

        {/* Overall Score Card */}
        <Card className="p-8 mb-8 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-lg font-semibold text-gray-700 mb-2">Overall Score</h2>
              <div className={`text-6xl font-bold ${scoreColor} mb-2`}>{overallScore}</div>
              <Badge variant="default" className="bg-blue-600">{scoreLabel}</Badge>
              <p className="text-sm text-gray-600 mt-4">
                Based on your performance across {questions.length} questions
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-32 h-32 rounded-full border-8 border-blue-200 bg-white">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">{overallScore}</div>
                  <div className="text-xs text-gray-500">Score</div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Performance Metrics */}
        <Card className="p-8 mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Performance Metrics
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={metricsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-15} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Question-by-Question Breakdown */}
        <Card className="p-8 mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Question-by-Question Breakdown</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="question" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={2} dot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Recommendations */}
        <Card className="p-8 mb-8 border-amber-200 bg-amber-50">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Recommendations for Improvement</h3>
          <ul className="space-y-3 text-gray-700">
            <li className="flex gap-3">
              <span className="text-amber-600 font-bold">1.</span>
              <span>Work on providing more concrete examples in your answers. This demonstrates deeper understanding.</span>
            </li>
            <li className="flex gap-3">
              <span className="text-amber-600 font-bold">2.</span>
              <span>Practice structuring your responses with clear opening, middle, and closing statements.</span>
            </li>
            <li className="flex gap-3">
              <span className="text-amber-600 font-bold">3.</span>
              <span>Consider slowing down your speech to ensure clarity and confidence in your delivery.</span>
            </li>
            <li className="flex gap-3">
              <span className="text-amber-600 font-bold">4.</span>
              <span>Review system design concepts and prepare for follow-up questions about trade-offs.</span>
            </li>
          </ul>
        </Card>

        {/* Session Info */}
        <Card className="p-6 mb-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-gray-500 uppercase font-semibold">Category</p>
              <p className="text-lg font-semibold text-gray-900 capitalize">{interview.category}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-semibold">Difficulty</p>
              <p className="text-lg font-semibold text-gray-900 capitalize">{interview.difficulty}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-semibold">Questions</p>
              <p className="text-lg font-semibold text-gray-900">{questions.length}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-semibold">Duration</p>
              <p className="text-lg font-semibold text-gray-900">~15 mins</p>
            </div>
          </div>
        </Card>

        {/* Detailed Question Review & Ideal Answers */}
        <div className="space-y-6 mb-12">
           <h3 className="text-2xl font-black text-slate-900 px-2 tracking-tight">Question Depth Review</h3>
           {questions.map((q, index) => {
              const evalItem = q.evaluation;
              return (
                <Card key={q.id} className="p-8 border-slate-200 overflow-hidden relative">
                   <Badge className="mb-4 bg-indigo-50 text-indigo-600 border-indigo-100">Question {index + 1}</Badge>
                   <h4 className="text-xl font-bold text-slate-900 mb-4">{q.questionText}</h4>
                   
                   {evalItem && (
                     <div className="space-y-6">
                        <div className="p-5 bg-emerald-50/30 rounded-2xl border border-emerald-100/50">
                           <p className="text-xs font-black uppercase tracking-widest text-emerald-600 mb-2">Your Answer</p>
                           <p className="text-slate-700 leading-relaxed italic">"{q.answer?.answerText || "No answer recorded."}"</p>
                        </div>
                        
                        <div className="p-5 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                           <p className="text-xs font-black uppercase tracking-widest text-indigo-600 mb-2">Ideal Technical Response</p>
                           <p className="text-slate-700 leading-relaxed font-medium">"{evalItem.idealAnswer || "Synthesizing ideal response..."}"</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100">
                              <p className="text-[10px] font-black uppercase text-emerald-600 mb-2">Strengths</p>
                              <ul className="text-sm text-slate-600 space-y-1">
                                 {evalItem.strengths.map((s: string, i: number) => <li key={i}>• {s}</li>)}
                              </ul>
                           </div>
                           <div className="p-4 bg-rose-50/50 rounded-xl border border-rose-100">
                              <p className="text-[10px] font-black uppercase text-rose-600 mb-2">Improvements</p>
                              <ul className="text-sm text-slate-600 space-y-1">
                                 {evalItem.improvements.map((im: string, i: number) => <li key={i}>• {im}</li>)}
                              </ul>
                           </div>
                        </div>
                     </div>
                   )}
                </Card>
              );
           })}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col md:flex-row gap-4">
          <Button
            onClick={() => router.push('/interview/setup')}
            className="flex-1 h-14 text-lg font-black bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-100 rounded-2xl"
          >
            Practice Another Interview
          </Button>
          <Button
            variant="outline"
            className="flex-1 h-14 text-lg font-bold border-slate-200 text-slate-600 rounded-2xl hover:bg-slate-50"
            onClick={() => router.push('/dashboard')}
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
