import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import UserModel from '@/lib/models/User';
import InterviewModel from '@/lib/models/Interview';

export async function DELETE(
    request: NextRequest,
    context: any
) {
    try {
        await dbConnect();
        
        // Safely resolve params whether it's a Promise or an Object
        const params = await context.params;
        const userId = params?.id;
        
        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        // Delete the user and all their associated interviews
        const user = await UserModel.findByIdAndDelete(userId);
        
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        await InterviewModel.deleteMany({ userId });

        return NextResponse.json({ success: true, message: 'User completely deleted' });
        
    } catch (error: any) {
        console.error('Delete user error:', error);
        return NextResponse.json(
            { error: error?.message || 'An error occurred while deleting user' },
            { status: 500 }
        );
    }
}
