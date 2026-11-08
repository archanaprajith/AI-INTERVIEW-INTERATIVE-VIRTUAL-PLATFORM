import { NextRequest, NextResponse } from 'next/server';
import { getInterview, getInterviewQuestions, getInterviewEvaluations } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const interview = await getInterview(id);
    if (!interview) {
      return NextResponse.json(
        { error: 'Interview not found' },
        { status: 404 }
      );
    }

    const questions = await getInterviewQuestions(id);
    const evaluations = await getInterviewEvaluations(id);

    // Calculate overall score if interview is completed
    let overallScore = interview.overallScore;
    if (evaluations.length > 0 && !overallScore) {
      const avgScore = Math.round(
        evaluations.reduce((sum, e) => {
          const score = e.contentScore * 0.4 + e.clarityScore * 0.3 + e.confidenceScore * 0.2 + e.completenessScore * 0.1;
          return sum + score;
        }, 0) / evaluations.length
      );
      overallScore = avgScore;
    }

    // Fetch answers to link evaluations to questions
    const { getQuestionAnswers } = await import('@/lib/db');
    
    // Enrich questions with evaluations
    const enrichedQuestions = await Promise.all(questions.map(async (q) => {
      const answers = await getQuestionAnswers(q.id);
      if (answers.length === 0) return { ...q, evaluation: null, answer: null };
      
      const evaluation = evaluations.find(e => e.answerId === answers[0].id);
      return {
        ...q,
        answer: answers[0],
        evaluation: evaluation || null
      };
    }));

    return NextResponse.json({
      interview: { ...interview, overallScore },
      questions: enrichedQuestions,
      evaluationCount: evaluations.length,
    });
  } catch (error) {
    console.error('Error fetching interview:', error);
    return NextResponse.json(
      { error: 'Failed to fetch interview' },
      { status: 500 }
    );
  }
}
