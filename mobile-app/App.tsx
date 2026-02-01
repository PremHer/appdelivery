import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import * as SecureStore from 'expo-secure-store';
import * as Notifications from 'expo-notifications';

import Navigation from './src/navigation';
import { useAuthStore } from './src/context/stores';
import { COLORS } from './src/constants';
import notificationService from './src/services/notification.service';
import { ToastProvider } from './src/components/ui/Toast';

// Mantener el splash screen visible mientras cargamos
SplashScreen.preventAutoHideAsync();

export default function App() {
  const setLoading = useAuthStore((state) => state.setLoading);
  const setToken = useAuthStore((state) => state.setToken);
  const isLoading = useAuthStore((state) => state.isLoading);
  const user = useAuthStore((state) => state.user);

  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  useEffect(() => {
    // Inicializar la app
    const initApp = async () => {
      try {
        // Setup Android notification channels
        await notificationService.setupAndroidChannel();

        // Register for push notifications
        await notificationService.registerForPushNotifications();

        // Verificar si hay un token guardado (Solo móvil, en web usaríamos localStorage pero por ahora omitimos)
        let token = null;
        if (Platform.OS !== 'web') {
          token = await SecureStore.getItemAsync('auth_token');
        }

        if (token) {
          setToken(token);
          // TODO: Verificar token con el backend y obtener usuario
        }
      } catch (error) {
        console.error('Error inicializando app:', error);
      } finally {
        setLoading(false);
        try {
          await SplashScreen.hideAsync();
        } catch (e) {
          // Ignorar error de splash screen en web
        }
      }
    };

    initApp();

    // Setup notification listeners
    notificationListener.current = notificationService.addNotificationReceivedListener(
      (notification) => {
        console.log('Notification received:', notification);
      }
    );

    responseListener.current = notificationService.addNotificationResponseListener(
      (response) => {
        console.log('Notification response:', response);
        const data = response.notification.request.content.data;
        // Handle navigation based on notification type
        if (data?.type === 'order_status' && data?.orderId) {
          // Navigation will be handled by the Navigation component
          console.log('Navigate to order:', data.orderId);
        }
      }
    );

    // Cleanup listeners on unmount
    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  // Save push token when user is authenticated
  useEffect(() => {
    if (user?.id) {
      notificationService.savePushToken(user.id);
    }
  }, [user?.id]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <ToastProvider>
          <StatusBar style="auto" />
          <Navigation />
        </ToastProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
});

