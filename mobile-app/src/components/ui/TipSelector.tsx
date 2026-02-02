import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../constants';

interface TipSelectorProps {
    subtotal: number;
    selectedTip: number;
    onTipChange: (tip: number) => void;
}

const TIP_OPTIONS = [
    { label: 'Sin propina', value: 0 },
    { label: '10%', percentage: 10 },
    { label: '15%', percentage: 15 },
    { label: '20%', percentage: 20 },
    { label: 'Otro', value: -1 }, // Custom
];

const TipSelector: React.FC<TipSelectorProps> = ({
    subtotal,
    selectedTip,
    onTipChange,
}) => {
    const [showCustomInput, setShowCustomInput] = useState(false);
    const [customAmount, setCustomAmount] = useState('');
    const [selectedOption, setSelectedOption] = useState<number | null>(null);

    const handleOptionPress = (option: typeof TIP_OPTIONS[0], index: number) => {
        if (option.value === -1) {
            // Custom option
            setShowCustomInput(true);
            setSelectedOption(index);
        } else if (option.percentage) {
            // Percentage option
            const tipAmount = (subtotal * option.percentage) / 100;
            setSelectedOption(index);
            setShowCustomInput(false);
            setCustomAmount('');
            onTipChange(tipAmount);
        } else {
            // No tip
            setSelectedOption(index);
            setShowCustomInput(false);
            setCustomAmount('');
            onTipChange(0);
        }
    };

    const handleCustomAmountChange = (text: string) => {
        // Only allow numbers and decimal
        const cleaned = text.replace(/[^0-9.]/g, '');
        setCustomAmount(cleaned);
        const amount = parseFloat(cleaned) || 0;
        onTipChange(amount);
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Ionicons name="heart" size={20} color={COLORS.error} />
                <Text style={styles.title}>Propina para el repartidor</Text>
            </View>
            <Text style={styles.subtitle}>
                El 100% de tu propina va directamente al repartidor 💚
            </Text>

            <View style={styles.optionsContainer}>
                {TIP_OPTIONS.map((option, index) => {
                    const isSelected = selectedOption === index;
                    const displayValue = option.percentage
                        ? `S/ ${((subtotal * option.percentage) / 100).toFixed(2)}`
                        : option.label;

                    return (
                        <TouchableOpacity
                            key={index}
                            style={[
                                styles.optionButton,
                                isSelected && styles.optionButtonSelected,
                            ]}
                            onPress={() => handleOptionPress(option, index)}
                            activeOpacity={0.7}
                        >
                            <Text
                                style={[
                                    styles.optionLabel,
                                    isSelected && styles.optionLabelSelected,
                                ]}
                            >
                                {option.label}
                            </Text>
                            {option.percentage && (
                                <Text
                                    style={[
                                        styles.optionValue,
                                        isSelected && styles.optionValueSelected,
                                    ]}
                                >
                                    {displayValue}
                                </Text>
                            )}
                        </TouchableOpacity>
                    );
                })}
            </View>

            {showCustomInput && (
                <View style={styles.customInputContainer}>
                    <Text style={styles.currencyPrefix}>S/</Text>
                    <TextInput
                        style={styles.customInput}
                        placeholder="0.00"
                        placeholderTextColor={COLORS.gray400}
                        keyboardType="decimal-pad"
                        value={customAmount}
                        onChangeText={handleCustomAmountChange}
                        autoFocus
                    />
                </View>
            )}

            {selectedTip > 0 && (
                <View style={styles.tipSummary}>
                    <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
                    <Text style={styles.tipSummaryText}>
                        Propina: S/ {selectedTip.toFixed(2)}
                    </Text>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: COLORS.white,
        borderRadius: SIZES.radiusMd,
        padding: SIZES.md,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
    },
    title: {
        fontSize: SIZES.fontMd,
        fontWeight: '700',
        color: COLORS.gray900,
    },
    subtitle: {
        fontSize: SIZES.fontSm,
        color: COLORS.gray500,
        marginBottom: SIZES.md,
    },
    optionsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    optionButton: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: SIZES.radiusSm,
        backgroundColor: COLORS.gray100,
        alignItems: 'center',
        minWidth: '18%',
        flexGrow: 1,
    },
    optionButtonSelected: {
        backgroundColor: COLORS.accent,
    },
    optionLabel: {
        fontSize: SIZES.fontSm,
        fontWeight: '600',
        color: COLORS.gray700,
    },
    optionLabelSelected: {
        color: COLORS.white,
    },
    optionValue: {
        fontSize: 10,
        color: COLORS.gray500,
        marginTop: 2,
    },
    optionValueSelected: {
        color: COLORS.white,
    },
    customInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.gray100,
        borderRadius: SIZES.radiusSm,
        paddingHorizontal: 12,
        marginTop: SIZES.sm,
    },
    currencyPrefix: {
        fontSize: SIZES.fontLg,
        fontWeight: '600',
        color: COLORS.gray700,
        marginRight: 8,
    },
    customInput: {
        flex: 1,
        fontSize: SIZES.fontLg,
        fontWeight: '600',
        color: COLORS.gray900,
        paddingVertical: 12,
    },
    tipSummary: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: SIZES.sm,
        paddingTop: SIZES.sm,
        borderTopWidth: 1,
        borderTopColor: COLORS.gray100,
    },
    tipSummaryText: {
        fontSize: SIZES.fontSm,
        fontWeight: '600',
        color: COLORS.success,
    },
});

export default TipSelector;
