import { createClient } from '@supabase/supabase-js';
import { env } from './env';
import type { Database } from '../types/database';

// Cliente para operaciones del servidor (con service role key)
export const supabaseAdmin = createClient<Database>(
    env.SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    }
);

// Cliente para operaciones públicas (con anon key)
export const supabase = createClient<Database>(
    env.SUPABASE_URL,
    env.SUPABASE_ANON_KEY
);

export default supabaseAdmin;
