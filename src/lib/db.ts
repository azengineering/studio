
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

// --- IMPORTANT ---
// These are placeholder Supabase credentials.
// Replace them with your actual Supabase project URL and keys.
// You can find these in your Supabase project's API settings.
const placeholderSupabaseUrl = "https://your-project-id.supabase.co";
const placeholderSupabaseAnonKey = "your-anon-key";
const placeholderSupabaseServiceRoleKey = "your-service-role-key";


const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || placeholderSupabaseUrl;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || placeholderSupabaseAnonKey;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || placeholderSupabaseServiceRoleKey;

if (supabaseUrl === placeholderSupabaseUrl || supabaseAnonKey === placeholderSupabaseAnonKey) {
    console.warn("WARNING: Supabase environment variables are not set. The application is running with placeholder credentials. Please update them in your environment settings.");
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
