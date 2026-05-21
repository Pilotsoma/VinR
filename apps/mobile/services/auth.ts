import api from './api';
import { useAuthStore } from '../stores/authStore';
import { setItemAsync, deleteItemAsync, getItemAsync } from '../utils/storage';

export const AuthService = {
    async signIn(email: string, password: string) {
        useAuthStore.getState().setLoading(true);
        try {
            const { data } = await api.post('/auth/login', { email, password });
            
            if (data.access_token) {
                await setItemAsync('authToken', data.access_token);
                await setItemAsync('refreshToken', data.refresh_token);
                useAuthStore.getState().setToken(data.access_token);
                
                // Get user profile
                return await this.getMe();
            }
        } catch (error: any) {
            if (error?.response?.status !== 401) {
                console.error('Sign in failed:', error);
            }
            throw error;
        } finally {
            useAuthStore.getState().setLoading(false);
        }
    },

    async signUp(email: string, password: string, name?: string) {
        useAuthStore.getState().setLoading(true);
        try {
            const { data } = await api.post('/auth/register', { email, password, name });
            
            if (data.access_token) {
                await setItemAsync('authToken', data.access_token);
                await setItemAsync('refreshToken', data.refresh_token);
                useAuthStore.getState().setToken(data.access_token);
                
                // Get user profile
                return await this.getMe();
            }
        } catch (error: any) {
            const detail = error?.response?.data?.detail;
            if (error?.response?.status !== 401) {
                console.error('Sign up failed:', detail || error.message || error);
            }
            throw error;
        } finally {
            useAuthStore.getState().setLoading(false);
        }
    },

    async getMe() {
        try {
            const { data: user } = await api.get('/auth/me');
            if (user) {
                const mappedUser = {
                    id: user.id,
                    email: user.email || '',
                    name: user.name || null,
                    avatarUrl: user.avatar_url || null,
                    onboardingComplete: user.onboarding_complete ?? false,
                    age: user.age || null,
                    primaryReason: user.primary_reason || null,
                    relaxationMethods: user.relaxation_methods || [],
                    timezone: user.timezone || "UTC"
                };
                useAuthStore.getState().setUser(mappedUser);
                return mappedUser;
            }
        } catch (error: any) {
            if (error?.response?.status !== 401) {
                console.error('Get me failed:', error);
            }
            return null;
        }
        return null;
    },

    async updateProfile(data: any) {
        try {
            // Map camelCase to snake_case for the API
            const payload: any = {};
            if (data.name !== undefined) payload.name = data.name;
            if (data.age !== undefined) payload.age = data.age;
            if (data.primaryReason !== undefined) payload.primary_reason = data.primaryReason;
            if (data.relaxationMethods !== undefined) payload.relaxation_methods = data.relaxationMethods;
            if (data.onboardingComplete !== undefined) payload.onboarding_complete = data.onboardingComplete;
            if (data.timezone !== undefined) payload.timezone = data.timezone;
            
            const { data: user } = await api.patch('/auth/me', payload);
            if (user) {
                return await this.getMe();
            }
        } catch (error) {
            console.error('Update profile failed:', error);
            throw error;
        }
    },

    async signInWithGoogle(accessToken: string) {
        useAuthStore.getState().setLoading(true);
        try {
            const { data } = await api.post('/auth/google', { access_token: accessToken });
            if (data.access_token) {
                await setItemAsync('authToken', data.access_token);
                await setItemAsync('refreshToken', data.refresh_token);
                useAuthStore.getState().setToken(data.access_token);
                return await this.getMe();
            }
        } catch (error: any) {
            console.error('Google sign in failed:', error);
            throw error;
        } finally {
            useAuthStore.getState().setLoading(false);
        }
    },

    async signOut() {
        useAuthStore.getState().setLoading(true);
        try {
            await deleteItemAsync('authToken');
            await deleteItemAsync('refreshToken');
            useAuthStore.getState().signOut();
        } finally {
            useAuthStore.getState().setLoading(false);
        }
    },

    async initAuth() {
        useAuthStore.getState().setLoading(true);
        try {
            const token = await getItemAsync('authToken');
            if (token) {
                useAuthStore.getState().setToken(token);
                const user = await this.getMe();
                if (!user) {
                    await this.signOut();
                }
            } else {
                useAuthStore.getState().signOut();
            }
        } catch (error) {
            console.error('Failed to init auth:', error);
            useAuthStore.getState().signOut();
        } finally {
            useAuthStore.getState().setLoading(false);
        }
    }
};
