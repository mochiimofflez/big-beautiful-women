import { createClient } from '@supabase/supabase-js';
import { SUPABASE_CONFIG } from './config';

/**
 * The Supabase client for persistent, cross-device data storage.
 */
export const supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
