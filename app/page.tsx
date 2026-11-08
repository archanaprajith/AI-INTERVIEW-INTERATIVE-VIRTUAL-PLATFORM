'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/components/UserContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, BrainCircuit, Sparkles, Gamepad2 } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const { isLoggedIn, user } = useUser();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-white font-sans selection:bg-indigo-100 overflow-x-hidden" suppressHydrationWarning>
      {/* Floating Navigation */}
      <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-7xl glass rounded-2xl transition-all duration-300 hover:shadow-lg" suppressHydrationWarning>
        <div className="px-6 py-3 flex items-center justify-between" suppressHydrationWarning>
          <div className="flex items-center gap-2 text-2xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent cursor-pointer" onClick={() => router.push('/')}>
            <BrainCircuit className="h-8 w-8 text-indigo-600" />
            Interview Coach
          </div>
          <div className="flex gap-4 items-center">
            {!mounted ? (
              <div className="w-32 h-10 bg-slate-100/50 animate-pulse rounded-lg" />
            ) : isLoggedIn && user ? (
              <Button
                onClick={() => router.push('/dashboard')}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-md transition-all px-6"
              >
                Dashboard <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <>
                <Button
                  variant="ghost"
                  onClick={() => router.push('/login')}
                  className="font-semibold text-slate-600 hover:text-indigo-600"
                >
                  Log In
                </Button>
                <Button
                  onClick={() => router.push('/signup')}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl shadow-md transition-all px-6"
                >
                  Get Started
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-slate-50 pt-20">
        {/* Decorative Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-200/30 blur-[120px] rounded-full animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-200/30 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
        </div>

        <div className="relative max-w-5xl mx-auto px-6 text-center z-10">
          <div className="animate-scale-in" style={{ animationDelay: '0.1s' }}>
            <Badge className="mb-8 py-2 px-5 text-sm bg-white/80 backdrop-blur-md text-indigo-700 border border-indigo-100 shadow-xl shadow-indigo-100/20 rounded-full animate-float">
              <Sparkles className="w-4 h-4 mr-2 inline text-purple-500" /> Powered by Gemini 1.5 Pro Elite
            </Badge>
          </div>
          
          <h1 className="text-6xl md:text-8xl font-black text-slate-900 tracking-tight leading-[0.95] mb-8 animate-scale-in delay-200">
            Elevate Your <br />
            <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent drop-shadow-sm">
              Interview Game.
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-slate-600 mb-12 max-w-3xl mx-auto font-medium leading-relaxed animate-scale-in delay-300">
            Master your technical and behavioral skills with real-time AI mock interviews. 
            Get instant feedback, body language analysis, and personalized coaching.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-6 items-center flex-wrap animate-scale-in delay-400">
            <Button
              size="lg"
              onClick={() => router.push('/lobby')}
              className="h-16 px-12 text-xl font-bold rounded-2xl shadow-2xl shadow-indigo-600/30 hover:scale-110 active:scale-95 transition-all group bg-slate-900 text-white border-2 border-slate-800 animate-pulse-glow"
            >
              <Gamepad2 className="h-6 w-6 mr-3 group-hover:rotate-[360deg] transition-all duration-700" />
              Start Free Practice
            </Button>
            
            <Button
              variant="outline"
              size="lg"
              onClick={() => router.push('/resume')}
              className="h-16 px-12 text-xl font-bold rounded-2xl border-2 border-slate-200 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all text-slate-700 shadow-lg"
            >
              Scan Your Resume
            </Button>
          </div>
        </div>

        {/* Floating Stat Indicator */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex gap-12 text-slate-400 font-bold uppercase tracking-widest text-xs animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
          <div className="flex flex-col items-center">
            <span className="text-slate-900 text-lg mb-1">50K+</span>
            <span>Interviews</span>
          </div>
          <div className="w-[1px] h-8 bg-slate-200" />
          <div className="flex flex-col items-center">
            <span className="text-slate-900 text-lg mb-1">98%</span>
            <span>Success Rate</span>
          </div>
          <div className="w-[1px] h-8 bg-slate-200" />
          <div className="flex flex-col items-center">
            <span className="text-slate-900 text-lg mb-1">24/7</span>
            <span>AI Availability</span>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-32 px-6 bg-white border-t border-slate-100 relative overflow-hidden">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-indigo-50 text-indigo-600 font-bold text-sm mb-8 border border-indigo-100">
            Trusted by candidates at top tech companies
          </div>
          <h2 className="text-4xl md:text-6xl font-black text-slate-900 mb-8 max-w-2xl mx-auto leading-tight">
            Stop guessing. <br /> Start knowing.
          </h2>
          <p className="text-xl text-slate-500 mb-12 max-w-xl mx-auto leading-relaxed">
            Our AI analyzes your performance across hundreds of data points to give you the competitive edge you need.
          </p>
          <Button
            size="lg"
            onClick={() => router.push('/signup')}
            className="h-14 px-10 text-lg font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-200 active:scale-95 transition-all"
          >
            Create Your Professional Profile
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-50 text-slate-500 py-16 px-6 border-t border-slate-200">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2 font-black text-slate-900 text-xl">
            <BrainCircuit className="h-6 w-6 text-indigo-600" />
            Interview Coach
          </div>
          <div className="text-sm font-medium">
            &copy; {mounted ? new Date().getFullYear() : '2026'} AI Professional Suite. Built for excellence.
          </div>
          <div className="flex gap-8 text-sm font-bold uppercase tracking-widest">
                <a href="#" className="hover:text-indigo-600 transition-colors">Twitter</a>
                <a href="#" className="hover:text-indigo-600 transition-colors">LinkedIn</a>
                <a href="#" className="hover:text-indigo-600 transition-colors">Discord</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
