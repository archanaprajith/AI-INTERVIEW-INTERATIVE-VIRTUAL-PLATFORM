import React from 'react';
import { VirtualRoom } from '@/components/lobby/VirtualRoom';

export default function LobbyPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-200">
      <VirtualRoom />
    </div>
  );
}
