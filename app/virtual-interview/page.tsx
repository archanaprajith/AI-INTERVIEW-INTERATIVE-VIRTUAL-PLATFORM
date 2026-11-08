'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AIAvatar } from '@/components/interview/AIAvatar';
import { 
  ArrowLeft, Mic, MicOff, VideoOff, Video, Loader2, 
  PhoneMissed, Volume2, RefreshCw, Send, MessageSquare, Check, Sparkles 
} from 'lucide-react';

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
  
  // Voice engine & transcript states
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isListeningState, setIsListeningState] = useState(false);
  const [isSpeakingState, setIsSpeakingState] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [showTextInput, setShowTextInput] = useState(false);
  const [manualInput, setManualInput] = useState('');

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
  const isLoadingRef = useRef(false);
  const shouldListenRef = useRef(false);
  const isRecognitionActiveRef = useRef(false);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const accumulatedSpeechRef = useRef('');
  
  // Sync refs
  const messagesRef = useRef(messages);
  useEffect(() => { messagesRef.current = messages; }, [messages]);
  useEffect(() => { isSpeakingRef.current = isSpeakingState; }, [isSpeakingState]);
  useEffect(() => { isListeningRef.current = isListeningState; }, [isListeningState]);
  useEffect(() => { isLoadingRef.current = isLoading; }, [isLoading]);

  // 1. Initialize Webcam & Mic
  const initMedia = async () => {
    setErrorMsg(null);
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsCameraReady(true);
      setIsAudioEnabled(true);
      setIsVideoEnabled(true);
    } catch (err: any) {
      console.warn("Media access denied or error:", err);
      setErrorMsg("Camera or Microphone access was denied. Please allow permissions in your browser settings (lock icon next to URL) and click Retry.");
      
      // Fallback: try video only
      try {
        const vidStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        streamRef.current = vidStream;
        if (videoRef.current) videoRef.current.srcObject = vidStream;
        setIsCameraReady(true);
        setIsAudioEnabled(false);
      } catch (videoErr) {
        setIsCameraReady(false);
      }
    }
  };

  useEffect(() => {
    initMedia();

    return () => {
      cleanupResources();
    };
  }, []);

  const cleanupResources = () => {
    shouldListenRef.current = false;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        try { track.stop(); } catch (e) {}
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
    }
  };

  const endInterview = () => {
    cleanupResources();
    router.push('/dashboard');
  };

  // Safe Speech Recognition Starter
  const safeStartListening = () => {
    if (!shouldListenRef.current || isSpeakingRef.current || isLoadingRef.current) return;
    if (!recognitionRef.current) return;
    if (isRecognitionActiveRef.current) return;

    try {
      recognitionRef.current.start();
      isRecognitionActiveRef.current = true;
      setIsListeningState(true);
    } catch (e: any) {
      if (e.name !== 'InvalidStateError') {
        console.warn("Speech start warning:", e);
      }
    }
  };

  const safeStopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    isRecognitionActiveRef.current = false;
    setIsListeningState(false);
  };

  // 2. Initialize Speech Recognition Engine once
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SpeechParams = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechParams) {
      console.warn("SpeechRecognition not supported in this browser.");
      return;
    }

    const rec = new SpeechParams();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-US';

    rec.onstart = () => {
      isRecognitionActiveRef.current = true;
      setIsListeningState(true);
    };

    rec.onresult = (event: any) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          accumulatedSpeechRef.current = (accumulatedSpeechRef.current + ' ' + event.results[i][0].transcript).trim();
        } else {
          interim += event.results[i][0].transcript;
        }
      }

      const combinedText = (accumulatedSpeechRef.current + ' ' + interim).trim();
      setLiveTranscript(combinedText);

      if (combinedText.length > 0) {
        if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
        
        // Auto-submit after 2 seconds of silence
        silenceTimeoutRef.current = setTimeout(() => {
          if (!isSpeakingRef.current && !isLoadingRef.current) {
            const textToSubmit = (accumulatedSpeechRef.current + ' ' + interim).trim();
            if (textToSubmit) {
              handleUserCompletedSpeech(textToSubmit);
            }
          }
        }, 2000);
      }
    };

    rec.onerror = (event: any) => {
      console.warn("Speech recognition event error:", event.error);
      if (event.error === 'not-allowed') {
        setErrorMsg("Microphone access was denied. Please allow microphone permissions in browser settings.");
        setIsListeningState(false);
        isRecognitionActiveRef.current = false;
      } else if (event.error !== 'no-speech') {
        setIsListeningState(false);
        isRecognitionActiveRef.current = false;
      }
    };

    rec.onend = () => {
      isRecognitionActiveRef.current = false;
      setIsListeningState(false);
      // Auto-restart safely if candidate should be speaking
      if (shouldListenRef.current && !isSpeakingRef.current && !isLoadingRef.current) {
        setTimeout(() => {
          safeStartListening();
        }, 300);
      }
    };

    recognitionRef.current = rec;

    return () => {
      try { rec.stop(); } catch (e) {}
    };
  }, []);

  // Preload voices
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
      }
    }
  }, []);

  // Start the interview
  const startInterview = async () => {
    setHasStarted(true);
    setIsLoading(true);
    shouldListenRef.current = false;
    
    try {
      const response = await fetch('/api/chat-v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: [{ role: 'user', content: 'I am ready. Please start the general interview with a brief self-introduction question.' }],
          mode: 'general' 
        })
      });
      const data = await response.json();
      setMessages([{ role: 'assistant', content: data.reply }]);
      speakText(data.reply);
    } catch (e) {
      console.error("Failed to start interview:", e);
      setIsLoading(false);
      const fallbackGreeting = "Welcome! I am your AI Interviewer. To begin our session, could you please introduce yourself and share a brief overview of your background?";
      setMessages([{ role: 'assistant', content: fallbackGreeting }]);
      speakText(fallbackGreeting);
    }
  };

  const speakText = (text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setIsLoading(false);
      shouldListenRef.current = true;
      safeStartListening();
      return;
    }
    
    // Stop microphone while AI is speaking
    shouldListenRef.current = false;
    safeStopListening();
    if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);

    try {
      window.speechSynthesis.cancel();

      setTimeout(() => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        utterance.rate = 1.0;
        utterance.pitch = 1.0;

        utterance.onstart = () => {
          setIsSpeakingState(true);
          setIsLoading(false);
        };

        utterance.onend = () => {
          setIsSpeakingState(false);
          // Reset speech buffers and resume listening for user
          accumulatedSpeechRef.current = '';
          setLiveTranscript('');
          shouldListenRef.current = true;
          setTimeout(() => {
            safeStartListening();
          }, 200);
        };

        utterance.onerror = (e) => {
          console.warn("Speech synthesis error event:", e);
          setIsSpeakingState(false);
          accumulatedSpeechRef.current = '';
          setLiveTranscript('');
          shouldListenRef.current = true;
          safeStartListening();
        };

        window.speechSynthesis.speak(utterance);
      }, 50);
    } catch (err) {
      console.warn("Speech failure:", err);
      setIsSpeakingState(false);
      shouldListenRef.current = true;
      safeStartListening();
    }
  };

  const captureSnapshot = (): string | null => {
    if (!videoRef.current || !canvasRef.current) return null;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    canvas.width = 480;
    canvas.height = 360;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    try {
      return canvas.toDataURL('image/jpeg', 0.6).split(',')[1];
    } catch (e) {
      return null;
    }
  };

  const handleUserCompletedSpeech = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoadingRef.current) return;

    if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
    shouldListenRef.current = false;
    safeStopListening();
    setIsLoading(true);
    setLiveTranscript('');
    accumulatedSpeechRef.current = '';

    const snapshot = captureSnapshot();
    const newMessages = [...messagesRef.current, { role: 'user', content: trimmed } as Message];
    setMessages(newMessages);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25000);

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
    } catch (err: any) {
      console.error("Fetch error:", err);
      setIsLoading(false);
      shouldListenRef.current = true;
      safeStartListening();
      if (err.name === 'AbortError') {
        setErrorMsg("Response timed out. Let's keep moving—please speak your next thought.");
      }
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualInput.trim()) {
      handleUserCompletedSpeech(manualInput.trim());
      setManualInput('');
      setShowTextInput(false);
    }
  };

  const toggleMic = () => {
    setErrorMsg(null);
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach(t => t.enabled = !isAudioEnabled);
    }
    const newAudioState = !isAudioEnabled;
    setIsAudioEnabled(newAudioState);

    if (!newAudioState) {
      shouldListenRef.current = false;
      safeStopListening();
    } else {
      setHasStarted(true);
      shouldListenRef.current = true;
      safeStartListening();
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
      <div className="max-w-7xl w-full mx-auto px-4 flex items-center justify-between mb-4 z-10">
        <Button variant="ghost" onClick={endInterview} className="text-slate-300 hover:text-white hover:bg-slate-800">
          <ArrowLeft className="w-4 h-4 mr-2" /> End Interview
        </Button>
        <h1 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
           <Sparkles className="w-5 h-5 text-indigo-400" /> Virtual Face-to-Face Meeting
        </h1>
        <div className="flex items-center gap-2">
          {hasStarted && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowTextInput(!showTextInput)}
              className="text-xs bg-slate-800 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700"
            >
              <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
              {showTextInput ? 'Hide Chat Input' : 'Type Response'}
            </Button>
          )}
        </div>
      </div>

      {/* Permission Warning Banner with Active Retry */}
      {errorMsg && (
        <div className="max-w-7xl w-full mx-auto px-4 mb-4 z-10 animate-in fade-in">
          <div className="bg-red-500/10 border border-red-500/50 text-red-200 px-4 py-3 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-3">
              <VideoOff className="w-5 h-5 text-red-400 shrink-0" />
              <p className="text-xs md:text-sm font-medium">{errorMsg}</p>
            </div>
            <Button 
              size="sm" 
              onClick={initMedia} 
              className="bg-red-600 hover:bg-red-700 text-white font-semibold text-xs shrink-0 self-end sm:self-auto"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Retry Permissions
            </Button>
          </div>
        </div>
      )}

      {/* Main Split Interface */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 pb-24 flex flex-col md:flex-row gap-6 relative">
        
        {/* User Webcam (Left Pane) */}
        <div className="flex-1 rounded-2xl overflow-hidden bg-black border border-slate-700 shadow-2xl relative min-h-[320px] md:min-h-[460px] flex items-center justify-center">
           <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              className="w-full h-full object-cover transform -scale-x-100" 
           />
           
           {!isCameraReady && (
             <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-800/90 text-slate-400 p-6 text-center">
                <VideoOff className="w-10 h-10 mb-3 opacity-50 text-indigo-400" />
                <p className="font-medium text-white mb-1">Camera Permission Required</p>
                <p className="text-xs text-slate-400 max-w-sm mb-4">Please allow camera and microphone access in your browser to experience the live avatar interview.</p>
                <Button size="sm" onClick={initMedia} className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs">
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Enable Camera & Mic
                </Button>
             </div>
           )}

           {/* User Nameplate & Speech Indicator */}
           <div className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-lg text-white font-medium shadow-md border border-white/10 flex items-center gap-2 text-xs">
             <span>You</span>
             {isListeningState && (
               <span className="flex items-center gap-1 text-emerald-400 text-[11px] font-semibold">
                 <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                 Listening
               </span>
             )}
             {isSpeakingState && (
               <span className="text-indigo-400 text-[11px]">AI Speaking...</span>
             )}
           </div>

           {/* Live Speech Recognition Feedback Pill */}
           {hasStarted && (
             <div className="absolute bottom-4 right-4 max-w-[70%] z-20">
               {liveTranscript ? (
                 <div className="bg-slate-900/95 backdrop-blur-md border border-indigo-500/50 text-white px-3.5 py-2 rounded-xl shadow-2xl flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-2">
                   <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
                   <p className="text-xs text-slate-200 truncate font-mono">
                     "{liveTranscript}"
                   </p>
                   <Button
                     size="sm"
                     onClick={() => handleUserCompletedSpeech(liveTranscript)}
                     className="h-7 px-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shrink-0"
                     title="Click to submit answer immediately"
                   >
                     <Send className="w-3 h-3 mr-1" /> Send
                   </Button>
                 </div>
               ) : isListeningState ? (
                 <div className="bg-black/60 backdrop-blur-md border border-white/10 text-slate-300 px-3 py-1.5 rounded-lg text-[11px] flex items-center gap-2">
                   <Mic className="w-3 h-3 text-emerald-400 animate-pulse" />
                   <span>Speak clearly—listening to your answer...</span>
                 </div>
               ) : null}
             </div>
           )}
        </div>

        {/* AI Server Avatar (Right Pane) */}
        <div className="flex-1 rounded-2xl bg-gradient-to-b from-slate-800 to-slate-900 border border-slate-700 shadow-2xl flex flex-col relative overflow-hidden min-h-[320px] md:min-h-[460px]">
           
           {/* Avatar Canvas */}
           <div className="flex-1 flex items-center justify-center p-8">
              <AIAvatar isSpeaking={isSpeakingState} isListening={isListeningState} />
              <canvas ref={canvasRef} className="hidden" />
           </div>

           {/* AI Coaching HUD */}
           {coachFeedback && (
              <div className="absolute top-4 left-4 right-4 z-20 animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="bg-black/50 backdrop-blur-md border border-white/20 rounded-xl p-3 flex flex-wrap gap-4 text-[10px] font-semibold">
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
                      <span className="text-indigo-300 block mb-0.5 uppercase"> COACH TIP </span>
                      <span className="text-white italic text-[11px]">"{coachFeedback.tip}"</span>
                    </div>
                  )}
                </div>
              </div>
           )}

           {isLoading && (
              <div className="absolute top-4 right-4 bg-indigo-500/30 text-indigo-200 px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-2 backdrop-blur-md border border-indigo-400/30 animate-pulse">
                 <Loader2 className="w-3.5 h-3.5 animate-spin"/> Thinking & Analyzing...
              </div>
           )}

           {/* AI Nameplate */}
           <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg text-white font-medium shadow-md border border-white/10 text-xs">
             AI Interviewer
           </div>

           {/* Subtitles Overlay on AI Side */}
           <div className="absolute bottom-16 left-4 right-4 text-center pointer-events-none">
             {messages.filter(m => m.role === 'assistant').slice(-1).map((msg, idx) => (
                <div key={idx} className="inline-block bg-black/85 backdrop-blur-md text-white px-5 py-3 rounded-2xl max-w-[92%] border border-white/10 shadow-2xl animate-in fade-in slide-in-from-bottom-2">
                   <p className="text-xs md:text-sm leading-relaxed break-words font-medium">{msg.content}</p>
                </div>
             ))}
           </div>
        </div>
      </div>

      {/* Expandable Manual Text Fallback Bar */}
      {showTextInput && hasStarted && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-full max-w-xl px-4 z-50">
          <form onSubmit={handleManualSubmit} className="bg-slate-900/95 backdrop-blur-md p-2 rounded-2xl border border-indigo-500/50 shadow-2xl flex items-center gap-2">
            <Input
              type="text"
              placeholder="Type your answer here if microphone is noisy or unavailable..."
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              className="bg-slate-800 border-none text-white placeholder-slate-400 text-xs focus-visible:ring-indigo-500"
            />
            <Button type="submit" size="sm" disabled={!manualInput.trim() || isLoading} className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-4 shrink-0">
              <Send className="w-3.5 h-3.5 mr-1" /> Submit
            </Button>
          </form>
        </div>
      )}

      {/* Bottom Controls Bar (Google Meet Style) */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 p-2.5 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.6)] z-50 flex items-center gap-3 bg-slate-900/95 backdrop-blur-md border border-slate-700">
        {!hasStarted ? (
          <Button size="lg" onClick={startInterview} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-8 shadow-lg shadow-indigo-600/30 h-12 text-sm font-semibold">
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
               className={`w-11 h-11 rounded-full transition-all flex items-center justify-center ${!isAudioEnabled ? 'bg-red-500 hover:bg-red-600 text-white' : isListeningState ? 'bg-emerald-600 hover:bg-emerald-700 text-white ring-2 ring-emerald-400/50' : 'bg-slate-700 hover:bg-slate-600 border-none text-white'}`}
            >
               {!isAudioEnabled ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </Button>
            
            {/* Video Toggle */}
            <Button 
               size="icon" 
               variant="ghost"
               onClick={toggleVideo}
               title={isVideoEnabled ? "Turn off camera" : "Turn on camera"}
               className={`w-11 h-11 rounded-full transition-all flex items-center justify-center ${!isVideoEnabled ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-slate-700 hover:bg-slate-600 border-none text-white'}`}
            >
               {!isVideoEnabled ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
            </Button>

            {/* Test Voice Button */}
            <Button 
               size="icon" 
               variant="ghost"
               onClick={() => speakText("Voice audio connection is active. I am listening for your answer.")}
               title="Test AI Voice"
               className="w-11 h-11 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white border-none flex items-center justify-center"
            >
               <Volume2 className="w-5 h-5" />
            </Button>

            {/* Manual "Done Speaking" quick submit button */}
            {liveTranscript.trim() && (
              <Button
                size="sm"
                onClick={() => handleUserCompletedSpeech(liveTranscript)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold h-11 px-4 rounded-xl flex items-center gap-1.5 shadow-lg shadow-emerald-600/30 animate-in fade-in"
              >
                <Check className="w-4 h-4" /> Done Speaking
              </Button>
            )}
            
            {/* End Call */}
            <Button 
               size="icon" 
               variant="ghost"
               onClick={endInterview}
               title="Leave call"
               className="w-14 h-11 rounded-2xl bg-red-600 hover:bg-red-700 text-white flex items-center justify-center border-none ml-1"
            >
               <PhoneMissed className="w-5 h-5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
