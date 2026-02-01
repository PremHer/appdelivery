import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Configuración directa para el script
const SUPABASE_URL = 'https://ffplqtpeclgbkqfjwuvq.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmcGxxdHBlY2xnYmtxZmp3dXZxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTU1OTIyMCwiZXhwIjoyMDg1MTM1MjIwfQ.cGVGCNNL1I3MxCus63BfjztofbSRnt3yH6tdcAL3DrE';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
});

async function testConnection() {
    console.log('🔄 Probando conexión a Supabase...\n');

    try {
        // Intentar insertar datos de prueba directamente (las tablas deben existir)
        // Primero, vamos a verificar si podemos acceder

        // Test 1: Verificar conexión básica
        const { data: testData, error: testError } = await supabase
            .from('categories')
            .select('*')
            .limit(1);

        if (testError) {
            if (testError.message.includes('does not exist')) {
                console.log('⚠️  Las tablas no existen todavía.');
                console.log('📋 Por favor, ejecuta el schema.sql manualmente en Supabase:\n');
                console.log('   1. Ve a: https://supabase.com/dashboard/project/ffplqtpeclgbkqfjwuvq/sql/new');
                console.log('   2. Copia el contenido de: backend/src/config/schema.sql');
                console.log('   3. Pégalo y haz clic en "Run"\n');
                return false;
            }
            throw testError;
        }

        console.log('✅ Conexión exitosa a Supabase!');
        console.log(`   Categorías encontradas: ${testData?.length || 0}\n`);
        return true;

    } catch (error: any) {
        console.error('❌ Error conectando a Supabase:', error.message);
        return false;
    }
}

async function seedCategories() {
    console.log('📁 Insertando categorías...');

    const categories = [
        { name: 'Comida Rápida', slug: 'comida-rapida', icon: '🍔', display_order: 1 },
        { name: 'Pizza', slug: 'pizza', icon: '🍕', display_order: 2 },
        { name: 'Sushi', slug: 'sushi', icon: '🍣', display_order: 3 },
        { name: 'Mexicana', slug: 'mexicana', icon: '🌮', display_order: 4 },
        { name: 'Postres', slug: 'postres', icon: '🍰', display_order: 5 },
        { name: 'Bebidas', slug: 'bebidas', icon: '🥤', display_order: 6 },
        { name: 'Saludable', slug: 'saludable', icon: '🥗', display_order: 7 },
        { name: 'Asiática', slug: 'asiatica', icon: '🍜', display_order: 8 },
        { name: 'Italiana', slug: 'italiana', icon: '🍝', display_order: 9 },
        { name: 'Parrilla', slug: 'parrilla', icon: '🥩', display_order: 10 },
    ];

    const { data, error } = await supabase
        .from('categories')
        .upsert(categories, { onConflict: 'slug' })
        .select();

    if (error) {
        console.error('   ❌ Error:', error.message);
        return [];
    }

    console.log(`   ✅ ${data.length} categorías insertadas`);
    return data;
}

async function seedRestaurants() {
    console.log('🏪 Insertando restaurantes...');

    const restaurants = [
        {
            name: 'Burger Palace',
            description: 'Las mejores hamburguesas artesanales de la ciudad',
            image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800',
            address: 'Av. Principal 123',
            latitude: -12.0464,
            longitude: -77.0428,
            phone: '+51 999 888 777',
            rating: 4.5,
            total_reviews: 120,
            delivery_fee: 5.00,
            min_order_amount: 20.00,
            estimated_delivery_time: '25-35 min',
            categories: ['comida-rapida'],
            is_open: true,
            is_active: true,
        },
        {
            name: 'Pizza Express',
            description: 'Pizza italiana auténtica con ingredientes importados',
            image_url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800',
            address: 'Calle Secundaria 456',
            latitude: -12.0500,
            longitude: -77.0350,
            phone: '+51 999 777 666',
            rating: 4.8,
            total_reviews: 250,
            delivery_fee: 0,
            min_order_amount: 25.00,
            estimated_delivery_time: '30-40 min',
            categories: ['pizza', 'italiana'],
            is_open: true,
            is_active: true,
        },
        {
            name: 'Sushi Master',
            description: 'Sushi fresco preparado por chefs japoneses',
            image_url: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800',
            address: 'Av. del Mar 789',
            latitude: -12.0550,
            longitude: -77.0400,
            phone: '+51 999 666 555',
            rating: 4.9,
            total_reviews: 180,
            delivery_fee: 8.00,
            min_order_amount: 40.00,
            estimated_delivery_time: '35-45 min',
            categories: ['sushi', 'asiatica'],
            is_open: true,
            is_active: true,
        },
        {
            name: 'Taco Loco',
            description: 'Auténtica comida mexicana con sazón tradicional',
            image_url: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800',
            address: 'Plaza Central 321',
            latitude: -12.0480,
            longitude: -77.0380,
            phone: '+51 999 555 444',
            rating: 4.3,
            total_reviews: 95,
            delivery_fee: 4.00,
            min_order_amount: 15.00,
            estimated_delivery_time: '20-30 min',
            categories: ['mexicana'],
            is_open: true,
            is_active: true,
        },
        {
            name: 'Green Bowl',
            description: 'Comida saludable, bowls nutritivos y jugos naturales',
            image_url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800',
            address: 'Av. Fitness 555',
            latitude: -12.0520,
            longitude: -77.0450,
            phone: '+51 999 444 333',
            rating: 4.6,
            total_reviews: 78,
            delivery_fee: 6.00,
            min_order_amount: 30.00,
            estimated_delivery_time: '25-35 min',
            categories: ['saludable', 'bebidas'],
            is_open: true,
            is_active: true,
        },
    ];

    const { data, error } = await supabase
        .from('restaurants')
        .insert(restaurants)
        .select();

    if (error) {
        if (error.message.includes('duplicate')) {
            console.log('   ⚠️  Restaurantes ya existen, omitiendo...');
            const { data: existing } = await supabase.from('restaurants').select('*');
            return existing || [];
        }
        console.error('   ❌ Error:', error.message);
        return [];
    }

    console.log(`   ✅ ${data.length} restaurantes insertados`);
    return data;
}

async function seedProducts(restaurants: any[]) {
    console.log('🍔 Insertando productos...');

    const productsByRestaurant: Record<string, any[]> = {
        'Burger Palace': [
            { name: 'Classic Burger', description: 'Hamburguesa clásica con queso, lechuga y tomate', price: 18.90, is_featured: true, image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400' },
            { name: 'Double Cheese Burger', description: 'Doble carne con doble queso americano', price: 24.90, is_featured: true, image_url: 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=400' },
            { name: 'Bacon Burger', description: 'Con tocino crocante y salsa BBQ', price: 22.90, image_url: 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=400' },
            { name: 'Veggie Burger', description: 'Hamburguesa vegetariana con portobello', price: 19.90, image_url: 'https://images.unsplash.com/photo-1520072959219-c595dc870360?w=400' },
            { name: 'Papas Fritas', description: 'Porción grande de papas crujientes', price: 8.90, image_url: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400' },
            { name: 'Milkshake', description: 'Batido de vainilla, chocolate o fresa', price: 12.90, image_url: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400' },
        ],
        'Pizza Express': [
            { name: 'Pizza Margherita', description: 'Tomate, mozzarella y albahaca fresca', price: 32.90, is_featured: true, image_url: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400' },
            { name: 'Pizza Pepperoni', description: 'Pepperoni premium y mozzarella', price: 38.90, is_featured: true, image_url: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400' },
            { name: 'Pizza 4 Quesos', description: 'Mozzarella, gorgonzola, parmesano y provolone', price: 42.90, image_url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400' },
            { name: 'Pizza Hawaiana', description: 'Jamón y piña', price: 36.90, image_url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400' },
            { name: 'Tiramisú', description: 'Postre italiano clásico', price: 15.90, image_url: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400' },
        ],
        'Sushi Master': [
            { name: 'Maki Roll (8 pzs)', description: 'Salmón, palta y queso crema', price: 28.90, is_featured: true, image_url: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400' },
            { name: 'Nigiri Mixto (6 pzs)', description: 'Salmón, atún y camarón', price: 35.90, is_featured: true, image_url: 'https://images.unsplash.com/photo-1583623025817-d180a2221d0a?w=400' },
            { name: 'Tempura Roll', description: 'Roll empanizado con langostino', price: 32.90, image_url: 'https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?w=400' },
            { name: 'Dragon Roll', description: 'Roll especial con anguila y palta', price: 42.90, image_url: 'https://images.unsplash.com/photo-1611143669185-af224c5e3252?w=400' },
            { name: 'Gyozas (5 pzs)', description: 'Empanaditas japonesas de cerdo', price: 18.90, image_url: 'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=400' },
        ],
        'Taco Loco': [
            { name: 'Tacos al Pastor (3)', description: 'Carne de cerdo adobada con piña', price: 22.90, is_featured: true, image_url: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400' },
            { name: 'Burritos', description: 'Burrito de carne, frijoles y queso', price: 24.90, is_featured: true, image_url: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=400' },
            { name: 'Quesadillas', description: 'Tortilla con queso fundido y guacamole', price: 18.90, image_url: 'https://images.unsplash.com/photo-1618040996337-56904b7850b9?w=400' },
            { name: 'Nachos Supremos', description: 'Con carne, queso, guacamole y crema', price: 28.90, image_url: 'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=400' },
            { name: 'Guacamole', description: 'Guacamole fresco con totopos', price: 16.90, image_url: 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=400' },
        ],
        'Green Bowl': [
            { name: 'Açaí Bowl', description: 'Açaí, granola, banana y frutas', price: 24.90, is_featured: true, image_url: 'https://images.unsplash.com/photo-1590301157890-4810ed352733?w=400' },
            { name: 'Buddha Bowl', description: 'Quinoa, garbanzos, vegetales y tahini', price: 28.90, is_featured: true, image_url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400' },
            { name: 'Poke Bowl', description: 'Salmón, arroz, palta y edamame', price: 32.90, image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400' },
            { name: 'Green Smoothie', description: 'Espinaca, manzana, jengibre y limón', price: 14.90, image_url: 'https://images.unsplash.com/photo-1610970881699-44a5587cabec?w=400' },
            { name: 'Ensalada César', description: 'Lechuga, pollo, crutones y parmesano', price: 22.90, image_url: 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=400' },
        ],
    };

    let totalProducts = 0;

    for (const restaurant of restaurants) {
        const restaurantProducts = productsByRestaurant[restaurant.name];
        if (!restaurantProducts) continue;

        const productsWithRestaurantId = restaurantProducts.map((p) => ({
            ...p,
            restaurant_id: restaurant.id,
            is_available: true,
        }));

        const { data, error } = await supabase
            .from('products')
            .insert(productsWithRestaurantId)
            .select();

        if (error) {
            if (!error.message.includes('duplicate')) {
                console.error(`   ❌ Error en ${restaurant.name}:`, error.message);
            }
        } else {
            totalProducts += data.length;
        }
    }

    console.log(`   ✅ ${totalProducts} productos insertados`);
}

async function main() {
    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('║        🚀 DELIVERY APP - Seed Database                    ║');
    console.log('╚═══════════════════════════════════════════════════════════╝\n');

    const connected = await testConnection();

    if (!connected) {
        process.exit(1);
    }

    console.log('🌱 Iniciando seed de datos...\n');

    await seedCategories();
    const restaurants = await seedRestaurants();
    await seedProducts(restaurants);

    console.log('\n╔═══════════════════════════════════════════════════════════╗');
    console.log('║        ✅ Seed completado exitosamente!                   ║');
    console.log('╚═══════════════════════════════════════════════════════════╝\n');
}

main().catch(console.error);
