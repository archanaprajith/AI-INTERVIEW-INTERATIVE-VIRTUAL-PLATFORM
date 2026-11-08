'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Loader2, Users, Trash2, Home, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useUser } from '@/components/UserContext';
import { useRouter } from 'next/navigation';

interface AdminUser {
    id: string;
    name: string;
    email: string;
    college?: string;
    course?: string;
    experience?: string;
    skills?: string[];
    createdAt: string;
}

export default function AdminUsersPage() {
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const { user, isLoggedIn } = useUser();
    const router = useRouter();

    // Protection logic
    const isAdmin = isLoggedIn && user?.isAdmin === true;
    
    useEffect(() => {
        if (isLoggedIn === false || (isLoggedIn && !user?.isAdmin)) {
            // Only allow if context explicitly confirms they are an admin
            router.push('/dashboard');
            return;
        }
        const fetchUsers = async () => {
            try {
                const response = await fetch('/api/admin/users');
                if (!response.ok) {
                    throw new Error('Failed to fetch users');
                }
                const data = await response.json();
                setUsers(data.users || []);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchUsers();
    }, [isLoggedIn, user, router]);

    const handleDeleteUser = async (userId: string, userName: string) => {
        if (!window.confirm(`Are you extremely sure you want to completely erase ${userName}'s account? This cannot be undone.`)) {
            return;
        }

        try {
            const res = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete user');
            
            // Remove user from UI state manually so we don't have to refetch all
            setUsers((prev) => prev.filter(u => u.id !== userId));
            alert('User successfully deleted from database.');
        } catch (err: any) {
            alert(err.message);
        }
    };

    if (!isAdmin) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <Card className="max-w-md p-8 text-center space-y-4 shadow-xl border-red-100">
                    <div className="mx-auto bg-red-100 w-16 h-16 rounded-full flex items-center justify-center text-red-600">
                        <AlertCircle className="w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Access Denied</h2>
                    <p className="text-gray-500">You must be an Administrator to view this page.</p>
                    <button onClick={() => router.push('/dashboard')} className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition">
                        Return to Dashboard
                    </button>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-100 p-3 rounded-lg flex items-center justify-center">
                            <Users className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
                            <p className="text-gray-600">View and manage registered users</p>
                        </div>
                    </div>
                    <Link href="/" className="text-blue-600 hover:text-blue-500 font-medium">
                        Back to Home
                    </Link>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-md text-sm font-medium mb-6">
                        {error}
                    </div>
                )}

                <Card className="overflow-hidden shadow-md">
                    {isLoading ? (
                        <div className="py-24 flex items-center justify-center text-gray-500">
                            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mr-2" />
                            Loading users...
                        </div>
                    ) : users.length === 0 ? (
                        <div className="py-24 text-center text-gray-500">
                            <p className="text-lg">No users registered yet.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Name / Email
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Experience
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Education
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Skills
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Joined
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {users.map((user) => (
                                        <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="h-10 w-10 flex-shrink-0 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold uppercase">
                                                        {user.name.charAt(0)}
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                                        <div className="text-sm text-gray-500">{user.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 capitalize">
                                                    {user.experience || 'Not specified'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-900">{user.college || 'N/A'}</div>
                                                <div className="text-sm text-gray-500">{user.course || 'N/A'}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-wrap gap-1">
                                                    {user.skills && user.skills.length > 0 ? (
                                                        user.skills.map((skill, i) => (
                                                            <span key={i} className="inline-block px-2 text-xs py-0.5 rounded-md bg-gray-100 text-gray-700">
                                                                {skill}
                                                            </span>
                                                        ))
                                                    ) : (
                                                        <span className="text-sm text-gray-500">None</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(user.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button
                                                    onClick={() => handleDeleteUser(user.id, user.name)}
                                                    className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-full transition-colors"
                                                    title="Delete User"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
}
