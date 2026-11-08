import { NextRequest, NextResponse } from 'next/server';
import { createAnswer, createEvaluation, getQuestion } from '@/lib/db';
import { evaluateAnswer } from '@/lib/ai';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { questionId, answerText, duration = 30 } = body;

    if (!questionId || !answerText) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get question context for evaluation
    const question = await getQuestion(questionId);
    if (!question) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }

    // Create answer record
    const answer = await createAnswer(questionId, answerText, duration);

    // Evaluate the answer
    const evaluation = await evaluateAnswer(answerText, question.questionText);

    // Store evaluation
    const savedEvaluation = await createEvaluation(answer.id, {
      contentScore: evaluation.scores.contentQuality,
      clarityScore: evaluation.scores.clarity,
      confidenceScore: evaluation.scores.confidence,
      completenessScore: evaluation.scores.completeness,
      feedbackText: evaluation.feedback.summary,
      strengths: evaluation.feedback.strengths,
      improvements: evaluation.feedback.improvements,
      idealAnswer: evaluation.idealAnswer,
    });

    return NextResponse.json({
      answer,
      evaluation: {
        ...savedEvaluation,
        scores: evaluation.scores,
      },
    });
  } catch (error) {
    console.error('Error submitting answer:', error);
    return NextResponse.json(
      { error: 'Failed to submit answer' },
      { status: 500 }
    );
  }
}
