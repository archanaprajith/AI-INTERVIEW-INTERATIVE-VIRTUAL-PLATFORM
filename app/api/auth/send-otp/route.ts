import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import dbConnect from '@/lib/mongoose';
import UserModel from '@/lib/models/User';
import OtpModel from '@/lib/models/Otp';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const email = body.email?.trim();

        if (!email) {
            return NextResponse.json(
                { error: 'Email is required' },
                { status: 400 }
            );
        }

        const emailUser = process.env.EMAIL_USER?.trim();
        const rawEmailPass = process.env.EMAIL_PASS?.trim();
        const emailPass = rawEmailPass ? rawEmailPass.replace(/\s+/g, '') : '';

        if (!emailUser || !emailPass) {
            return NextResponse.json(
                { error: 'Email service is not configured. Please set EMAIL_USER and EMAIL_PASS in the server environment.' },
                { status: 503 }
            );
        }

        await dbConnect();

        // Check if user already exists
        const existingUser = await UserModel.findOne({ email });
        if (existingUser) {
            return NextResponse.json(
                { error: 'Email is already registered. Please log in.' },
                { status: 400 }
            );
        }

        // Generate 4-digit OTP
        const code = Math.floor(1000 + Math.random() * 9000).toString();

        // Delete any existing OTPs for this email to prevent spam conflicts
        await OtpModel.deleteMany({ email });

        // Save new OTP (expires in 5 minutes via OtpSchema TTL)
        await OtpModel.create({ email, code });

        // Configure nodemailer transport with Gmail service
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: emailUser,
                pass: emailPass,
            },
        });

        try {
            await transporter.sendMail({
                from: `"Interview Coach" <${emailUser}>`,
                to: email,
                subject: 'Your Interview Coach Verification Code',
                html: `
                    <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; text-align: center; padding: 30px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #f9fafb;">
                        <h2 style="color: #111827; margin-bottom: 20px;">Welcome to Interview Coach! 🚀</h2>
                        <p style="color: #4b5563; font-size: 16px;">Here is your secure verification code to create your account.</p>
                        <div style="background-color: #ffffff; border: 2px dashed #cbd5e1; border-radius: 8px; padding: 20px; margin: 30px 0;">
                            <h1 style="color: #2563eb; font-size: 48px; letter-spacing: 12px; margin: 0;">${code}</h1>
                        </div>
                        <p style="color: #6b7280; font-size: 14px;">This code securely expires in 5 minutes. Do not share it with anyone.</p>
                    </div>
                `,
            });
        } catch (mailError: any) {
            // Clean up stored OTP so user isn't stuck with an undelivered code
            await OtpModel.deleteMany({ email });

            let errorMessage = 'Failed to deliver verification email. Please try again later.';
            if (mailError?.code === 'EAUTH') {
                errorMessage = 'Email authentication failed. Please verify that EMAIL_USER and EMAIL_PASS (Google App Password) are configured correctly.';
            } else if (mailError?.code === 'ESOCKET' || mailError?.code === 'ETIMEDOUT' || mailError?.code === 'ECONNECTION') {
                errorMessage = 'Unable to connect to the email server. Please check network connectivity and try again.';
            }

            return NextResponse.json(
                { error: errorMessage },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true, message: 'Verification code sent to your email' });

    } catch (error: any) {
        return NextResponse.json(
            { error: error?.message || 'An error occurred while sending OTP' },
            { status: 500 }
        );
    }
}
