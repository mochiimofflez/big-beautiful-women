import { useState } from 'react';

type SettingsProps = {
  isOpen: boolean;
  onClose: () => void;
  settings: { disableAnimations: boolean };
  onUpdate: (settings: { disableAnimations: boolean }) => void;
};

export function Settings({ isOpen, onClose, settings, onUpdate }: SettingsProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl border border-brass/10 bg-[#0d0b0b] p-8 shadow-library animate-in zoom-in-95 duration-200">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-amber-100">Explorer Settings</h2>
          <button onClick={onClose} className="text-stone/50 hover:text-red-400 transition-colors">✕</button>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 rounded-2xl bg-charcoal/50 border border-brass/5">
            <div>
              <div className="text-sm font-bold text-stone">Reduce Motion</div>
              <div className="text-[10px] text-stone/40 uppercase tracking-widest mt-1">Disables interface flourishes</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={settings.disableAnimations} 
                onChange={() => onUpdate({ ...settings, disableAnimations: !settings.disableAnimations })} 
              />
              <div className="w-11 h-6 bg-[#151313] border border-brass/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-brass after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-900/40" />
            </label>
          </div>
          
          <div className="p-4 rounded-2xl bg-charcoal/50 border border-brass/5">
            <div className="text-sm font-bold text-stone">Interface Version</div>
            <div className="text-[10px] text-stone/40 uppercase tracking-widest mt-1">v0.2.0-beta (Explorer Overhaul)</div>
          </div>
        </div>

        <button 
          onClick={onClose}
          className="mt-8 w-full p-4 rounded-2xl bg-brass text-charcoal font-bold text-sm uppercase tracking-widest hover:bg-amber-400 transition-colors"
        >
          Confirm Configuration
        </button>
      </div>
    </div>
  );
}
