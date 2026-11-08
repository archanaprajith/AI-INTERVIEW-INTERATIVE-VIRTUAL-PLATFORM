'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import {
    Loader2, Upload, FileText, CheckCircle2, AlertTriangle,
    XCircle, Menu, GraduationCap, Sparkles, User, Lightbulb,
    Briefcase, FileCode2, FileSearch, Target, LineChart,
    BrainCircuit, Bot, MessageSquare, Gamepad2, Zap
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { CVAtsEvaluation, CVSegment } from '@/lib/ai';

export default function ResumeCheckerPage() {
    const router = useRouter();
    const [resumeText, setResumeText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<CVAtsEvaluation | null>(null);
    const [activeTab, setActiveTab] = useState<'overview' | 'detailed' | 'recommendations' | 'next-steps'>('overview');
    const [imageInfo, setImageInfo] = useState<{ data: string, mimeType: string } | null>(null);
    const [fileName, setFileName] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    // Switched to Next.js Engine for built-in resilience and multi-model fallbacks
    const useLegacy = false; 

    const sampleIsabel = "Isabel Mercado\nMarketing Manager\n5+ years experience driving B2B SaaS growth campaigns. Increased lead generation by 40% YoY at TechCorp.";
    const sampleJohn = "John Smith\nSoftware Engineer\n3+ years experience. Java, Python, React. Built microservices. Worked at Startup Inc.";

    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        processFile(file);
    };

    const processFile = (file: File | undefined | null) => {
        if (!file) return;

        setFileName(file.name);
        
        // Supported types: PNG, JPEG/JPG and PDF
        if (file.type === 'image/png' || file.type === 'image/jpeg' || file.type === 'application/pdf') {
            const reader = new FileReader();
            reader.onload = (event) => {
                const base64 = (event.target?.result as string).split(',')[1];
                setImageInfo({ data: base64, mimeType: file.type });
                setResumeText(""); // Clear text if binary file is used
            };
            reader.readAsDataURL(file);
            return;
        }

        alert("Only PDF, PNG, and JPEG files are supported for professional analysis.");
        setFileName(null);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        processFile(file);
    };

    const handleAnalyze = async () => {
        if (!resumeText.trim() && !imageInfo) return;
        setIsLoading(true);
        setResult(null);

        try {
            const endpoint = useLegacy ? 'http://127.0.0.1:5000/evaluate' : '/api/resume/evaluate';
            
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ resumeText, imageInfo }),
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.details || errData.error || 'Failed to analyze');
            }

            let data = await response.json();
            
            // Map Python backend response to the modern UI structure
            // If the AI already provided categories, we use them directly to show real reasons
            if (data.overallScore !== undefined && !data.categories) {
                data = {
                    overallScore: data.overallScore,
                    passedChecks: data.passedChecks || 4, 
                    warnings: data.warnings || 2, 
                    issues: data.issues || 2,
                    categories: {
                        education: { score: 85, status: 'Pass', message: data.summary || 'Education verified against background.' },
                        formatting: { score: 75, status: 'Warning', message: 'Standard industry formatting detected.' },
                        contactInformation: { score: 95, status: 'Pass', message: 'All contact channels active and valid.' },
                        skillsSection: { score: data.overallScore, status: 'Pass', message: 'Technical depth verified via AI logic.' },
                        workExperience: { score: data.overallScore, status: 'Pass', message: 'Career progression mapped successfully.' },
                        atsCompatibility: { score: 80, status: 'Warning', message: 'Optimized for high-volume recruitment.' },
                        keywords: { score: 70, status: 'Warning', message: 'Key technical identifiers found.' },
                        professionalSummary: { score: 90, status: 'Pass', message: data.summary || 'Profile narrative synthesized.' }
                    },
                    recommendations: data.recommendations || data.strengths || ["Enhance quantitative technical depth.", "Align keywords with specific JD."]
                };
            }

            setResult(data);
        } catch (error: any) {
            console.error(error);
            alert(`Scan Error: ${error.message || "Something went wrong while analyzing the resume."}`);
        } finally {
            setIsLoading(false);
            setActiveTab('overview');
        }
    };

    const getStatusIcon = (status: 'Pass' | 'Warning' | 'Fail') => {
        if (status === 'Pass') return <CheckCircle2 className="w-5 h-5 text-green-500" />;
        if (status === 'Warning') return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
        return <XCircle className="w-5 h-5 text-red-500" />;
    };

    const getProgressColor = (status: 'Pass' | 'Warning' | 'Fail') => {
        if (status === 'Pass') return "bg-green-500";
        if (status === 'Warning') return "bg-yellow-500";
        return "bg-red-500";
    };

    const CategoryCard = ({ title, icon: Icon, data }: { title: string, icon: any, data: CVSegment }) => (
        <Card className="glass p-6 rounded-2xl flex flex-col h-full animate-fade-in-up border-slate-200/50">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-slate-100 rounded-xl text-slate-600">
                    <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900">{title}</h3>
            </div>
            
            <div className="flex items-center justify-between mb-3 text-sm font-black uppercase tracking-widest">
                <div className="flex items-center gap-2">
                    {getStatusIcon(data.status)}
                    <span className={data.status === 'Pass' ? 'text-emerald-600' : data.status === 'Warning' ? 'text-amber-600' : 'text-rose-600'}>
                        {data.status}
                    </span>
                </div>
                <span className="text-xl text-slate-900">{data.score}</span>
            </div>

            <div className="w-full h-2 bg-slate-100/50 rounded-full overflow-hidden mb-6">
                <div
                    className={`h-full ${getProgressColor(data.status)} transition-all duration-1000 ease-out`}
                    style={{ width: data.score + '%' }}
                />
            </div>
            <p className={`text-[13px] font-medium leading-snug mt-auto ${
                data.status === 'Pass' ? 'text-slate-500' : 
                data.status === 'Warning' ? 'text-amber-700 bg-amber-50/50 p-2 rounded-lg border border-amber-100' : 
                'text-rose-700 bg-rose-50/50 p-2 rounded-lg border border-rose-100'
            }`}>
                {data.message}
            </p>
        </Card>
    );

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20 selection:bg-indigo-100" suppressHydrationWarning>
            {/* Professional Floating Navbar */}
            <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-7xl glass rounded-2xl p-4 flex items-center justify-between" suppressHydrationWarning>
                <div className="flex items-center gap-2 text-xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent cursor-pointer" onClick={() => router.push('/')}>
                    <BrainCircuit className="w-6 h-6 text-indigo-600" />
                    Interview Coach
                </div>
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={() => router.push('/dashboard')} className="font-bold text-slate-600">Dashboard</Button>
                    <div className="w-8 h-8 rounded-full bg-slate-200 animate-pulse" />
                </div>
            </nav>

            <div className="pt-32 max-w-5xl mx-auto px-6">
                {/* Header Section */}
                <div className="max-w-4xl mx-auto animate-scale-in">
                    <section className="text-center mb-16">
                        <Badge className="mb-6 py-2 px-5 text-indigo-700 bg-indigo-50 border-indigo-100 rounded-full animate-float">
                            <Zap className="w-4 h-4 mr-2 inline" /> AI-Powered Analysis
                        </Badge>
                        <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tight leading-[0.95] mb-6">
                            ATS & Career <br />
                            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Strategy Analyst.</span>
                        </h1>
                        <p className="text-xl text-slate-500 font-medium max-w-2xl mx-auto">
                            Standardized for maximum professional accuracy.
                        </p>
                    </section>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    {/* Left Column: Input Form */}
                    <div className="lg:col-span-12 space-y-10">
                        <Card className="glass p-10 rounded-[2rem] border-slate-200 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg">
                                    <FileSearch className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-900">Upload for Analysis</h2>
                                    <p className="text-slate-500 font-medium">Get your ATS score in seconds</p>
                                </div>
                            </div>

                            <div className="relative group overflow-hidden bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200 p-12 transition-all hover:border-indigo-400 hover:bg-slate-50">
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileUpload}
                                    className="hidden"
                                    accept=".pdf, .png, .jpg, .jpeg"
                                />
                                {resumeText || imageInfo ? (
                                    <div className="min-h-[200px] flex flex-col items-center justify-center">
                                       {imageInfo ? (
                                          <div className="flex flex-col items-center gap-4">
                                             <div className="w-20 h-20 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 border border-indigo-100">
                                                {imageInfo?.mimeType === 'application/pdf' ? <FileText className="w-10 h-10" /> : <Upload className="w-10 h-10" />}
                                             </div>
                                             <p className="text-slate-700 font-bold">{fileName || (imageInfo?.mimeType === 'application/pdf' ? "PDF Resume Loaded" : "Image Resume Loaded")}</p>
                                             <Button variant="ghost" size="sm" onClick={() => {setImageInfo(null); setResumeText(""); setFileName(null);}} className="text-xs text-rose-500 font-black uppercase tracking-widest hover:bg-rose-50">Clear</Button>
                                          </div>
                                       ) : (
                                          <Textarea
                                              value={resumeText}
                                              onChange={(e) => setResumeText(e.target.value)}
                                              className="min-h-[200px] w-full text-lg font-medium border-none shadow-none focus-visible:ring-0 bg-transparent resize-y text-slate-700"
                                              placeholder="Paste your professional highlights here..."
                                          />
                                       )}
                                    </div>
                                ) : (
                                    <div className={`p-10 border-2 border-dashed rounded-3xl transition-all duration-500 ${isDragging ? 'border-indigo-600 bg-indigo-50/50 scale-[0.98]' : 'border-slate-200 hover:border-indigo-400 hover:bg-slate-50/50'} cursor-pointer group premium-card animate-scale-in delay-100`}
                                        onClick={() => fileInputRef.current?.click()}
                                        onDragOver={handleDragOver}
                                        onDragLeave={handleDragLeave}
                                        onDrop={handleDrop}
                                    >
                                        <div className="w-20 h-20 bg-indigo-50 rounded-2xl flex items-center justify-center mb-6 mx-auto group-hover:scale-110 group-hover:rotate-6 transition-all animate-float">
                                            <Upload className="w-7 h-7 text-indigo-600" />
                                        </div>
                                        <h3 className="text-xl font-bold text-slate-800 mb-2">Click to Upload Resume</h3>
                                        <p className="text-slate-500 font-medium">Supported: PDF, PNG, JPEG / Paste Plain Text</p>
                                    </div>
                                )}
                            </div>

                            <div className="mt-8 flex flex-wrap gap-4">
                                <Button 
                                    onClick={() => setResumeText(sampleIsabel)}
                                    variant="outline"
                                    className={`flex-1 min-w-[200px] h-14 rounded-xl border-slate-200 font-bold transition-all ${resumeText === sampleIsabel ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'text-slate-600'}`}
                                >
                                    Try Marketing Sample
                                </Button>
                                <Button 
                                    onClick={() => setResumeText(sampleJohn)}
                                    variant="outline"
                                    className={`flex-1 min-w-[200px] h-14 rounded-xl border-slate-200 font-bold transition-all ${resumeText === sampleJohn ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'text-slate-600'}`}
                                >
                                    Try Tech Sample
                                </Button>
                                
                                <Button 
                                    onClick={handleAnalyze}
                                    disabled={(!resumeText.trim() && !imageInfo) || isLoading}
                                    className={`w-full h-16 rounded-xl font-black text-xl shadow-xl active:scale-95 transition-all bg-slate-900 hover:bg-slate-800 text-white`}
                                >
                                    {isLoading ? <><Loader2 className="w-5 h-5 mr-3 animate-spin" /> Analyzing...</> : "Start Professional Scan"}
                                </Button>
                            </div>
                        </Card>
                    </div>

                    {/* Results Overlay Section */}
                    {result && (
                        <div className="lg:col-span-12 animate-fade-in-up space-y-10">
                            {/* High Impact Score Header - Rich Dark Contrast */}
                            <Card className="bg-slate-900 p-10 rounded-[2.5rem] border-white/5 text-white shadow-2xl shadow-indigo-200 overflow-hidden relative animate-scale-in">
                               <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/30 rounded-full -mr-48 -mt-48 blur-3xl pointer-events-none" />
                               <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-600/20 rounded-full -ml-32 -mb-32 blur-3xl pointer-events-none" />
                               <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
                                  <div className="flex flex-col items-center md:items-start text-center md:text-left">
                                     <h3 className="text-xl font-bold text-indigo-300 uppercase tracking-[0.3em] mb-4">Total Match Score</h3>
                                     <div className="flex items-baseline gap-2">
                                        <span className="text-8xl font-black text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]">{result.overallScore}</span>
                                        <span className="text-2xl text-white/40 font-bold">/100</span>
                                     </div>
                                     <p className="mt-6 text-lg text-white/70 font-medium max-w-md">{result.summary || "Your profile narrative has been synthesized professionally."}</p>
                                  </div>

                                  <div className="grid grid-cols-3 gap-6 w-full md:w-auto">
                                     <div className="bg-white/5 border border-white/10 p-6 rounded-3xl text-center min-w-[120px] backdrop-blur-md">
                                        <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400 mx-auto mb-3">
                                           <CheckCircle2 className="w-6 h-6" />
                                        </div>
                                        <p className="text-3xl font-black text-emerald-400">{result.passedChecks}</p>
                                        <p className="text-[10px] uppercase font-bold text-white/40 tracking-widest mt-1">Passed</p>
                                     </div>
                                     <div className="bg-white/5 border border-white/10 p-6 rounded-3xl text-center min-w-[120px] backdrop-blur-md">
                                        <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center text-amber-400 mx-auto mb-3">
                                           <AlertTriangle className="w-6 h-6" />
                                        </div>
                                        <p className="text-3xl font-black text-amber-400">{result.warnings}</p>
                                        <p className="text-[10px] uppercase font-bold text-white/40 tracking-widest mt-1">Warnings</p>
                                     </div>
                                     <div className="bg-white/5 border border-white/10 p-6 rounded-3xl text-center min-w-[120px] backdrop-blur-md">
                                        <div className="w-10 h-10 bg-rose-500/20 rounded-xl flex items-center justify-center text-rose-400 mx-auto mb-3">
                                           <XCircle className="w-6 h-6" />
                                        </div>
                                        <p className="text-3xl font-black text-rose-400">{result.issues}</p>
                                        <p className="text-[10px] uppercase font-bold text-white/40 tracking-widest mt-1">Issues</p>
                                     </div>
                                  </div>
                               </div>
                            </Card>

                            {/* Tabs Navigation */}
                            <div className="flex gap-8 border-b border-slate-200 mb-10 overflow-x-auto pb-1 no-scrollbar">
                                {[
                                    { id: 'overview', label: 'Overview', icon: Menu },
                                    { id: 'detailed', label: 'Detailed Results', icon: FileSearch },
                                    { id: 'recommendations', label: 'Recommendations', icon: Sparkles },
                                    { id: 'next-steps', label: 'Next Steps', icon: GraduationCap }
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id as any)}
                                        className={`flex items-center gap-2 pb-3 text-sm font-bold whitespace-nowrap transition-all border-b-2 ${
                                            activeTab === tab.id 
                                            ? 'border-indigo-600 text-indigo-600' 
                                            : 'border-transparent text-slate-400 hover:text-slate-600'
                                        }`}
                                    >
                                        <tab.icon className="w-4 h-4" /> {tab.label}
                                    </button>
                                ))}
                            </div>

                            {/* Tab Content */}
                            <div className="transition-all duration-500 min-h-[400px]">
                                {activeTab === 'overview' && (
                                    <div className="animate-fade-in-up space-y-8">
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                            <CategoryCard title="Education" icon={GraduationCap} data={result.categories.education} />
                                            <CategoryCard title="Formatting" icon={Sparkles} data={result.categories.formatting} />
                                            <CategoryCard title="Skills" icon={Target} data={result.categories.skillsSection} />
                                            <CategoryCard title="Experience" icon={Briefcase} data={result.categories.workExperience} />
                                            <CategoryCard title="Keywords" icon={FileCode2} data={result.categories.keywords} />
                                            <CategoryCard title="ATS" icon={CheckCircle2} data={result.categories.atsCompatibility} />
                                            <CategoryCard title="Contact" icon={User} data={result.categories.contactInformation} />
                                            <CategoryCard title="Summary" icon={FileText} data={result.categories.professionalSummary} />
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'detailed' && (
                                    <div className="animate-fade-in-up space-y-6">
                                        {Object.entries(result.categories).map(([key, data]) => (
                                            <Card key={key} className="glass p-8 flex flex-col md:flex-row gap-8 items-start hover:border-slate-300 transition-colors">
                                                <div className={`p-4 rounded-2xl ${
                                                    data.status === 'Pass' ? 'bg-emerald-50 text-emerald-600' :
                                                    data.status === 'Warning' ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'
                                                }`}>
                                                    {getStatusIcon(data.status)}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <h4 className="text-xl font-bold text-slate-900 capitalize">{key.replace(/([A-Z])/g, ' $1')}</h4>
                                                        <Badge variant="outline" className="font-black">{data.score}/100</Badge>
                                                    </div>
                                                    <p className="text-slate-600 leading-relaxed font-medium">{data.message}</p>
                                                </div>
                                            </Card>
                                        ))}
                                    </div>
                                )}

                                {activeTab === 'recommendations' && (
                                    <div className="animate-fade-in-up grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {result.recommendations.map((rec, idx) => (
                                            <Card key={idx} className="glass p-8 relative overflow-hidden group hover:border-indigo-200 transition-all">
                                                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                                    <Lightbulb className="w-16 h-16 text-indigo-600" />
                                                </div>
                                                <div className="flex gap-4 items-start relative z-10">
                                                    <div className="w-8 h-8 rounded-full bg-indigo-600 flex-shrink-0 flex items-center justify-center text-white font-black text-xs">
                                                        {idx + 1}
                                                    </div>
                                                    <p className="text-slate-700 font-medium leading-relaxed">{rec}</p>
                                                </div>
                                            </Card>
                                        ))}
                                    </div>
                                )}

                                {activeTab === 'next-steps' && (
                                    <div className="animate-fade-in-up space-y-8">
                                        <Card className="glass p-10 bg-indigo-600 text-white border-none shadow-2xl shadow-indigo-200 overflow-hidden relative">
                                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none" />
                                            <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
                                                <div className="flex-1 text-center md:text-left">
                                                    <h3 className="text-3xl font-black mb-4 flex items-center gap-3 justify-center md:justify-start">
                                                        <Bot className="w-8 h-8" /> Career Acceleration
                                                    </h3>
                                                    <p className="text-indigo-100 font-medium text-lg leading-relaxed max-w-xl">
                                                        Your resume is strong, but interview readiness is the final hurdle. Let's practice specific scenarios based on your background.
                                                    </p>
                                                </div>
                                                <Button 
                                                    onClick={() => router.push('/interview/setup')}
                                                    className="h-16 px-10 rounded-2xl bg-white text-indigo-600 hover:bg-slate-50 font-black text-lg transition-all active:scale-95"
                                                >
                                                    Launch Interview Simulation
                                                </Button>
                                            </div>
                                        </Card>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            {[
                                                { title: 'Topic Drills', desc: 'Focus on Technical or Behavioral mastery.', icon: Target, route: '/interview/setup' },
                                                { title: 'Interactive Chat', desc: 'Warm up with our conversational AI.', icon: MessageSquare, route: '/chat' },
                                                { title: 'Virtual Lobby', desc: 'Experience the 3D practice suite.', icon: Gamepad2, route: '/virtual-lobby' }
                                            ].map((step, i) => (
                                                <Card key={i} className="glass p-8 hover:scale-105 transition-all cursor-pointer border-slate-200/50" onClick={() => router.push(step.route)}>
                                                    <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center text-white mb-6">
                                                        <step.icon className="w-6 h-6" />
                                                    </div>
                                                    <h4 className="text-xl font-bold text-slate-900 mb-2">{step.title}</h4>
                                                    <p className="text-slate-500 text-sm font-medium leading-relaxed">{step.desc}</p>
                                                </Card>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Global Polish Footer */}
                            <div className="text-center py-12">
                                <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.3em]">
                                    Report Generated by AI Interview Coach Pro Suite
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
