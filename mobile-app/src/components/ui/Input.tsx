import React, { useState } from 'react';
import {
    View,
    TextInput,
    Text,
    StyleSheet,
    ViewStyle,
    TextInputProps,
    TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../constants';

interface InputProps extends TextInputProps {
    label?: string;
    error?: string;
    leftIcon?: keyof typeof Ionicons.glyphMap;
    rightIcon?: keyof typeof Ionicons.glyphMap;
    onRightIconPress?: () => void;
    containerStyle?: ViewStyle;
    isPassword?: boolean;
}

const Input: React.FC<InputProps> = ({
    label,
    error,
    leftIcon,
    rightIcon,
    onRightIconPress,
    containerStyle,
    isPassword = false,
    style,
    ...props
}) => {
    const [isFocused, setIsFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const getBorderColor = () => {
        if (error) return COLORS.error;
        if (isFocused) return COLORS.primary;
        return COLORS.gray300;
    };

    return (
        <View style={[styles.container, containerStyle]}>
            {label && <Text style={styles.label}>{label}</Text>}

            <View
                style={[
                    styles.inputContainer,
                    { borderColor: getBorderColor() },
                    isFocused && styles.focused,
                ]}
            >
                {leftIcon && (
                    <Ionicons
                        name={leftIcon}
                        size={20}
                        color={isFocused ? COLORS.primary : COLORS.gray400}
                        style={styles.leftIcon}
                    />
                )}

                <TextInput
                    style={[
                        styles.input,
                        leftIcon && styles.inputWithLeftIcon,
                        (rightIcon || isPassword) && styles.inputWithRightIcon,
                        style,
                    ]}
                    placeholderTextColor={COLORS.gray400}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    secureTextEntry={isPassword && !showPassword}
                    {...props}
                />

                {isPassword && (
                    <TouchableOpacity
                        onPress={() => setShowPassword(!showPassword)}
                        style={styles.rightIcon}
                    >
                        <Ionicons
                            name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                            size={20}
                            color={COLORS.gray400}
                        />
                    </TouchableOpacity>
                )}

                {rightIcon && !isPassword && (
                    <TouchableOpacity
                        onPress={onRightIconPress}
                        style={styles.rightIcon}
                        disabled={!onRightIconPress}
                    >
                        <Ionicons
                            name={rightIcon}
                            size={20}
                            color={COLORS.gray400}
                        />
                    </TouchableOpacity>
                )}
            </View>

            {error && <Text style={styles.error}>{error}</Text>}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: SIZES.md,
    },
    label: {
        fontSize: SIZES.fontMd,
        fontWeight: '500',
        color: COLORS.gray700,
        marginBottom: SIZES.sm,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        borderWidth: 1.5,
        borderRadius: SIZES.radiusMd,
        overflow: 'hidden',
    },
    focused: {
        borderWidth: 2,
    },
    input: {
        flex: 1,
        paddingVertical: SIZES.md - 2,
        paddingHorizontal: SIZES.md,
        fontSize: SIZES.fontLg,
        color: COLORS.gray900,
    },
    inputWithLeftIcon: {
        paddingLeft: 0,
    },
    inputWithRightIcon: {
        paddingRight: 0,
    },
    leftIcon: {
        paddingLeft: SIZES.md,
        paddingRight: SIZES.sm,
    },
    rightIcon: {
        paddingRight: SIZES.md,
        paddingLeft: SIZES.sm,
    },
    error: {
        fontSize: SIZES.fontSm,
        color: COLORS.error,
        marginTop: SIZES.xs,
    },
});

export default Input;
