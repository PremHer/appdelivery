import { createClient } from '@supabase/supabase-js';

export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ffplqtpeclgbkqfjwuvq.supabase.co';
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmcGxxdHBlY2xnYmtxZmp3dXZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1NTkyMjAsImV4cCI6MjA4NTEzNTIyMH0.RZsrQSrbeR-Oc0uzCL1xwfR7qhz_Z4zmlKVTI80NJgk';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
