import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
    TouchableOpacity,
    Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../../constants';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastConfig {
    message: string;
    type?: ToastType;
    duration?: number;
    icon?: string;
}

interface ToastContextType {
    showToast: (config: ToastConfig) => void;
    hideToast: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

const toastConfig: Record<ToastType, { bg: string; icon: string; iconColor: string }> = {
    success: { bg: '#10B981', icon: 'checkmark-circle', iconColor: '#fff' },
    error: { bg: '#EF4444', icon: 'close-circle', iconColor: '#fff' },
    warning: { bg: '#F59E0B', icon: 'warning', iconColor: '#fff' },
    info: { bg: '#3B82F6', icon: 'information-circle', iconColor: '#fff' },
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [visible, setVisible] = useState(false);
    const [config, setConfig] = useState<ToastConfig>({ message: '' });
    const translateY = useRef(new Animated.Value(-100)).current;
    const opacity = useRef(new Animated.Value(0)).current;
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const insets = useSafeAreaInsets();

    const showToast = useCallback((newConfig: ToastConfig) => {
        // Clear existing timeout
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        setConfig(newConfig);
        setVisible(true);

        // Animate in
        Animated.parallel([
            Animated.spring(translateY, {
                toValue: 0,
                useNativeDriver: true,
                tension: 80,
                friction: 10,
            }),
            Animated.timing(opacity, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
            }),
        ]).start();

        // Auto hide after duration
        const duration = newConfig.duration || 2500;
        timeoutRef.current = setTimeout(() => {
            hideToast();
        }, duration);
    }, []);

    const hideToast = useCallback(() => {
        Animated.parallel([
            Animated.timing(translateY, {
                toValue: -100,
                duration: 250,
                useNativeDriver: true,
            }),
            Animated.timing(opacity, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }),
        ]).start(() => {
            setVisible(false);
        });
    }, []);

    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    const type = config.type || 'info';
    const { bg, icon, iconColor } = toastConfig[type];

    return (
        <ToastContext.Provider value={{ showToast, hideToast }}>
            {children}
            {visible && (
                <Animated.View
                    style={[
                        styles.container,
                        {
                            top: insets.top + 10,
                            backgroundColor: bg,
                            transform: [{ translateY }],
                            opacity,
                        }
                    ]}
                >
                    <TouchableOpacity
                        style={styles.content}
                        onPress={hideToast}
                        activeOpacity={0.9}
                    >
                        <View style={styles.iconContainer}>
                            <Ionicons
                                name={config.icon as any || icon as any}
                                size={22}
                                color={iconColor}
                            />
                        </View>
                        <Text style={styles.message} numberOfLines={2}>
                            {config.message}
                        </Text>
                        <TouchableOpacity onPress={hideToast} style={styles.closeButton}>
                            <Ionicons name="close" size={18} color="rgba(255,255,255,0.7)" />
                        </TouchableOpacity>
                    </TouchableOpacity>
                </Animated.View>
            )}
        </ToastContext.Provider>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        left: 16,
        right: 16,
        zIndex: 9999,
        borderRadius: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 8,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
    },
    iconContainer: {
        marginRight: 12,
    },
    message: {
        flex: 1,
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
        lineHeight: 20,
    },
    closeButton: {
        marginLeft: 8,
        padding: 4,
    },
});

export default ToastProvider;
