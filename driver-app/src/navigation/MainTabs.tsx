import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/home/HomeScreen';
import OrdersScreen from '../screens/orders/OrdersScreen';
import EarningsScreen from '../screens/earnings/EarningsScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import { Home, List, Wallet, User } from 'lucide-react-native';
import { COLORS } from '../constants';

const Tab = createBottomTabNavigator();

export default function MainTabs() {
    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: COLORS.primary,
                tabBarInactiveTintColor: COLORS.gray400,
                tabBarStyle: {
                    borderTopWidth: 1,
                    borderTopColor: COLORS.gray200,
                    height: 60,
                    paddingBottom: 8,
                    paddingTop: 8,
                },
            }}
        >
            <Tab.Screen
                name="Inicio"
                component={HomeScreen}
                options={{
                    tabBarIcon: ({ color, size }) => <Home color={color} size={size} />
                }}
            />
            <Tab.Screen
                name="Pedidos"
                component={OrdersScreen}
                options={{
                    tabBarIcon: ({ color, size }) => <List color={color} size={size} />
                }}
            />
            <Tab.Screen
                name="Ganancias"
                component={EarningsScreen}
                options={{
                    tabBarIcon: ({ color, size }) => <Wallet color={color} size={size} />
                }}
            />
            <Tab.Screen
                name="Perfil"
                component={ProfileScreen}
                options={{
                    tabBarIcon: ({ color, size }) => <User color={color} size={size} />
                }}
            />
        </Tab.Navigator>
    );
}

