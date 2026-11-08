'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/components/UserContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Brain, Loader2, UploadCloud } from 'lucide-react';
import Link from 'next/link';

export default function OnboardingPage() {
    const router = useRouter();
    const { user, isLoggedIn } = useUser();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        college: '',
        course: '',
        experience: 'fresher', // default
        skills: '', // comma separated
        cvUrl: '', // simulated file upload
    });

    useEffect(() => {
        if (!isLoggedIn) {
            router.push('/login');
        }
    }, [isLoggedIn, router]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // In a real app, you'd upload this file to S3/Cloud Storage. 
        if (e.target.files && e.target.files[0]) {
            setFormData({ ...formData, cvUrl: `fake-url-for-${e.target.files[0].name}` });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.userId) return;

        setIsLoading(true);
        setError('');

        try {
            // transform skills string to array
            const skillsArray = formData.skills.split(',').map(s => s.trim()).filter(s => s.length > 0);

            const response = await fetch('/api/user/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.userId,
                    ...formData,
                    skills: skillsArray
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to update profile');
            }

            // Redirect to dashboard
            router.push('/dashboard');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isLoggedIn) return null; // Prevent flash of content while redirecting

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
            <div className="w-full max-w-2xl">
                <div className="text-center mb-8">
                    <Link href="/" className="inline-flex items-center gap-2 text-2xl font-bold text-blue-600 mb-4">
                        <Brain className="h-8 w-8" />
                        Interview Coach
                    </Link>
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900">
                        Complete your profile
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Tell us about your professional background so we can tailor your interviews.
                    </p>
                </div>

                <Card className="p-8 shadow-xl border-0 overflow-hidden">
                    <form onSubmit={handleSubmit} className="space-y-8">
                        {error && (
                            <div className="bg-red-50 text-red-600 p-4 rounded-md text-sm font-medium">
                                {error}
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Education & Experience */}
                            <div className="space-y-4 md:col-span-2">
                                <h3 className="text-lg font-semibold border-b pb-2">Professional Profile</h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="college">College / University</Label>
                                        <Input id="college" name="college" placeholder="e.g. Stanford University" value={formData.college} onChange={handleChange} className="mt-1" />
                                    </div>
                                    <div>
                                        <Label htmlFor="course">Course / Major</Label>
                                        <Input id="course" name="course" placeholder="e.g. B.S. Computer Science" value={formData.course} onChange={handleChange} className="mt-1" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="experience">Experience Level *</Label>
                                        <select
                                            id="experience"
                                            name="experience"
                                            value={formData.experience}
                                            onChange={handleChange}
                                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 mt-1"
                                        >
                                            <option value="fresher">Fresher / Student</option>
                                            <option value="junior">Junior (1-3 years)</option>
                                            <option value="mid">Mid-Level (3-5 years)</option>
                                            <option value="senior">Senior (5+ years)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <Label htmlFor="skills">Key Skills</Label>
                                        <Input id="skills" name="skills" placeholder="React, Node.js, Python (comma separated)" value={formData.skills} onChange={handleChange} className="mt-1" />
                                    </div>
                                </div>
                            </div>

                            {/* CV Upload Mock */}
                            <div className="space-y-4 md:col-span-2">
                                <h3 className="text-lg font-semibold border-b pb-2 mt-4">Resume / CV</h3>
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors">
                                    <UploadCloud className="h-10 w-10 text-gray-400 mb-2" />
                                    <p className="text-sm text-gray-600 mb-2">Upload your CV to help us tailor your interviews</p>
                                    <Label htmlFor="cv-upload" className="cursor-pointer bg-white px-4 py-2 border rounded-md text-sm font-medium hover:bg-gray-50">
                                        Select File
                                    </Label>
                                    <input
                                        id="cv-upload"
                                        type="file"
                                        className="hidden"
                                        accept=".pdf,.doc,.docx"
                                        onChange={handleFileChange}
                                    />
                                    {formData.cvUrl && (
                                        <p className="mt-2 text-xs text-green-600 font-medium">
                                            File attached: {formData.cvUrl.replace('fake-url-for-', '')}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <Button type="button" variant="outline" className="w-1/3 text-lg h-12" onClick={() => router.push('/dashboard')}>
                                Skip for now
                            </Button>
                            <Button type="submit" className="w-2/3 text-lg h-12" disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    'Save & Continue'
                                )}
                            </Button>
                        </div>
                    </form>
                </Card>
            </div>
        </div>
    );
}
