import React, { useState, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format, addDays, setHours, setMinutes, isBefore, isAfter } from 'date-fns';
import { es } from 'date-fns/locale';
import { COLORS, SIZES, SHADOWS } from '../../constants';
import Button from '../ui/Button';

interface ScheduledDeliveryModalProps {
    visible: boolean;
    onConfirm: (scheduledTime: Date | null) => void;
    onCancel: () => void;
}

const ScheduledDeliveryModal: React.FC<ScheduledDeliveryModalProps> = ({
    visible,
    onConfirm,
    onCancel,
}) => {
    const [selectedDay, setSelectedDay] = useState<Date | null>(null);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);

    // Generate available days (today + next 6 days)
    const availableDays = useMemo(() => {
        const days = [];
        const now = new Date();

        for (let i = 0; i < 7; i++) {
            const day = addDays(now, i);
            days.push({
                date: day,
                label: i === 0 ? 'Hoy' : i === 1 ? 'Mañana' : format(day, 'EEE d', { locale: es }),
                fullLabel: format(day, "EEEE d 'de' MMMM", { locale: es }),
            });
        }
        return days;
    }, []);

    // Generate time slots (8 AM to 10 PM, every 30 mins)
    const timeSlots = useMemo(() => {
        const slots = [];
        const now = new Date();
        const isToday = selectedDay && format(selectedDay, 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd');

        for (let hour = 8; hour <= 22; hour++) {
            for (let minutes of [0, 30]) {
                if (hour === 22 && minutes === 30) continue; // Skip 10:30 PM

                const timeString = `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
                const displayTime = format(
                    setMinutes(setHours(new Date(), hour), minutes),
                    'h:mm a'
                );

                // If today, only show future times + 1 hour buffer
                if (isToday) {
                    const slotTime = setMinutes(setHours(new Date(), hour), minutes);
                    const bufferTime = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now
                    if (isBefore(slotTime, bufferTime)) continue;
                }

                slots.push({
                    value: timeString,
                    label: displayTime,
                });
            }
        }
        return slots;
    }, [selectedDay]);

    const handleConfirm = () => {
        if (selectedDay && selectedTime) {
            const [hours, minutes] = selectedTime.split(':').map(Number);
            const scheduledDate = setMinutes(setHours(selectedDay, hours), minutes);
            onConfirm(scheduledDate);
        }
    };

    const handleAsap = () => {
        onConfirm(null); // null means "Lo antes posible"
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            statusBarTranslucent
        >
            <View style={styles.overlay}>
                <View style={styles.container}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.title}>📅 Programar Entrega</Text>
                        <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
                            <Ionicons name="close" size={24} color={COLORS.gray600} />
                        </TouchableOpacity>
                    </View>

                    {/* ASAP Option */}
                    <TouchableOpacity style={styles.asapButton} onPress={handleAsap}>
                        <Ionicons name="flash" size={20} color={COLORS.primary} />
                        <Text style={styles.asapText}>Lo antes posible</Text>
                        <Text style={styles.asapSubtext}>~30-45 min</Text>
                    </TouchableOpacity>

                    <View style={styles.divider} />

                    {/* Day Selection */}
                    <Text style={styles.sectionTitle}>Selecciona el día</Text>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.daysScroll}
                        contentContainerStyle={styles.daysContainer}
                    >
                        {availableDays.map((day, index) => (
                            <TouchableOpacity
                                key={index}
                                style={[
                                    styles.dayChip,
                                    selectedDay && format(selectedDay, 'yyyy-MM-dd') === format(day.date, 'yyyy-MM-dd') && styles.dayChipActive,
                                ]}
                                onPress={() => {
                                    setSelectedDay(day.date);
                                    setSelectedTime(null); // Reset time when day changes
                                }}
                            >
                                <Text style={[
                                    styles.dayChipText,
                                    selectedDay && format(selectedDay, 'yyyy-MM-dd') === format(day.date, 'yyyy-MM-dd') && styles.dayChipTextActive,
                                ]}>
                                    {day.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    {/* Time Selection */}
                    {selectedDay && (
                        <>
                            <Text style={styles.sectionTitle}>Selecciona la hora</Text>
                            <ScrollView
                                style={styles.timeSlotsScroll}
                                contentContainerStyle={styles.timeSlotsContainer}
                            >
                                {timeSlots.length > 0 ? (
                                    timeSlots.map((slot, index) => (
                                        <TouchableOpacity
                                            key={index}
                                            style={[
                                                styles.timeSlot,
                                                selectedTime === slot.value && styles.timeSlotActive,
                                            ]}
                                            onPress={() => setSelectedTime(slot.value)}
                                        >
                                            <Text style={[
                                                styles.timeSlotText,
                                                selectedTime === slot.value && styles.timeSlotTextActive,
                                            ]}>
                                                {slot.label}
                                            </Text>
                                        </TouchableOpacity>
                                    ))
                                ) : (
                                    <Text style={styles.noSlotsText}>
                                        No hay horarios disponibles para hoy
                                    </Text>
                                )}
                            </ScrollView>
                        </>
                    )}

                    {/* Confirm Button */}
                    <Button
                        title="Confirmar Horario"
                        onPress={handleConfirm}
                        disabled={!selectedDay || !selectedTime}
                        style={styles.confirmButton}
                    />
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    container: {
        backgroundColor: COLORS.white,
        borderTopLeftRadius: SIZES.radiusXl,
        borderTopRightRadius: SIZES.radiusXl,
        padding: SIZES.lg,
        maxHeight: '80%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SIZES.md,
    },
    title: {
        fontSize: SIZES.fontXl,
        fontWeight: '700',
        color: COLORS.gray900,
    },
    closeButton: {
        padding: SIZES.xs,
    },
    asapButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.primary + '10',
        borderRadius: SIZES.radiusMd,
        padding: SIZES.md,
        marginBottom: SIZES.md,
        gap: SIZES.sm,
    },
    asapText: {
        flex: 1,
        fontSize: SIZES.fontMd,
        fontWeight: '600',
        color: COLORS.gray800,
    },
    asapSubtext: {
        fontSize: SIZES.fontSm,
        color: COLORS.gray500,
    },
    divider: {
        height: 1,
        backgroundColor: COLORS.gray200,
        marginVertical: SIZES.md,
    },
    sectionTitle: {
        fontSize: SIZES.fontMd,
        fontWeight: '600',
        color: COLORS.gray700,
        marginBottom: SIZES.sm,
    },
    daysScroll: {
        marginBottom: SIZES.md,
    },
    daysContainer: {
        gap: SIZES.sm,
        paddingVertical: SIZES.xs,
    },
    dayChip: {
        paddingHorizontal: SIZES.md,
        paddingVertical: SIZES.sm,
        borderRadius: SIZES.radiusFull,
        backgroundColor: COLORS.gray100,
        borderWidth: 1,
        borderColor: COLORS.gray200,
    },
    dayChipActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    dayChipText: {
        fontSize: SIZES.fontSm,
        fontWeight: '500',
        color: COLORS.gray700,
    },
    dayChipTextActive: {
        color: COLORS.white,
    },
    timeSlotsScroll: {
        maxHeight: 200,
        marginBottom: SIZES.md,
    },
    timeSlotsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: SIZES.sm,
    },
    timeSlot: {
        paddingHorizontal: SIZES.md,
        paddingVertical: SIZES.sm,
        borderRadius: SIZES.radiusMd,
        backgroundColor: COLORS.gray100,
        borderWidth: 1,
        borderColor: COLORS.gray200,
        minWidth: 85,
        alignItems: 'center',
    },
    timeSlotActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    timeSlotText: {
        fontSize: SIZES.fontSm,
        fontWeight: '500',
        color: COLORS.gray700,
    },
    timeSlotTextActive: {
        color: COLORS.white,
    },
    noSlotsText: {
        fontSize: SIZES.fontSm,
        color: COLORS.gray500,
        fontStyle: 'italic',
        textAlign: 'center',
        paddingVertical: SIZES.lg,
    },
    confirmButton: {
        marginTop: SIZES.sm,
    },
});

export default ScheduledDeliveryModal;
