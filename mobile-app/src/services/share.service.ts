import { Share, Alert } from 'react-native';
import * as Linking from 'expo-linking';

class ShareService {
    /**
     * Share a restaurant via native share sheet
     */
    async shareRestaurant(restaurant: { id: string; name: string; description?: string | null }): Promise<void> {
        try {
            const deepLink = Linking.createURL(`restaurant/${restaurant.id}`);
            const webLink = `https://sajinoexpress.com/restaurant/${restaurant.id}`;

            const message = `🐗 ¡Mira este lugar en Sajino Express!\n\n${restaurant.name}\n${restaurant.description ? restaurant.description.substring(0, 100) + '...' : ''}\n\n${webLink}`;

            await Share.share({
                message,
                title: `Compartir ${restaurant.name}`,
                url: webLink, // iOS only
            });
        } catch (error) {
            console.error('Error sharing restaurant:', error);
        }
    }

    /**
     * Share a product via native share sheet
     */
    async shareProduct(product: { id: string; name: string; price: number; restaurantName?: string }): Promise<void> {
        try {
            const webLink = `https://sajinoexpress.com/product/${product.id}`;

            const message = `🐗 ¡Mira esto en Sajino Express!\n\n${product.name}\nS/ ${product.price.toFixed(2)}\n${product.restaurantName ? `en ${product.restaurantName}` : ''}\n\n${webLink}`;

            await Share.share({
                message,
                title: `Compartir ${product.name}`,
                url: webLink,
            });
        } catch (error) {
            console.error('Error sharing product:', error);
        }
    }

    /**
     * Share order tracking link
     */
    async shareOrderTracking(orderId: string): Promise<void> {
        try {
            const deepLink = Linking.createURL(`order/${orderId}`);

            const message = `🐗 Sigue mi pedido en Sajino Express:\n\n${deepLink}`;

            await Share.share({
                message,
                title: 'Compartir seguimiento de pedido',
            });
        } catch (error) {
            console.error('Error sharing order:', error);
        }
    }

    /**
     * Open app settings (for permissions)
     */
    async openSettings(): Promise<void> {
        await Linking.openSettings();
    }
}

export default new ShareService();
