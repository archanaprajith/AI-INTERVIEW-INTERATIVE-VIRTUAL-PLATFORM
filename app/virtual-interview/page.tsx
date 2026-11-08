'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { AIAvatar } from '@/components/interview/AIAvatar';
import { ArrowLeft, Mic, MicOff, VideoOff, Video, Loader2, PhoneMissed, Volume2 } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function VirtualInterviewPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [hasStarted, setHasStarted] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  
  // Voice engine states
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isListeningState, setIsListeningState] = useState(false);
  const [isSpeakingState, setIsSpeakingState] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [coachFeedback, setCoachFeedback] = useState<{
    bodyLanguage?: string;
    energy?: string;
    anxiety?: string;
    tip?: string;
  } | null>(null);
  
  const recognitionRef = useRef<any>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isSpeakingRef = useRef(false);
  const isListeningRef = useRef(false);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const interimTranscriptRef = useRef('');
  
  // Keep refs in sync for handlers
  const messagesRef = useRef(messages);
  useEffect(() => { messagesRef.current = messages; }, [messages]);
  useEffect(() => { isSpeakingRef.current = isSpeakingState; }, [isSpeakingState]);
  useEffect(() => { isListeningRef.current = isListeningState; }, [isListeningState]);

  // 1. Initialize Webcam & Mic (Requesting both unlocks SpeechRecognition in stricter browsers)
  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(stream => {
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setIsCameraReady(true);
      })
      .catch((err: any) => {
        console.error("Media access denied or failed", err);
        setErrorMsg("Camera or Microphone access was denied. Please allow permissions in your browser.");
        
        // Fallback to video only if audio completely fails
        navigator.mediaDevices.getUserMedia({ video: true, audio: false })
            .then(vidStream => {
                streamRef.current = vidStream;
                if (videoRef.current) videoRef.current.srcObject = vidStream;
                setIsCameraReady(true);
                setIsAudioEnabled(false);
            }).catch(() => {});
      });

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // 2. Initialize Speech Recognition Engine
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechParams = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechParams) {
        const rec = new SpeechParams();
        rec.continuous = true;
        rec.interimResults = true;

        rec.onresult = (event: any) => {
          let finalTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript + ' ';
            } else {
              interimTranscriptRef.current = event.results[i][0].transcript;
            }
          }

          if (finalTranscript.trim()) {
            interimTranscriptRef.current = '';
            // Reset silence timeout
            if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
            
            silenceTimeoutRef.current = setTimeout(() => {
              if (!isSpeakingRef.current && finalTranscript.trim()) {
                handleUserCompletedSpeech(finalTranscript.trim());
              }
            }, 1500); // Wait 1.5s of silence before sending
          }
        };

        rec.onerror = (event: any) => {
          console.error("Speech recognition error:", event.error);
          if (event.error === 'not-allowed') {
            setErrorMsg("Microphone access was denied. Please allow microphone permissions in your browser.");
            setIsListeningState(false);
          } else if (event.error !== 'no-speech') {
            setIsListeningState(false);
          }
        };

        rec.onend = () => {
          setIsListeningState(false);
          // Auto-restart if we should be listening and AI is not speaking
          if (hasStarted && !isSpeakingRef.current && !isLoading) {
            try { 
              rec.start(); 
              setIsListeningState(true);
            } catch (e) {}
          }
        };

        recognitionRef.current = rec;
      }
    }

    return () => {
      if (recognitionRef.current) recognitionRef.current.stop();
      if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
      window.speechSynthesis.cancel();
    };
  }, [hasStarted, isLoading]);
  
  // 3. Pre-load voices for Speech Synthesis
  useEffect(() => {
    const loadVoices = () => {
      window.speechSynthesis.getVoices();
    };
    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  // Initial AI Greeting
  const startInterview = async () => {
    setHasStarted(true);
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/chat-v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: [{ role: 'user', content: 'I am ready. Please start the general interview with a self-introduction.' }],
          mode: 'general' 
        })
      });
      const data = await response.json();
      setMessages([{ role: 'assistant', content: data.reply }]);
      speakText(data.reply);
    } catch(e) {
      console.error(e);
      setIsLoading(false);
    }
  };

  const speakText = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    
    // Stop mic while AI speaks
    if (recognitionRef.current && isListeningRef.current) {
      try { recognitionRef.current.stop(); } catch(e){}
    }

    // Robust Speech Synthesis
    try {
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      }

      // Small delay after cancel
      setTimeout(() => {
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Use basic English as fallback for stability
        utterance.lang = 'en-US';
        utterance.rate = 1.0;
        utterance.pitch = 1.0;

        utterance.onstart = () => {
          setIsSpeakingState(true);
          setIsLoading(false);
          console.log("AI is now speaking...");
        };

        utterance.onend = () => {
          setIsSpeakingState(false);
          if (hasStarted && recognitionRef.current && !isLoading) {
            try { recognitionRef.current.start(); setIsListeningState(true); } catch(e){}
          }
        };

        utterance.onerror = (e) => {
          console.error("Speech Error Event:", e);
          setIsSpeakingState(false);
        };

        window.speechSynthesis.speak(utterance);
      }, 50);
    } catch (err) {
      console.error("Critical Speech Failure:", err);
      setIsSpeakingState(false);
    }
  };

  const captureSnapshot = (): string | null => {
    if (!videoRef.current || !canvasRef.current) return null;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    // Set low-res for speed and token efficiency
    canvas.width = 480;
    canvas.height = 360;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    
    // Mirror image to match the preview
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    return canvas.toDataURL('image/jpeg', 0.6).split(',')[1]; // Base64 without header
  };

  const handleUserCompletedSpeech = async (text: string) => {
    // Stop listening during processing
    if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch(e){}
    }
    
    setIsLoading(true);
    
    // Capture visual context right when they finish speaking
    const snapshot = captureSnapshot();
    
    const newMessages = [...messagesRef.current, { role: 'user', content: text } as Message];
    setMessages(newMessages);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s timeout

      const response = await fetch('/api/chat-v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({ 
          messages: newMessages,
          image: snapshot,
          mode: 'general'
        }),
      });
      
      clearTimeout(timeoutId);
      const data = await response.json();
      setMessages([...newMessages, { role: 'assistant', content: data.reply }]);
      
      if (data.analysis) setCoachFeedback(data.analysis);
      speakText(data.reply);
    } catch(err: any) {
      console.error("Fetch error:", err);
      setIsLoading(false);
      if (err.name === 'AbortError') {
        setErrorMsg("The AI is taking too long to respond. Please check your connection and try again.");
      } else {
        setErrorMsg("Failed to connect to AI. Please check your internet and API key.");
      }
    }
  };

  const toggleMic = () => {
    setErrorMsg(null);
    
    // Toggle WebRTC Stream Audio
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach(t => t.enabled = !isAudioEnabled);
    }
    const newAudioState = !isAudioEnabled;
    setIsAudioEnabled(newAudioState);

    // Toggle Speech Recognition
    if (isListeningState && !newAudioState) {
       try { recognitionRef.current?.stop(); } catch(e){}
       setIsListeningState(false);
    } else if (newAudioState) {
       setHasStarted(true); // force start if they click mic directly
       try {
         recognitionRef.current?.start();
         setIsListeningState(true);
       } catch (err: any) {
         if (err.name === 'NotAllowedError') setErrorMsg("Microphone access denied.");
       }
    }
  };

  const toggleVideo = () => {
    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !isVideoEnabled;
        setIsVideoEnabled(!isVideoEnabled);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col pt-4">
      {/* Header View */}
      <div className="max-w-7xl w-full mx-auto px-4 flex items-center justify-between mb-6 z-10">
        <Button variant="ghost" onClick={() => router.push('/')} className="text-slate-300 hover:text-white hover:bg-slate-800">
          <ArrowLeft className="w-4 h-4 mr-2" /> End Interview
        </Button>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
           Virtual Face-to-Face Meeting
        </h1>
        <div className="w-[140px] flex justify-end"></div>
      </div>

      {errorMsg && (
        <div className="max-w-7xl w-full mx-auto px-4 mb-4 z-10">
          <div className="bg-red-500/10 border border-red-500/50 text-red-200 px-4 py-3 rounded-xl flex items-center gap-3">
            <VideoOff className="w-5 h-5 text-red-400 shrink-0" />
            <p className="font-medium">{errorMsg}</p>
          </div>
        </div>
      )}

      {/* Main Split Interface */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 pb-8 flex flex-col md:flex-row gap-6 relative">
        
        {/* User Webcam (Left Pane) */}
        <div className="flex-1 rounded-2xl overflow-hidden bg-black border border-slate-700 shadow-2xl relative">
           {/* Webcam Feed */}
           <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              className="w-full h-full object-cover transform -scale-x-100" 
           />
           
           {!isCameraReady && (
             <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-800/80 text-slate-400">
                <VideoOff className="w-8 h-8 mb-2 opacity-50" />
                <p>Waiting for camera permissions...</p>
             </div>
           )}

           {/* User Nameplate */}
           <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-4 py-2 rounded-lg text-white font-medium shadow-md border border-white/10 flex items-center gap-2 text-sm">
             You
             {isListeningState && <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse ml-1" />}
           </div>
        </div>

        {/* AI Server Avatar (Right Pane) */}
        <div className="flex-1 rounded-2xl bg-gradient-to-b from-slate-800 to-slate-900 border border-slate-700 shadow-2xl flex flex-col relative overflow-hidden">
           
           {/* Avatar Canvas */}
           <div className="flex-1 flex items-center justify-center p-8">
              <AIAvatar isSpeaking={isSpeakingState} isListening={isListeningState} />
              <canvas ref={canvasRef} className="hidden" />
           </div>

           {/* AI Coaching HUD */}
           {coachFeedback && (
              <div className="absolute top-4 left-4 right-4 z-20 animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-3 flex flex-wrap gap-4 text-[10px] font-semibold">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-slate-400 uppercase">Posture</span>
                    <span className="text-white">{coachFeedback.bodyLanguage || '--'}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-slate-400 uppercase">Anxiety</span>
                    <span className="text-white">{coachFeedback.anxiety || '--'}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-slate-400 uppercase">Energy</span>
                    <span className="text-white">{coachFeedback.energy || '--'}</span>
                  </div>
                  {coachFeedback.tip && (
                    <div className="flex-1 bg-indigo-500/20 border-l-2 border-indigo-400 pl-3 py-1">
                      <span className="text-indigo-300 block mb-0.5 uppercase"> TIP </span>
                      <span className="text-white italic text-[11px]">"{coachFeedback.tip}"</span>
                    </div>
                  )}
                </div>
              </div>
           )}

           {isLoading && (
              <div className="absolute top-4 right-4 bg-indigo-500/20 text-indigo-300 px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-2 backdrop-blur-sm border border-indigo-500/30">
                 <Loader2 className="w-3 h-3 animate-spin"/> Processing
              </div>
           )}

           {/* AI Nameplate */}
           <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-4 py-2 rounded-lg text-white font-medium shadow-md border border-white/10 text-sm">
             AI Interviewer
           </div>

           {/* Transcript Overlay directly on AI side */}
           <div className="absolute bottom-16 left-4 right-4 text-center pointer-events-none">
             {messages.filter(m => m.role === 'assistant').slice(-1).map((msg, idx) => (
                <div key={idx} className="inline-block bg-black/80 backdrop-blur-sm text-white px-6 py-3 rounded-2xl max-w-[90%] border border-white/10 shadow-2xl animate-in fade-in slide-in-from-bottom-2">
                   <p className="text-sm md:text-base leading-relaxed break-words font-medium">{msg.content}</p>
                </div>
             ))}
           </div>
        </div>
      </div>

      {/* Sub-controls Overlay (Google Meet Style) */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 p-3 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] z-50 flex items-center gap-4 bg-slate-900 border border-slate-700">
        {!hasStarted ? (
          <Button size="lg" onClick={startInterview} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-8 shadow-lg shadow-indigo-600/20 w-auto h-12 text-sm font-semibold">
             Join Meeting
          </Button>
        ) : (
          <div className="flex items-center justify-center gap-3">
            {/* Mic Toggle */}
            <Button 
               size="icon" 
               variant="ghost"
               onClick={toggleMic}
               title={isAudioEnabled ? "Turn off microphone" : "Turn on microphone"}
               className={`w-12 h-12 rounded-full transition-all flex items-center justify-center ${!isAudioEnabled ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-slate-700 hover:bg-slate-600 border-none text-white'}`}
            >
               {!isAudioEnabled ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </Button>
            
            {/* Video Toggle */}
            <Button 
               size="icon" 
               variant="ghost"
               onClick={toggleVideo}
               title={isVideoEnabled ? "Turn off camera" : "Turn on camera"}
               className={`w-12 h-12 rounded-full transition-all flex items-center justify-center ${!isVideoEnabled ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-slate-700 hover:bg-slate-600 border-none text-white'}`}
            >
               {!isVideoEnabled ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
            </Button>

            {/* Test Voice Button */}
            <Button 
               size="icon" 
               variant="ghost"
               onClick={() => speakText("Voice system initialized. I am ready for your interview.")}
               title="Test AI Voice"
               className="w-12 h-12 rounded-full bg-indigo-500 hover:bg-indigo-600 text-white border-none flex items-center justify-center"
            >
               <Volume2 className="w-5 h-5" />
            </Button>
            
            {/* End Call */}
            <Button 
               size="icon" 
               variant="ghost"
               onClick={() => router.push('/')}
               title="Leave call"
               className="w-16 h-12 rounded-3xl bg-red-600 hover:bg-red-700 text-white flex items-center justify-center border-none ml-2"
            >
               <PhoneMissed className="w-5 h-5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
