import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase';

const router = Router();

interface PushMessage {
    to: string;
    sound: string;
    title: string;
    body: string;
    data: object;
    priority: string;
    channelId: string;
}

/**
 * POST /api/v1/notifications/new-order
 * Called when a new order is placed to notify nearby online drivers
 */
router.post('/new-order', async (req: Request, res: Response) => {
    try {
        const { orderId, restaurantName, restaurantLat, restaurantLng, total } = req.body;

        if (!orderId) {
            return res.status(400).json({ error: 'orderId is required' });
        }

        // Fetch online drivers with push tokens
        const { data: drivers, error } = await supabase
            .from('driver_profiles')
            .select('expo_push_token, current_latitude, current_longitude')
            .eq('is_online', true)
            .not('expo_push_token', 'is', null);

        if (error) {
            console.error('Error fetching drivers:', error);
            return res.status(500).json({ error: 'Failed to fetch drivers' });
        }

        if (!drivers || drivers.length === 0) {
            return res.json({ message: 'No online drivers available', notified: 0 });
        }

        // Filter drivers within ~5km of restaurant (optional, could be disabled)
        const nearbyDrivers = restaurantLat && restaurantLng
            ? drivers.filter((d: any) => {
                if (!d.current_latitude || !d.current_longitude) return true; // Include if no location
                const distance = calculateDistance(
                    restaurantLat, restaurantLng,
                    d.current_latitude, d.current_longitude
                );
                return distance <= 10; // 10 km radius
            })
            : drivers;

        // Prepare push messages
        const messages: PushMessage[] = (nearbyDrivers as any[])
            .filter((d: any) => d.expo_push_token)
            .map((d: any) => ({
                to: d.expo_push_token!,
                sound: 'default',
                title: '🔔 ¡Nuevo Pedido Disponible!',
                body: `Pedido de ${restaurantName || 'Restaurante'} - S/${total?.toFixed(2) || '0.00'} de delivery`,
                data: { orderId, type: 'new_order' },
                priority: 'high',
                channelId: 'orders',
            }));

        if (messages.length === 0) {
            return res.json({ message: 'No drivers with push tokens nearby', notified: 0 });
        }

        // Send notifications in batches of 100 (Expo limit)
        const chunks = chunkArray(messages, 100);
        let totalSent = 0;

        for (const chunk of chunks) {
            const response = await fetch('https://exp.host/--/api/v2/push/send', {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Accept-encoding': 'gzip, deflate',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(chunk),
            });

            if (response.ok) {
                totalSent += chunk.length;
            } else {
                console.error('Push send error:', await response.text());
            }
        }

        return res.json({
            message: 'Notifications sent',
            notified: totalSent,
            totalDriversOnline: drivers.length
        });

    } catch (error) {
        console.error('Error in new-order notification:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// Haversine formula to calculate distance between two points in km
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function toRad(deg: number): number {
    return deg * (Math.PI / 180);
}

function chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
    }
    return chunks;
}

export default router;
