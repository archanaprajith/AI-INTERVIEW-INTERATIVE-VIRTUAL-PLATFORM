'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  AlertCircle, 
  Loader2, 
  LogOut, 
  BrainCircuit, 
  Sparkles, 
  User,
  Binary, 
  Database, 
  Terminal, 
  Globe, 
  Layers, 
  Code2, 
  ChevronRight,
  Target,
  History
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useUser } from '@/components/UserContext';

function InterviewSetupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoggedIn, login, logout } = useUser();
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    category: searchParams.get('category') || 'dsa',
    difficulty: 'medium',
  });

  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const [masteryData, setMasteryData] = useState<Record<string, { avg: number, count: number }>>({});

  useEffect(() => {
    if (user?.userId) {
      fetch(`/api/user/interviews?userId=${user.userId}`)
        .then(res => res.json())
        .then(data => {
          const stats: Record<string, { sum: number, count: number }> = {};
          data.interviews.forEach((inv: any) => {
            if (inv.status === 'completed') {
              if (!stats[inv.category]) stats[inv.category] = { sum: 0, count: 0 };
              stats[inv.category].sum += (inv.overallScore || 0);
              stats[inv.category].count += 1;
            }
          });
          const mastery: Record<string, { avg: number, count: number }> = {};
          Object.keys(stats).forEach(cat => {
            mastery[cat] = { 
              avg: Math.round(stats[cat].sum / stats[cat].count), 
              count: stats[cat].count 
            };
          });
          setMasteryData(mastery);
          setIsHistoryLoading(false);
        })
        .catch(() => setIsHistoryLoading(false));
    }
  }, [user]);

  // Update category if searchParams change
  useEffect(() => {
    const cat = searchParams.get('category');
    if (cat) {
      setFormData(prev => ({ ...prev, category: cat }));
    }
  }, [searchParams]);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>();
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(undefined);
    setIsLoading(true);

    try {
      const response = await fetch('/api/interviews/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          email: user?.email,
          name: user?.name,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create interview');
      }

      const data = await response.json();
      sessionStorage.setItem('interviewData', JSON.stringify(data));
      router.push(`/interview/${data.interview.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    if (!isLoggedIn) {
      router.push('/login');
    }
  }, [isLoggedIn, router]);

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-20 px-4 selection:bg-indigo-100" suppressHydrationWarning>
      {/* Floating Navbar */}
      <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-4xl glass rounded-2xl p-4 flex items-center justify-between" suppressHydrationWarning>
        <div className="flex items-center gap-2 text-xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent cursor-pointer" onClick={() => router.push('/')}>
          <BrainCircuit className="w-6 h-6 text-indigo-600" />
          Interview Coach
        </div>
        <Button 
          variant="ghost" 
          onClick={() => { logout(); router.push('/'); }} 
          className="font-bold text-slate-600 hover:text-rose-600"
        >
          <LogOut className="h-4 w-4 mr-2" /> Sign Out
        </Button>
      </nav>

      <div className="max-w-2xl mx-auto pt-16">
        {/* Header Section */}
        <div className="text-center mb-12 animate-fade-in-up">
          <Badge className="mb-6 py-2 px-5 text-sm bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full">
            <Sparkles className="w-4 h-4 mr-2 inline" /> AI-Augmented Practice
          </Badge>
          <h1 className="text-5xl font-black text-slate-900 tracking-tight mb-4">
            Session <span className="text-indigo-600">Config.</span>
          </h1>
          <p className="text-lg text-slate-500 font-medium italic">
            "Your path to mastery starts with the right parameters."
          </p>
        </div>

        {/* Setup Form */}
        <Card className="glass p-10 rounded-[2.5rem] border-slate-200 premium-shadow animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center gap-4 mb-8 pb-8 border-b border-slate-100/50">
            <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600">
               <User className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-black uppercase tracking-widest">Candidate Identity</p>
              <p className="text-slate-900 font-bold">{user?.name} <span className="text-indigo-600/40 mx-2">|</span> {user?.email}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Subject Mastery Grid */}
            <div className="space-y-4">
              <Label className="text-sm font-black uppercase tracking-widest text-slate-500">
                Select Mastery Track
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { id: 'dsa', name: 'Data Structures', icon: Binary, color: 'indigo' },
                  { id: 'dbms', name: 'Database Systems', icon: Database, color: 'emerald' },
                  { id: 'os', name: 'Operating Systems', icon: Terminal, color: 'amber' },
                  { id: 'networks', name: 'Computer Networks', icon: Globe, color: 'blue' },
                  { id: 'system-design', name: 'System Design', icon: Layers, color: 'purple' },
                  { id: 'web-dev', name: 'Web Dev / React', icon: Code2, color: 'rose' }
                ].map((subject) => {
                  const stats = masteryData[subject.id] || { avg: 0, count: 0 };
                  const isSelected = formData.category === subject.id;
                  const MasteryBadge = () => {
                    if (stats.count === 0) return <Badge variant="outline" className="text-[10px] opacity-40">Unrated</Badge>;
                    if (stats.avg >= 90) return <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[10px] font-black italic">Elite Gold</Badge>;
                    if (stats.avg >= 75) return <Badge className="bg-slate-100 text-slate-700 border-slate-200 text-[10px] font-black">Professional</Badge>;
                    return <Badge className="bg-indigo-50 text-indigo-600 border-indigo-100 text-[10px]">Novice</Badge>;
                  };

                  return (
                    <Card 
                      key={subject.id}
                      onClick={() => setFormData({ ...formData, category: subject.id })}
                      className={`relative cursor-pointer transition-all duration-300 overflow-hidden border-2 p-5 group hover:shadow-xl ${
                        isSelected 
                        ? `border-${subject.color}-500 bg-${subject.color}-50/50 shadow-lg shadow-${subject.color}-100` 
                        : 'border-slate-100 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between relative z-10">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                          isSelected ? `bg-${subject.color}-500 text-white` : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'
                        }`}>
                          <subject.icon className="w-6 h-6" />
                        </div>
                        <div className="text-right">
                          <MasteryBadge />
                          {stats.count > 0 && (
                             <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">{stats.count} Sessions</p>
                          )}
                        </div>
                      </div>
                      <div className="mt-4 relative z-10">
                        <h3 className={`font-black text-lg ${isSelected ? 'text-slate-900' : 'text-slate-700'}`}>{subject.name}</h3>
                        {stats.count > 0 ? (
                          <div className="flex items-center gap-2 mt-2">
                             <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full bg-${subject.color}-500 transition-all duration-1000`} 
                                  style={{ width: `${stats.avg}%` }}
                                />
                             </div>
                             <span className="text-[10px] font-black text-slate-500">{stats.avg}%</span>
                          </div>
                        ) : (
                          <p className="text-xs text-slate-400 mt-1 font-medium italic">Ready for discovery</p>
                        )}
                      </div>

                      {/* Animated Pulse for Selected */}
                      {isSelected && (
                        <div className={`absolute -right-10 -bottom-10 w-40 h-40 bg-${subject.color}-500/10 rounded-full blur-3xl pointer-events-none animate-pulse-glow`} />
                      )}
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Difficulty Selection */}
            <div className="space-y-3">
              <Label htmlFor="difficulty" className="text-sm font-black uppercase tracking-widest text-slate-500">
                Challenge Level
              </Label>
              <Select value={formData.difficulty} onValueChange={(val) => setFormData({ ...formData, difficulty: val })}>
                <SelectTrigger id="difficulty" disabled={isLoading} className="h-14 rounded-xl border-slate-200 bg-slate-50/50 text-lg font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-200">
                  <SelectItem value="easy">Easy — Entry Level</SelectItem>
                  <SelectItem value="medium">Medium — Professional</SelectItem>
                  <SelectItem value="hard">Hard — Lead / Specialist</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex gap-3 p-5 bg-rose-50 border border-rose-100 rounded-2xl animate-fade-in-up">
                <AlertCircle className="h-6 w-6 text-rose-600 flex-shrink-0" />
                <p className="text-sm text-rose-800 font-medium leading-relaxed">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-16 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xl shadow-2xl shadow-indigo-200 active:scale-95 transition-all"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-6 w-6 mr-3 animate-spin" />
                  Initializing...
                </>
              ) : (
                'Start Simulation'
              )}
            </Button>
          </form>

          {/* Guidelines Section */}
          <div className="mt-12 pt-8 border-t border-slate-100/50">
            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400 mb-6 text-center">Protocol Guidelines</h3>
            <div className="grid grid-cols-2 gap-4">
               <div className="flex items-center gap-3 p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                  <span className="text-xs font-bold text-slate-600 uppercase">5 Questions</span>
               </div>
               <div className="flex items-center gap-3 p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                  <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                  <span className="text-xs font-bold text-slate-600 uppercase">AI Evaluation</span>
               </div>
               <div className="flex items-center gap-3 p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                  <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
                  <span className="text-xs font-bold text-slate-600 uppercase">Coach HUD</span>
               </div>
               <div className="flex items-center gap-3 p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                  <div className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
                  <span className="text-xs font-bold text-slate-600 uppercase">Score Report</span>
               </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

// Main page wrapper with Suspense for useSearchParams
export default function InterviewSetupPage() {
  return (
    <Suspense fallback={
      <div className='min-h-screen flex items-center justify-center bg-gray-50'>
        <Loader2 className='w-8 h-8 animate-spin text-blue-600' />
      </div>
    }>
      <InterviewSetupContent />
    </Suspense>
  );
}
