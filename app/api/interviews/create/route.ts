import { NextRequest, NextResponse } from 'next/server';
import { createInterview, createQuestions, getOrCreateUser } from '@/lib/db';
import { generateQuestion } from '@/lib/ai';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name, category, difficulty } = body;

    if (!email || !name || !category || !difficulty) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get or create user
    const user = await getOrCreateUser(email, name);

    // Create interview
    const interview = await createInterview(user.id, category, difficulty);

    // Generate questions (7 questions for a deep-dive session)
    // The first question is now subject-aligned to ensure 100% technical relevance
    const categoryNames: Record<string, string> = {
      'dsa': 'Data Structures & Algorithms',
      'dbms': 'Database Management Systems',
      'os': 'Operating Systems',
      'networks': 'Computer Networks',
      'system-design': 'System Design',
      'web-dev': 'Web Development'
    };
    const catName = categoryNames[category] || category;

    const questionTexts = [
      `Welcome to your ${catName} simulation. To begin, could you provide an overview of your technical experience in this field and mention a specific project where you solved a complex challenge?`,
    ];

    for (let i = 1; i < 7; i++) {
      const q = await generateQuestion(category, difficulty, i + 1);
      questionTexts.push(q);
    }

    const questionsData = questionTexts.map((text, index) => ({
      questionText: text,
      category: index === 0 ? 'behavioral' : category, // intro is always behavioral
      difficulty: index === 0 ? 'easy' : difficulty,   // intro is always easy
      order: index,
      hints: [],
    }));

    const questions = await createQuestions(interview.id, questionsData);

    return NextResponse.json({
      interview,
      questions,
      userId: user.id,
    });
  } catch (error) {
    console.error('Error creating interview:', error);
    return NextResponse.json(
      { error: 'Failed to create interview' },
      { status: 500 }
    );
  }
}
