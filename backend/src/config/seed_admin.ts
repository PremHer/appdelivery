import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load env vars
dotenv.config({ path: path.join(__dirname, '../../.env') });

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://cxwswhfylwdstqziejmd.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4d3N3aGZ5bHdkc3Rxemllam1kIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTU1OTIyMCwiZXhwIjoyMDg1MTM1MjIwfQ.cGVGCNNL1I3MxCus63BfjztofbSRnt3yH6tdcAL3DrE';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function seedAdmin() {
    console.log('👑 Creando usuario administrador...');

    const adminUser = {
        email: 'admin@delivery.pe',
        full_name: 'Administrador Principal',
        // role: 'admin', // Column doesn't exist yet, UI defaults to admin
        is_active: true,
        phone: '+51999999999',
        address: 'Oficina Central',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };

    try {
        // 1. Check if user exists
        const { data: existingUser } = await supabase
            .from('users')
            .select('*')
            .eq('email', adminUser.email)
            .single();

        if (existingUser) {
            console.log('⚠️ El usuario admin ya existe. Actualizando datos...');
            const { error: updateError } = await supabase
                .from('users')
                .update({ is_active: true })
                .eq('email', adminUser.email);

            if (updateError) throw updateError;
            console.log('✅ Usuario admin actualizado correctamente.');
        } else {
            console.log('🆕 Creando nuevo usuario admin...');
            // We need a UUID for the ID. Since we are inserting directly into public.users
            // and usually this table is linked to auth.users, in a real app we'd create the auth user first.
            // But for this demo dashboard which reads from public.users, we can generate a random UUID if not strict FK.
            // However, usually public.users.id is a FK to auth.users.id.
            // If we can't create in auth.users via API easily without admin API (we have service role though).

            // Try to create in auth first using admin api
            const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
                email: adminUser.email,
                password: 'password123',
                email_confirm: true,
                user_metadata: { full_name: adminUser.full_name }
            });

            let userId = authUser?.user?.id;

            if (authError) {
                console.log(`   ⚠️ Auth create info: ${authError.message}`);

                // If user exists, find their ID
                if (authError.message.includes('already registered') || authError.status === 422) {
                    console.log('   🔍 Buscando usuario existente en auth...');
                    const { data: usersData } = await supabase.auth.admin.listUsers();
                    const foundUser = usersData?.users.find(u => u.email === adminUser.email);

                    if (foundUser) {
                        userId = foundUser.id;
                        console.log(`   ✅ ID encontrado: ${userId}`);
                    } else {
                        console.error('   ❌ No se pudo encontrar el ID del usuario en auth.');
                        return;
                    }
                }
            }

            if (!userId) {
                console.error('   ❌ No ID available for insert.');
                return;
            }

            console.log(`   📝 Insertando en public.users con ID: ${userId}`);

            const { error: insertError } = await supabase
                .from('users')
                .insert([{ ...adminUser, id: userId }]);

            if (insertError) throw insertError;
            console.log('✅ Usuario admin creado correctamente.');
        }

    } catch (error: any) {
        console.error('❌ Error:', error.message);
    }
}

seedAdmin();
