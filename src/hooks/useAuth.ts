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
      .maybeSingle();

    if (error) {
      console.error('Profile fetch error:', error);
    } else if (data) {
      setUser({
          ...data,
          avatarUrl: data.avatar_url,
          unlockedWikis: data.unlocked_wikis || []
      });
    } else {
      console.warn('No profile found for user:', userId);
      setUser(null);
    }
    setLoading(false);
  }

  const handleSignUp = async (username: string, password: string, email: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } }
    });

    if (error) {
        console.error('Supabase Auth error:', error);
        setAuthMessage(error.message);
        return;
    }

    if (data.user) {
        console.log('User created, attempting profile insert...');
        const { error: profileError } = await supabase
            .from('profiles')
            .insert([
                { id: data.user.id, username, email, role: 'reader' }
            ]);

        if (profileError) {
            console.error('Profile insert error:', profileError);
            setAuthMessage('Database error creating new user profile: ' + profileError.message);
            return;
        }
        console.log('Profile created successfully!');
        setUser(data.user as any); 
    }
  };

  const handleLogin = async (handleOrEmail: string, password: string) => {
    let emailToUse = handleOrEmail;

    // If it doesn't look like an email, try to resolve username to email
    if (!handleOrEmail.includes('@')) {
        console.log('Resolving handle to email:', handleOrEmail);
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('email')
            .eq('username', handleOrEmail)
            .maybeSingle();

        if (profileError) {
            console.error('Handle resolution database error:', profileError);
            setAuthMessage('Database error during lookup.');
            return;
        }

        if (profile?.email) {
            emailToUse = profile.email;
        } else {
            // If no profile with that username exists, we still try to login as email
            // just in case it's a weird email format, but usually this means handle not found
            console.warn('No email found for handle:', handleOrEmail);
        }
    }

    console.log('Attempting login for:', emailToUse);
    const { error } = await supabase.auth.signInWithPassword({ email: emailToUse, password });
    
    if (error) {
        console.error('Supabase Login Error:', error);
        setAuthMessage(error.message);
    } else {
        setAuthMessage('');
        console.log('Login successful');
    }
  };
  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
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

  const redeemInviteCode = async (code: string) => {
    if (!user) return;
    const { data: invite, error: iError } = await supabase
        .from('invite_codes')
        .select('wiki_id')
        .eq('code', code.toUpperCase())
        .single();
    
    if (iError || !invite) {
        setInviteMessage('Invalid access key.');
        return;
    }

    const { error } = await supabase
        .from('campaign_members')
        .insert([{ user_id: user.id, wiki_id: invite.wiki_id }]);
    
    if (error) {
        setInviteMessage('Failed to join campaign: ' + error.message);
    } else {
        setInviteMessage('Successfully joined campaign!');
    }
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
    generateInviteCode,
    redeemInviteCode,
  };
}
