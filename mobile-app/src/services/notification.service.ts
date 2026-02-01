import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { supabase } from './supabase';

// Configure notification behavior
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

export interface NotificationData {
    type: 'order_status' | 'promotion' | 'general';
    orderId?: string;
    title: string;
    body: string;
}

class NotificationService {
    private expoPushToken: string | null = null;

    /**
     * Request permission and get push token
     */
    async registerForPushNotifications(): Promise<string | null> {
        // Expo Go (SDK 53+) on Android no longer supports remote notifications
        if (Constants.appOwnership === 'expo') {
            console.log('Push notifications are not supported in Expo Go. Use a development build.');
            return null;
        }

        if (!Device.isDevice) {
            console.log('Push notifications only work on physical devices');
            return null;
        }

        // Check existing permission
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        // Request permission if not granted
        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            console.log('Push notification permission not granted');
            return null;
        }

        // Get Expo push token
        try {
            const projectId = Constants.expoConfig?.extra?.eas?.projectId;
            const token = await Notifications.getExpoPushTokenAsync({
                projectId: projectId,
            });
            this.expoPushToken = token.data;
            console.log('Push token:', this.expoPushToken);
            return this.expoPushToken;
        } catch (error) {
            console.warn('Error getting push token (Expected in Expo Go):', error);
            return null;
        }
    }

    /**
     * Save push token to user profile in database
     */
    async savePushToken(userId: string): Promise<void> {
        if (!this.expoPushToken) {
            await this.registerForPushNotifications();
        }

        if (!this.expoPushToken) {
            return;
        }

        try {
            await supabase
                .from('users')
                .update({ push_token: this.expoPushToken })
                .eq('id', userId);
            console.log('Push token saved to user profile');
        } catch (error) {
            console.error('Error saving push token:', error);
        }
    }

    async scheduleLocalNotification(
        title: string,
        body: string,
        data?: NotificationData,
        seconds: number = 1
    ): Promise<string> {
        const trigger = seconds > 0
            ? {
                type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
                seconds,
                repeats: false
            }
            : null;

        const id = await Notifications.scheduleNotificationAsync({
            content: {
                title,
                body,
                data: data as any,
                sound: true,
            },
            trigger: trigger as any,
        });
        return id;
    }

    /**
     * Show immediate notification for order status update
     */
    async notifyOrderStatus(
        orderId: string,
        status: string,
        restaurantName?: string
    ): Promise<void> {
        const statusMessages: Record<string, { title: string; body: string }> = {
            confirmed: {
                title: '✅ Pedido Confirmado',
                body: `Tu pedido en ${restaurantName || 'la tienda'} ha sido confirmado`,
            },
            preparing: {
                title: '👨‍🍳 Preparando tu pedido',
                body: `${restaurantName || 'La tienda'} está preparando tu pedido`,
            },
            ready: {
                title: '🚴 ¡En camino!',
                body: 'Tu pedido ya va en camino a tu ubicación',
            },
            picked_up: {
                title: '📦 Pedido recogido',
                body: 'El repartidor recogió tu pedido y va en camino',
            },
            delivered: {
                title: '🎉 ¡Pedido entregado!',
                body: '¡Disfruta tu pedido! No olvides calificarnos',
            },
            cancelled: {
                title: '❌ Pedido cancelado',
                body: 'Tu pedido ha sido cancelado',
            },
        };

        const message = statusMessages[status] || {
            title: 'Actualización de pedido',
            body: `Estado: ${status}`,
        };

        await this.scheduleLocalNotification(message.title, message.body, {
            type: 'order_status',
            orderId,
            title: message.title,
            body: message.body,
        }, 0);
    }

    /**
     * Show promotion notification
     */
    async notifyPromotion(title: string, body: string): Promise<void> {
        await this.scheduleLocalNotification(title, body, {
            type: 'promotion',
            title,
            body,
        }, 0);
    }

    /**
     * Add notification received listener
     */
    addNotificationReceivedListener(
        callback: (notification: Notifications.Notification) => void
    ): Notifications.Subscription {
        return Notifications.addNotificationReceivedListener(callback);
    }

    /**
     * Add notification response listener (when user taps notification)
     */
    addNotificationResponseListener(
        callback: (response: Notifications.NotificationResponse) => void
    ): Notifications.Subscription {
        return Notifications.addNotificationResponseReceivedListener(callback);
    }

    /**
     * Get current push token
     */
    getPushToken(): string | null {
        return this.expoPushToken;
    }

    /**
     * Cancel all scheduled notifications
     */
    async cancelAllNotifications(): Promise<void> {
        await Notifications.cancelAllScheduledNotificationsAsync();
    }

    /**
     * Set badge count (iOS only typically)
     */
    async setBadgeCount(count: number): Promise<void> {
        await Notifications.setBadgeCountAsync(count);
    }

    /**
     * Configure Android notification channel
     */
    async setupAndroidChannel(): Promise<void> {
        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('orders', {
                name: 'Pedidos',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#FF6B35',
                sound: 'default',
            });

            await Notifications.setNotificationChannelAsync('promotions', {
                name: 'Promociones',
                importance: Notifications.AndroidImportance.DEFAULT,
                sound: 'default',
            });
        }
    }
}

export const notificationService = new NotificationService();
export default notificationService;
