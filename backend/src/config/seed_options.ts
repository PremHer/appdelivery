import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Cargar variables de entorno
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Faltan variables de entorno');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
});

async function seedOptions() {
    console.log('🚀 Seeding Product Options...');

    // 1. Get a random "Burger" product
    const { data: products, error } = await supabase
        .from('products')
        .select('id, name')
        .ilike('name', '%Royal%') // Target "Royal" burgers usually have options
        .limit(1);

    if (error || !products || products.length === 0) {
        console.error('No suitable product found for seeding options.');
        return;
    }

    const product = products[0];
    console.log(`Adding options to product: ${product.name} (${product.id})`);

    // 2. Clear existing options for this product
    await supabase.from('product_options').delete().eq('product_id', product.id);

    // 3. Create Option Groups
    const optionGroups = [
        {
            product_id: product.id,
            name: 'Elige tus Salsas',
            is_required: false,
            max_selections: 3,
        },
        {
            product_id: product.id,
            name: 'Término de la carne',
            is_required: true,
            max_selections: 1,
        },
        {
            product_id: product.id,
            name: 'Adicionales',
            is_required: false,
            max_selections: 5,
        }
    ];

    const { data: createdGroups, error: groupError } = await supabase
        .from('product_options')
        .insert(optionGroups)
        .select();

    if (groupError || !createdGroups) {
        console.error('Error creating groups:', groupError);
        return;
    }

    // 4. Create Option Items
    const saucesGroup = createdGroups.find(g => g.name === 'Elige tus Salsas');
    const termGroup = createdGroups.find(g => g.name === 'Término de la carne');
    const extrasGroup = createdGroups.find(g => g.name === 'Adicionales');

    const items = [];

    if (saucesGroup) {
        items.push(
            { option_id: saucesGroup.id, name: 'Mayonesa', price_modifier: 0 },
            { option_id: saucesGroup.id, name: 'Ketchup', price_modifier: 0 },
            { option_id: saucesGroup.id, name: 'Mostaza', price_modifier: 0 },
            { option_id: saucesGroup.id, name: 'Ají de la casa', price_modifier: 0 },
            { option_id: saucesGroup.id, name: 'Salsa Golf', price_modifier: 0 }
        );
    }

    if (termGroup) {
        items.push(
            { option_id: termGroup.id, name: 'Bien cocido', price_modifier: 0, is_default: true },
            { option_id: termGroup.id, name: '3/4', price_modifier: 0 },
            { option_id: termGroup.id, name: 'Medio', price_modifier: 0 }
        );
    }

    if (extrasGroup) {
        items.push(
            { option_id: extrasGroup.id, name: 'Tocino Extra', price_modifier: 3.50 },
            { option_id: extrasGroup.id, name: 'Queso Extra', price_modifier: 2.50 },
            { option_id: extrasGroup.id, name: 'Huevo Frito', price_modifier: 2.00 },
            { option_id: extrasGroup.id, name: 'Papas Fritas Extra', price_modifier: 5.00 }
        );
    }

    const { error: itemsError } = await supabase.from('product_option_items').insert(items);

    if (itemsError) {
        console.error('Error creating items:', itemsError);
    } else {
        console.log('✅ Options seeded successfully!');
    }
}

seedOptions();
