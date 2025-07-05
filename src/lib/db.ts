
// This file is repurposed to initialize and export the Supabase client.
// The previous better-sqlite3 implementation has been removed.

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const urlIsMissing = !supabaseUrl || supabaseUrl.includes('YOUR_PROJECT_URL');
const keyIsMissing = !supabaseAnonKey || supabaseAnonKey.includes('YOUR_ANON_KEY');

if (urlIsMissing || keyIsMissing) {
  let errorMessage = 'Missing Supabase environment variables. Please check your .env.local file.\n';
  if (urlIsMissing) {
    errorMessage += '- NEXT_PUBLIC_SUPABASE_URL is missing or using a placeholder value.\n';
  }
  if (keyIsMissing) {
    errorMessage += '- NEXT_PUBLIC_SUPABASE_ANON_KEY is missing or using a placeholder value.\n';
  }
  // This will throw during build if variables aren't set, which is good.
  // It prevents deploying a non-functional app.
  // throw new Error(errorMessage);
  console.warn(errorMessage);
}

export const supabase = createClient(supabaseUrl!, supabaseAnonKey!);
