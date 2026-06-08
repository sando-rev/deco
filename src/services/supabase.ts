import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://hjbzknaionxkdkiowcch.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqYnprbmFpb254a2RraW93Y2NoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxNjgxMjAsImV4cCI6MjA4ODc0NDEyMH0.WRE11VHC7-6QJNaPgg-9miDGceDxDmGqPL45-fhI6Ic';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  db: {
    schema: 'deco',
  },
});

// Helper for auth operations (always uses public schema)
export const supabaseAuth = supabase.auth;
