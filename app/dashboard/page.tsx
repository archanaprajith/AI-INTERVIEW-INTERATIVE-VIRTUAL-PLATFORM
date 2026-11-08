'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useUser } from '@/components/UserContext';
import { Loader2, Plus, TrendingUp, Calendar, Award, Video, FileSearch, MessageSquare } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, ComposedChart } from 'recharts';

interface Interview {
  id: string;
  category: string;
  difficulty: string;
  startTime: string;
  overallScore?: number;
  status: string;
  evaluationCount: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoggedIn, logout } = useUser();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn || !user?.userId) {
      router.push('/interview/setup');
      return;
    }

    const loadInterviews = async () => {
      try {
        const response = await fetch(`/api/user/interviews?userId=${user.userId}`);
        if (response.ok) {
          const data = await response.json();
          setInterviews(data.interviews);
        }
      } catch (error) {
        console.error('Failed to load interviews:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadInterviews();
  }, [user, isLoggedIn, router]);

  const completedInterviews = interviews.filter(i => i.status === 'completed');
  const avgScore = completedInterviews.length > 0
    ? Math.round(completedInterviews.reduce((sum, i) => sum + (i.overallScore || 0), 0) / completedInterviews.length)
    : 0;

  // Sample progress data
  const progressData = [
    { week: 'Week 1', average: 65 },
    { week: 'Week 2', average: 70 },
    { week: 'Week 3', average: 72 },
    { week: 'Week 4', average: 78 },
  ];

  // Subject-wise breakdown (Mastery Tracker)
  const subjectData = [
    { name: 'DSA', avg: Math.round(completedInterviews.filter(i => i.category === 'dsa').reduce((s, i) => s + (i.overallScore || 0), 0) / (completedInterviews.filter(i => i.category === 'dsa').length || 1)) },
    { name: 'DBMS', avg: Math.round(completedInterviews.filter(i => i.category === 'dbms').reduce((s, i) => s + (i.overallScore || 0), 0) / (completedInterviews.filter(i => i.category === 'dbms').length || 1)) },
    { name: 'OS', avg: Math.round(completedInterviews.filter(i => i.category === 'os').reduce((s, i) => s + (i.overallScore || 0), 0) / (completedInterviews.filter(i => i.category === 'os').length || 1)) },
    { name: 'Network', avg: Math.round(completedInterviews.filter(i => i.category === 'networks').reduce((s, i) => s + (i.overallScore || 0), 0) / (completedInterviews.filter(i => i.category === 'networks').length || 1)) },
    { name: 'SysDesign', avg: Math.round(completedInterviews.filter(i => i.category === 'system-design').reduce((s, i) => s + (i.overallScore || 0), 0) / (completedInterviews.filter(i => i.category === 'system-design').length || 1)) },
    { name: 'WebDev', avg: Math.round(completedInterviews.filter(i => i.category === 'web-dev').reduce((s, i) => s + (i.overallScore || 0), 0) / (completedInterviews.filter(i => i.category === 'web-dev').length || 1)) },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center py-12 px-4">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 selection:bg-indigo-100" suppressHydrationWarning>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 animate-scale-in">
          <div>
            <h1 className="text-5xl font-black text-slate-900 tracking-tight">Welcome, {user?.name}</h1>
            <p className="text-slate-500 mt-2 text-lg font-medium opacity-80">Ready to take your next career step?</p>
          </div>
          <div className="flex items-center gap-4">
            {user?.isAdmin && (
              <Button
                variant="default"
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl px-6 h-12"
                onClick={() => router.push('/admin')}
              >
                Admin Panel
              </Button>
            )}
            <Button
              variant="outline"
              className="rounded-xl border-red-200 h-12 px-6 font-bold text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={async () => {
                if (window.confirm("Are you REALLY sure you want to delete your account? This will permanently remove your progress, results, and interviews. This cannot be undone.")) {
                  try {
                    const response = await fetch('/api/user/delete', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ userId: user?.userId })
                    });
                    if (response.ok) {
                      alert("Your account has been deleted. We are sorry to see you go!");
                      logout();
                      router.push('/');
                    } else {
                      alert("Failed to delete account. Please try again.");
                    }
                  } catch (error) {
                    console.error("Deletion error:", error);
                    alert("An error occurred. Please contact support.");
                  }
                }
              }}
            >
              Delete Account
            </Button>
            <Button
              variant="outline"
              className="rounded-xl border-slate-200 h-12 px-6 font-bold text-slate-600"
              onClick={() => {
                logout();
                router.push('/');
              }}
            >
              Sign Out
            </Button>
          </div>
        </div>

        {/* Primary Action Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {/* Chat with AI */}
          <Card className="glass group premium-card animate-scale-in delay-100 cursor-pointer overflow-hidden border-indigo-100" onClick={() => router.push('/chat')}>
            <div className="p-6">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white mb-6 shadow-lg shadow-indigo-200">
                <MessageSquare className="w-7 h-7" />
              </div>
              <Badge className="mb-3 bg-indigo-50 text-indigo-600 border-indigo-100">Conversational</Badge>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Chat with AI</h2>
              <p className="text-slate-500 text-sm leading-relaxed mb-6">Free-flowing verbal or text practice sessions.</p>
              <Button className="w-full bg-indigo-600 hover:bg-indigo-700 rounded-xl font-bold">Start Chat</Button>
            </div>
          </Card>

          {/* Practice by Topic */}
          <Card className="glass group premium-card animate-scale-in delay-200 cursor-pointer overflow-hidden border-emerald-100" onClick={() => router.push('/interview/setup')}>
            <div className="p-6">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white mb-6 shadow-lg shadow-emerald-200">
                <Plus className="w-7 h-7" />
              </div>
              <Badge className="mb-3 bg-emerald-50 text-emerald-600 border-emerald-100">Structured</Badge>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Topic Practice</h2>
              <p className="text-slate-500 text-sm leading-relaxed mb-6">Subject-specific drills and evaluations.</p>
              <Button className="w-full bg-emerald-600 hover:bg-emerald-700 rounded-xl font-bold">Select Topic</Button>
            </div>
          </Card>

          {/* Face-to-Face */}
          <Card className="glass group premium-card animate-scale-in delay-300 cursor-pointer overflow-hidden border-blue-100" onClick={() => router.push('/virtual-interview')}>
            <div className="p-6">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white mb-6 shadow-lg shadow-blue-200">
                <Video className="w-7 h-7" />
              </div>
              <Badge className="mb-3 bg-blue-50 text-blue-600 border-blue-100">Avatar AI</Badge>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Video Mock</h2>
              <p className="text-slate-500 text-sm leading-relaxed mb-6">Realistic simulation with interactive avatar.</p>
              <Button className="w-full bg-blue-600 hover:bg-blue-700 rounded-xl font-bold">Join Meeting</Button>
            </div>
          </Card>

          {/* Scan Resume */}
          <Card className="glass group premium-card animate-scale-in delay-400 cursor-pointer overflow-hidden border-purple-100" onClick={() => router.push('/resume')}>
            <div className="p-6">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-rose-600 flex items-center justify-center text-white mb-6 shadow-lg shadow-purple-200">
                <FileSearch className="w-7 h-7" />
              </div>
              <Badge className="mb-3 bg-purple-50 text-purple-600 border-purple-100">ATS Tool</Badge>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Scan Resume</h2>
              <p className="text-slate-500 text-sm leading-relaxed mb-6">Discover how your CV ranks against AI.</p>
              <Button className="w-full bg-purple-600 hover:bg-purple-700 rounded-xl font-bold">Analyze CV</Button>
            </div>
          </Card>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12 animate-scale-in delay-500">
          <Card className="p-8 glass-dark text-white border-white/10 premium-shadow animate-pulse-glow">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-bold uppercase tracking-widest text-indigo-300">Total Interviews</p>
              <div className="p-3 bg-indigo-500/20 rounded-xl">
                <Calendar className="h-6 w-6 text-indigo-400" />
              </div>
            </div>
            <p className="text-5xl font-black">{interviews.length}</p>
            <p className="text-sm text-indigo-300/60 mt-4 font-medium">{completedInterviews.length} sessions completed successfully</p>
          </Card>

          <Card className="p-8 glass border-slate-200 premium-shadow">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-bold uppercase tracking-widest text-slate-500">Average Score</p>
              <div className="p-3 bg-emerald-100 rounded-xl">
                <Award className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
            <p className="text-5xl font-black text-slate-900">{avgScore}<span className="text-xl text-slate-400 ml-1">/100</span></p>
            <p className="text-sm text-slate-500 mt-4 font-medium">Top 15% of all candidates this month</p>
          </Card>

          <Card className="p-8 glass border-slate-200 premium-shadow">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-bold uppercase tracking-widest text-slate-500">Streak</p>
              <div className="p-3 bg-orange-100 rounded-xl">
                <TrendingUp className="h-6 w-6 text-orange-600" />
              </div>
            </div>
            <p className="text-5xl font-black text-slate-900">4 <span className="text-xl text-slate-400 ml-1">Days</span></p>
            <p className="text-sm text-slate-500 mt-4 font-medium">Keep it going to unlock special rewards</p>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Progress Chart */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Trend</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={progressData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Line type="monotone" dataKey="average" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {/* Subject Mastery Radar */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Subject Mastery Tracker</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={subjectData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} tick={{ fill: '#64748b' }} />
                <YAxis domain={[0, 100]} axisLine={false} tickLine={false} fontSize={12} tick={{ fill: '#64748b' }} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="avg" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Recent Interviews */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Recent Practice Sessions</h3>

          {interviews.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4">No interviews yet. Start your first practice session!</p>
              <Button
                onClick={() => router.push('/interview/setup')}
                className="font-semibold"
              >
                Start Interview
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {interviews.slice(0, 10).map((interview) => (
                <div
                  key={interview.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h4 className="font-medium text-gray-900 capitalize">
                        {interview.category.replace('-', ' ')} Interview
                      </h4>
                      <Badge variant="secondary" className="text-xs">
                        {interview.difficulty}
                      </Badge>
                      <Badge
                        variant={interview.status === 'completed' ? 'default' : 'outline'}
                        className="text-xs"
                      >
                        {interview.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">
                      {new Date(interview.startTime).toLocaleDateString()} at{' '}
                      {new Date(interview.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className="text-right">
                    {interview.overallScore && interview.status === 'completed' ? (
                      <>
                        <p className="text-2xl font-bold text-blue-600">{interview.overallScore}</p>
                        <p className="text-xs text-gray-600">{interview.evaluationCount} Q&A</p>
                      </>
                    ) : (
                      <p className="text-sm text-gray-600">In progress...</p>
                    )}
                  </div>
                  {interview.status === 'completed' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/interview/results/${interview.id}`)}
                      className="ml-4"
                    >
                      View Details
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
