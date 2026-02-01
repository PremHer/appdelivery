import { createClient } from '@supabase/supabase-js';

// Configuración directa para el script
const SUPABASE_URL = 'https://ffplqtpeclgbkqfjwuvq.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmcGxxdHBlY2xnYmtxZmp3dXZxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTU1OTIyMCwiZXhwIjoyMDg1MTM1MjIwfQ.cGVGCNNL1I3MxCus63BfjztofbSRnt3yH6tdcAL3DrE';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
});

async function seedMultiCategoryStores() {
    console.log('🏪 Seeding multi-category stores...\n');

    const stores = [
        // Pharmacies
        {
            name: 'Farmacia Salud Total',
            description: 'Tu farmacia de confianza, medicamentos y productos de cuidado personal',
            image_url: 'https://images.unsplash.com/photo-1585435557343-3b092031a831?w=800',
            address: 'Av. Saludable 101',
            latitude: -12.0520,
            longitude: -77.0380,
            phone: '+51 999 111 222',
            rating: 4.7,
            total_reviews: 85,
            delivery_fee: 3.00,
            min_order_amount: 20.00,
            estimated_delivery_time: '20-30 min',
            categories: ['farmacias', 'salud'],
            store_type: 'pharmacy',
            requires_age_verification: false,
            is_open: true,
            is_active: true,
        },
        {
            name: 'Inkafarma Express',
            description: 'Medicamentos, vitaminas y productos de belleza',
            image_url: 'https://images.unsplash.com/photo-1576602976047-174e57a47881?w=800',
            address: 'Calle Central 202',
            latitude: -12.0480,
            longitude: -77.0420,
            phone: '+51 999 222 333',
            rating: 4.5,
            total_reviews: 120,
            delivery_fee: 2.50,
            min_order_amount: 15.00,
            estimated_delivery_time: '15-25 min',
            categories: ['farmacias', 'salud'],
            store_type: 'pharmacy',
            requires_age_verification: false,
            is_open: true,
            is_active: true,
        },
        // Liquor Stores
        {
            name: 'La Bodega del Vino',
            description: 'Los mejores vinos nacionales e importados',
            image_url: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800',
            address: 'Av. del Vino 303',
            latitude: -12.0540,
            longitude: -77.0350,
            phone: '+51 999 333 444',
            rating: 4.8,
            total_reviews: 65,
            delivery_fee: 5.00,
            min_order_amount: 50.00,
            estimated_delivery_time: '25-35 min',
            categories: ['licores', 'vinos'],
            store_type: 'liquor_store',
            requires_age_verification: true,
            is_open: true,
            is_active: true,
        },
        {
            name: 'Cervecería Artesanal',
            description: 'Cervezas artesanales locales e importadas',
            image_url: 'https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=800',
            address: 'Calle Hoppy 404',
            latitude: -12.0560,
            longitude: -77.0390,
            phone: '+51 999 444 555',
            rating: 4.6,
            total_reviews: 90,
            delivery_fee: 4.00,
            min_order_amount: 40.00,
            estimated_delivery_time: '20-30 min',
            categories: ['licores', 'cervezas'],
            store_type: 'liquor_store',
            requires_age_verification: true,
            is_open: true,
            is_active: true,
        },
        // Pet Stores
        {
            name: 'Pet Paradise',
            description: 'Todo para el cuidado de tu mascota',
            image_url: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=800',
            address: 'Av. Mascota Feliz 505',
            latitude: -12.0500,
            longitude: -77.0440,
            phone: '+51 999 555 666',
            rating: 4.9,
            total_reviews: 110,
            delivery_fee: 4.00,
            min_order_amount: 30.00,
            estimated_delivery_time: '25-35 min',
            categories: ['mascotas', 'alimento-mascota'],
            store_type: 'pet_store',
            requires_age_verification: false,
            is_open: true,
            is_active: true,
        },
        {
            name: 'Huellitas Store',
            description: 'Alimento premium, accesorios y juguetes para mascotas',
            image_url: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=800',
            address: 'Calle Patitas 606',
            latitude: -12.0490,
            longitude: -77.0360,
            phone: '+51 999 666 777',
            rating: 4.7,
            total_reviews: 75,
            delivery_fee: 3.50,
            min_order_amount: 25.00,
            estimated_delivery_time: '20-30 min',
            categories: ['mascotas', 'alimento-mascota'],
            store_type: 'pet_store',
            requires_age_verification: false,
            is_open: true,
            is_active: true,
        },
        // Grocery / Market
        {
            name: 'Mercado Fresco',
            description: 'Frutas, verduras y productos frescos del día',
            image_url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800',
            address: 'Av. del Mercado 707',
            latitude: -12.0510,
            longitude: -77.0410,
            phone: '+51 999 777 888',
            rating: 4.6,
            total_reviews: 200,
            delivery_fee: 3.00,
            min_order_amount: 25.00,
            estimated_delivery_time: '20-30 min',
            categories: ['mercado', 'frutas', 'verduras'],
            store_type: 'grocery',
            requires_age_verification: false,
            is_open: true,
            is_active: true,
        },
        {
            name: 'Plaza Vea Express',
            description: 'Supermercado con todo lo que necesitas',
            image_url: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=800',
            address: 'Centro Comercial 808',
            latitude: -12.0530,
            longitude: -77.0370,
            phone: '+51 999 888 999',
            rating: 4.4,
            total_reviews: 350,
            delivery_fee: 5.00,
            min_order_amount: 40.00,
            estimated_delivery_time: '30-45 min',
            categories: ['mercado', 'supermercado'],
            store_type: 'grocery',
            requires_age_verification: false,
            is_open: true,
            is_active: true,
        },
        // Hardware Store
        {
            name: 'Ferretería El Constructor',
            description: 'Herramientas, materiales de construcción y más',
            image_url: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800',
            address: 'Av. Industrial 909',
            latitude: -12.0570,
            longitude: -77.0330,
            phone: '+51 999 000 111',
            rating: 4.5,
            total_reviews: 45,
            delivery_fee: 8.00,
            min_order_amount: 50.00,
            estimated_delivery_time: '40-60 min',
            categories: ['ferreteria', 'herramientas'],
            store_type: 'hardware',
            requires_age_verification: false,
            is_open: true,
            is_active: true,
        },
        // Convenience Store
        {
            name: 'Tambo+',
            description: 'Tu tienda de conveniencia 24/7',
            image_url: 'https://images.unsplash.com/photo-1604689598793-b8bf1dc445a1?w=800',
            address: 'Esquina Rápida 1010',
            latitude: -12.0460,
            longitude: -77.0400,
            phone: '+51 999 123 456',
            rating: 4.3,
            total_reviews: 280,
            delivery_fee: 2.00,
            min_order_amount: 10.00,
            estimated_delivery_time: '15-20 min',
            categories: ['tienda', 'snacks', 'bebidas'],
            store_type: 'convenience',
            requires_age_verification: false,
            is_open: true,
            is_active: true,
        },
        {
            name: 'Oxxo',
            description: 'Snacks, bebidas y productos esenciales',
            image_url: 'https://images.unsplash.com/photo-1556767576-5ec41e3239ea?w=800',
            address: 'Av. Principal 1111',
            latitude: -12.0470,
            longitude: -77.0430,
            phone: '+51 999 234 567',
            rating: 4.2,
            total_reviews: 190,
            delivery_fee: 2.50,
            min_order_amount: 12.00,
            estimated_delivery_time: '15-25 min',
            categories: ['tienda', 'snacks', 'bebidas'],
            store_type: 'convenience',
            requires_age_verification: false,
            is_open: true,
            is_active: true,
        },
    ];

    const { data, error } = await supabase
        .from('restaurants')
        .insert(stores)
        .select();

    if (error) {
        if (error.message.includes('duplicate')) {
            console.log('⚠️  Some stores already exist, skipping...');
        } else {
            console.error('❌ Error inserting stores:', error.message);
        }
        return;
    }

    console.log(`✅ ${data.length} multi-category stores inserted!`);
    console.log('\nStores by type:');
    console.log('  - Pharmacies: 2');
    console.log('  - Liquor Stores: 2');
    console.log('  - Pet Stores: 2');
    console.log('  - Grocery/Markets: 2');
    console.log('  - Hardware: 1');
    console.log('  - Convenience: 2');
}

async function seedNewCategories() {
    console.log('📁 Adding new categories for store types...\n');

    const newCategories = [
        { name: 'Farmacias', slug: 'farmacias', icon: '💊', display_order: 11 },
        { name: 'Licorería', slug: 'licores', icon: '🍷', display_order: 12 },
        { name: 'Mascotas', slug: 'mascotas', icon: '🐕', display_order: 13 },
        { name: 'Mercado', slug: 'mercado', icon: '🛒', display_order: 14 },
        { name: 'Ferretería', slug: 'ferreteria', icon: '🔧', display_order: 15 },
        { name: 'Tiendas', slug: 'tienda', icon: '🏪', display_order: 16 },
    ];

    const { data, error } = await supabase
        .from('categories')
        .upsert(newCategories, { onConflict: 'slug' })
        .select();

    if (error) {
        console.error('❌ Error inserting categories:', error.message);
        return;
    }

    console.log(`✅ ${data.length} new categories added!`);
}

async function main() {
    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('║   🌐 MULTI-CATEGORY MARKETPLACE - Seed Additional Stores  ║');
    console.log('╚═══════════════════════════════════════════════════════════╝\n');

    await seedNewCategories();
    await seedMultiCategoryStores();

    console.log('\n╔═══════════════════════════════════════════════════════════╗');
    console.log('║   ✅ Multi-category seed completed successfully!          ║');
    console.log('╚═══════════════════════════════════════════════════════════╝\n');
}

main().catch(console.error);
