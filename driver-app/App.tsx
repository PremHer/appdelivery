import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { supabase } from './src/services/supabase';
import { Session } from '@supabase/supabase-js';
import LoginScreen from './src/screens/auth/LoginScreen';
import HomeScreen from './src/screens/home/HomeScreen';
import MainTabs from './src/navigation/MainTabs';
import OrderDetailScreen from './src/screens/orders/OrderDetailScreen';
import { View, ActivityIndicator } from 'react-native';
import { COLORS } from './src/constants';
import { ThemeProvider } from './src/context/ThemeContext';

import DeliveryMapScreen from './src/screens/orders/DeliveryMapScreen';
import ChatScreen from './src/screens/chat/ChatScreen';
import HistoryScreen from './src/screens/history/HistoryScreen';

const Stack = createStackNavigator();

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <ThemeProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {session ? (
            <>
              <Stack.Screen name="Main" component={MainTabs} />
              <Stack.Screen name="OrderDetail" component={OrderDetailScreen} options={{ headerShown: true, title: 'Detalle de Pedido' }} />
              <Stack.Screen name="DeliveryMap" component={DeliveryMapScreen as any} options={{ headerShown: true, title: 'Mapa de Entrega' }} />
              <Stack.Screen name="History" component={HistoryScreen} options={{ headerShown: true, title: 'Historial de Pedidos' }} />
              <Stack.Screen name="Chat" component={ChatScreen as any} options={{ headerShown: false }} />
            </>
          ) : (
            <Stack.Screen name="Login" component={LoginScreen} />
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </ThemeProvider>
  );
}

