import { NextRequest, NextResponse } from 'next/server';
import { getUserInterviews, getUserById, getInterviewEvaluations } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get user data
    const user = await getUserById(userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get all interviews for user
    const interviews = await getUserInterviews(userId);

    // Enrich interviews with evaluation data
    const enrichedInterviews = await Promise.all(
      interviews.map(async (interview) => {
        const evaluations = await getInterviewEvaluations(interview.id);
        const avgScore = evaluations.length > 0 
          ? Math.round(
              evaluations.reduce((sum, e) => {
                const score = e.contentScore * 0.4 + e.clarityScore * 0.3 + e.confidenceScore * 0.2 + e.completenessScore * 0.1;
                return sum + score;
              }, 0) / evaluations.length
            )
          : 0;

        return {
          ...interview,
          overallScore: interview.overallScore || avgScore,
          evaluationCount: evaluations.length,
        };
      })
    );

    return NextResponse.json({
      user,
      interviews: enrichedInterviews.sort((a, b) => 
        new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
      ),
    });
  } catch (error) {
    console.error('Error fetching user interviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch interviews' },
      { status: 500 }
    );
  }
}
