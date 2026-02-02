import React, { useState, useEffect } from 'react';
import { NavigationContainer, LinkingOptions } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator, View } from 'react-native';
import * as Linking from 'expo-linking';

import { useAuthStore } from '../context/stores';
import { COLORS } from '../constants';

// Onboarding Screen
import OnboardingScreen from '../screens/onboarding/OnboardingScreen';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';

// Main Screens
import HomeScreen from '../screens/home/HomeScreen';
import RestaurantDetailScreen from '../screens/restaurant/RestaurantDetailScreen';
import CartScreen from '../screens/cart/CartScreen';
import CheckoutScreen from '../screens/order/CheckoutScreen';
import OrdersScreen from '../screens/order/OrdersScreen';
import FavoritesScreen from '../screens/favorites/FavoritesScreen';
import AddressListScreen from '../screens/address/AddressListScreen';
import AddAddressScreen from '../screens/address/AddAddressScreen';
import EditProfileScreen from '../screens/profile/EditProfileScreen';
import PaymentMethodsScreen from '../screens/profile/PaymentMethodsScreen';
import ProductDetailScreen from '../screens/product/ProductDetailScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import PlaceholderScreen from '../screens/PlaceholderScreen';
import OrderTrackingScreen from '../screens/order/OrderTrackingScreen';
import RatingScreen from '../screens/rating/RatingScreen';
import SearchScreen from '../screens/search/SearchScreen';
import ChatScreen from '../screens/chat/ChatScreen';



export type AuthStackParamList = {
    Login: undefined;
    Register: undefined;
    ForgotPassword: undefined;
};

export type MainTabParamList = {
    Home: undefined;
    Search: undefined;
    Orders: undefined;
    Favorites: undefined;
    Profile: undefined;
};

export type RootStackParamList = {
    MainTabs: undefined;
    Cart: undefined;
    RestaurantDetail: { id: string };
    ProductDetail: { product: any };
    Checkout: undefined;
    OrderTracking: { orderId: string };
    Rating: { orderId: string; restaurantId: string; restaurantName: string };
    SelectAddress: undefined;
    AddressList: { returnTo?: string };
    AddAddress: undefined;
    EditProfile: undefined;
    PaymentMethods: undefined;
    Search: undefined;
    Chat: { orderId: string; driverName?: string };
};

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const MainTab = createBottomTabNavigator<MainTabParamList>();
const RootStack = createNativeStackNavigator<RootStackParamList>();

// Deep linking configuration
const prefix = Linking.createURL('/');

const linking: LinkingOptions<RootStackParamList> = {
    prefixes: [prefix, 'deliveryapp://', 'https://sajinoexpress.com'],
    config: {
        screens: {
            MainTabs: {
                screens: {
                    Home: 'home',
                    Search: 'search',
                    Orders: 'orders',
                    Favorites: 'favorites',
                    Profile: 'profile',
                },
            },
            RestaurantDetail: 'restaurant/:id',
            ProductDetail: 'product/:id',
            OrderTracking: 'order/:orderId',
            Cart: 'cart',
            Checkout: 'checkout',
        },
    },
};

// Auth Navigator
const AuthNavigator = () => (
    <AuthStack.Navigator
        screenOptions={{
            headerShown: false,
        }}
    >
        <AuthStack.Screen name="Login" component={LoginScreen} />
        <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
);

// Tab Navigator (Main App)
const TabNavigator = () => (
    <MainTab.Navigator
        screenOptions={({ route }) => ({
            headerShown: false,
            tabBarIcon: ({ focused, color, size }) => {
                let iconName: keyof typeof Ionicons.glyphMap;

                switch (route.name) {
                    case 'Home':
                        iconName = focused ? 'home' : 'home-outline';
                        break;
                    case 'Search':
                        iconName = focused ? 'search' : 'search-outline';
                        break;
                    case 'Orders':
                        iconName = focused ? 'receipt' : 'receipt-outline';
                        break;
                    case 'Favorites':
                        iconName = focused ? 'heart' : 'heart-outline';
                        break;
                    case 'Profile':
                        iconName = focused ? 'person' : 'person-outline';
                        break;
                    default:
                        iconName = 'help-outline';
                }

                return <Ionicons name={iconName} size={size} color={color} />;
            },
            tabBarActiveTintColor: COLORS.primary,
            tabBarInactiveTintColor: COLORS.gray400,
            tabBarStyle: {
                backgroundColor: COLORS.white,
                borderTopWidth: 1,
                borderTopColor: COLORS.gray100,
                paddingBottom: 8,
                paddingTop: 8,
                height: 65,
            },
            tabBarLabelStyle: {
                fontSize: 12,
                fontWeight: '500',
            },
        })}
    >
        <MainTab.Screen
            name="Home"
            component={HomeScreen}
            options={{ tabBarLabel: 'Inicio' }}
        />
        <MainTab.Screen
            name="Search"
            component={SearchScreen}
            options={{ tabBarLabel: 'Buscar' }}
        />
        <MainTab.Screen
            name="Orders"
            component={OrdersScreen}
            options={{ tabBarLabel: 'Pedidos' }}
        />
        <MainTab.Screen
            name="Favorites"
            component={FavoritesScreen}
            options={{ tabBarLabel: 'Favoritos' }}
        />
        <MainTab.Screen
            name="Profile"
            component={ProfileScreen}
            options={{ tabBarLabel: 'Perfil' }}
        />
    </MainTab.Navigator>
);

// Root Navigator
const RootNavigator = () => (
    <RootStack.Navigator
        screenOptions={{
            headerShown: false,
        }}
    >
        <RootStack.Screen name="MainTabs" component={TabNavigator} />
        <RootStack.Screen
            name="Cart"
            component={CartScreen}
            options={{
                presentation: 'modal',
            }}
        />
        <RootStack.Screen
            name="RestaurantDetail"
            component={RestaurantDetailScreen}
        />
        <RootStack.Screen
            name="ProductDetail"
            component={ProductDetailScreen}
            options={{ presentation: 'modal', headerShown: false }}
        />
        <RootStack.Screen
            name="Checkout"
            component={CheckoutScreen}
            options={{ title: 'Checkout' }}
        />
        <RootStack.Screen
            name="AddressList"
            component={AddressListScreen}
        />
        <RootStack.Screen
            name="AddAddress"
            component={AddAddressScreen}
        />
        <RootStack.Screen
            name="EditProfile"
            component={EditProfileScreen}
        />
        <RootStack.Screen
            name="PaymentMethods"
            component={PaymentMethodsScreen}
        />
        <RootStack.Screen
            name="SelectAddress"
            component={AddressListScreen}
            options={{ title: 'Seleccionar Dirección' }}
        />
        <RootStack.Screen
            name="OrderTracking"
            component={OrderTrackingScreen}
            options={{ title: 'Seguimiento de Pedido' }}
        />
        <RootStack.Screen
            name="Rating"
            component={RatingScreen}
            options={{ headerShown: false }}
        />
        <RootStack.Screen
            name="Search"
            component={SearchScreen}
            options={{ headerShown: false }}
        />
        <RootStack.Screen
            name="Chat"
            component={ChatScreen}
            options={{ headerShown: false }}
        />
    </RootStack.Navigator>
);

// Onboarding Navigator
const OnboardingStack = createNativeStackNavigator();
const OnboardingNavigator = () => (
    <OnboardingStack.Navigator screenOptions={{ headerShown: false }}>
        <OnboardingStack.Screen name="Onboarding" component={OnboardingScreen} />
    </OnboardingStack.Navigator>
);

// Main Navigation Component
const Navigation = () => {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const isLoading = useAuthStore((state) => state.isLoading);
    const [isOnboardingComplete, setIsOnboardingComplete] = useState<boolean | null>(null);

    useEffect(() => {
        checkOnboarding();
    }, []);

    const checkOnboarding = async () => {
        try {
            const value = await AsyncStorage.getItem('onboarding_complete');
            setIsOnboardingComplete(value === 'true');
        } catch (error) {
            console.error('Error checking onboarding:', error);
            setIsOnboardingComplete(true); // Default to true on error
        }
    };

    const handleOnboardingComplete = () => {
        setIsOnboardingComplete(true);
    };

    // Show loading while checking onboarding
    if (isOnboardingComplete === null) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    // Onboarding Navigator (inline to access handleOnboardingComplete)
    const OnboardingNavigatorWithCallback = () => (
        <OnboardingStack.Navigator screenOptions={{ headerShown: false }}>
            <OnboardingStack.Screen name="Onboarding">
                {(props) => <OnboardingScreen {...props} onComplete={handleOnboardingComplete} />}
            </OnboardingStack.Screen>
        </OnboardingStack.Navigator>
    );

    return (
        <NavigationContainer linking={linking}>
            {!isOnboardingComplete ? (
                <OnboardingNavigatorWithCallback />
            ) : isAuthenticated ? (
                <RootNavigator />
            ) : (
                <AuthNavigator />
            )}
        </NavigationContainer>
    );
};

export default Navigation;
