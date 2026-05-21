/**
 * Google Sign-In Screen — "Void Emergence" design language
 *
 * Focused OAuth entry point. Uses expo-auth-session to run the
 * Google OAuth flow, then exchanges the access token with the
 * VinR backend for a JWT pair.
 *
 * Required env vars (.env):
 *   EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID     — Web OAuth 2.0 client (Google Cloud Console)
 *   EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID     — iOS OAuth 2.0 client
 *   EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID — Android OAuth 2.0 client
 */

import { useState, useEffect } from 'react';
import {
    View, Text, Pressable, StyleSheet,
    ActivityIndicator, Alert, Dimensions, Platform,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import Animated, {
    useSharedValue, useAnimatedStyle,
    withTiming, withSpring, withDelay, withSequence,
    withRepeat, Easing,
} from 'react-native-reanimated';
import { haptics } from '../../services/haptics';
import { AuthService } from '../../services/auth';

WebBrowser.maybeCompleteAuthSession();

const { width, height } = Dimensions.get('window');

// ─── Palette (matches Void Emergence) ────────────────────────────────────────
const GOLD        = '#D4AF37';
const GOLD_BRIGHT = '#F2C84B';
const VOID        = '#05040E';
const TEXT_HI     = '#ECEAF6';
const TEXT_MID    = 'rgba(236,234,246,0.52)';
const TEXT_LO     = 'rgba(236,234,246,0.22)';

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
                withTiming(28,  { duration: duration * 1.3, easing: Easing.inOut(Easing.sin) }),
                withTiming(-28, { duration: duration * 1.3, easing: Easing.inOut(Easing.sin) })
            ), -1, true
        ));
        ty.value = withDelay(d + 900, withRepeat(
            withSequence(
                withTiming(-20, { duration: duration * 1.1, easing: Easing.inOut(Easing.sin) }),
                withTiming(20,  { duration: duration * 1.1, easing: Easing.inOut(Easing.sin) })
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

// ─── Floating Particle ────────────────────────────────────────────────────────
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

// ─── Google "G" SVG-like icon using Text ──────────────────────────────────────
function GoogleIcon({ size = 20 }: { size?: number }) {
    return (
        <View style={[s.googleIconWrap, { width: size, height: size }]}>
            <Text style={[s.googleIconG, { fontSize: size * 0.85 }]}>G</Text>
        </View>
    );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function GoogleSignInScreen() {
    const [loading, setLoading] = useState(false);

    const [request, response, promptAsync] = Google.useAuthRequest({
        clientId:         process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
        iosClientId:      process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
        androidClientId:  process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
        scopes:           ['profile', 'email'],
    });

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
        backOp.value = withDelay(0,   withTiming(1, { duration: 400 }));
        logoOp.value = withDelay(80,  withTiming(1, { duration: 500 }));
        logoY.value  = withDelay(80,  withSpring(0,  { stiffness: 100, damping: 18 }));
        headOp.value = withDelay(200, withTiming(1, { duration: 500 }));
        headY.value  = withDelay(200, withSpring(0,  { stiffness: 90, damping: 16 }));
        cardOp.value = withDelay(320, withTiming(1, { duration: 500 }));
        cardY.value  = withDelay(320, withSpring(0,  { stiffness: 80, damping: 18 }));
        footOp.value = withDelay(700, withTiming(1, { duration: 400 }));
    }, []);

    const backStyle = useAnimatedStyle(() => ({ opacity: backOp.value }));
    const logoStyle = useAnimatedStyle(() => ({ opacity: logoOp.value, transform: [{ translateY: logoY.value }] }));
    const headStyle = useAnimatedStyle(() => ({ opacity: headOp.value, transform: [{ translateY: headY.value }] }));
    const cardStyle = useAnimatedStyle(() => ({ opacity: cardOp.value, transform: [{ translateY: cardY.value }] }));
    const footStyle = useAnimatedStyle(() => ({ opacity: footOp.value }));

    const btnScale = useSharedValue(1);
    const btnStyle = useAnimatedStyle(() => ({ transform: [{ scale: btnScale.value }] }));

    // Handle OAuth response
    useEffect(() => {
        if (response?.type === 'success' && response.authentication?.accessToken) {
            handleGoogleSuccess(response.authentication.accessToken);
        } else if (response?.type === 'error') {
            haptics.error();
            Alert.alert('Google Sign In Error', response.error?.message || 'Something went wrong');
        }
    }, [response]);

    const handleGoogleSuccess = async (accessToken: string) => {
        setLoading(true);
        try {
            await AuthService.signInWithGoogle(accessToken);
            haptics.success();
            // Navigation is handled by AuthService → authStore → _layout.tsx
        } catch (err: any) {
            haptics.error();
            Alert.alert(
                'Sign In Failed',
                err.response?.data?.detail || err.message || 'Please try again',
            );
        } finally {
            setLoading(false);
        }
    };

    // Handle OAuth response
    useEffect(() => {
        if (response?.type === 'success' && response.authentication?.accessToken) {
            handleGoogleSuccess(response.authentication.accessToken);
        } else if (response?.type === 'error') {
            haptics.error();
            Alert.alert('Google Sign In Error', response.error?.message || 'Something went wrong');
        }
    }, [response]);

    const handlePress = async () => {
        if (!request) {
            Alert.alert(
                'Not configured',
                'Google sign-in is not set up yet. Please add Google OAuth client IDs to your .env file.',
            );
            return;
        }
        haptics.medium();
        btnScale.value = withSequence(
            withSpring(0.96, { stiffness: 400 }),
            withSpring(1,    { stiffness: 300 }),
        );
        await promptAsync();
    };

    return (
        <View style={s.container}>
            {/* Background gradient */}
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

            {/* Ambient depth */}
            <AmbientBlob color="rgba(212,175,55,0.055)" size={380} top={height * 0.0}  left={-80}          delay={200} duration={5400} />
            <AmbientBlob color="rgba(123,94,248,0.09)"  size={320} top={height * 0.06} right={-90}         delay={400} duration={6600} />
            <AmbientBlob color="rgba(66,133,244,0.07)"  size={260} top={height * 0.60} right={-60}         delay={300} duration={7800} />
            <AmbientBlob color="rgba(212,175,55,0.04)"  size={220} top={height * 0.54} left={width * 0.2}  delay={600} duration={5000} />

            <Particle x={width * 0.10} y={height * 0.14} r={2.5} delay={600} />
            <Particle x={width * 0.84} y={height * 0.10} r={2}   delay={900} />
            <Particle x={width * 0.92} y={height * 0.44} r={2}   delay={1200} />
            <Particle x={width * 0.06} y={height * 0.60} r={2}   delay={1500} color="rgba(160,110,255,0.8)" />
            <Particle x={width * 0.76} y={height * 0.72} r={1.5} delay={1800} color="rgba(66,133,244,0.7)" />

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
                    <Text style={s.title}>Continue your{'\n'}journey.</Text>
                    <Text style={s.subtitle}>Sign in securely with your Google account</Text>
                </Animated.View>

                {/* Card */}
                <Animated.View style={[s.card, cardStyle]}>

                    {/* Google button */}
                    <Animated.View style={btnStyle}>
                        <Pressable
                            style={[s.googleBtn, loading && s.btnDisabled]}
                            onPress={handlePress}
                            disabled={loading || !request}
                        >
                            {loading ? (
                                <ActivityIndicator color={VOID} />
                            ) : (
                                <>
                                    <GoogleIcon size={20} />
                                    <Text style={s.googleBtnText}>Continue with Google</Text>
                                </>
                            )}
                        </Pressable>
                    </Animated.View>

                    {/* Divider */}
                    <View style={s.divider}>
                        <View style={s.dividerLine} />
                        <Text style={s.dividerText}>or use email instead</Text>
                        <View style={s.dividerLine} />
                    </View>

                    {/* Email fallback links */}
                    <View style={s.emailRow}>
                        <Pressable
                            style={s.emailBtn}
                            onPress={() => router.replace('/(auth)/sign-in')}
                        >
                            <Text style={s.emailBtnText}>Sign in with email</Text>
                        </Pressable>
                        <Pressable
                            style={s.emailBtn}
                            onPress={() => router.replace('/(auth)/sign-up')}
                        >
                            <Text style={s.emailBtnText}>Create account</Text>
                        </Pressable>
                    </View>
                </Animated.View>

                {/* Privacy note */}
                <Animated.View style={[s.privacyRow, footStyle]}>
                    <Text style={s.privacyText}>
                        By continuing you agree to our{' '}
                        <Text style={s.privacyLink}>Terms</Text>
                        {' '}and{' '}
                        <Text style={s.privacyLink}>Privacy Policy</Text>
                    </Text>
                </Animated.View>

            </View>
        </View>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
    container: { flex: 1 },

    inner: {
        flex: 1,
        paddingHorizontal: 28,
        paddingTop: Platform.OS === 'ios' ? 60 : 44,
        paddingBottom: 40,
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
        letterSpacing: -0.5, lineHeight: 40,
        marginBottom: 8,
    },
    subtitle: {
        fontFamily: 'DMSans_300Light',
        fontSize: 16, color: TEXT_MID,
        marginBottom: 32,
        letterSpacing: 0.1,
    },

    card: {
        backgroundColor: 'rgba(12,10,28,0.75)',
        borderRadius: 24,
        padding: 22,
        borderWidth: 1,
        borderColor: 'rgba(236,234,246,0.07)',
    },

    // Google button — white surface for brand compliance
    googleBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        paddingVertical: 15,
        gap: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 4,
    },
    googleBtnText: {
        fontFamily: 'DMSans_600SemiBold',
        fontSize: 16,
        color: '#1F1F1F',
        letterSpacing: 0.1,
    },
    btnDisabled: { opacity: 0.5 },

    googleIconWrap: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    // Multicolor "G" using a bold font; real apps would use an SVG asset
    googleIconG: {
        fontWeight: '800',
        color: '#4285F4',
    },

    divider: {
        flexDirection: 'row',
        alignItems: 'center',
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

    emailRow: { flexDirection: 'row', gap: 10 },
    emailBtn: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(236,234,246,0.04)',
        borderRadius: 12,
        paddingVertical: 13,
        borderWidth: 1,
        borderColor: 'rgba(236,234,246,0.07)',
    },
    emailBtnText: {
        fontFamily: 'DMSans_400Regular',
        fontSize: 14, color: TEXT_MID,
    },

    privacyRow: { alignItems: 'center', marginTop: 28 },
    privacyText: {
        fontFamily: 'DMSans_300Light',
        fontSize: 12, color: TEXT_LO,
        textAlign: 'center',
        letterSpacing: 0.15,
        lineHeight: 18,
    },
    privacyLink: {
        fontFamily: 'DMSans_400Regular',
        color: GOLD,
    },
});
