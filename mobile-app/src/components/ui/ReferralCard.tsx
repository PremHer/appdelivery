import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SIZES, SHADOWS } from '../../constants';
import { useAuthStore } from '../../context/stores';
import referralService, { ReferralData } from '../../services/referral.service';

interface ReferralCardProps {
    style?: any;
}

const ReferralCard: React.FC<ReferralCardProps> = ({ style }) => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<ReferralData | null>(null);
    const [inputCode, setInputCode] = useState('');
    const [applyingCode, setApplyingCode] = useState(false);
    const [showInput, setShowInput] = useState(false);
    const user = useAuthStore((state) => state.user);

    useEffect(() => {
        if (user) {
            loadReferralData();
        }
    }, [user]);

    const loadReferralData = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const stats = await referralService.getReferralStats(user.id);
            setData(stats);
        } catch (error) {
            console.error('Error loading referral data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleShare = async () => {
        if (data?.referralCode) {
            await referralService.shareReferralCode(data.referralCode);
        }
    };

    const handleCopy = async () => {
        if (data?.referralCode) {
            await referralService.copyToClipboard(data.referralCode);
        }
    };

    const handleApplyCode = async () => {
        if (!user || !inputCode.trim()) return;
        setApplyingCode(true);
        try {
            const success = await referralService.applyReferralCode(user.id, inputCode.trim());
            if (success) {
                setInputCode('');
                setShowInput(false);
            }
        } finally {
            setApplyingCode(false);
        }
    };

    if (!user) return null;

    if (loading) {
        return (
            <View style={[styles.container, style]}>
                <ActivityIndicator color={COLORS.primary} />
            </View>
        );
    }

    return (
        <View style={[styles.container, style]}>
            <LinearGradient
                colors={[COLORS.secondary, '#FFB300']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradient}
            >
                <View style={styles.header}>
                    <View style={styles.iconCircle}>
                        <Ionicons name="gift" size={24} color={COLORS.secondary} />
                    </View>
                    <Text style={styles.title}>Invita y Gana</Text>
                </View>

                <Text style={styles.description}>
                    Comparte tu código y gana <Text style={styles.bold}>S/10</Text> por cada amigo que haga su primer pedido
                </Text>

                {/* Your Code */}
                <View style={styles.codeContainer}>
                    <Text style={styles.codeLabel}>Tu código:</Text>
                    <View style={styles.codeBox}>
                        <Text style={styles.code}>{data?.referralCode || '---'}</Text>
                        <TouchableOpacity onPress={handleCopy} style={styles.copyButton}>
                            <Ionicons name="copy-outline" size={20} color={COLORS.gray800} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Stats */}
                <View style={styles.statsRow}>
                    <View style={styles.stat}>
                        <Text style={styles.statValue}>{data?.referredCount || 0}</Text>
                        <Text style={styles.statLabel}>Amigos invitados</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.stat}>
                        <Text style={styles.statValue}>S/{data?.totalEarnings || 0}</Text>
                        <Text style={styles.statLabel}>Ganado</Text>
                    </View>
                </View>

                {/* Share Button */}
                <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
                    <Ionicons name="share-social" size={20} color={COLORS.white} />
                    <Text style={styles.shareButtonText}>Compartir</Text>
                </TouchableOpacity>

                {/* Apply Code Section */}
                <TouchableOpacity
                    style={styles.applyCodeToggle}
                    onPress={() => setShowInput(!showInput)}
                >
                    <Text style={styles.applyCodeToggleText}>
                        ¿Tienes un código de amigo?
                    </Text>
                    <Ionicons
                        name={showInput ? 'chevron-up' : 'chevron-down'}
                        size={16}
                        color={COLORS.gray800}
                    />
                </TouchableOpacity>

                {showInput && (
                    <View style={styles.applyCodeContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder="Ingresa código"
                            placeholderTextColor={COLORS.gray400}
                            value={inputCode}
                            onChangeText={setInputCode}
                            autoCapitalize="characters"
                        />
                        <TouchableOpacity
                            style={styles.applyButton}
                            onPress={handleApplyCode}
                            disabled={applyingCode}
                        >
                            {applyingCode ? (
                                <ActivityIndicator size="small" color={COLORS.white} />
                            ) : (
                                <Text style={styles.applyButtonText}>Aplicar</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                )}
            </LinearGradient>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: SIZES.radiusLg,
        overflow: 'hidden',
        ...SHADOWS.medium,
    },
    gradient: {
        padding: SIZES.lg,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    iconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.white,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    title: {
        fontSize: SIZES.fontXl,
        fontWeight: '700',
        color: COLORS.gray900,
    },
    description: {
        fontSize: SIZES.fontSm,
        color: COLORS.gray800,
        lineHeight: 20,
        marginBottom: 16,
    },
    bold: {
        fontWeight: '700',
    },
    codeContainer: {
        marginBottom: 16,
    },
    codeLabel: {
        fontSize: SIZES.fontSm,
        color: COLORS.gray700,
        marginBottom: 4,
    },
    codeBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        borderRadius: SIZES.radiusSm,
        padding: 12,
    },
    code: {
        flex: 1,
        fontSize: SIZES.fontLg,
        fontWeight: '700',
        color: COLORS.gray900,
        letterSpacing: 2,
    },
    copyButton: {
        padding: 4,
    },
    statsRow: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.5)',
        borderRadius: SIZES.radiusSm,
        padding: 12,
        marginBottom: 16,
    },
    stat: {
        flex: 1,
        alignItems: 'center',
    },
    statDivider: {
        width: 1,
        backgroundColor: COLORS.gray300,
        marginHorizontal: 12,
    },
    statValue: {
        fontSize: SIZES.fontXl,
        fontWeight: '700',
        color: COLORS.gray900,
    },
    statLabel: {
        fontSize: 11,
        color: COLORS.gray700,
        marginTop: 2,
    },
    shareButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.primary,
        paddingVertical: 14,
        borderRadius: SIZES.radiusMd,
        gap: 8,
    },
    shareButtonText: {
        fontSize: SIZES.fontMd,
        fontWeight: '700',
        color: COLORS.white,
    },
    applyCodeToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 16,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.1)',
    },
    applyCodeToggleText: {
        fontSize: SIZES.fontSm,
        color: COLORS.gray800,
        marginRight: 4,
    },
    applyCodeContainer: {
        flexDirection: 'row',
        marginTop: 12,
        gap: 8,
    },
    input: {
        flex: 1,
        backgroundColor: COLORS.white,
        borderRadius: SIZES.radiusSm,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: SIZES.fontMd,
        fontWeight: '600',
    },
    applyButton: {
        backgroundColor: COLORS.accent,
        paddingHorizontal: 20,
        borderRadius: SIZES.radiusSm,
        justifyContent: 'center',
    },
    applyButtonText: {
        fontSize: SIZES.fontMd,
        fontWeight: '700',
        color: COLORS.white,
    },
});

export default ReferralCard;
