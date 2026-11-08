'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
    Loader2, Mic, MicOff, Send, Volume2, ArrowLeft, 
    Radio, BrainCircuit, Sparkles, User, Bot, 
    MessageSquare, Zap
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

export default function ChatInterviewPage() {
    const router = useRouter();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Speech Recognition State
    const [isListening, setIsListening] = useState(false);
    const [isVoiceMode, setIsVoiceMode] = useState(false);
    const [interimResult, setInterimResult] = useState('');
    const recognitionRef = useRef<any>(null);
    
    // Refs for callbacks
    const isVoiceModeRef = useRef(false);
    const isSpeakingRef = useRef(false);
    const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const inputRef = useRef(input);
    const messagesRef = useRef(messages);
    const isLoadingRef = useRef(isLoading);

    useEffect(() => { inputRef.current = input; }, [input]);
    useEffect(() => { messagesRef.current = messages; }, [messages]);
    useEffect(() => { isLoadingRef.current = isLoading; }, [isLoading]);

    useEffect(() => {
        const initialGreeting = async () => {
            setIsLoading(true);
            try {
                const res = await fetch('/api/chat-v2', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        messages: [{ role: 'user', content: 'I am ready. Please start the interview with a self-introduction.' }],
                        mode: 'general' 
                    })
                });
                const data = await res.json();
                if (data.reply) {
                    setMessages([{ role: 'assistant', content: data.reply }]);
                    speakText(data.reply);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setIsLoading(false);
            }
        };

        if (messages.length === 0) {
            initialGreeting();
        }

        if (typeof window !== 'undefined') {
            const SpeechRecognitionImpl = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            if (SpeechRecognitionImpl) {
                const rec = new SpeechRecognitionImpl();
                rec.continuous = true;
                rec.interimResults = true;

                rec.onresult = (event: any) => {
                    let finalTranscript = '';
                    let interimTranscript = '';
                    for (let i = event.resultIndex; i < event.results.length; ++i) {
                        if (event.results[i].isFinal) {
                            finalTranscript += event.results[i][0].transcript;
                        } else {
                            interimTranscript += event.results[i][0].transcript;
                        }
                    }
                    if (finalTranscript) {
                        setInput(prev => prev ? prev + ' ' + finalTranscript : finalTranscript);
                    }
                    setInterimResult(interimTranscript);

                    if (isVoiceModeRef.current) {
                        if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
                        silenceTimeoutRef.current = setTimeout(() => {
                            if (inputRef.current.trim() && !isLoadingRef.current && !isSpeakingRef.current) {
                                handleSendFromVoice();
                            }
                        }, 2000); 
                    }
                };

                rec.onerror = (event: any) => {
                    console.error('Speech recognition error', event.error);
                    if (event.error !== 'no-speech') {
                        setIsListening(false);
                    }
                };

                rec.onend = () => {
                    setIsListening(false);
                    if (isVoiceModeRef.current && !isSpeakingRef.current && !isLoadingRef.current) {
                        try {
                            rec.start();
                            setIsListening(true);
                        } catch (e) {
                            console.error('Failed to restart recording', e);
                        }
                    }
                };
                recognitionRef.current = rec;
            }
        }

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
            if (silenceTimeoutRef.current) {
                clearTimeout(silenceTimeoutRef.current);
            }
        };
    }, []);

    const speakText = (text: string) => {
        if (!('speechSynthesis' in window)) return;
        window.speechSynthesis.cancel();
        
        isSpeakingRef.current = true;
        
        if (recognitionRef.current && isListening) {
             try { recognitionRef.current.stop(); } catch(e){}
        }

        const utterance = new SpeechSynthesisUtterance(text);
        
        utterance.onend = () => {
             isSpeakingRef.current = false;
             if (isVoiceModeRef.current && recognitionRef.current && !isLoadingRef.current) {
                  try { 
                      recognitionRef.current.start(); 
                      setIsListening(true);
                  } catch(e) { console.error('Failed to restart mic after speaking', e); }
             }
        };
        
        utterance.onerror = () => {
            isSpeakingRef.current = false;
        };

        window.speechSynthesis.speak(utterance);
    };

    const toggleVoiceMode = () => {
        if (!recognitionRef.current) return alert("Speech recognition is not supported in this browser.");
        
        if (isVoiceMode) {
            setIsVoiceMode(false);
            isVoiceModeRef.current = false;
            setIsListening(false);
            if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
            try { recognitionRef.current.stop(); } catch (e) { }
            window.speechSynthesis.cancel();
            isSpeakingRef.current = false;
        } else {
            setIsVoiceMode(true);
            isVoiceModeRef.current = true;
            setInterimResult('');
            try { 
                recognitionRef.current.start(); 
                setIsListening(true);
            } catch (e: any) {
                if (e.name !== 'InvalidStateError') {
                    console.error('Failed to start recording', e);
                    setIsVoiceMode(false);
                    isVoiceModeRef.current = false;
                }
            }
        }
    };

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendFromVoice = async () => {
        if (!inputRef.current.trim() || isLoadingRef.current) return;
        const currentInput = inputRef.current;
        const currentMessages = messagesRef.current;
        await sendPayload(currentInput, currentMessages);
    };

    const sendMessage = async () => {
        if (!input.trim() || isLoading) return;
        await sendPayload(input, messages);
    };

    const sendPayload = async (textToSend: string, currentMessages: Message[]) => {
        if (recognitionRef.current) {
            try { recognitionRef.current.stop(); setIsListening(false); } catch(e){}
        }
        
        if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);

        const newMessages = [...currentMessages, { role: 'user', content: textToSend } as Message];
        setMessages(newMessages);
        setInput('');
        setInterimResult('');
        setIsLoading(true);

        try {
            const response = await fetch('/api/chat-v2', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: newMessages, mode: 'general' }),
            });

            if (!response.ok) throw new Error('Failed to send message');

            const data = await response.json();
            setMessages([...newMessages, { role: 'assistant', content: data.reply }]);
            speakText(data.reply);

        } catch (error) {
            console.error(error);
            setMessages([...newMessages, { role: 'assistant', content: "Sorry, I ran into an error processing that." }]);
        } finally {
            setIsLoading(false);
            if (isVoiceModeRef.current && !isSpeakingRef.current) {
                 try { recognitionRef.current.start(); setIsListening(true); } catch(e) {}
            }
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-10 selection:bg-indigo-100" suppressHydrationWarning>
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

            <div className="pt-32 max-w-4xl mx-auto px-4 h-[calc(100vh-80px)] flex flex-col">
                <div className="flex items-center justify-between mb-8 animate-fade-in-up">
                    <div>
                        <Badge className="mb-2 py-1 px-3 text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full font-black uppercase tracking-widest">
                           <Zap className="w-3 h-3 mr-1 inline" /> Real-time Coaching
                        </Badge>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                            Interactive <span className="text-indigo-600">Chat.</span>
                        </h1>
                    </div>
                    {isVoiceMode && (
                        <div className="flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-600 text-xs rounded-xl font-black border border-rose-100 shadow-sm animate-pulse uppercase tracking-wider">
                            <Radio className="w-4 h-4" /> Voice Mode Active
                        </div>
                    )}
                </div>

                <Card className="flex-1 glass rounded-[2rem] border-slate-200 flex flex-col overflow-hidden mb-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                    {/* Chat Window */}
                    <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in-up`}>
                                <div className={`max-w-[85%] rounded-[1.5rem] p-6 shadow-sm ${
                                    msg.role === 'user' 
                                    ? 'bg-slate-900 text-white rounded-br-none' 
                                    : 'bg-white text-slate-800 rounded-bl-none border border-slate-100'
                                }`}>
                                    <div className="flex justify-between items-start gap-6">
                                        <p className="whitespace-pre-wrap leading-relaxed text-[15px] font-medium">{msg.content}</p>
                                        {msg.role === 'assistant' && (
                                            <button onClick={() => speakText(msg.content)} className="text-slate-300 hover:text-indigo-600 shrink-0 transition-all active:scale-90" title="Play Audio">
                                                <Volume2 className="w-5 h-5" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start animate-fade-in-up">
                                <div className="bg-white rounded-[1.5rem] rounded-bl-none p-6 w-24 flex justify-center items-center border border-slate-100 shadow-sm">
                                    <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className={`p-6 border-t transition-all ${isVoiceMode ? 'bg-indigo-50/50 border-indigo-200' : 'bg-slate-50/50 border-slate-100'}`}>
                        <div className="flex gap-4 relative items-end">
                            <Button
                                variant={isVoiceMode ? "destructive" : "outline"}
                                size="icon"
                                className={`shrink-0 h-14 w-14 rounded-2xl shadow-sm transition-all active:scale-95 ${
                                    isVoiceMode 
                                    ? 'bg-rose-600 text-white hover:bg-rose-700' 
                                    : 'bg-white text-slate-600 hover:bg-slate-50'
                                }`}
                                onClick={toggleVoiceMode}
                                title={isVoiceMode ? "Disable Voice Mode" : "Enable Hands-Free Voice"}
                            >
                                {isVoiceMode ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                            </Button>
                            
                            <div className="flex-1 relative">
                                <Textarea
                                    value={input + (interimResult ? (input ? ' ' : '') + interimResult : '')}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            sendMessage();
                                        }
                                    }}
                                    disabled={isLoading || isVoiceMode}
                                    placeholder={isVoiceMode ? "Hands-free active. AI is listening..." : "Type your message..."}
                                    className={`resize-none min-h-[56px] py-4 bg-white rounded-2xl text-base shadow-sm border-slate-200 focus-visible:ring-indigo-500 transition-all ${
                                        isVoiceMode ? 'opacity-60 cursor-not-allowed' : ''
                                    }`}
                                />
                                
                                {isVoiceMode && isListening && !isLoading && !isSpeakingRef.current && (
                                   <div className="absolute right-4 bottom-4 flex gap-1 animate-fade-in">
                                      <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                      <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                      <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                   </div>
                                )}
                            </div>
                            
                            <Button
                                onClick={sendMessage}
                                disabled={isLoading || (!input.trim() && !interimResult.trim()) || isVoiceMode}
                                className={`shrink-0 h-14 w-14 rounded-2xl shadow-xl transition-all active:scale-95 ${
                                    isVoiceMode ? 'opacity-40 translate-y-1' : 'bg-slate-900 text-white hover:bg-slate-800'
                                }`}
                                title="Send"
                            >
                                <Send className="w-6 h-6" />
                            </Button>
                        </div>
                        {isVoiceMode && (
                           <p className="text-center mt-4 text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] animate-fade-in">
                               Hands-free mode active • Simply speak to respond
                           </p>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
}
