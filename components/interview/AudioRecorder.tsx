'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Square, Trash2, Volume2 } from 'lucide-react';

interface AudioRecorderProps {
  onAudioData?: (audioBlob: Blob) => void;
  onTranscript?: (text: string) => void;
  disabled?: boolean;
}

export function AudioRecorder({ onAudioData, onTranscript, disabled }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioURL, setAudioURL] = useState<string>('');
  const [isPlayback, setIsPlayback] = useState(false);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioURL(url);
        onAudioData?.(audioBlob);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Unable to access microphone. Please check your permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const playAudio = () => {
    if (audioRef.current) {
      setIsPlayback(true);
      audioRef.current.play();
    }
  };

  const clearRecording = () => {
    setAudioURL('');
    audioChunksRef.current = [];
  };

  if (isRecording) {
    return (
      <div className="flex gap-3 items-center p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse"></div>
            <span className="text-sm font-semibold text-red-700">Recording...</span>
          </div>
          <p className="text-xs text-red-600">Your microphone is active</p>
        </div>
        <Button
          onClick={stopRecording}
          size="sm"
          variant="destructive"
          className="flex items-center gap-2"
        >
          <Square className="h-4 w-4" />
          Stop
        </Button>
      </div>
    );
  }

  if (audioURL) {
    return (
      <div className="space-y-3">
        <audio
          ref={audioRef}
          src={audioURL}
          onEnded={() => setIsPlayback(false)}
          style={{ display: 'none' }}
        />
        
        <div className="flex gap-3 items-center p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex-1">
            <p className="text-sm font-semibold text-green-700">Audio recorded successfully</p>
            <p className="text-xs text-green-600 mt-1">Click play to preview your recording</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={playAudio}
              size="sm"
              variant="outline"
              disabled={isPlayback}
              className="flex items-center gap-2"
            >
              <Volume2 className="h-4 w-4" />
              {isPlayback ? 'Playing...' : 'Preview'}
            </Button>
            <Button
              onClick={clearRecording}
              size="sm"
              variant="ghost"
              className="flex items-center gap-2 text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
              Clear
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Button
      onClick={startRecording}
      disabled={disabled}
      variant="outline"
      className="w-full flex items-center justify-center gap-2"
    >
      <Mic className="h-4 w-4" />
      Record Audio Answer
    </Button>
  );
}
