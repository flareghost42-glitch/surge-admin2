import { createClient } from '@supabase/supabase-js';

// Support various environment variable naming conventions
const supabaseUrl = 
  process.env.REACT_APP_SUPABASE_URL || 
  process.env.VITE_SUPABASE_URL || 
  process.env.SUPABASE_URL;

const supabaseKey = 
  process.env.REACT_APP_SUPABASE_ANON_KEY || 
  process.env.VITE_SUPABASE_ANON_KEY || 
  process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase URL or Key is missing. Ensure you have configured your environment variables.');
}

export const supabase = createClient(supabaseUrl || '', supabaseKey || '');