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
  role: 'admin',
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
      try {
        const { data: remoteProfiles, error } = await supabase.from('profiles').select('*');
        if (!error && remoteProfiles) {
          initialProfiles = remoteProfiles;
        } else {
          console.warn('Supabase profile load failed:', error);
          const raw = window.localStorage.getItem(PROFILES_KEY);
          initialProfiles = raw ? JSON.parse(raw) : [];
        }
      } catch (e) {
        const raw = window.localStorage.getItem(PROFILES_KEY);
        initialProfiles = raw ? JSON.parse(raw) : [];
      }

      // Ensure SYSTEM is always present
      if (!initialProfiles.find(p => p.username.toLowerCase() === 'system')) {
        initialProfiles.push(SYSTEM_PROFILE);
      }
      setProfiles(initialProfiles);

      // 2. Load current session
      const currentUsername = window.localStorage.getItem(CURRENT_USER_KEY);
      if (currentUsername) {
        const found = initialProfiles.find(p => p.username.toLowerCase() === currentUsername.toLowerCase());    
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
    const lowerUsername = username.trim().toLowerCase();

    if (!lowerUsername || !password) {
      setAuthMessage('Both handle and secret phrase are required.');
      return;
    }

    const existing = profiles.find((profile) => profile.username.toLowerCase() === lowerUsername);

    // SIGN IN Flow
    if (authMode === 'signin') {
      if (lowerUsername === 'system' && password === SYSTEM_PROFILE.password) {
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

    console.log('Validating invite code:', inviteInput.trim().toUpperCase());
    const isValid = await validateInviteCode(inviteInput.trim().toUpperCase(), 'SITE');
    if (!isValid) {
      console.log('Invite code validation failed');
      setAuthMessage('A valid Access Key is required to establish a new profile record.');
      return;
    }

    // Mark code as used
    console.log('Marking code as used');
    const { error: updateError } = await supabase.from('invite_codes').update({ used: true }).eq('code', inviteInput.trim().toUpperCase());
    if (updateError) {
        console.error('Error marking code as used:', updateError);
    }

    const newProfile: UserProfile = {
      username: username.trim(),
      password,
      role: 'reader',
      unlockedWikis: [],
    };

    console.log('New profile to create:', newProfile);
    const updatedProfiles = [...profiles, newProfile];
    setProfiles(updatedProfiles);
    window.localStorage.setItem(PROFILES_KEY, JSON.stringify(updatedProfiles));
    console.log('Profiles updated in state and localStorage');

    // Automatically log in
    setUser(newProfile);
    window.localStorage.setItem(CURRENT_USER_KEY, newProfile.username);
    console.log('User state set and session persisted');
    setShowLogin(false);
    setAuthMessage('');
    setInviteInput('');
  };

  const logout = () => {
    setUser(null);
    window.localStorage.removeItem(CURRENT_USER_KEY);
    setShowLogin(true);
    setAuthMessage('');
  };

  const generateInviteCode = async (wikiId: string) => {
    if (user?.role !== 'admin') {
        setInviteMessage('Access denied: Admin role required.');
        return;
    }
    const code = wikiId.toUpperCase().slice(0, 3) + '-' + Math.random().toString(36).slice(2, 8).toUpperCase();
    const { error } = await supabase.from('invite_codes').insert([{ code, wiki_id: wikiId }]);
    if (error) {
        console.error('Supabase invite generation error:', error);
        setInviteMessage('Failed to generate invite code: ' + error.message);
        return;
    }
    setInviteMessage('Access Key generated: ' + code);
    return code;
  };

  const validateInviteCode = async (code: string, wikiId: string) => {
      console.log('Validating code:', code, 'for wiki:', wikiId);
      const { data, error } = await supabase.from('invite_codes').select('*').eq('code', code).eq('wiki_id', wikiId).single();
      if (error) {
          console.error('Supabase validation error:', error);
          setInviteMessage('Database error checking key.');
          return false;
      }
      if (!data || data.used || new Date(data.expires_at) < new Date()) {
          console.log('Validation failed:', { data, expired: data ? new Date(data.expires_at) < new Date() : 'n/a' });
          setInviteMessage('Invalid or expired Access Key.');
          return false;
      }
      return true;
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
    setProfiles((current) => current.map((profile) => (profile.username.toLowerCase() === updatedUser.username.toLowerCase() ? updatedUser : profile)));
    setInviteMessage('Archive clearance granted.');
    setInviteInput('');
    return true;
  };

  const updateAvatar = (url: string) => {
    if (!user) return;
    const updatedUser = { ...user, avatarUrl: url };
    setUser(updatedUser);
    const savedProfiles = JSON.parse(window.localStorage.getItem(PROFILES_KEY) || '[]');
    const updatedProfiles = savedProfiles.map((p: UserProfile) => p.username.toLowerCase() === updatedUser.username.toLowerCase() ? updatedUser : p);
    window.localStorage.setItem(PROFILES_KEY, JSON.stringify(updatedProfiles));
  };

  return {
    user,
    loading,
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
    validateInviteCode,
    unlockWiki,
    updateAvatar,
    setAuthMessage,
  };
}
