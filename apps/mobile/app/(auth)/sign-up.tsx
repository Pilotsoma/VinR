/**
 * Sign Up Screen — "Void Emergence" design language
 *
 * Consistent with WelcomeScreen palette, typography & atmosphere.
 * Three-field form (name, email, password) with gold focus states.
 * Staggered spring-based reveal. Liquid fill CTA. Ambient depth.
 */

import { useState, useEffect } from 'react';
import {
    View, Text, TextInput, Pressable, StyleSheet,
    KeyboardAvoidingView, Platform, ActivityIndicator,
    Alert, Dimensions,
} from 'react-native';
import { AuthService } from '../../services/auth';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
    useSharedValue, useAnimatedStyle,
    withTiming, withSpring, withDelay, withSequence,
    withRepeat, Easing,
} from 'react-native-reanimated';
import { haptics } from '../../services/haptics';
import { Lock, Eye, EyeOff } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

// ─── Palette ──────────────────────────────────────────────────────────────────
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
                withTiming(1.15, { duration, easing: Easing.inOut(Easing.sin) }),
                withTiming(0.85, { duration, easing: Easing.inOut(Easing.sin) })
            ), -1, true
        ));
        tx.value = withDelay(d + 400, withRepeat(
            withSequence(
                withTiming(26, { duration: duration * 1.3, easing: Easing.inOut(Easing.sin) }),
                withTiming(-26, { duration: duration * 1.3, easing: Easing.inOut(Easing.sin) })
            ), -1, true
        ));
        ty.value = withDelay(d + 900, withRepeat(
            withSequence(
                withTiming(-18, { duration: duration * 1.1, easing: Easing.inOut(Easing.sin) }),
                withTiming(18, { duration: duration * 1.1, easing: Easing.inOut(Easing.sin) })
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

// ─── Gold Focus Input ─────────────────────────────────────────────────────────
function GoldInput({
    label, placeholder, value, onChangeText,
    keyboardType, autoCapitalize, autoComplete, secureTextEntry, delay: d,
}: {
    label: string; placeholder: string; value: string;
    onChangeText: (t: string) => void;
    keyboardType?: any; autoCapitalize?: any;
    autoComplete?: any; secureTextEntry?: boolean; delay: number;
}) {
    const [focused,  setFocused]  = useState(false);
    const [revealed, setRevealed] = useState(false);
    const slideY      = useSharedValue(16);
    const op          = useSharedValue(0);
    const focusBorder = useSharedValue(0);
    const eyeOp       = useSharedValue(0);

    useEffect(() => {
        op.value     = withDelay(d, withTiming(1,  { duration: 500 }));
        slideY.value = withDelay(d, withSpring(0,  { stiffness: 90, damping: 18 }));
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
export default function SignUpScreen() {
    const [name,     setName]     = useState('');
    const [email,    setEmail]    = useState('');
    const [password, setPassword] = useState('');
    const [loading,  setLoading]  = useState(false);

    // Entry animations
    const backOp  = useSharedValue(0);
    const logoOp  = useSharedValue(0);
    const logoY   = useSharedValue(12);
    const headOp  = useSharedValue(0);
    const headY   = useSharedValue(16);
    const cardOp  = useSharedValue(0);
    const cardY   = useSharedValue(24);
    const footOp  = useSharedValue(0);

    useEffect(() => {
        backOp.value  = withDelay(0,   withTiming(1, { duration: 400 }));
        logoOp.value  = withDelay(80,  withTiming(1, { duration: 500 }));
        logoY.value   = withDelay(80,  withSpring(0, { stiffness: 100, damping: 18 }));
        headOp.value  = withDelay(180, withTiming(1, { duration: 500 }));
        headY.value   = withDelay(180, withSpring(0, { stiffness: 90, damping: 16 }));
        cardOp.value  = withDelay(300, withTiming(1, { duration: 500 }));
        cardY.value   = withDelay(300, withSpring(0, { stiffness: 80, damping: 18 }));
        footOp.value  = withDelay(700, withTiming(1, { duration: 400 }));
    }, []);

    const backStyle = useAnimatedStyle(() => ({ opacity: backOp.value }));
    const logoStyle = useAnimatedStyle(() => ({ opacity: logoOp.value, transform: [{ translateY: logoY.value }] }));
    const headStyle = useAnimatedStyle(() => ({ opacity: headOp.value, transform: [{ translateY: headY.value }] }));
    const cardStyle = useAnimatedStyle(() => ({ opacity: cardOp.value, transform: [{ translateY: cardY.value }] }));
    const footStyle = useAnimatedStyle(() => ({ opacity: footOp.value }));

    const btnScale = useSharedValue(1);
    const btnStyle = useAnimatedStyle(() => ({ transform: [{ scale: btnScale.value }] }));

    const handleSignUp = async () => {
        if (!name || !email || !password) return;
        haptics.medium();
        btnScale.value = withSequence(
            withSpring(0.96, { stiffness: 400 }),
            withSpring(1,    { stiffness: 300 })
        );
        setLoading(true);
        try {
            await AuthService.signUp(email, password, name);
            haptics.success();
        } catch (err: any) {
            haptics.error();
            Alert.alert('Sign Up Failed', err.response?.data?.detail || err.message || 'Please try again');
        } finally {
            setLoading(false);
        }
    };

    const canSubmit = !!name && !!email && !!password && !loading;

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
            <AmbientBlob color="rgba(212,175,55,0.05)"  size={360} top={height * 0.0}  left={-80}          delay={200} duration={5200} />
            <AmbientBlob color="rgba(123,94,248,0.09)"  size={300} top={height * 0.05} right={-80}         delay={400} duration={6400} />
            <AmbientBlob color="rgba(40,90,210,0.06)"   size={240} top={height * 0.65} right={-50}         delay={300} duration={7600} />
            <AmbientBlob color="rgba(212,175,55,0.035)" size={200} top={height * 0.58} left={width * 0.22} delay={600} duration={4800} />

            {/* Particles */}
            <Particle x={width * 0.08}  y={height * 0.12} r={2.5} delay={500} />
            <Particle x={width * 0.86}  y={height * 0.09} r={2}   delay={800} />
            <Particle x={width * 0.93}  y={height * 0.48} r={2}   delay={1100} />
            <Particle x={width * 0.05}  y={height * 0.62} r={2}   delay={1400} color="rgba(160,110,255,0.8)" />
            <Particle x={width * 0.78}  y={height * 0.76} r={1.5} delay={1700} color="rgba(160,110,255,0.7)" />

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

                    {/* Logo */}
                    <Animated.View style={[s.logoRow, logoStyle]}>
                        <Text style={s.logoVin}>vin</Text>
                        <Text style={s.logoR}>R</Text>
                    </Animated.View>

                    {/* Header */}
                    <Animated.View style={headStyle}>
                        <Text style={s.title}>You are a{'\n'}winner.</Text>
                        <Text style={s.subtitle}>VinR is your growth partner</Text>
                    </Animated.View>

                    {/* Card */}
                    <Animated.View style={[s.card, cardStyle]}>

                        <GoldInput
                            label="Name"
                            placeholder="John Doe"
                            value={name}
                            onChangeText={setName}
                            autoCapitalize="words"
                            autoComplete="name"
                            delay={380}
                        />
                        <GoldInput
                            label="Email"
                            placeholder="you@example.com"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoComplete="email"
                            delay={460}
                        />
                        <GoldInput
                            label="Password"
                            placeholder="At least 8 characters"
                            value={password}
                            onChangeText={setPassword}
                            autoComplete="new-password"
                            secureTextEntry
                            delay={540}
                        />

                        {/* CTA */}
                        <Animated.View style={[{ marginTop: 8 }, btnStyle]}>
                            <Pressable
                                style={[s.primaryBtn, !canSubmit && s.btnDisabled]}
                                onPress={handleSignUp}
                                disabled={!canSubmit}
                            >
                                <LinearGradient
                                    colors={canSubmit ? [GOLD_BRIGHT, GOLD, '#C9981C'] : ['rgba(212,175,55,0.3)', 'rgba(212,175,55,0.2)']}
                                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                                    style={s.primaryBtnGradient}
                                >
                                    {loading
                                        ? <ActivityIndicator color={VOID} />
                                        : <Text style={[s.primaryBtnText, !canSubmit && { color: 'rgba(5,4,14,0.5)' }]}>
                                            Create account →
                                          </Text>
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

                        {/* Google sign-up */}
                        <Pressable
                            style={s.googleBtn}
                            onPress={() => { haptics.medium(); router.push('/(auth)/google-sign-in'); }}
                        >
                            <Text style={s.googleIcon}>G</Text>
                            <Text style={s.googleBtnText}>Sign up with Google</Text>
                        </Pressable>

                        {/* Privacy */}
                        <View style={s.privacyRow}>
                            <Lock size={11} color={TEXT_LO} strokeWidth={1.8} />
                            <Text style={s.privacyNote}>Encrypted · Never shared · Always yours</Text>
                        </View>
                    </Animated.View>

                    {/* Switch to sign in */}
                    <Animated.View style={[s.switchRow, footStyle]}>
                        <Pressable onPress={() => router.replace('/(auth)/sign-in')} hitSlop={12}>
                            <Text style={s.switchBase}>Already have an account?
                                <Text style={s.switchAccent}> Sign in →</Text>
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
        fontSize: 15, color: TEXT_LO, letterSpacing: 0.2,
    },

    logoRow: {
        flexDirection: 'row', alignItems: 'baseline',
        marginBottom: 24,
    },
    logoVin: {
        fontFamily: 'DMSans_300Light',
        fontSize: 32, color: TEXT_HI, letterSpacing: -0.5,
    },
    logoR: {
        fontFamily: 'DMSans_700Bold',
        fontSize: 38, color: GOLD, letterSpacing: -0.5,
        textShadowColor: 'rgba(212,175,55,0.55)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 14,
    },

    title: {
        fontFamily: 'DMSans_600SemiBold',
        fontSize: 34, color: TEXT_HI,
        letterSpacing: -0.5, lineHeight: 40,
        marginBottom: 6,
    },
    subtitle: {
        fontFamily: 'DMSans_300Light',
        fontSize: 16, color: TEXT_MID,
        marginBottom: 28, letterSpacing: 0.1,
    },

    card: {
        backgroundColor: 'rgba(12,10,28,0.75)',
        borderRadius: 24, padding: 22,
        borderWidth: 1,
        borderColor: 'rgba(236,234,246,0.07)',
    },

    inputWrap: { marginBottom: 14 },
    inputLabel: {
        fontFamily: 'DMSans_400Regular',
        fontSize: 12, color: TEXT_LO,
        letterSpacing: 0.8, textTransform: 'uppercase',
        marginBottom: 7,
    },
    inputBox: {
        borderRadius: 12, borderWidth: 1,
        borderColor: BORDER,
        backgroundColor: 'rgba(5,4,14,0.6)',
        shadowColor: GOLD,
        shadowOffset: { width: 0, height: 0 },
        shadowRadius: 8, shadowOpacity: 0,
    },
    eyeBtn: {
        position: 'absolute',
        right: 14, top: 0, bottom: 0,
        justifyContent: 'center',
    },
    input: {
        paddingHorizontal: 16, paddingVertical: 14,
        fontFamily: 'DMSans_400Regular',
        fontSize: 16, color: TEXT_HI,
    },

    primaryBtn: { borderRadius: 14, overflow: 'hidden' },
    primaryBtnGradient: {
        paddingVertical: 16,
        alignItems: 'center', justifyContent: 'center',
        shadowColor: GOLD_BRIGHT,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4, shadowRadius: 16,
    },
    primaryBtnText: {
        fontFamily: 'DMSans_600SemiBold',
        fontSize: 17, color: VOID, letterSpacing: 0.2,
    },
    btnDisabled: { opacity: 0.6 },

    divider: {
        flexDirection: 'row', alignItems: 'center',
        marginVertical: 18,
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

    googleBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        paddingVertical: 14,
        gap: 10,
        marginBottom: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 3,
    },
    googleIcon: {
        fontSize: 17, fontWeight: '800',
        color: '#4285F4',
    },
    googleBtnText: {
        fontFamily: 'DMSans_600SemiBold',
        fontSize: 15, color: '#1F1F1F',
        letterSpacing: 0.1,
    },

    privacyRow: {
        flexDirection: 'row', alignItems: 'center',
        justifyContent: 'center', gap: 5, marginTop: 16,
    },
    privacyNote: {
        fontFamily: 'DMSans_300Light',
        fontSize: 12, color: TEXT_LO, letterSpacing: 0.2,
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