import React from 'react';
import {
    TouchableOpacity,
    Text,
    StyleSheet,
    ActivityIndicator,
    ViewStyle,
    TextStyle,
} from 'react-native';
import { COLORS, SIZES, SHADOWS } from '../../constants';

interface ButtonProps {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
    size?: 'small' | 'medium' | 'large';
    disabled?: boolean;
    loading?: boolean;
    icon?: React.ReactNode;
    iconPosition?: 'left' | 'right';
    style?: ViewStyle;
    textStyle?: TextStyle;
    fullWidth?: boolean;
}

const Button: React.FC<ButtonProps> = ({
    title,
    onPress,
    variant = 'primary',
    size = 'medium',
    disabled = false,
    loading = false,
    icon,
    iconPosition = 'left',
    style,
    textStyle,
    fullWidth = false,
}) => {
    const getButtonStyle = (): ViewStyle[] => {
        const baseStyles: ViewStyle[] = [styles.base];

        // Variant styles
        switch (variant) {
            case 'primary':
                baseStyles.push(styles.primary);
                break;
            case 'secondary':
                baseStyles.push(styles.secondary);
                break;
            case 'outline':
                baseStyles.push(styles.outline);
                break;
            case 'ghost':
                baseStyles.push(styles.ghost);
                break;
        }

        // Size styles
        switch (size) {
            case 'small':
                baseStyles.push(styles.small);
                break;
            case 'medium':
                baseStyles.push(styles.medium);
                break;
            case 'large':
                baseStyles.push(styles.large);
                break;
        }

        if (disabled || loading) {
            baseStyles.push(styles.disabled);
        }

        if (fullWidth) {
            baseStyles.push(styles.fullWidth);
        }

        return baseStyles;
    };

    const getTextStyle = (): TextStyle[] => {
        const baseTextStyles: TextStyle[] = [styles.text];

        switch (variant) {
            case 'primary':
                baseTextStyles.push(styles.textPrimary);
                break;
            case 'secondary':
                baseTextStyles.push(styles.textSecondary);
                break;
            case 'outline':
            case 'ghost':
                baseTextStyles.push(styles.textOutline);
                break;
        }

        switch (size) {
            case 'small':
                baseTextStyles.push(styles.textSmall);
                break;
            case 'medium':
                baseTextStyles.push(styles.textMedium);
                break;
            case 'large':
                baseTextStyles.push(styles.textLarge);
                break;
        }

        return baseTextStyles;
    };

    return (
        <TouchableOpacity
            style={[...getButtonStyle(), style]}
            onPress={onPress}
            disabled={disabled || loading}
            activeOpacity={0.8}
        >
            {loading ? (
                <ActivityIndicator
                    color={variant === 'primary' ? COLORS.white : COLORS.primary}
                    size="small"
                />
            ) : (
                <>
                    {icon && iconPosition === 'left' && icon}
                    <Text style={[...getTextStyle(), textStyle]}>{title}</Text>
                    {icon && iconPosition === 'right' && icon}
                </>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    base: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: SIZES.radiusMd,
        gap: SIZES.sm,
    },
    // Variants
    primary: {
        backgroundColor: COLORS.primary,
        ...SHADOWS.medium,
    },
    secondary: {
        backgroundColor: COLORS.secondary,
        ...SHADOWS.medium,
    },
    outline: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: COLORS.primary,
    },
    ghost: {
        backgroundColor: 'transparent',
    },
    // Sizes
    small: {
        paddingVertical: SIZES.sm,
        paddingHorizontal: SIZES.md,
    },
    medium: {
        paddingVertical: SIZES.md - 4,
        paddingHorizontal: SIZES.lg,
    },
    large: {
        paddingVertical: SIZES.md,
        paddingHorizontal: SIZES.xl,
    },
    // States
    disabled: {
        opacity: 0.5,
    },
    fullWidth: {
        width: '100%',
    },
    // Text styles
    text: {
        fontWeight: '600',
    },
    textPrimary: {
        color: COLORS.white,
    },
    textSecondary: {
        color: COLORS.white,
    },
    textOutline: {
        color: COLORS.primary,
    },
    textSmall: {
        fontSize: SIZES.fontSm,
    },
    textMedium: {
        fontSize: SIZES.fontMd,
    },
    textLarge: {
        fontSize: SIZES.fontLg,
    },
});

export default Button;
