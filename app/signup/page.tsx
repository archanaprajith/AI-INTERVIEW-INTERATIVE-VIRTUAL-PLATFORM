'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/components/UserContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Brain, Loader2, UploadCloud } from 'lucide-react';
import Link from 'next/link';

export default function SignupPage() {
    const router = useRouter();
    const { login } = useUser();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };



    const [step, setStep] = useState(1);
    const [otp, setOtp] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        if (step === 1) {
            if (formData.password !== formData.confirmPassword) {
                setError('Passwords do not match');
                setIsLoading(false);
                return;
            }

            try {
                const response = await fetch('/api/auth/send-otp', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: formData.email }),
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || 'Failed to send verification code');
                }

                setStep(2);
                setError('');
            } catch (err: any) {
                setError(err.message);
                window.alert(err.message);
            } finally {
                setIsLoading(false);
            }
        } else {
            try {
                const response = await fetch('/api/auth/signup', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: formData.name,
                        email: formData.email,
                        password: formData.password,
                        code: otp
                    }),
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || 'Failed to sign up');
                }

                login(data.user.email, data.user.name, data.user.id, data.user.isAdmin);
                router.push('/onboarding');
            } catch (err: any) {
                setError(err.message);
                window.alert(err.message);
            } finally {
                setIsLoading(false);
            }
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
            <div className="w-full max-w-2xl">
                <div className="text-center mb-8">
                    <Link href="/" className="inline-flex items-center gap-2 text-2xl font-bold text-blue-600 mb-4">
                        <Brain className="h-8 w-8" />
                        Interview Coach
                    </Link>
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900">
                        Create your account
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Already have an account?{' '}
                        <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
                            Sign in here
                        </Link>
                    </p>
                </div>

                <Card className="p-8 shadow-xl border-0 overflow-hidden">
                    <form onSubmit={handleSubmit} className="space-y-8">
                        {error && (
                            <div className="bg-red-50 text-red-600 p-4 rounded-md text-sm font-medium">
                                {error}
                            </div>
                        )}

                        {step === 1 ? (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4 md:col-span-2">
                                        <h3 className="text-lg font-semibold border-b pb-2">Account Details</h3>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <Label htmlFor="name">Full Name *</Label>
                                                <Input id="name" name="name" required value={formData.name} onChange={handleChange} className="mt-1" />
                                            </div>
                                            <div>
                                                <Label htmlFor="email">Email Address *</Label>
                                                <Input id="email" name="email" type="email" required value={formData.email} onChange={handleChange} className="mt-1" />
                                            </div>
                                        </div>

                                        <div>
                                            <Label htmlFor="password">Password *</Label>
                                            <Input id="password" name="password" type="password" required minLength={6} value={formData.password} onChange={handleChange} className="mt-1" />
                                        </div>
                                        <div>
                                            <Label htmlFor="confirmPassword">Confirm Password *</Label>
                                            <Input id="confirmPassword" name="confirmPassword" type="password" required minLength={6} value={formData.confirmPassword} onChange={handleChange} className="mt-1" />
                                        </div>
                                    </div>
                                </div>

                                <Button type="submit" className="w-full text-lg h-12" disabled={isLoading}>
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                            Sending verification code...
                                        </>
                                    ) : (
                                        'Sign Up'
                                    )}
                                </Button>
                            </>
                        ) : (
                            <div className="space-y-6">
                                <div className="text-center">
                                    <h3 className="text-xl font-bold text-gray-900">Verify your email</h3>
                                    <p className="text-sm text-gray-500 mt-2">
                                        We sent a 4-digit verification code to <br /><span className="font-semibold text-gray-900">{formData.email}</span>
                                    </p>
                                    <div className="bg-blue-50 border border-blue-200 text-blue-700 text-sm px-4 py-3 rounded-md mt-4 flex items-center justify-center gap-2">
                                        <span>Please check your inbox (and spam folder) for the code.</span>
                                    </div>
                                </div>

                                <div className="pt-2">
                                    <Label htmlFor="otp" className="sr-only">Verification Code</Label>
                                    <Input
                                        id="otp"
                                        name="otp"
                                        type="text"
                                        required
                                        maxLength={4}
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        placeholder="1234"
                                        className="mt-1 text-center text-3xl tracking-[1em] font-mono h-16 w-full"
                                    />
                                </div>

                                <Button type="submit" className="w-full text-lg h-12 mt-4" disabled={isLoading || otp.length !== 4}>
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                            Verifying...
                                        </>
                                    ) : (
                                        'Verify & Continue'
                                    )}
                                </Button>

                                <div className="text-center mt-4">
                                    <button
                                        type="button"
                                        onClick={() => setStep(1)}
                                        className="text-sm text-gray-500 hover:text-gray-700 underline"
                                    >
                                        Go back to edit email
                                    </button>
                                </div>
                            </div>
                        )}
                    </form>
                </Card>
            </div>
        </div>
    );
}
