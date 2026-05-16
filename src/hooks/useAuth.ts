import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { UserProfile } from '../types';

export function useAuth() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // UI State
  const [authMessage, setAuthMessage] = useState('');
  const [inviteInput, setInviteInput] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');

  useEffect(() => {
    // 1. Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // 2. Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        fetchProfile(session.user.id);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (data) {
      setUser(data);
    } else {
      console.error('Profile fetch error:', error);
    }
    setLoading(false);
  }

  const handleSignUp = async (username: string, password: string, email: string) => {
    // Note: This assumes standard Supabase Auth email/password flow.
    // Adjust if you are strictly using usernames.
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } }
    });

    if (error) {
        setAuthMessage(error.message);
        return;
    }
    setUser(data.user as any); // Simplification for migration
  };

  const handleLogin = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
        setAuthMessage(error.message);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return {
    user,
    loading,
    authMessage,
    inviteInput,
    inviteMessage,
    setInviteInput,
    setInviteMessage,
    handleSignUp,
    handleLogin,
    logout,
  };
}
