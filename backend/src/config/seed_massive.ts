import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Cargar variables de entorno desde el archivo correcto
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Faltan variables de entorno SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
});

// --- DATOS BASE PARA GENERACIÓN ---

const CATEGORIES = [
    { name: 'Hamburguesas', slug: 'hamburguesas', icon: '🍔' },
    { name: 'Pizza', slug: 'pizza', icon: '🍕' },
    { name: 'Sushi', slug: 'sushi', icon: '🍣' },
    { name: 'Mexicana', slug: 'mexicana', icon: '🌮' },
    { name: 'Pollo', slug: 'pollo', icon: '🍗' },
    { name: 'Saludable', slug: 'saludable', icon: '🥗' },
    { name: 'Postres', slug: 'postres', icon: '🍰' },
    { name: 'Bebidas', slug: 'bebidas', icon: '🥤' },
    { name: 'Asiática', slug: 'asiatica', icon: '🍜' },
    { name: 'Café', slug: 'cafe', icon: '☕' },
    { name: 'Helados', slug: 'helados', icon: '🍦' },
    { name: 'Desayunos', slug: 'desayunos', icon: '🥞' },
];

const RESTAURANT_PREFIXES = ['The', 'El', 'La', 'Don', 'Santo', 'Rey', 'Mr.', 'Urban', 'Royal', 'Super'];
const RESTAURANT_NAMES = ['Burger', 'Pizza', 'Sushi', 'Taco', 'Wok', 'Grill', 'Bowl', 'Chicken', 'Coffee', 'Bakery', 'Sabor', 'Fuego', 'Bocado'];
const RESTAURANT_SUFFIXES = ['House', 'Place', 'Spot', 'Express', 'King', 'Queen', 'Factory', 'Station', 'Bistro', 'Gourmet', 'Garden', 'Kitchen'];

const STREETS = ['Av. Principal', 'Calle Real', 'Jr. Libertad', 'Av. del Parque', 'Calle Los Pinos', 'Av. La Marina', 'Psje. Los Olivos'];
const IMAGES_BY_CATEGORY: Record<string, string[]> = {
    hamburguesas: [
        'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600',
        'https://images.unsplash.com/photo-1550547660-d9450f859349?w=600',
        'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=600'
    ],
    pizza: [
        'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600',
        'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=600',
        'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600'
    ],
    sushi: [
        'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=600',
        'https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?w=600',
        'https://images.unsplash.com/photo-1553621042-f6e147245754?w=600'
    ],
    mexicana: [
        'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=600',
        'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=600'
    ],
    pollo: [
        'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=600',
        'https://images.unsplash.com/photo-1562967960-f554925e0193?w=600'
    ],
    default: ['https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600']
};

// --- ARRAYS DE PRODUCTOS GENÉRICOS ---
const MENU_TEMPLATES: Record<string, any[]> = {
    hamburguesas: [
        { name: 'Clásica', basePrice: 15, desc: 'Carne, queso, tomate y lechuga' },
        { name: 'Royal', basePrice: 22, desc: 'Huevo, queso y tocino' },
        { name: 'Picante', basePrice: 20, desc: 'Jalapeños y salsa hot' },
        { name: 'Doble', basePrice: 28, desc: 'Doble carne y doble queso' },
        { name: 'BBQ', basePrice: 24, desc: 'Aros de cebolla y salsa BBQ' },
    ],
    pizza: [
        { name: 'Americana', basePrice: 25, desc: 'Jamón y queso mozzarella' },
        { name: 'Pepperoni', basePrice: 30, desc: 'Doble pepperoni' },
        { name: 'Suprema', basePrice: 35, desc: 'Todas las carnes y vegetales' },
        { name: 'Hawaiana', basePrice: 28, desc: 'Piña y jamón' },
        { name: 'Vegetariana', basePrice: 26, desc: 'Champiñones, pimientos y aceitunas' },
    ],
    sushi: [
        { name: 'Acevichado', basePrice: 30, desc: 'Maki relleno de langostino con salsa acevichada' },
        { name: 'California', basePrice: 25, desc: 'Queso crema, palta y kanikama' },
        { name: 'Furado', basePrice: 32, desc: 'Salmón y palta por fuera' },
        { name: 'Tempura', basePrice: 28, desc: 'Frito y crocante' },
    ],
    mexicana: [
        { name: 'Tacos Al Pastor', basePrice: 18, desc: '3 unidades con piña' },
        { name: 'Burrito Gigante', basePrice: 24, desc: 'Frijoles, carne, arroz y queso' },
        { name: 'Quesadilla', basePrice: 20, desc: 'Con guacamole y pico de gallo' },
        { name: 'Nachos', basePrice: 22, desc: 'Con queso fundido y jalapeños' },
    ],
    default: [ // Para otros típos
        { name: 'Plato Especial', basePrice: 25, desc: 'La especialidad de la casa' },
        { name: 'Combo Familiar', basePrice: 45, desc: 'Para compartir entre 3' },
        { name: 'Bebida Personal', basePrice: 5, desc: 'Gaseosa o agua' },
        { name: 'Postre del día', basePrice: 12, desc: 'Preguntar disponibilidad' },
    ]
};

// --- UTILS ---
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomFloat = (min: number, max: number) => parseFloat((Math.random() * (max - min) + min).toFixed(2));
const pickRandom = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

async function generateData() {
    console.log('🚀 Iniciando Generación Masiva de Datos...');

    // 1. LIMPIEZA (Opcional, comentada por seguridad, pero útil si quieres resetear)
    // await supabase.from('order_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    // await supabase.from('products').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    // await supabase.from('restaurants').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    // await supabase.from('categories').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    // 2. Insertar Categorías
    console.log('Inserting categories...');
    const { data: catData, error: catError } = await supabase.from('categories').upsert(CATEGORIES, { onConflict: 'slug' }).select();

    if (catError) {
        console.error('Error detallado de Supabase:', catError);
        return;
    }

    if (!catData) return console.error('No se recibieron datos de categorías (catData is null)');

    const categoriesMap = catData.reduce((acc: any, cat: any) => {
        acc[cat.slug] = cat.id;
        return acc;
    }, {});

    // 3. Generar 20 Restaurantes
    console.log('Generating restaurants...');
    const restaurantsToInsert = [];

    for (let i = 0; i < 20; i++) {
        const mainCategorySlug = pickRandom(Object.keys(categoriesMap));
        const name = `${pickRandom(RESTAURANT_PREFIXES)} ${pickRandom(RESTAURANT_NAMES)} ${pickRandom(RESTAURANT_SUFFIXES)}`;

        // Coordenadas alrededor de Lima (aprox)
        const lat = -12.0464 + (Math.random() - 0.5) * 0.05;
        const lng = -77.0428 + (Math.random() - 0.5) * 0.05;

        const images = IMAGES_BY_CATEGORY[mainCategorySlug] || IMAGES_BY_CATEGORY.default;
        const image = pickRandom(images);

        restaurantsToInsert.push({
            name: name,
            description: `El mejor lugar para comer ${mainCategorySlug}. Ingredientes frescos y sabor único.`,
            image_url: image, // Usamos la misma para logo por simplicidad
            logo_url: image,
            address: `${pickRandom(STREETS)} ${randomInt(100, 999)}`,
            latitude: lat,
            longitude: lng,
            phone: `+51 9${randomInt(10, 99)} ${randomInt(100, 999)} ${randomInt(100, 999)}`,
            rating: randomFloat(3.5, 5.0),
            total_reviews: randomInt(10, 500),
            delivery_fee: randomFloat(0, 8), // Algunos gratis
            min_order_amount: randomFloat(10, 30),
            estimated_delivery_time: `${randomInt(20, 40)}-${randomInt(45, 60)} min`,
            categories: [mainCategorySlug, pickRandom(Object.keys(categoriesMap))], // 2 categorías
            is_open: Math.random() > 0.1, // 90% abiertos
            is_active: true,
        });
    }

    const { data: restaurants, error: restError } = await supabase.from('restaurants').insert(restaurantsToInsert).select();

    if (restError) {
        console.error('Error inserting restaurants:', restError);
        return;
    }

    console.log(`✅ ${restaurants.length} restaurantes creados.`);

    // 4. Generar Productos para cada restaurante
    console.log('Generating products...');
    const productsToInsert = [];

    for (const restaurant of restaurants) {
        // Determinar qué menú usar basado en la categoría principal del restaurante
        // (Asumimos que la primera categoría en el array es la principal)
        const categorySlug = restaurant.categories[0];
        const templateMenu = MENU_TEMPLATES[categorySlug] || MENU_TEMPLATES.default;

        // Insertar 5-8 productos por restaurante
        const numProducts = randomInt(5, 8);

        for (let k = 0; k < numProducts; k++) {
            const itemTemplate = pickRandom(templateMenu);
            const categoryId = categoriesMap[categorySlug];

            productsToInsert.push({
                restaurant_id: restaurant.id,
                category_id: categoryId,
                name: itemTemplate.name,
                description: itemTemplate.desc,
                image_url: restaurant.image_url, // Reusamos imágen del restaurante por simplicidad visual
                price: parseFloat((itemTemplate.basePrice * randomFloat(0.9, 1.2)).toFixed(2)), // Variación de precio
                is_available: true,
                is_featured: k < 2, // Los primeros 2 son destacados
                preparation_time: randomInt(15, 40),
            });
        }
    }

    // Insertar en lotes de 50 para no saturar
    const BATCH_SIZE = 50;
    for (let i = 0; i < productsToInsert.length; i += BATCH_SIZE) {
        const batch = productsToInsert.slice(i, i + BATCH_SIZE);
        const { error } = await supabase.from('products').insert(batch);
        if (error) console.error('Error batch products:', error);
        else console.log(`   Batch ${i / BATCH_SIZE + 1} insertado.`);
    }

    console.log(`✅ Total ~${productsToInsert.length} productos creados.`);
    console.log('\n✨ DONE! Ahora tu app tiene muchísimos datos.');
}

generateData().catch(console.error);
