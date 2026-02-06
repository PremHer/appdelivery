import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Light theme colors (current colors)
export const lightColors = {
    primary: '#FF6B35',
    primaryDark: '#E55A2B',
    primaryLight: '#FF8F66',
    secondary: '#2D3748',

    // Estados
    success: '#10B981',
    error: '#EF4444',
    warning: '#F59E0B',
    info: '#3B82F6',

    // Fondos
    background: '#F5F5F5',
    surface: '#FFFFFF',
    card: '#FFFFFF',

    // Texto
    text: '#1F2937',
    textSecondary: '#6B7280',
    textMuted: '#9CA3AF',

    // Bordes
    border: '#E5E7EB',
    borderLight: '#F3F4F6',

    // Neutros
    white: '#FFFFFF',
    black: '#000000',
    overlay: 'rgba(0, 0, 0, 0.5)',

    // Grises
    gray50: '#F9FAFB',
    gray100: '#F3F4F6',
    gray200: '#E5E7EB',
    gray300: '#D1D5DB',
    gray400: '#9CA3AF',
    gray500: '#6B7280',
    gray600: '#4B5563',
    gray700: '#374151',
    gray800: '#1F2937',
};

// Dark theme colors
export const darkColors = {
    primary: '#FF6B35', // Keep orange as primary
    primaryDark: '#FF8F66',
    primaryLight: '#E55A2B',
    secondary: '#4A5568',

    // Estados (más brillantes para dark mode)
    success: '#34D399',
    error: '#F87171',
    warning: '#FBBF24',
    info: '#60A5FA',

    // Fondos oscuros
    background: '#0F0F0F',
    surface: '#1A1A1A',
    card: '#252525',

    // Texto claro
    text: '#FFFFFF',
    textSecondary: '#A0AEC0',
    textMuted: '#718096',

    // Bordes
    border: '#333333',
    borderLight: '#2A2A2A',

    // Neutros
    white: '#FFFFFF',
    black: '#000000',
    overlay: 'rgba(0, 0, 0, 0.7)',

    // Grises invertidos
    gray50: '#1A1A1A',
    gray100: '#252525',
    gray200: '#333333',
    gray300: '#404040',
    gray400: '#718096',
    gray500: '#A0AEC0',
    gray600: '#CBD5E0',
    gray700: '#E2E8F0',
    gray800: '#F7FAFC',
};

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
    theme: 'light' | 'dark';
    themeMode: ThemeMode;
    colors: typeof lightColors;
    isDark: boolean;
    setThemeMode: (mode: ThemeMode) => void;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@driver_theme_mode';

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const systemColorScheme = useColorScheme();
    const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
    const [isLoaded, setIsLoaded] = useState(false);

    // Load saved theme preference
    useEffect(() => {
        AsyncStorage.getItem(THEME_STORAGE_KEY).then((saved) => {
            if (saved === 'light' || saved === 'dark' || saved === 'system') {
                setThemeModeState(saved);
            }
            setIsLoaded(true);
        });
    }, []);

    // Determine actual theme based on mode
    const theme: 'light' | 'dark' =
        themeMode === 'system'
            ? (systemColorScheme || 'light')
            : themeMode;

    const isDark = theme === 'dark';
    const colors = isDark ? darkColors : lightColors;

    const setThemeMode = async (mode: ThemeMode) => {
        setThemeModeState(mode);
        await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    };

    const toggleTheme = () => {
        const newMode = isDark ? 'light' : 'dark';
        setThemeMode(newMode);
    };

    if (!isLoaded) return null;

    return (
        <ThemeContext.Provider
            value={{
                theme,
                themeMode,
                colors,
                isDark,
                setThemeMode,
                toggleTheme,
            }}
        >
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

export default ThemeContext;
