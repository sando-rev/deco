import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://njzojocqtouumgazbfso.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5qem9qb2NxdG91dW1nYXpiZnNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4NzU1MTIsImV4cCI6MjA4MzQ1MTUxMn0.U8yQUOUVrQ_zcFOfL2ghzNIBtchUr54Owi_UWRDqdAQ';

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
