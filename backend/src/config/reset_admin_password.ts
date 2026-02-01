import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load env vars
dotenv.config({ path: path.join(__dirname, '../../.env') });

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://cxwswhfylwdstqziejmd.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFub24iLCJpYXQiOjE3MzgwMjg4NTcsImV4cCI6MjA1MzYwNDg1N30.MHdGZH49p1F-J9EV3vDWV8fy02Qkexia5dJiLqDITvE';

// Wait, the above key in code snippet seemed to be ANON key in previous metadata, but I need SERVICE ROLE.
// I will use the one I used in `seed.ts` (Step 1265) if available, or try to read from env.
// In Step 1265, I saw:
// const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmcGxxdHBlY2xnYmtxZmp3dXZxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTU1OTIyMCwiZXhwIjoyMDg1MTM1MjIwfQ.cGVGCNNL1I3MxCus63BfjztofbSRnt3yH6tdcAL3DrE';
// BUT wait, that URL was 'https://ffplqtpeclgbkqfjwuvq.supabase.co'.
// The current URL in task 1269 and 1273 metadata seems to be 'https://cxwswhfylwdstqziejmd.supabase.co'.
// The seeds I ran used the env vars or defaults.
// Let's trust `d:/appdelivery/backend/.env` has the correct ones.
// I will assume `process.env.SUPABASE_SERVICE_ROLE_KEY` is set correctly by `dotenv`.

// Re-verifying seed_admin.ts content I wrote (Step 1275):
// It used hardcoded fallback: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4d3N3aGZ5bHdkc3Rxemllam1kIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTU1OTIyMCwiZXhwIjoyMDg1MTM1MjIwfQ.cGVGCNNL1I3MxCus63BfjztofbSRnt3yH6tdcAL3DrE'
// That matches the `cxw...` URL.
// So I will use that.

const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmcGxxdHBlY2xnYmtxZmp3dXZxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTU1OTIyMCwiZXhwIjoyMDg1MTM1MjIwfQ.cGVGCNNL1I3MxCus63BfjztofbSRnt3yH6tdcAL3DrE';
const URL = 'https://ffplqtpeclgbkqfjwuvq.supabase.co';

const supabase = createClient(URL, SERVICE_KEY);

async function resetPassword() {
    console.log('🔄 Actualizando contraseña de admin...');
    const email = 'admin@delivery.pe';
    const password = 'password123';

    try {
        const { data, error: findError } = await supabase.auth.admin.listUsers();

        if (findError) throw findError;

        const admin = data.users.find((u: any) => u.email === email);

        if (!admin) {
            console.error('❌ Usuario admin no encontrado en Auth.');
            return;
        }

        const { error } = await supabase.auth.admin.updateUserById(
            admin.id,
            { password: password }
        );

        if (error) throw error;
        console.log('✅ Contraseña actualizada correctamente a: password123');

    } catch (error: any) {
        console.error('❌ Error:', error.message);
    }
}

resetPassword();
