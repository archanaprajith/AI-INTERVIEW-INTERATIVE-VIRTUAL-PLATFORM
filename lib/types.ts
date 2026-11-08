// User Types
export interface User {
  id: string;
  email: string;
  name: string;
  password?: string;
  college?: string;
  course?: string;
  skills?: string[];
  cvUrl?: string;
  targetRole?: string;
  experience?: string;
  createdAt: Date;
}

// Interview Types
export interface Interview {
  id: string;
  userId: string;
  category: string; // e.g., "tech", "behavioral", "system-design"
  difficulty: 'easy' | 'medium' | 'hard';
  startTime: Date;
  endTime?: Date;
  overallScore?: number;
  status: 'active' | 'completed' | 'abandoned';
}

// Question Types
export interface Question {
  id: string;
  interviewId: string;
  questionText: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  order: number;
  hints?: string[];
}

// Answer Types
export interface Answer {
  id: string;
  questionId: string;
  answerText: string;
  audioUrl?: string;
  wordCount: number;
  duration: number; // in seconds
  submittedAt: Date;
}

// Evaluation Types
export interface Evaluation {
  id: string;
  answerId: string;
  contentScore: number; // 0-100
  clarityScore: number; // 0-100
  confidenceScore: number; // 0-100
  completenessScore: number; // 0-100
  feedbackText: string;
  strengths: string[];
  improvements: string[];
  idealAnswer?: string;
  evaluatedAt: Date;
}

// Scoring Types
export interface OverallScore {
  contentQuality: number; // 40%
  clarity: number; // 30%
  confidence: number; // 20%
  completeness: number; // 10%
  total: number;
}

// Session Types for Client-side State
export interface InterviewSession {
  interview: Interview;
  questions: Question[];
  currentQuestionIndex: number;
  answers: Answer[];
  evaluations: Evaluation[];
  isLoading: boolean;
  error?: string;
}
