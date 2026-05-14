import { createClient } from '@supabase/supabase-js';

// These should be replaced with your actual Supabase URL and Anon Key
// For GitHub Pages, you can set these as environment variables in your build process
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase configuration. Please check your .env file.');
}

/**
 * The Supabase client for persistent, cross-device data storage.
 * 
 * Setup Instructions:
 * 1. Create a Supabase project.
 * 2. Create 'profiles', 'campaigns', and 'articles' tables.
 * 3. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your deployment environment.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
