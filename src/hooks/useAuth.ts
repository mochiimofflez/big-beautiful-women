import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { UserProfile } from '../types';

/** Storage keys for local persistence (Fallback) */
const PROFILES_KEY = 'wbw_user_profiles';
const CURRENT_USER_KEY = 'wbw_current_user';
const INVITE_STORAGE_KEY = 'wbw_invite_code';

const SYSTEM_PROFILE: UserProfile = {
  username: 'SYSTEM',
  password: '7rE31]Q}DJ^Pa#b~(L8',
  role: 'gm',
  unlockedWikis: ['all'],
};

export function useAuth() {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // UI State
  const [showLogin, setShowLogin] = useState(true);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [authMessage, setAuthMessage] = useState('');
  const [inviteInput, setInviteInput] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');
  const [inviteCode, setInviteCode] = useState('');

  // Initialize data
  useEffect(() => {
    async function initAuth() {
      setLoading(true);

      // 1. Load profiles (Try Supabase, then localStorage)
      let initialProfiles: UserProfile[] = [];
      const { data: remoteProfiles } = await supabase.from('profiles').select('*');

      if (remoteProfiles && remoteProfiles.length > 0) {
        initialProfiles = remoteProfiles;
      } else {
        const raw = window.localStorage.getItem(PROFILES_KEY);
        initialProfiles = raw ? JSON.parse(raw) : [];
      }

      // Ensure SYSTEM is always present
      if (!initialProfiles.find(p => p.username === 'SYSTEM')) {
        initialProfiles.push(SYSTEM_PROFILE);
      }
      setProfiles(initialProfiles);

      // 2. Load current session
      const currentUsername = window.localStorage.getItem(CURRENT_USER_KEY);
      if (currentUsername) {
        const found = initialProfiles.find(p => p.username === currentUsername);
        if (found) setUser(found);
      }

      // 3. Load invite code
      const storedInvite = window.localStorage.getItem(INVITE_STORAGE_KEY);
      if (storedInvite) setInviteCode(storedInvite);

      setLoading(false);
    }

    initAuth();
  }, []);

  const toggleLoginForm = (mode: 'signin' | 'signup' = 'signin') => {
    setAuthMode(mode);
    setShowLogin((value) => !value);
    setAuthMessage('');
  };

  const handleLogin = async () => {
    if (!username || !password) {
      setAuthMessage('Both handle and secret phrase are required.');
      return;
    }

    const existing = profiles.find((profile) => profile.username === username);

    // SIGN IN Flow
    if (authMode === 'signin') {
      if (username === 'SYSTEM' && password === SYSTEM_PROFILE.password) {
        const { data: existingRemote } = await supabase.from('profiles').select('*').eq('username', 'SYSTEM').single();
        if (!existingRemote) {
          await supabase.from('profiles').insert([SYSTEM_PROFILE]);
        }
        setUser(SYSTEM_PROFILE);
        window.localStorage.setItem(CURRENT_USER_KEY, SYSTEM_PROFILE.username);
        setShowLogin(false);
        setAuthMessage('');
        return;
      }
      if (!existing) {
        setAuthMessage('No record found for this handle.');
        return;
      }
      if (existing.password !== password) {
        setAuthMessage('Incorrect secret phrase.');
        return;
      }
      setUser(existing);
      window.localStorage.setItem(CURRENT_USER_KEY, existing.username);
      setShowLogin(false);
      setAuthMessage('');
      return;
    }

    // SIGN UP Flow
    if (existing) {
      setAuthMessage('This handle is already recorded in the archive.');
      return;
    }

    const storedInvite = window.localStorage.getItem(INVITE_STORAGE_KEY);
    if (!storedInvite || inviteInput.trim().toUpperCase() !== storedInvite) {
      setAuthMessage('A valid Access Key is required to establish a new profile record.');
      return;
    }

    const newProfile: UserProfile = {
      username,
      password,
      role: 'reader',
      unlockedWikis: [],
    };

    const { error } = await supabase.from('profiles').insert([newProfile]);
    if (error) {
      console.warn('Supabase save failed:', error);
    }

    const updatedProfiles = [...profiles, newProfile];
    setProfiles(updatedProfiles);
    window.localStorage.setItem(PROFILES_KEY, JSON.stringify(updatedProfiles));

    setUser(newProfile);
    window.localStorage.setItem(CURRENT_USER_KEY, newProfile.username);
    setShowLogin(false);
    setAuthMessage('');
    setInviteInput('');
  };

  const logout = () => {
    setUser(null);
    setShowLogin(true);
    setAuthMessage('');
  };

  const generateInviteCode = (wikiId: string) => {
    const code = wikiId.toUpperCase().slice(0, 3) + '-' + Math.random().toString(36).slice(2, 8).toUpperCase(); 
    window.localStorage.setItem(INVITE_STORAGE_KEY, code);
    setInviteCode(code);
    setInviteMessage('Access Key generated: ' + code);
    return code;
  };

  const unlockWiki = (wikiId: string) => {
    if (!user) {
      setInviteMessage('Sign-in required to unlock archive sections.');
      return false;
    }
    const stored = window.localStorage.getItem(INVITE_STORAGE_KEY);
    if (!stored || inviteInput.trim().toUpperCase() !== stored) {
      setInviteMessage('Invalid Access Key.');
      return false;
    }
    if (user.unlockedWikis.includes(wikiId)) {
      setInviteMessage('This section is already accessible.');
      return true;
    }
    const updatedUser = { ...user, unlockedWikis: [...user.unlockedWikis, wikiId] };
    setUser(updatedUser);
    setProfiles((current) => current.map((profile) => (profile.username === updatedUser.username ? updatedUser : profile)));
    setInviteMessage('Archive clearance granted.');
    setInviteInput('');
    return true;
  };

  const updateAvatar = (url: string) => {
    if (!user) return;
    const updatedUser = { ...user, avatarUrl: url };
    setUser(updatedUser);
    const savedProfiles = JSON.parse(window.localStorage.getItem(PROFILES_KEY) || '[]');
    const updatedProfiles = savedProfiles.map((p: UserProfile) => p.username === updatedUser.username ? updatedUser : p);
    window.localStorage.setItem(PROFILES_KEY, JSON.stringify(updatedProfiles));
  };

  return {
    user,
    showLogin,
    authMode,
    username,
    password,
    inviteInput,
    inviteMessage,
    inviteCode,
    authMessage,
    unlockedWikis: user?.unlockedWikis ?? [],
    isGM: user?.role === 'gm',
    isGuest: user?.role === 'guest',
    setUsername,
    setPassword,
    setInviteInput,
    setInviteMessage,
    setAuthMode,
    toggleLoginForm,
    handleLogin,
    logout,
    generateInviteCode,
    unlockWiki,
    updateAvatar,
    setAuthMessage,
  };
}
