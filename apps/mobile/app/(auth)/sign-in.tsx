/**
 * Sign In Screen — "Void Emergence" design language
 *
 * Consistent with WelcomeScreen palette, typography & atmosphere.
 * Ambient blobs + particles for depth. Gold focus states on inputs.
 * Staggered spring-based reveal animations. Liquid fill sign-in button.
 */

import { useState, useEffect, useRef } from 'react';
import {
    View, Text, TextInput, Pressable, StyleSheet,
    KeyboardAvoidingView, Platform, ActivityIndicator,
    Alert, Dimensions, // Alert kept for Apple OAuth fallback
} from 'react-native';
import { AuthService } from '../../services/auth';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
    useSharedValue, useAnimatedStyle,
    withTiming, withSpring, withDelay, withSequence,
    withRepeat, Easing, interpolate,
} from 'react-native-reanimated';
import { haptics } from '../../services/haptics';
import { Eye, EyeOff } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

// ─── Palette (matches WelcomeScreen) ─────────────────────────────────────────
const GOLD        = '#D4AF37';
const GOLD_BRIGHT = '#F2C84B';
const VOID        = '#05040E';
const TEXT_HI     = '#ECEAF6';
const TEXT_MID    = 'rgba(236,234,246,0.52)';
const TEXT_LO     = 'rgba(236,234,246,0.22)';
const BORDER      = 'rgba(236,234,246,0.08)';
const BORDER_GOLD = 'rgba(212,175,55,0.35)';

// ─── Ambient Blob ─────────────────────────────────────────────────────────────
function AmbientBlob({ color, size, top, left, right, delay: d, duration }: {
    color: string; size: number; top: number;
    left?: number; right?: number; delay: number; duration: number;
}) {
    const scale = useSharedValue(0.85);
    const op    = useSharedValue(0);
    const tx    = useSharedValue(0);
    const ty    = useSharedValue(0);

    useEffect(() => {
        op.value    = withDelay(d, withTiming(1, { duration: 1400 }));
        scale.value = withDelay(d, withRepeat(
            withSequence(
                withTiming(1.18, { duration, easing: Easing.inOut(Easing.sin) }),
                withTiming(0.85, { duration, easing: Easing.inOut(Easing.sin) })
            ), -1, true
        ));
        tx.value = withDelay(d + 400, withRepeat(
            withSequence(
                withTiming(28, { duration: duration * 1.3, easing: Easing.inOut(Easing.sin) }),
                withTiming(-28, { duration: duration * 1.3, easing: Easing.inOut(Easing.sin) })
            ), -1, true
        ));
        ty.value = withDelay(d + 900, withRepeat(
            withSequence(
                withTiming(-20, { duration: duration * 1.1, easing: Easing.inOut(Easing.sin) }),
                withTiming(20, { duration: duration * 1.1, easing: Easing.inOut(Easing.sin) })
            ), -1, true
        ));
    }, []);

    const style = useAnimatedStyle(() => ({
        opacity: op.value,
        transform: [{ scale: scale.value }, { translateX: tx.value }, { translateY: ty.value }],
    }));

    return (
        <Animated.View style={[{
            position: 'absolute', width: size, height: size,
            borderRadius: size / 2, backgroundColor: color, top, left, right,
        }, style]} />
    );
}

// ─── Particle ─────────────────────────────────────────────────────────────────
function Particle({ x, y, r, delay: d, color = GOLD_BRIGHT }: {
    x: number; y: number; r: number; delay: number; color?: string;
}) {
    const op = useSharedValue(0);
    const ty = useSharedValue(0);

    useEffect(() => {
        op.value = withDelay(d, withTiming(0.7, { duration: 1000 }));
        ty.value = withDelay(d, withRepeat(
            withSequence(
                withTiming(-14, { duration: 2800, easing: Easing.inOut(Easing.sin) }),
                withTiming(14,  { duration: 2800, easing: Easing.inOut(Easing.sin) })
            ), -1, true
        ));
    }, []);

    const style = useAnimatedStyle(() => ({
        opacity: op.value,
        transform: [{ translateY: ty.value }],
    }));

    return (
        <Animated.View style={[{
            position: 'absolute', left: x, top: y,
            width: r, height: r, borderRadius: r / 2,
            backgroundColor: color,
            shadowColor: color,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 1, shadowRadius: r * 3,
        }, style]} />
    );
}

// ─── Focused Input ────────────────────────────────────────────────────────────
function GoldInput({
    label, placeholder, value, onChangeText,
    keyboardType, autoCapitalize, autoComplete, secureTextEntry,
    delay: d,
}: {
    label: string;
    placeholder: string;
    value: string;
    onChangeText: (t: string) => void;
    keyboardType?: any;
    autoCapitalize?: any;
    autoComplete?: any;
    secureTextEntry?: boolean;
    delay: number;
}) {
    const [focused,  setFocused]  = useState(false);
    const [revealed, setRevealed] = useState(false);
    const slideY      = useSharedValue(16);
    const op          = useSharedValue(0);
    const focusBorder = useSharedValue(0);
    const eyeOp       = useSharedValue(0);

    useEffect(() => {
        op.value     = withDelay(d, withTiming(1, { duration: 500 }));
        slideY.value = withDelay(d, withSpring(0, { stiffness: 90, damping: 18 }));
        if (secureTextEntry) eyeOp.value = withDelay(d + 200, withTiming(1, { duration: 400 }));
    }, []);

    useEffect(() => {
        focusBorder.value = withTiming(focused ? 1 : 0, { duration: 220 });
    }, [focused]);

    const containerStyle = useAnimatedStyle(() => ({
        opacity: op.value,
        transform: [{ translateY: slideY.value }],
    }));

    const borderStyle = useAnimatedStyle(() => ({
        borderColor: focusBorder.value === 1 ? BORDER_GOLD : BORDER,
        shadowOpacity: focusBorder.value * 0.25,
    }));

    const eyeStyle = useAnimatedStyle(() => ({ opacity: eyeOp.value }));

    return (
        <Animated.View style={[s.inputWrap, containerStyle]}>
            <Text style={s.inputLabel}>{label}</Text>
            <Animated.View style={[s.inputBox, borderStyle]}>
                <TextInput
                    style={[s.input, secureTextEntry && { paddingRight: 48 }]}
                    placeholder={placeholder}
                    placeholderTextColor={TEXT_LO}
                    value={value}
                    onChangeText={onChangeText}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    keyboardType={keyboardType}
                    autoCapitalize={autoCapitalize ?? 'none'}
                    autoComplete={autoComplete}
                    secureTextEntry={secureTextEntry && !revealed}
                />
                {secureTextEntry && (
                    <Animated.View style={[s.eyeBtn, eyeStyle]}>
                        <Pressable
                            onPress={() => { haptics.light(); setRevealed(r => !r); }}
                            hitSlop={10}
                        >
                            {revealed
                                ? <EyeOff size={18} color={TEXT_LO} strokeWidth={1.6} />
                                : <Eye    size={18} color={TEXT_LO} strokeWidth={1.6} />
                            }
                        </Pressable>
                    </Animated.View>
                )}
            </Animated.View>
        </Animated.View>
    );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function SignInScreen() {
    const [email,    setEmail]    = useState('');
    const [password, setPassword] = useState('');
    const [loading,  setLoading]  = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    // Entry animations
    const backOp   = useSharedValue(0);
    const logoOp   = useSharedValue(0);
    const logoY    = useSharedValue(12);
    const headOp   = useSharedValue(0);
    const headY    = useSharedValue(16);
    const cardOp   = useSharedValue(0);
    const cardY    = useSharedValue(24);
    const footOp   = useSharedValue(0);

    useEffect(() => {
        backOp.value  = withDelay(0,   withTiming(1, { duration: 400 }));
        logoOp.value  = withDelay(80,  withTiming(1, { duration: 500 }));
        logoY.value   = withDelay(80,  withSpring(0, { stiffness: 100, damping: 18 }));
        headOp.value  = withDelay(200, withTiming(1, { duration: 500 }));
        headY.value   = withDelay(200, withSpring(0, { stiffness: 90, damping: 16 }));
        cardOp.value  = withDelay(320, withTiming(1, { duration: 500 }));
        cardY.value   = withDelay(320, withSpring(0, { stiffness: 80, damping: 18 }));
        footOp.value  = withDelay(700, withTiming(1, { duration: 400 }));
    }, []);

    const backStyle = useAnimatedStyle(() => ({ opacity: backOp.value }));
    const logoStyle = useAnimatedStyle(() => ({ opacity: logoOp.value, transform: [{ translateY: logoY.value }] }));
    const headStyle = useAnimatedStyle(() => ({ opacity: headOp.value, transform: [{ translateY: headY.value }] }));
    const cardStyle = useAnimatedStyle(() => ({ opacity: cardOp.value, transform: [{ translateY: cardY.value }] }));
    const footStyle = useAnimatedStyle(() => ({ opacity: footOp.value }));

    // Button press scale
    const btnScale = useSharedValue(1);
    const btnStyle = useAnimatedStyle(() => ({ transform: [{ scale: btnScale.value }] }));

    const handleSignIn = async () => {
        if (!email || !password) return;
        setErrorMsg(null);
        haptics.medium();
        btnScale.value = withSequence(
            withSpring(0.96, { stiffness: 400 }),
            withSpring(1,    { stiffness: 300 })
        );
        setLoading(true);
        try {
            await AuthService.signIn(email, password);
            haptics.success();
        } catch (err: any) {
            haptics.error();
            const status = err.response?.status;
            const detail = err.response?.data?.detail;
            if (status === 401) {
                setErrorMsg('Incorrect email or password. Please try again.');
            } else if (detail) {
                setErrorMsg(detail);
            } else {
                setErrorMsg('Something went wrong. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleOAuth = (strategy: 'oauth_google' | 'oauth_apple') => {
        haptics.medium();
        if (strategy === 'oauth_google') {
            router.push('/(auth)/google-sign-in');
        } else {
            Alert.alert('Coming soon', 'Apple sign-in coming next');
        }
    };

    const canSubmit = !!email && !!password && !loading;

    return (
        <View style={s.container}>
            {/* Background */}
            <LinearGradient
                colors={['#05040E', '#0C0A1C', '#120F28', '#080614', '#05040E']}
                style={StyleSheet.absoluteFill}
                locations={[0, 0.25, 0.5, 0.75, 1]}
                start={{ x: 0.25, y: 0 }}
                end={{ x: 0.75, y: 1 }}
            />
            <LinearGradient
                colors={['rgba(123,94,248,0.06)', 'transparent']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0.5, y: 0.2 }}
                end={{ x: 0.5, y: 1 }}
            />

            {/* Ambient blobs */}
            <AmbientBlob color="rgba(212,175,55,0.055)" size={380} top={height * 0.0}  left={-80}          delay={200} duration={5400} />
            <AmbientBlob color="rgba(123,94,248,0.09)"  size={320} top={height * 0.06} right={-90}         delay={400} duration={6600} />
            <AmbientBlob color="rgba(40,90,210,0.06)"   size={260} top={height * 0.62} right={-60}         delay={300} duration={7800} />
            <AmbientBlob color="rgba(212,175,55,0.04)"  size={220} top={height * 0.55} left={width * 0.2}  delay={600} duration={5000} />

            {/* Particles */}
            <Particle x={width * 0.10} y={height * 0.14} r={2.5} delay={600} />
            <Particle x={width * 0.84} y={height * 0.10} r={2}   delay={900} />
            <Particle x={width * 0.92} y={height * 0.44} r={2}   delay={1200} />
            <Particle x={width * 0.06} y={height * 0.60} r={2}   delay={1500} color="rgba(160,110,255,0.8)" />
            <Particle x={width * 0.76} y={height * 0.72} r={1.5} delay={1800} color="rgba(160,110,255,0.7)" />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={s.kav}
            >
                <View style={s.inner}>

                    {/* Back */}
                    <Animated.View style={backStyle}>
                        <Pressable onPress={() => router.back()} style={s.back} hitSlop={12}>
                            <Text style={s.backText}>← Back</Text>
                        </Pressable>
                    </Animated.View>

                    {/* Logo wordmark */}
                    <Animated.View style={[s.logoRow, logoStyle]}>
                        <Text style={s.logoVin}>vin</Text>
                        <Text style={s.logoR}>R</Text>
                    </Animated.View>

                    {/* Header */}
                    <Animated.View style={headStyle}>
                        <Text style={s.title}>Welcome winner</Text>
                        <Text style={s.subtitle}>You showed up today, that already matters</Text>
                    </Animated.View>

                    {/* Card */}
                    <Animated.View style={[s.card, cardStyle]}>

                        <GoldInput
                            label="Email"
                            placeholder="you@example.com"
                            value={email}
                            onChangeText={(t) => { setEmail(t); setErrorMsg(null); }}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoComplete="email"
                            delay={400}
                        />
                        <GoldInput
                            label="Password"
                            placeholder="••••••••"
                            value={password}
                            onChangeText={(t) => { setPassword(t); setErrorMsg(null); }}
                            autoComplete="password"
                            secureTextEntry
                            delay={500}
                        />

                        {/* Forgot */}
                        <Pressable style={s.forgotRow} onPress={() => router.push('/(auth)/forgot-password')}>
                            <Text style={s.forgotText}>Forgot password?</Text>
                        </Pressable>

                        {/* Inline error banner */}
                        {errorMsg && (
                            <View style={s.errorBox}>
                                <Text style={s.errorIcon}>⚠</Text>
                                <Text style={s.errorText}>{errorMsg}</Text>
                            </View>
                        )}

                        {/* Sign In button */}
                        <Animated.View style={btnStyle}>
                            <Pressable
                                style={[s.primaryBtn, !canSubmit && s.btnDisabled]}
                                onPress={handleSignIn}
                                disabled={!canSubmit}
                            >
                                <LinearGradient
                                    colors={canSubmit ? [GOLD_BRIGHT, GOLD, '#C9981C'] : ['rgba(212,175,55,0.3)', 'rgba(212,175,55,0.2)']}
                                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                                    style={s.primaryBtnGradient}
                                >
                                    {loading
                                        ? <ActivityIndicator color={VOID} />
                                        : <Text style={[s.primaryBtnText, !canSubmit && { color: 'rgba(5,4,14,0.5)' }]}>Sign in →</Text>
                                    }
                                </LinearGradient>
                            </Pressable>
                        </Animated.View>

                        {/* Divider */}
                        <View style={s.divider}>
                            <View style={s.dividerLine} />
                            <Text style={s.dividerText}>or continue with</Text>
                            <View style={s.dividerLine} />
                        </View>

                        {/* OAuth */}
                        <View style={s.oauthRow}>
                            <Pressable style={s.oauthBtn} onPress={() => handleOAuth('oauth_google')}>
                                <Text style={s.oauthIcon}>G</Text>
                                <Text style={s.oauthText}>Google</Text>
                            </Pressable>
                            <Pressable style={s.oauthBtn} onPress={() => handleOAuth('oauth_apple')}>
                                <Text style={s.oauthIcon}></Text>
                                <Text style={s.oauthText}>Apple</Text>
                            </Pressable>
                        </View>
                    </Animated.View>

                    {/* Switch to sign up */}
                    <Animated.View style={[s.switchRow, footStyle]}>
                        <Pressable onPress={() => router.replace('/(auth)/sign-up')} hitSlop={12}>
                            <Text style={s.switchBase}>Don't have an account?
                                <Text style={s.switchAccent}> Sign up →</Text>
                            </Text>
                        </Pressable>
                    </Animated.View>

                </View>
            </KeyboardAvoidingView>
        </View>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
    container: { flex: 1 },
    kav: { flex: 1 },
    inner: {
        flex: 1,
        paddingHorizontal: 28,
        paddingTop: Platform.OS === 'ios' ? 60 : 44,
        paddingBottom: 32,
        justifyContent: 'center',
    },

    back: { marginBottom: 28 },
    backText: {
        fontFamily: 'DMSans_400Regular',
        fontSize: 15, color: TEXT_LO,
        letterSpacing: 0.2,
    },

    logoRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginBottom: 24,
    },
    logoVin: {
        fontFamily: 'DMSans_300Light',
        fontSize: 32, color: TEXT_HI,
        letterSpacing: -0.5,
    },
    logoR: {
        fontFamily: 'DMSans_700Bold',
        fontSize: 38, color: GOLD,
        letterSpacing: -0.5,
        textShadowColor: 'rgba(212,175,55,0.55)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 14,
    },

    title: {
        fontFamily: 'DMSans_600SemiBold',
        fontSize: 34, color: TEXT_HI,
        letterSpacing: -0.5,
        marginBottom: 6,
    },
    subtitle: {
        fontFamily: 'DMSans_300Light',
        fontSize: 16, color: TEXT_MID,
        marginBottom: 28,
        letterSpacing: 0.1,
    },

    card: {
        backgroundColor: 'rgba(12,10,28,0.75)',
        borderRadius: 24,
        padding: 22,
        borderWidth: 1,
        borderColor: 'rgba(236,234,246,0.07)',
    },

    inputWrap: { marginBottom: 14 },
    inputLabel: {
        fontFamily: 'DMSans_400Regular',
        fontSize: 12, color: TEXT_LO,
        letterSpacing: 0.8,
        textTransform: 'uppercase',
        marginBottom: 7,
    },
    inputBox: {
        borderRadius: 12,
        borderWidth: 1,
        borderColor: BORDER,
        backgroundColor: 'rgba(5,4,14,0.6)',
        shadowColor: GOLD,
        shadowOffset: { width: 0, height: 0 },
        shadowRadius: 8,
        shadowOpacity: 0,
    },
    eyeBtn: {
        position: 'absolute',
        right: 14, top: 0, bottom: 0,
        justifyContent: 'center',
    },
    input: {
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontFamily: 'DMSans_400Regular',
        fontSize: 16, color: TEXT_HI,
    },

    errorBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(220,38,38,0.12)',
        borderWidth: 1,
        borderColor: 'rgba(220,38,38,0.35)',
        borderRadius: 10,
        paddingVertical: 10,
        paddingHorizontal: 14,
        marginBottom: 14,
        gap: 8,
    },
    errorIcon: {
        fontSize: 14,
        color: '#F87171',
    },
    errorText: {
        flex: 1,
        fontFamily: 'DMSans_400Regular',
        fontSize: 13,
        color: '#F87171',
        lineHeight: 18,
    },

    forgotRow: { alignSelf: 'flex-end', marginBottom: 18, marginTop: 2 },
    forgotText: {
        fontFamily: 'DMSans_400Regular',
        fontSize: 13, color: GOLD,
        letterSpacing: 0.1,
    },

    primaryBtn: { borderRadius: 14, overflow: 'hidden', marginBottom: 4 },
    primaryBtnGradient: {
        paddingVertical: 16,
        alignItems: 'center', justifyContent: 'center',
        shadowColor: GOLD_BRIGHT,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4, shadowRadius: 16,
    },
    primaryBtnText: {
        fontFamily: 'DMSans_600SemiBold',
        fontSize: 17, color: VOID,
        letterSpacing: 0.2,
    },
    btnDisabled: { opacity: 0.6 },

    divider: {
        flexDirection: 'row', alignItems: 'center',
        marginVertical: 20,
    },
    dividerLine: {
        flex: 1, height: 0.5,
        backgroundColor: 'rgba(236,234,246,0.08)',
    },
    dividerText: {
        fontFamily: 'DMSans_300Light',
        fontSize: 12, color: TEXT_LO,
        marginHorizontal: 12, letterSpacing: 0.3,
    },

    oauthRow: { flexDirection: 'row', gap: 10 },
    oauthBtn: {
        flex: 1, flexDirection: 'row',
        alignItems: 'center', justifyContent: 'center',
        backgroundColor: 'rgba(236,234,246,0.04)',
        borderRadius: 12, paddingVertical: 13,
        borderWidth: 1, borderColor: 'rgba(236,234,246,0.07)',
        gap: 8,
    },
    oauthIcon: {
        fontSize: 17, fontWeight: '700', color: TEXT_HI,
    },
    oauthText: {
        fontFamily: 'DMSans_400Regular',
        fontSize: 15, color: TEXT_MID,
    },

    switchRow: { alignItems: 'center', marginTop: 24 },
    switchBase: {
        fontFamily: 'DMSans_400Regular',
        fontSize: 14.5, color: TEXT_LO,
    },
    switchAccent: {
        fontFamily: 'DMSans_500Medium',
        color: GOLD,
    },
});