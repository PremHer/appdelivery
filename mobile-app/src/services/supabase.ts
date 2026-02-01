import { createClient } from '@supabase/supabase-js';
import { SUPABASE_CONFIG } from '../constants';

// Cliente Supabase para la app móvil
export const supabase = createClient(
    SUPABASE_CONFIG.URL,
    SUPABASE_CONFIG.ANON_KEY
);

export default supabase;
