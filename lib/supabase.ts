import { createClient } from '@supabase/supabase-js';

// Helper to safely access environment variables in different environments (Vite, CRA, etc.)
const getEnv = (key: string) => {
  // Try import.meta.env (Vite)
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
      // @ts-ignore
      return import.meta.env[key];
    }
  } catch (e) {
    // Ignore error if import.meta is not defined
  }

  // Try process.env (CRA / Node)
  try {
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      return process.env[key];
    }
  } catch (e) {
    // Ignore error
  }

  return undefined;
};

const supabaseUrl = 
  getEnv('REACT_APP_SUPABASE_URL') || 
  getEnv('VITE_SUPABASE_URL') || 
  getEnv('SUPABASE_URL');

const supabaseKey = 
  getEnv('REACT_APP_SUPABASE_ANON_KEY') || 
  getEnv('VITE_SUPABASE_ANON_KEY') || 
  getEnv('SUPABASE_ANON_KEY');

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase URL or Key is missing. Please check your environment configuration.');
}

// To avoid "supabaseUrl is required" error crashing the app, provide a fallback.
// API calls will fail, but the app will render.
const url = supabaseUrl || 'https://placeholder.supabase.co';
const key = supabaseKey || 'placeholder';

export const supabase = createClient(url, key);
