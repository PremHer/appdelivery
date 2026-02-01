// Constantes de la aplicación

export const COLORS = {
    // Colores primarios
    primary: '#FF6B35',
    primaryDark: '#E55A2B',
    primaryLight: '#FF8C5A',

    // Colores secundarios
    secondary: '#2D3748',
    secondaryDark: '#1A202C',
    secondaryLight: '#4A5568',

    // Colores de acento
    accent: '#10B981',
    accentDark: '#059669',
    accentLight: '#34D399',

    // Estados
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',

    // Neutros
    white: '#FFFFFF',
    black: '#000000',
    background: '#F7FAFC',
    surface: '#FFFFFF',

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

    // Transparencias
    overlay: 'rgba(0, 0, 0, 0.5)',
    shadowColor: 'rgba(0, 0, 0, 0.1)',
};

export const FONTS = {
    regular: 'System',
    medium: 'System',
    semiBold: 'System',
    bold: 'System',
};

export const SIZES = {
    // Espaciado
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,

    // Radio de bordes
    radiusSm: 8,
    radiusMd: 12,
    radiusLg: 16,
    radiusXl: 24,
    radiusFull: 9999,

    // Tamaños de fuente
    fontXs: 10,
    fontSm: 12,
    fontMd: 14,
    fontLg: 16,
    fontXl: 18,
    fontXxl: 24,
    fontTitle: 32,

    // Iconos
    iconSm: 16,
    iconMd: 24,
    iconLg: 32,
    iconXl: 48,

    // Dimensiones de pantalla (se actualizan dinámicamente)
    screenWidth: 375,
    screenHeight: 812,
};

export const SHADOWS = {
    small: {
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
    },
    medium: {
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
        elevation: 4,
    },
    large: {
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.16,
        shadowRadius: 16,
        elevation: 8,
    },
};

export const API_CONFIG = {
    BASE_URL: __DEV__
        ? 'http://192.168.18.20:3000/api/v1' // Tu IP Local (visto en logs)
        : 'https://tu-api.com/api/v1',
    TIMEOUT: 15000,
};

export const SUPABASE_CONFIG = {
    URL: 'https://ffplqtpeclgbkqfjwuvq.supabase.co',
    ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmcGxxdHBlY2xnYmtxZmp3dXZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1NTkyMjAsImV4cCI6MjA4NTEzNTIyMH0.RZsrQSrbeR-Oc0uzCL1xwfR7qhz_Z4zmlKVTI80NJgk',
};

// Constantes de la app
export const APP_CONFIG = {
    name: 'DeliveryApp',
    currency: 'S/.',
    currencyCode: 'PEN',
    defaultLocation: {
        latitude: -12.0464,
        longitude: -77.0428,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
    },
};

// Categorías de iconos (emojis como placeholder)
export const CATEGORY_ICONS: Record<string, string> = {
    'comida-rapida': '🍔',
    'pizza': '🍕',
    'sushi': '🍣',
    'mexicana': '🌮',
    'postres': '🍰',
    'bebidas': '🥤',
    'saludable': '🥗',
    'asiatica': '🍜',
    'italiana': '🍝',
    'parrilla': '🥩',
};

// Estados del pedido con información visual
export const ORDER_STATUS_INFO: Record<string, { label: string; color: string; icon: string }> = {
    pending: { label: 'Pendiente', color: COLORS.warning, icon: 'time-outline' },
    confirmed: { label: 'Confirmado', color: COLORS.info, icon: 'checkmark-circle-outline' },
    preparing: { label: 'Preparando', color: COLORS.primary, icon: 'restaurant-outline' },
    ready: { label: 'Listo', color: COLORS.accent, icon: 'bag-check-outline' },
    picked_up: { label: 'En camino', color: COLORS.primary, icon: 'bicycle-outline' },
    delivered: { label: 'Entregado', color: COLORS.success, icon: 'checkmark-done-outline' },
    cancelled: { label: 'Cancelado', color: COLORS.error, icon: 'close-circle-outline' },
};
