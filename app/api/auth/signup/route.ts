import { NextRequest, NextResponse } from 'next/server';
import { createUser } from '@/lib/db';
import dbConnect from '@/lib/mongoose';
import OtpModel from '@/lib/models/Otp';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, email, password, code, college, course, skills, experience, cvUrl } = body;

        if (!email || !password || !name || !code) {
            return NextResponse.json(
                { error: 'Name, email, password, and verification code are required' },
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

        try {
            const user = await createUser({
                name,
                email,
                password,
                college,
                course,
                skills,
                experience,
                cvUrl
            });

            // Clean up OTPs
            await OtpModel.deleteMany({ email });

            const { password: _, ...safeUser } = user;
            return NextResponse.json({ user: safeUser }, { status: 201 });
        } catch (e: any) {
            if (e.message === 'User already exists') {
                return NextResponse.json(
                    { error: 'User with this email already exists' },
                    { status: 409 }
                );
            }
            throw e;
        }
    } catch (error) {
        console.error('Signup error:', error);
        return NextResponse.json(
            { error: 'An error occurred during signup' },
            { status: 500 }
        );
    }
}
