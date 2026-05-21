/**
 * Reset Password Screen — "Void Emergence" design language
 * User arrives here from the email reset link with ?token=xxx
 */

import { useState, useEffect } from 'react';
import {
    View, Text, TextInput, Pressable, StyleSheet,
    KeyboardAvoidingView, Platform, ActivityIndicator,
    Dimensions,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
    useSharedValue, useAnimatedStyle,
    withTiming, withSpring, withDelay, withSequence,
    withRepeat, Easing,
} from 'react-native-reanimated';
import { Eye, EyeOff } from 'lucide-react-native';
import { haptics } from '../../services/haptics';
import api from '../../services/api';

const { width, height } = Dimensions.get('window');

const GOLD        = '#D4AF37';
const GOLD_BRIGHT = '#F2C84B';
const VOID        = '#05040E';
const TEXT_HI     = '#ECEAF6';
const TEXT_MID    = 'rgba(236,234,246,0.52)';
const TEXT_LO     = 'rgba(236,234,246,0.22)';
const BORDER      = 'rgba(236,234,246,0.08)';
const BORDER_GOLD = 'rgba(212,175,55,0.35)';

function AmbientBlob({ color, size, top, left, right, delay: d, duration }: {
    color: string; size: number; top: number;
    left?: number; right?: number; delay: number; duration: number;
}) {
    const scale = useSharedValue(0.85);
    const op    = useSharedValue(0);

    useEffect(() => {
        op.value    = withDelay(d, withTiming(1, { duration: 1400 }));
        scale.value = withDelay(d, withRepeat(
            withSequence(
                withTiming(1.15, { duration, easing: Easing.inOut(Easing.sin) }),
                withTiming(0.85, { duration, easing: Easing.inOut(Easing.sin) })
            ), -1, true
        ));
    }, []);

    const style = useAnimatedStyle(() => ({
        opacity: op.value,
        transform: [{ scale: scale.value }],
    }));

    return (
        <Animated.View style={[{
            position: 'absolute', width: size, height: size,
            borderRadius: size / 2, backgroundColor: color, top, left, right,
        }, style]} />
    );
}

export default function ResetPasswordScreen() {
    const { token } = useLocalSearchParams<{ token: string }>();

    const [password,  setPassword]  = useState('');
    const [confirm,   setConfirm]   = useState('');
    const [revealed,  setRevealed]  = useState(false);
    const [loading,   setLoading]   = useState(false);
    const [done,      setDone]      = useState(false);
    const [errorMsg,  setErrorMsg]  = useState<string | null>(null);

    const cardOp = useSharedValue(0);
    const cardY  = useSharedValue(24);
    const logoOp = useSharedValue(0);
    const logoY  = useSharedValue(12);
    const backOp = useSharedValue(0);

    useEffect(() => {
        backOp.value = withDelay(0,   withTiming(1, { duration: 400 }));
        logoOp.value = withDelay(80,  withTiming(1, { duration: 500 }));
        logoY.value  = withDelay(80,  withSpring(0, { stiffness: 100, damping: 18 }));
        cardOp.value = withDelay(250, withTiming(1, { duration: 500 }));
        cardY.value  = withDelay(250, withSpring(0, { stiffness: 80, damping: 18 }));
    }, []);

    const backStyle = useAnimatedStyle(() => ({ opacity: backOp.value }));
    const logoStyle = useAnimatedStyle(() => ({ opacity: logoOp.value, transform: [{ translateY: logoY.value }] }));
    const cardStyle = useAnimatedStyle(() => ({ opacity: cardOp.value, transform: [{ translateY: cardY.value }] }));
    const btnScale  = useSharedValue(1);
    const btnStyle  = useAnimatedStyle(() => ({ transform: [{ scale: btnScale.value }] }));

    if (!token) {
        return (
            <View style={[s.container, { alignItems: 'center', justifyContent: 'center' }]}>
                <LinearGradient colors={['#05040E', '#0C0A1C']} style={StyleSheet.absoluteFill} />
                <Text style={{ color: '#F87171', fontFamily: 'DMSans_400Regular', fontSize: 16, textAlign: 'center', paddingHorizontal: 32 }}>
                    Invalid or missing reset token.{'\n'}Please request a new password reset link.
                </Text>
                <Pressable style={{ marginTop: 24 }} onPress={() => router.replace('/(auth)/forgot-password')}>
                    <Text style={{ color: GOLD, fontFamily: 'DMSans_500Medium', fontSize: 15 }}>Request new link →</Text>
                </Pressable>
            </View>
        );
    }

    const handleReset = async () => {
        setErrorMsg(null);
        if (password.length < 8) {
            setErrorMsg('Password must be at least 8 characters.');
            return;
        }
        if (password !== confirm) {
            setErrorMsg('Passwords do not match.');
            return;
        }
        haptics.medium();
        btnScale.value = withSequence(
            withSpring(0.96, { stiffness: 400 }),
            withSpring(1,    { stiffness: 300 })
        );
        setLoading(true);
        try {
            await api.post('/auth/reset-password', { token, new_password: password });
            haptics.success();
            setDone(true);
        } catch (err: any) {
            haptics.error();
            const detail = err.response?.data?.detail;
            if (err.response?.status === 400) {
                setErrorMsg('This reset link has expired or already been used. Please request a new one.');
            } else {
                setErrorMsg(detail || 'Something went wrong. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const canSubmit = !!password && !!confirm && !loading;

    return (
        <View style={s.container}>
            <LinearGradient
                colors={['#05040E', '#0C0A1C', '#120F28', '#080614', '#05040E']}
                style={StyleSheet.absoluteFill}
                locations={[0, 0.25, 0.5, 0.75, 1]}
                start={{ x: 0.25, y: 0 }} end={{ x: 0.75, y: 1 }}
            />
            <AmbientBlob color="rgba(212,175,55,0.055)" size={340} top={height * 0.0}  left={-80} delay={200} duration={5400} />
            <AmbientBlob color="rgba(123,94,248,0.09)"  size={280} top={height * 0.06} right={-90} delay={400} duration={6600} />

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.kav}>
                <View style={s.inner}>

                    <Animated.View style={backStyle}>
                        <Pressable onPress={() => router.replace('/(auth)/sign-in')} style={s.back} hitSlop={12}>
                            <Text style={s.backText}>← Back to sign in</Text>
                        </Pressable>
                    </Animated.View>

                    <Animated.View style={[s.logoRow, logoStyle]}>
                        <Text style={s.logoVin}>vin</Text>
                        <Text style={s.logoR}>R</Text>
                    </Animated.View>

                    <Animated.View style={[s.card, cardStyle]}>
                        {done ? (
                            <View style={s.successWrap}>
                                <Text style={s.successIcon}>✅</Text>
                                <Text style={s.successTitle}>Password updated!</Text>
                                <Text style={s.successSub}>Your password has been reset successfully.</Text>
                                <Pressable
                                    style={s.signInBtn}
                                    onPress={() => router.replace('/(auth)/sign-in')}
                                >
                                    <LinearGradient
                                        colors={[GOLD_BRIGHT, GOLD, '#C9981C']}
                                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                                        style={s.primaryBtnGradient}
                                    >
                                        <Text style={s.primaryBtnText}>Sign in →</Text>
                                    </LinearGradient>
                                </Pressable>
                            </View>
                        ) : (
                            <>
                                <Text style={s.title}>Choose a new{'\n'}password</Text>
                                <Text style={s.subtitle}>Must be at least 8 characters.</Text>

                                {/* New password */}
                                <Text style={s.inputLabel}>New Password</Text>
                                <View style={[s.inputBox, { marginBottom: 14 }]}>
                                    <TextInput
                                        style={[s.input, { paddingRight: 48 }]}
                                        placeholder="At least 8 characters"
                                        placeholderTextColor={TEXT_LO}
                                        value={password}
                                        onChangeText={(t) => { setPassword(t); setErrorMsg(null); }}
                                        secureTextEntry={!revealed}
                                        autoComplete="new-password"
                                    />
                                    <Pressable
                                        style={s.eyeBtn}
                                        onPress={() => { haptics.light(); setRevealed(r => !r); }}
                                        hitSlop={10}
                                    >
                                        {revealed
                                            ? <EyeOff size={18} color={TEXT_LO} strokeWidth={1.6} />
                                            : <Eye    size={18} color={TEXT_LO} strokeWidth={1.6} />
                                        }
                                    </Pressable>
                                </View>

                                {/* Confirm password */}
                                <Text style={s.inputLabel}>Confirm Password</Text>
                                <View style={s.inputBox}>
                                    <TextInput
                                        style={s.input}
                                        placeholder="Repeat your password"
                                        placeholderTextColor={TEXT_LO}
                                        value={confirm}
                                        onChangeText={(t) => { setConfirm(t); setErrorMsg(null); }}
                                        secureTextEntry={!revealed}
                                        autoComplete="new-password"
                                    />
                                </View>

                                {errorMsg && (
                                    <View style={s.errorBox}>
                                        <Text style={s.errorIcon}>⚠</Text>
                                        <Text style={s.errorText}>{errorMsg}</Text>
                                    </View>
                                )}

                                <Animated.View style={[{ marginTop: 20 }, btnStyle]}>
                                    <Pressable
                                        style={[s.primaryBtn, !canSubmit && s.btnDisabled]}
                                        onPress={handleReset}
                                        disabled={!canSubmit}
                                    >
                                        <LinearGradient
                                            colors={canSubmit
                                                ? [GOLD_BRIGHT, GOLD, '#C9981C']
                                                : ['rgba(212,175,55,0.3)', 'rgba(212,175,55,0.2)']}
                                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                                            style={s.primaryBtnGradient}
                                        >
                                            {loading
                                                ? <ActivityIndicator color={VOID} />
                                                : <Text style={[s.primaryBtnText, !canSubmit && { color: 'rgba(5,4,14,0.5)' }]}>
                                                    Reset password →
                                                  </Text>
                                            }
                                        </LinearGradient>
                                    </Pressable>
                                </Animated.View>
                            </>
                        )}
                    </Animated.View>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
}

const s = StyleSheet.create({
    container: { flex: 1 },
    kav: { flex: 1 },
    inner: {
        flex: 1, paddingHorizontal: 28,
        paddingTop: Platform.OS === 'ios' ? 60 : 44,
        paddingBottom: 32, justifyContent: 'center',
    },

    back: { marginBottom: 28 },
    backText: { fontFamily: 'DMSans_400Regular', fontSize: 15, color: TEXT_LO, letterSpacing: 0.2 },

    logoRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 24 },
    logoVin: { fontFamily: 'DMSans_300Light', fontSize: 32, color: TEXT_HI, letterSpacing: -0.5 },
    logoR: {
        fontFamily: 'DMSans_700Bold', fontSize: 38, color: GOLD, letterSpacing: -0.5,
        textShadowColor: 'rgba(212,175,55,0.55)',
        textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 14,
    },

    card: {
        backgroundColor: 'rgba(12,10,28,0.75)',
        borderRadius: 24, padding: 22,
        borderWidth: 1, borderColor: 'rgba(236,234,246,0.07)',
    },

    title: {
        fontFamily: 'DMSans_600SemiBold', fontSize: 30, color: TEXT_HI,
        letterSpacing: -0.5, lineHeight: 36, marginBottom: 8,
    },
    subtitle: {
        fontFamily: 'DMSans_300Light', fontSize: 15, color: TEXT_MID,
        marginBottom: 24, letterSpacing: 0.1,
    },

    inputLabel: {
        fontFamily: 'DMSans_400Regular', fontSize: 12, color: TEXT_LO,
        letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 7,
    },
    inputBox: {
        borderRadius: 12, borderWidth: 1, borderColor: BORDER,
        backgroundColor: 'rgba(5,4,14,0.6)',
    },
    eyeBtn: {
        position: 'absolute', right: 14, top: 0, bottom: 0,
        justifyContent: 'center',
    },
    input: {
        paddingHorizontal: 16, paddingVertical: 14,
        fontFamily: 'DMSans_400Regular', fontSize: 16, color: TEXT_HI,
    },

    errorBox: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: 'rgba(220,38,38,0.12)',
        borderWidth: 1, borderColor: 'rgba(220,38,38,0.35)',
        borderRadius: 10, paddingVertical: 10, paddingHorizontal: 14,
        marginTop: 12, gap: 8,
    },
    errorIcon: { fontSize: 14, color: '#F87171' },
    errorText: { flex: 1, fontFamily: 'DMSans_400Regular', fontSize: 13, color: '#F87171', lineHeight: 18 },

    primaryBtn: { borderRadius: 14, overflow: 'hidden' },
    primaryBtnGradient: { paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
    primaryBtnText: { fontFamily: 'DMSans_600SemiBold', fontSize: 17, color: VOID, letterSpacing: 0.2 },
    btnDisabled: { opacity: 0.6 },

    successWrap: { alignItems: 'center', paddingVertical: 16 },
    successIcon: { fontSize: 44, marginBottom: 16 },
    successTitle: {
        fontFamily: 'DMSans_600SemiBold', fontSize: 24, color: TEXT_HI,
        marginBottom: 12, letterSpacing: -0.3,
    },
    successSub: {
        fontFamily: 'DMSans_300Light', fontSize: 15, color: TEXT_MID,
        textAlign: 'center', lineHeight: 22, marginBottom: 28,
    },
    signInBtn: { width: '100%', borderRadius: 14, overflow: 'hidden' },
});
