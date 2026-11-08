import { NextRequest, NextResponse } from 'next/server';
import { getAllUsers } from '@/lib/db';

export async function GET(request: NextRequest) {
    try {
        const users = await getAllUsers();

        // For security, remove passwords before sending to the client
        const safeUsers = users.map(({ password, ...rest }) => rest);

        return NextResponse.json({ users: safeUsers });
    } catch (error) {
        console.error('Error fetching users:', error);
        return NextResponse.json(
            { error: 'Failed to fetch users' },
            { status: 500 }
        );
    }
}
