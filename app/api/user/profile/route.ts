import { NextRequest, NextResponse } from 'next/server';
import { updateUser } from '@/lib/db';

export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { userId, ...updates } = body;

        if (!userId) {
            return NextResponse.json(
                { error: 'User ID is required' },
                { status: 400 }
            );
        }

        const user = await updateUser(userId, updates);

        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ user }, { status: 200 });
    } catch (error) {
        console.error('Profile update error:', error);
        return NextResponse.json(
            { error: 'An error occurred during profile update' },
            { status: 500 }
        );
    }
}
