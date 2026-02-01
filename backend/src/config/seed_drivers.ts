
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ffplqtpeclgbkqfjwuvq.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmcGxxdHBlY2xnYmtxZmp3dXZxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTU1OTIyMCwiZXhwIjoyMDg1MTM1MjIwfQ.cGVGCNNL1I3MxCus63BfjztofbSRnt3yH6tdcAL3DrE';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function seedDrivers() {
    console.log('🛵 Creando conductores de prueba...');

    const drivers = [
        {
            email: 'driver1@delivery.pe',
            full_name: 'Juan Perez (Moto)',
            phone: '+51900000001',
            role: 'driver',
            profile: {
                vehicle_type: 'moto',
                license_plate: 'AB-1234',
                verification_status: 'verified',
                is_online: true,
                total_deliveries: 150
            }
        },
        {
            email: 'driver2@delivery.pe',
            full_name: 'Maria Garcia (Bici)',
            phone: '+51900000002',
            role: 'driver',
            profile: {
                vehicle_type: 'bicycle',
                verification_status: 'pending',
                is_online: false,
                total_deliveries: 0
            }
        },
        {
            email: 'driver3@delivery.pe',
            full_name: 'Carlos Ruiz (Auto)',
            phone: '+51900000003',
            role: 'driver',
            profile: {
                vehicle_type: 'car',
                license_plate: 'D4F-567',
                verification_status: 'verified',
                is_online: true,
                total_deliveries: 45
            }
        }
    ];

    for (const driver of drivers) {
        try {
            // 1. Create or get Auth User
            const { data: authData, error: authError } = await supabase.auth.admin.createUser({
                email: driver.email,
                password: 'password123',
                email_confirm: true,
                user_metadata: { full_name: driver.full_name }
            });

            let userId = authData.user?.id;

            if (authError) {
                if (authError.message.includes('already registered')) {
                    const { data } = await supabase.auth.admin.listUsers();
                    userId = data.users.find(u => u.email === driver.email)?.id;
                } else {
                    console.error(`❌ Error Auth ${driver.email}:`, authError.message);
                    continue;
                }
            }

            if (!userId) {
                console.error(`❌ No ID for ${driver.email}`);
                continue;
            }

            // 2. Upsert in public.users
            const { error: userError } = await supabase
                .from('users')
                .upsert({
                    id: userId,
                    email: driver.email,
                    full_name: driver.full_name,
                    phone: driver.phone,
                    role: 'driver',
                    is_active: true
                });

            if (userError) console.error(`❌ Error public.users ${driver.email}:`, userError.message);

            // 3. Upsert in public.driver_profiles
            const { error: profileError } = await supabase
                .from('driver_profiles')
                .upsert({
                    user_id: userId,
                    ...driver.profile
                });

            if (profileError) {
                console.log(`⚠️ No se pudo crear perfil para ${driver.email} (Probablemente falta crear la tabla driver_profiles)`);
                console.log(`   Error: ${profileError.message}`);
            } else {
                console.log(`✅ Conductor creado: ${driver.full_name}`);
            }

        } catch (error: any) {
            console.error('Error procesando:', error.message);
        }
    }
}

seedDrivers();
