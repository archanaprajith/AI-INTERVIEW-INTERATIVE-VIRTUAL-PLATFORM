"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MessageSquare, Bot, Code, Briefcase, Video, FileText, Globe, UserCheck, Sparkles, Plus, Calendar, FileSearch } from 'lucide-react';

const ROOM_WIDTH = 800;
const ROOM_HEIGHT = 600;
const PLAYER_SIZE = 40;
const NPC_SIZE = 50;
const SPEED = 5;

// Define the 4 core modules as specialized NPCs
const NPCS = [
  { id: 'chat', x: 150, y: 150, name: 'AI Chat Bot', color: 'from-blue-400 to-indigo-500', icon: MessageSquare, route: '/chat', label: 'Conversational Chat' },
  { id: 'topic', x: 650, y: 150, name: 'Topic Master', color: 'from-emerald-400 to-green-600', icon: Plus, route: '/interview/setup', label: 'Structured practice' },
  { id: 'face-to-face', x: 150, y: 400, name: 'Avatar Interviewer', color: 'from-cyan-500 to-blue-600', icon: Video, route: '/virtual-interview', label: 'Real-time AI Video' },
  { id: 'resume', x: 650, y: 400, name: 'Resume Analyst', color: 'from-purple-500 to-rose-600', icon: FileSearch, route: '/resume', label: 'ATS Checker' },
];

export function VirtualRoom() {
  const router = useRouter();
  
  // Game state
  const [playerX, setPlayerX] = useState(ROOM_WIDTH / 2);
  const [playerY, setPlayerY] = useState(ROOM_HEIGHT - 100);
  const [facing, setFacing] = useState('down');
  
  // Interaction state
  const [nearbyNPC, setNearbyNPC] = useState<any>(null);

  // Input state refs (to avoid stale closures in requestAnimationFrame)
  const keys = useRef<{ [key: string]: boolean }>({});
  const posRef = useRef({ x: ROOM_WIDTH / 2, y: ROOM_HEIGHT - 100 });
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keys.current[e.key] = true;
      e.preventDefault(); // prevent scrolling
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      keys.current[e.key] = false;
    };

    window.addEventListener('keydown', handleKeyDown, { passive: false });
    window.addEventListener('keyup', handleKeyUp);

    let animationFrameId: number;

    const gameLoop = () => {
      let dx = 0;
      let dy = 0;

      if (keys.current['ArrowUp'] || keys.current['w'] || keys.current['W']) { dy -= SPEED; setFacing('up'); }
      if (keys.current['ArrowDown'] || keys.current['s'] || keys.current['S']) { dy += SPEED; setFacing('down'); }
      if (keys.current['ArrowLeft'] || keys.current['a'] || keys.current['A']) { dx -= SPEED; setFacing('left'); }
      if (keys.current['ArrowRight'] || keys.current['d'] || keys.current['D']) { dx += SPEED; setFacing('right'); }

      if (dx !== 0 || dy !== 0) {
        // Normalize diagonal speed
        if (dx !== 0 && dy !== 0) {
          const length = Math.sqrt(dx * dx + dy * dy);
          dx = (dx / length) * SPEED;
          dy = (dy / length) * SPEED;
        }

        // Apply movement with bounds checking
        let newX = posRef.current.x + dx;
        let newY = posRef.current.y + dy;

        newX = Math.max(0, Math.min(newX, ROOM_WIDTH - PLAYER_SIZE));
        newY = Math.max(0, Math.min(newY, ROOM_HEIGHT - PLAYER_SIZE));

        posRef.current = { x: newX, y: newY };
        setPlayerX(newX);
        setPlayerY(newY);

        // Check for nearby NPCs
        let foundNearby = null;
        for (const npc of NPCS) {
          const dist = Math.hypot(
            (npc.x + NPC_SIZE/2) - (newX + PLAYER_SIZE/2),
            (npc.y + NPC_SIZE/2) - (newY + PLAYER_SIZE/2)
          );
          if (dist < 80) { // proximity threshold
            foundNearby = npc;
            break;
          }
        }
        setNearbyNPC(foundNearby);
      }

      // Check interaction
      if (keys.current['Enter'] || keys.current[' ']) {
        if (nearbyNPC) {
          router.push(nearbyNPC.route);
          keys.current['Enter'] = false; // debounce
          keys.current[' '] = false;
        }
      }

      animationFrameId = requestAnimationFrame(gameLoop);
    };

    animationFrameId = requestAnimationFrame(gameLoop);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      cancelAnimationFrame(animationFrameId);
    };
  }, [router, nearbyNPC]);

  return (
    <div className="flex flex-col items-center justify-center p-4 min-h-screen bg-slate-50">
      <div className="w-full max-w-4xl mb-4 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Virtual Lobby</h1>
          <p className="text-slate-500">Use WASD or Arrow Keys to walk around. Walk to an AI desk to interact.</p>
        </div>
        <Button variant="outline" onClick={() => router.push('/')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>
      </div>

      <Card className="relative overflow-hidden border-2 border-slate-200 shadow-xl bg-white" 
            style={{ width: ROOM_WIDTH, height: ROOM_HEIGHT, backgroundSize: '40px 40px', backgroundImage: 'radial-gradient(#e2e8f0 1px, transparent 1px)' }}>
        
        {/* Render NPCs */}
        {NPCS.map(npc => {
          const Icon = npc.icon;
          const isNearby = nearbyNPC?.id === npc.id;
          return (
            <div 
              key={npc.id}
              className={`absolute flex flex-col items-center justify-center transition-all duration-300 ${isNearby ? 'scale-110 z-10' : 'z-0 opacity-90'}`}
              style={{ left: npc.x, top: npc.y, width: NPC_SIZE + 10, height: NPC_SIZE + 10 }}
            >
              <div className={`w-full h-full rounded-2xl bg-gradient-to-br ${npc.color} shadow-lg flex items-center justify-center text-white ring-4 ring-white/50 relative group`}>
                <Icon size={28} className={isNearby ? 'animate-pulse' : ''} />
                {isNearby && <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white animate-bounce" />}
              </div>
              <div className={`mt-3 flex flex-col items-center transition-opacity duration-300 ${isNearby ? 'opacity-100' : 'opacity-70'}`}>
                <span className="bg-slate-900 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider mb-1">
                  {npc.name}
                </span>
                <span className="text-[9px] text-slate-500 font-medium bg-white/80 px-2 rounded-md shadow-sm border border-slate-100 whitespace-nowrap">
                  {npc.label}
                </span>
              </div>
            </div>
          );
        })}

        {/* Render Player Avatar */}
        <div 
          className="absolute z-20 flex items-center justify-center w-10 h-10 bg-slate-800 rounded-full shadow-lg border-2 border-white transition-transform duration-75"
          style={{ 
            left: playerX, 
            top: playerY,
          }}
        >
          {/* A simple indicator for facing direction */}
          <div className={`absolute bg-white rounded-full ${facing === 'up' ? 'top-1 w-4 h-1' : facing === 'down' ? 'bottom-1 w-4 h-1' : facing === 'left' ? 'left-1 w-1 h-4' : 'right-1 w-1 h-4'}`} />
        </div>

            {/* Interaction Prompt */}
            {nearbyNPC && (
              <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-30 animate-fade-in-up">
                <div className="glass px-10 py-5 rounded-3xl premium-shadow flex flex-col items-center gap-4 min-w-[320px]">
                  <div className="flex items-center gap-4">
                    <div className={`p-4 rounded-2xl bg-gradient-to-br ${nearbyNPC.color} text-white shadow-lg`}>
                      {React.createElement(nearbyNPC.icon || MessageSquare, { className: "w-8 h-8" })}
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-slate-900 leading-tight">
                        {nearbyNPC.name}
                      </h3>
                      <p className="text-slate-500 font-medium">Ready to start?</p>
                    </div>
                  </div>
                  
                  <div className="w-full h-[1px] bg-slate-100 my-2" />
                  
                  <p className="text-center text-slate-600 font-medium italic">
                    "Welcome! I can help you with {nearbyNPC.label.toLowerCase()}."
                  </p>
                  
                  <Button 
                    onClick={() => router.push(nearbyNPC.route || '/')}
                    className={`w-full h-14 rounded-2xl bg-gradient-to-r ${nearbyNPC.color} hover:scale-105 transition-all text-lg font-bold shadow-xl`}
                  >
                    Start {nearbyNPC.name}
                  </Button>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-tighter">
                    Press <span className="px-2 py-0.5 bg-slate-100 rounded border border-slate-200">ENTER</span> to quick start
                  </p>
                </div>
              </div>
            )}

            {/* Room Header Overlay */}
            <div className="absolute top-8 left-8 z-30 animate-fade-in-up">
              <div className="glass px-6 py-4 rounded-2xl flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-black">
                  U
                </div>
                <div>
                  <h2 className="font-black text-slate-900 leading-none">Virtual Lobby</h2>
                  <p className="text-xs text-slate-500 font-bold mt-1 uppercase tracking-widest flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Professional Suite Active
                  </p>
                </div>
              </div>
            </div>

            {/* Back to Dashboard */}
            <button
              onClick={() => router.push('/dashboard')}
              className="absolute top-8 right-8 z-30 glass w-12 h-12 rounded-2xl flex items-center justify-center text-slate-600 hover:text-indigo-600 hover:scale-110 transition-all shadow-lg"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
      </Card>
      
      <div className="mt-6 flex gap-4 text-sm text-slate-500">
        <div className="flex items-center gap-2"><kbd className="px-2 py-1 bg-white border rounded">W A S D</kbd> to move</div>
        <div className="flex items-center gap-2"><kbd className="px-2 py-1 bg-white border rounded">SPACE</kbd> to talk</div>
      </div>
    </div>
  );
}
