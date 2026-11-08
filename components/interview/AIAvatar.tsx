import React, { useEffect, useState } from 'react';
import { Bot, Mic } from 'lucide-react';

interface AIAvatarProps {
  isSpeaking: boolean;
  isListening?: boolean;
}

export function AIAvatar({ isSpeaking, isListening }: AIAvatarProps) {
  const [randomBars, setRandomBars] = useState<number[]>([20, 20, 20, 20, 20]);

  // Animate the voice bars when speaking
  useEffect(() => {
    if (!isSpeaking) {
      setRandomBars([20, 20, 20, 20, 20]);
      return;
    }
    const interval = setInterval(() => {
      setRandomBars(Array(5).fill(0).map(() => 40 + Math.random() * 60)); // 40px to 100px
    }, 150);
    return () => clearInterval(interval);
  }, [isSpeaking]);

  return (
    <div className="relative flex flex-col items-center justify-center w-full h-full min-h-[400px]">
      
      {/* Outer Ambient Glow */}
      <div 
        className={`absolute rounded-full bg-indigo-500 blur-3xl transition-all duration-500 ${isSpeaking ? 'w-80 h-80 opacity-40 scale-125' : isListening ? 'w-64 h-64 opacity-20 scale-100 bg-emerald-500' : 'w-64 h-64 opacity-10 scale-100'}`} 
      />

      {/* Orbital Ring */}
      <div 
        className={`absolute w-64 h-64 rounded-full border border-indigo-400/30 transition-transform duration-1000 ${isSpeaking ? 'animate-ping' : ''}`} 
      />

      {/* Core Avatar Sphere */}
      <div className={`relative z-10 w-48 h-48 bg-gradient-to-br transition-all duration-300 shadow-2xl flex items-center justify-center overflow-hidden border-4 ${isSpeaking ? 'border-indigo-400 from-indigo-500 to-purple-600 scale-105 shadow-indigo-500/50' : 'border-white/20 from-slate-700 to-slate-800 scale-100'}`} style={{ borderRadius: '40% 60% 70% 30% / 40% 50% 60% 50%', animation: 'morph 8s ease-in-out infinite' }}>
        <img 
          src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=600" 
          alt="AI Interviewer"
          className={`w-full h-full object-cover transition-all duration-500 ${isSpeaking ? 'scale-110' : 'opacity-80 grayscale-[20%]'}`}
        />
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes morph {
          0%, 100% { border-radius: 40% 60% 70% 30% / 40% 40% 60% 50%; }
          34% { border-radius: 70% 30% 50% 50% / 30% 30% 70% 70%; }
          67% { border-radius: 100% 60% 60% 100% / 100% 100% 60% 60%; }
        }
      `}} />

      {/* Connection / Status Subtitle */}
      <div className="mt-12 text-center z-10">
        {isSpeaking ? (
          <div className="flex flex-col items-center">
            <div className="flex items-end justify-center gap-1.5 h-12 mb-2">
              {randomBars.map((height, i) => (
                <div key={i} className="w-2 bg-indigo-500 rounded-full transition-all duration-150" style={{ height: `${height}%` }} />
              ))}
            </div>
            <p className="text-indigo-600 font-semibold text-lg flex items-center gap-2"><Bot className="w-5 h-5"/> AI Interviewer Speaking</p>
          </div>
        ) : isListening ? (
          <div className="flex flex-col items-center">
            <Mic className="text-emerald-500 w-8 h-8 mb-4 animate-pulse" />
            <p className="text-emerald-600 font-semibold text-lg flex items-center gap-2">Listening to you...</p>
          </div>
        ) : (
          <p className="text-slate-400 font-medium text-lg">AI Connected & Waiting</p>
        )}
      </div>

    </div>
  );
}
