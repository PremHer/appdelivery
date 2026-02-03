import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Light theme colors
export const lightColors = {
    // Colores primarios
    primary: '#2D2D2D',
    primaryDark: '#1A1A1A',
    primaryLight: '#4A4A4A',

    // Colores secundarios - Amarillo/Dorado
    secondary: '#F2A900',
    secondaryDark: '#D99600',
    secondaryLight: '#FFB81C',

    // Acento
    accent: '#00C853',
    accentDark: '#00A844',
    accentLight: '#5EFC82',

    // Estados
    success: '#00C853',
    warning: '#F2A900',
    error: '#EF4444',
    info: '#3B82F6',

    // Fondos
    background: '#F7FAFC',
    surface: '#FFFFFF',
    card: '#FFFFFF',

    // Texto
    text: '#111827',
    textSecondary: '#6B7280',
    textMuted: '#9CA3AF',

    // Bordes
    border: '#E5E7EB',
    borderLight: '#F3F4F6',

    // Otros
    white: '#FFFFFF',
    black: '#000000',
    overlay: 'rgba(0, 0, 0, 0.5)',
    shadowColor: 'rgba(0, 0, 0, 0.1)',

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
    gray900: '#111827',
};

// Dark theme colors
export const darkColors = {
    // Colores primarios
    primary: '#F2A900', // Swap: gold becomes primary in dark mode
    primaryDark: '#FFB81C',
    primaryLight: '#D99600',

    // Colores secundarios
    secondary: '#3A3A3A',
    secondaryDark: '#2D2D2D',
    secondaryLight: '#4A4A4A',

    // Acento
    accent: '#00E676',
    accentDark: '#00C853',
    accentLight: '#69F0AE',

    // Estados
    success: '#00E676',
    warning: '#FFD54F',
    error: '#FF5252',
    info: '#448AFF',

    // Fondos
    background: '#121212',
    surface: '#1E1E1E',
    card: '#2A2A2A',

    // Texto
    text: '#FFFFFF',
    textSecondary: '#B3B3B3',
    textMuted: '#7A7A7A',

    // Bordes
    border: '#3A3A3A',
    borderLight: '#2A2A2A',

    // Otros
    white: '#FFFFFF',
    black: '#000000',
    overlay: 'rgba(0, 0, 0, 0.7)',
    shadowColor: 'rgba(0, 0, 0, 0.3)',

    // Grises (invertidos)
    gray50: '#1A1A1A',
    gray100: '#2A2A2A',
    gray200: '#3A3A3A',
    gray300: '#4A4A4A',
    gray400: '#6B7280',
    gray500: '#9CA3AF',
    gray600: '#D1D5DB',
    gray700: '#E5E7EB',
    gray800: '#F3F4F6',
    gray900: '#F9FAFB',
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

const THEME_STORAGE_KEY = '@sajino_theme_mode';

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
