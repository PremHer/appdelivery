import { supabase } from './supabase';
import { Share, Alert } from 'react-native';
import * as Clipboard from 'expo-clipboard';

export interface ReferralData {
    referralCode: string;
    referredCount: number;
    totalEarnings: number;
    pendingRewards: number;
}

const REFERRAL_REWARD = 10; // S/. 10 por cada referido

class ReferralService {
    /**
     * Generate or get user's referral code
     */
    async getReferralCode(userId: string): Promise<string> {
        try {
            // Check if user already has a referral code
            const { data: profile, error } = await supabase
                .from('users')
                .select('referral_code')
                .eq('id', userId)
                .single();

            if (error) throw error;

            if (profile?.referral_code) {
                return profile.referral_code;
            }

            // Generate new referral code
            const code = this.generateCode(userId);

            // Save to database
            const { error: updateError } = await supabase
                .from('users')
                .update({ referral_code: code })
                .eq('id', userId);

            if (updateError) throw updateError;

            return code;
        } catch (error) {
            console.error('Error getting referral code:', error);
            throw error;
        }
    }

    /**
     * Generate a unique referral code
     */
    private generateCode(userId: string): string {
        const prefix = 'SAJINO';
        const suffix = userId.substring(0, 6).toUpperCase();
        return `${prefix}${suffix}`;
    }

    /**
     * Get referral statistics for a user
     */
    async getReferralStats(userId: string): Promise<ReferralData> {
        try {
            const referralCode = await this.getReferralCode(userId);

            // Count users who used this referral code
            const { count, error } = await supabase
                .from('users')
                .select('id', { count: 'exact', head: true })
                .eq('referred_by', referralCode);

            if (error) throw error;

            const referredCount = count || 0;
            const totalEarnings = referredCount * REFERRAL_REWARD;

            return {
                referralCode,
                referredCount,
                totalEarnings,
                pendingRewards: 0, // Could track unclaimed rewards
            };
        } catch (error) {
            console.error('Error getting referral stats:', error);
            return {
                referralCode: '',
                referredCount: 0,
                totalEarnings: 0,
                pendingRewards: 0,
            };
        }
    }

    /**
     * Apply referral code for a new user
     */
    async applyReferralCode(userId: string, referralCode: string): Promise<boolean> {
        try {
            // Validate the referral code exists
            const { data: referrer, error: findError } = await supabase
                .from('users')
                .select('id')
                .eq('referral_code', referralCode.toUpperCase())
                .single();

            if (findError || !referrer) {
                Alert.alert('Código inválido', 'El código de referido no existe');
                return false;
            }

            // Make sure user isn't referring themselves
            if (referrer.id === userId) {
                Alert.alert('Error', 'No puedes usar tu propio código');
                return false;
            }

            // Save the referral
            const { error: updateError } = await supabase
                .from('users')
                .update({ referred_by: referralCode.toUpperCase() })
                .eq('id', userId);

            if (updateError) throw updateError;

            Alert.alert('¡Éxito!', 'Código aplicado. ¡Recibirás S/10 después de tu primer pedido!');
            return true;
        } catch (error) {
            console.error('Error applying referral code:', error);
            Alert.alert('Error', 'No se pudo aplicar el código');
            return false;
        }
    }

    /**
     * Share referral code via native share sheet
     */
    async shareReferralCode(referralCode: string): Promise<void> {
        try {
            const message = `🐗 ¡Pide en Sajino Express!\n\nUsa mi código ${referralCode} y recibe S/10 de descuento en tu primer pedido.\n\n¡Ambos ganamos! 🎉\n\nDescarga: https://sajinoexpress.com/app`;

            await Share.share({
                message,
                title: 'Invita a tus amigos a Sajino Express',
            });
        } catch (error) {
            console.error('Error sharing:', error);
        }
    }

    /**
     * Copy referral code to clipboard
     */
    async copyToClipboard(referralCode: string): Promise<void> {
        try {
            await Clipboard.setStringAsync(referralCode);
            Alert.alert('¡Copiado!', 'Código copiado al portapapeles');
        } catch (error) {
            console.error('Error copying:', error);
        }
    }
}

export default new ReferralService();
