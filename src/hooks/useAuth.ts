import { useEffect, useState } from 'react';
import type { UserProfile } from '../types';

/** Storage keys for local persistence */
const PROFILES_KEY = 'wbw_user_profiles';
const CURRENT_USER_KEY = 'wbw_current_user';
const INVITE_STORAGE_KEY = 'wbw_invite_code';

/**
 * Loads all known user profiles from local storage.
 */
function loadProfiles(): UserProfile[] {
  if (typeof window === 'undefined') return [];
  const raw = window.localStorage.getItem(PROFILES_KEY);
  return raw ? JSON.parse(raw) : [];
}

/**
 * Persists user profiles to local storage.
 */
function saveProfiles(profiles: UserProfile[]) {
  window.localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
}

/**
 * Retrieves the username of the currently logged-in user.
 */
function loadCurrentUsername(): string | null {
  return typeof window === 'undefined' ? null : window.localStorage.getItem(CURRENT_USER_KEY);
}

/**
 * Saves or clears the current session's username.
 */
function saveCurrentUsername(username: string | null) {
  if (typeof window === 'undefined') return;
  if (username) {
    window.localStorage.setItem(CURRENT_USER_KEY, username);
  } else {
    window.localStorage.removeItem(CURRENT_USER_KEY);
  }
}

/**
 * custom hook managing authentication, session state, and diegetic access control.
 * 
 * Features:
 * - LocalStorage persistence for user profiles and sessions.
 * - Automatic "GM" role assignment for the first user created.
 * - Invite-code based "unlocking" of restricted wiki sections.
 */
export function useAuth() {
  const [profiles, setProfiles] = useState<UserProfile[]>(() => loadProfiles());
  const [user, setUser] = useState<UserProfile | null>(() => {
    const currentUsername = loadCurrentUsername();
    if (!currentUsername) return null;
    return loadProfiles().find((profile) => profile.username === currentUsername) ?? null;
  });
  
  // UI State
  const [showLogin, setShowLogin] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [authMessage, setAuthMessage] = useState('');
  const [inviteInput, setInviteInput] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');
  
  // Invite System State
  const [inviteCode, setInviteCode] = useState(() => (typeof window !== 'undefined' ? window.localStorage.getItem(INVITE_STORAGE_KEY) ?? '' : ''));

  // Synchronization with LocalStorage
  useEffect(() => {
    saveProfiles(profiles);
  }, [profiles]);

  useEffect(() => {
    saveCurrentUsername(user?.username ?? null);
  }, [user]);

  /** Toggles the visibility of the login modal */
  const toggleLoginForm = () => {
    setShowLogin((value) => !value);
    setAuthMessage('');
  };

  /**
   * Processes login or registration.
   * If the username doesn't exist, a new profile is created.
   * The first registered user is automatically granted 'gm' status.
   */
  const handleLogin = () => {
    if (!username || !password) {
      setAuthMessage('Both handle and secret phrase are required.');
      return;
    }

    const existing = profiles.find((profile) => profile.username === username);
    if (existing) {
      if (existing.password !== password) {
        setAuthMessage('Incorrect secret phrase.');
        return;
      }
      setUser(existing);
      setShowLogin(false);
      setAuthMessage('');
      return;
    }

    // Diegetic Role Assignment: The first person to access the terminal is the GM
    const role = profiles.length === 0 ? 'gm' : 'reader';
    const profile: UserProfile = {
      username,
      password,
      role,
      unlockedWikis: [],
    };
    setProfiles((current) => [...current, profile]);
    setUser(profile);
    setShowLogin(false);
    setAuthMessage('');
  };

  /** Clears the current session */
  const logout = () => {
    setUser(null);
    setShowLogin(false);
    setAuthMessage('');
  };

  /**
   * Generates a random invite code to be shared with players.
   * This is part of the worldbuilding, representing "clearance codes" or "access keys".
   */
  const generateInviteCode = (wikiId: string) => {
    const code = `${wikiId.toUpperCase().slice(0, 3)}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    window.localStorage.setItem(INVITE_STORAGE_KEY, code);
    setInviteCode(code);
    setInviteMessage(`Invite code generated: ${code}`);
    return code;
  };

  /**
   * Unlocks a specific wiki section for the current user using an invite code.
   * Simulates the process of gaining clearance to redacted files.
   */
  const unlockWiki = (wikiId: string) => {
    if (!user) {
      setInviteMessage('You must sign in before unlocking a gated wiki.');
      return false;
    }

    const stored = window.localStorage.getItem(INVITE_STORAGE_KEY);
    if (!stored) {
      setInviteMessage('No invite code has been generated yet.');
      return false;
    }

    if (inviteInput.trim().toUpperCase() !== stored) {
      setInviteMessage('That invite code does not match.');
      return false;
    }

    if (user.unlockedWikis.includes(wikiId)) {
      setInviteMessage('This wiki is already unlocked.');
      return true;
    }

    const updatedUser = { ...user, unlockedWikis: [...user.unlockedWikis, wikiId] };
    setUser(updatedUser);
    setProfiles((current) => current.map((profile) => (profile.username === updatedUser.username ? updatedUser : profile)));
    setInviteMessage('The archive has been unlocked.');
    setInviteInput('');
    return true;
  };

  return {
    user,
    showLogin,
    username,
    password,
    inviteInput,
    inviteMessage,
    inviteCode,
    authMessage,
    unlockedWikis: user?.unlockedWikis ?? [],
    isGM: user?.role === 'gm',
    setUsername,
    setPassword,
    setInviteInput,
    setInviteMessage,
    toggleLoginForm,
    handleLogin,
    logout,
    generateInviteCode,
    unlockWiki,
    setAuthMessage,
  };
}
