import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import UserModel from '@/lib/models/User';
import OtpModel from '@/lib/models/Otp';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, code, password } = body;

        if (!email || !code || !password) {
            return NextResponse.json(
                { error: 'Email, code, and password are required' },
                { status: 400 }
            );
        }

        await dbConnect();

        // Verify OTP
        const otpRecord = await OtpModel.findOne({ email, code });
        if (!otpRecord) {
            return NextResponse.json(
                { error: 'Invalid or expired verification code. Please try again.' },
                { status: 400 }
            );
        }

        // Find the user to update
        const user = await UserModel.findOne({ email });
        if (!user) {
            return NextResponse.json(
                { error: 'User with this email does not exist.' },
                { status: 404 }
            );
        }

        // Update password (using plaintext matching existing schema design)
        user.password = password;
        await user.save();

        // Clean up OTPs
        await OtpModel.deleteMany({ email });

        return NextResponse.json({ success: true, message: 'Password has been reset successfully.' });

    } catch (error: any) {
        console.error('Reset password error:', error);
        return NextResponse.json(
            { error: error?.message || 'An error occurred during password reset' },
            { status: 500 }
        );
    }
}
