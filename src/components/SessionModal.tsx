import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';

export function SessionModal({ onKeepSession }: { onKeepSession: () => void }) {
  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#0d0b0b] border border-brass/20 p-8 rounded-3xl text-center shadow-2xl">
        <h2 className="text-xl text-amber-100 mb-4 uppercase tracking-widest">Are you still reading?</h2>
        <p className="text-stone/70 mb-8 text-sm">Your session is about to expire due to inactivity.</p>
        <button 
          onClick={onKeepSession}
          className="bg-brass text-charcoal px-8 py-3 rounded-full font-bold uppercase text-xs tracking-widest hover:bg-amber-300 transition"
        >
          Yes, continue reading
        </button>
      </div>
    </div>
  );
}
