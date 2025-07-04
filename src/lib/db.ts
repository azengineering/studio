
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
  throw new Error('Supabase environment variables are not set. Please check your .env.local file.');
}

// Public client for use in browser with RLS
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Admin client for use in server-side functions with elevated privileges (bypasses RLS)
export const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export const handleSupabaseError = (
  { error, data }: { error: any, data: any },
  entityName: string
) => {
  if (error) {
    console.error(`Error with ${entityName}:`, error.message);
    throw new Error(`Failed to perform operation on ${entityName}.`);
  }
  return data;
};
