import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { supabase } from './supabase';
import Constants from 'expo-constants';

// Configure notification behavior
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});

export async function registerForPushNotificationsAsync(): Promise<string | null> {
    let token = null;

    // Only works on physical devices
    if (!Device.isDevice) {
        console.log('Push notifications require a physical device');
        return null;
    }

    // Check if we're in Expo Go (push doesn't work there since SDK 53)
    const isExpoGo = Constants.appOwnership === 'expo';
    if (isExpoGo) {
        console.log('Push notifications are not available in Expo Go (SDK 53+). Use a development build.');
        return null;
    }

    try {
        // Check existing permissions
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        // Request permission if not granted
        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            console.log('Push notification permission denied');
            return null;
        }

        // Get Expo push token
        const pushTokenData = await Notifications.getExpoPushTokenAsync({
            projectId: Constants.expoConfig?.extra?.eas?.projectId
        });
        token = pushTokenData.data;

        // Android-specific channel setup
        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('orders', {
                name: 'Pedidos',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#FF6B35',
                sound: 'default',
            });
        }
    } catch (error) {
        console.log('Push notification setup error (expected in Expo Go):', error);
        return null;
    }

    return token;
}

export async function savePushToken(userId: string, token: string): Promise<void> {
    try {
        const { error } = await supabase
            .from('driver_profiles')
            .update({ expo_push_token: token })
            .eq('user_id', userId);

        if (error) {
            console.error('Error saving push token:', error);
        } else {
            console.log('Push token saved successfully');
        }
    } catch (error) {
        console.error('Error in savePushToken:', error);
    }
}

export async function sendPushNotification(expoPushToken: string, title: string, body: string, data?: object): Promise<void> {
    const message = {
        to: expoPushToken,
        sound: 'default',
        title,
        body,
        data: data || {},
        priority: 'high',
        channelId: 'orders',
    };

    await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            'Accept-encoding': 'gzip, deflate',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
    });
}
