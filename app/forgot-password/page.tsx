'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Brain, Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [step, setStep] = useState(1);
    
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handleRequestCode = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const response = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to request reset code');
            }

            setStep(2);
        } catch (err: any) {
            setError(err.message);
            window.alert(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            setIsLoading(false);
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters long');
            setIsLoading(false);
            return;
        }

        try {
            const response = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, code: otp, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to reset password');
            }

            setStep(3);
        } catch (err: any) {
            setError(err.message);
            window.alert(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <Link href="/" className="inline-flex items-center gap-2 text-2xl font-bold text-blue-600 mb-4">
                        <Brain className="h-8 w-8" />
                        Interview Coach
                    </Link>
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900">
                        {step === 3 ? 'Password Reset!' : 'Reset your password'}
                    </h2>
                    {step !== 3 && (
                        <p className="mt-2 text-sm text-gray-600">
                            Remember your password?{' '}
                            <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
                                Sign in here
                            </Link>
                        </p>
                    )}
                </div>

                <Card className="p-8 shadow-xl border-0 overflow-hidden">
                    {error && (
                        <div className="bg-red-50 text-red-600 p-4 rounded-md text-sm font-medium mb-6">
                            {error}
                        </div>
                    )}

                    {step === 1 && (
                        <form onSubmit={handleRequestCode} className="space-y-6">
                            <div>
                                <Label htmlFor="email">Email Address</Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    className="mt-2"
                                />
                            </div>

                            <Button type="submit" className="w-full text-lg h-12" disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        Sending reset code...
                                    </>
                                ) : (
                                    'Send Reset Code'
                                )}
                            </Button>

                            <div className="text-center pt-2">
                                <Link
                                    href="/login"
                                    className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                    Back to Sign In
                                </Link>
                            </div>
                        </form>
                    )}

                    {step === 2 && (
                        <form onSubmit={handleResetPassword} className="space-y-6">
                            <div className="text-center">
                                <p className="text-sm text-gray-500">
                                    We sent a 4-digit verification code to <br />
                                    <span className="font-semibold text-gray-900">{email}</span>
                                </p>
                            </div>

                            <div>
                                <Label htmlFor="otp">Verification Code</Label>
                                <Input
                                    id="otp"
                                    name="otp"
                                    type="text"
                                    required
                                    maxLength={4}
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    placeholder="1234"
                                    className="mt-2 text-center text-3xl tracking-[1em] font-mono h-16 w-full"
                                />
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="password">New Password</Label>
                                    <Input
                                        id="password"
                                        name="password"
                                        type="password"
                                        required
                                        minLength={6}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="mt-2"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                                    <Input
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        type="password"
                                        required
                                        minLength={6}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="mt-2"
                                    />
                                </div>
                            </div>

                            <Button type="submit" className="w-full text-lg h-12" disabled={isLoading || otp.length !== 4}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        Resetting...
                                    </>
                                ) : (
                                    'Reset Password'
                                )}
                            </Button>

                            <div className="text-center">
                                <button
                                    type="button"
                                    onClick={() => setStep(1)}
                                    className="text-sm text-gray-500 hover:text-gray-700 underline"
                                >
                                    Go back to edit email
                                </button>
                            </div>
                        </form>
                    )}

                    {step === 3 && (
                        <div className="text-center py-6 space-y-6">
                            <div className="flex justify-center">
                                <CheckCircle2 className="h-16 w-16 text-green-500 animate-bounce" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900">Success!</h3>
                            <p className="text-sm text-gray-500">
                                Your password has been successfully reset. You can now sign in using your new password.
                            </p>
                            <Button onClick={() => router.push('/login')} className="w-full text-lg h-12">
                                Sign In Now
                            </Button>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
}
