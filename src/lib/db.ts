// This file is repurposed to initialize and export the Supabase client.
// The previous better-sqlite3 implementation has been removed.

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('YOUR_PROJECT_URL') || supabaseAnonKey.includes('YOUR_ANON_KEY')) {
  throw new Error('Missing or placeholder Supabase environment variables. Please check your .env.local file and ensure you have replaced the placeholder values with your actual Supabase credentials.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
