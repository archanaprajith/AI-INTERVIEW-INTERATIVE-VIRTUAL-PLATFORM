import { NextRequest, NextResponse } from 'next/server';
import { deleteUser } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    console.log(`Deleting account for user: ${userId}`);
    const success = await deleteUser(userId);

    if (success) {
      return NextResponse.json({ success: true, message: 'Account deleted successfully' });
    } else {
      return NextResponse.json(
        { error: 'User not found or already deleted' },
        { status: 404 }
      );
    }
  } catch (error: any) {
    console.error('Account Deletion Error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred during account deletion', details: error.message },
      { status: 500 }
    );
  }
}
