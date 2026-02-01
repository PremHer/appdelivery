import { createClient } from '@supabase/supabase-js';
import { SUPABASE_CONFIG } from '../constants';
import 'react-native-url-polyfill/auto'; // Supabase needs this in older RN, checking if needed. Actually template-blank-ts usually needs setup.

// Use AsyncStorage for auth persistence
import AsyncStorage from '@react-native-async-storage/async-storage';

export const supabase = createClient(
    SUPABASE_CONFIG.URL,
    SUPABASE_CONFIG.ANON_KEY,
    {
        auth: {
            storage: AsyncStorage,
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: false,
        },
    }
);
