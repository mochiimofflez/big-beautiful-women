import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import type { UserProfile } from '../types';

type UserMenuProps = {
  user: UserProfile;
  onLogout: () => void;
  onUpdateAvatar: (url: string) => void;
};

export function UserMenu({ user, onLogout, onUpdateAvatar }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // In a real app, upload to storage
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpdateAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 rounded-full border border-brass/20 bg-charcoal p-1 pr-4 hover:border-brass/50 transition"
      >
        <img 
          src={user.avatarUrl || '/default-avatar.png'} 
          alt={user.username}
          className="h-8 w-8 rounded-full object-cover"
        />
        <span className="text-sm text-stone">{user.username}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-2xl border border-brass/10 bg-[#1a1818] p-2 shadow-xl z-50">
          <label className="flex w-full cursor-pointer items-center gap-2 rounded-xl px-4 py-3 text-sm text-stone hover:bg-brass/10">
            <span>Change Picture</span>
            <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </label>
          <Link 
            to={`/Users/${user.username}`}
            className="block w-full rounded-xl px-4 py-3 text-left text-sm text-stone hover:bg-brass/10"
            onClick={() => setIsOpen(false)}
          >
            View Profile
          </Link>
          <button 
            onClick={() => { onLogout(); setIsOpen(false); }}
            className="w-full rounded-xl px-4 py-3 text-left text-sm text-red-300 hover:bg-red-900/20"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
