import { create } from 'zustand';
import { supabase, getCurrentSession } from '../features/supabase';

interface AuthUser {
    id: string;
    email: string;
    username: string;
}

interface AuthState {
    user: AuthUser | null;
    auth_user_id: string | null;
    email: string | null;
    access_token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    setSession: (
        auth_user_id: string,
        email: string,
        access_token: string,
        user?: AuthUser
    ) => Promise<void>;
    setUser: (user: AuthUser) => void;
    updateAccessToken: (access_token: string) => void;
    clearSession: () => Promise<void>;
    initializeAuth: () => Promise<void>;
    getValidToken: () => Promise<string | null>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
    user: null,
    auth_user_id: null,
    email: null,
    access_token: null,
    isAuthenticated: false,
    isLoading: true,

    initializeAuth: async () => {
        try {
            console.log('🔄 Inicializando autenticación...');
            const session = await getCurrentSession();
            if (session?.user) {
                console.log('✅ Sesión restaurada para usuario:', session.user.id);
                set({
                    access_token: session.access_token,
                    auth_user_id: session.user.id,
                    email: session.user.email,
                    user: {
                        id: session.user.id,
                        email: session.user.email || '',
                        username: session.user.user_metadata?.username || '',
                    },
                    isAuthenticated: true,
                    isLoading: false,
                });
            } else {
                console.log('⚠️ No hay sesión guardada');
                set({ isLoading: false });
            }
        } catch (error) {
            console.error('❌ Error al inicializar auth:', error);
            set({ isLoading: false });
        }
    },

    // ✅ Versión SIMPLIFICADA - Solo guardamos en memoria, no usamos setSession de Supabase
    setSession: async (auth_user_id, email, access_token, user) => {
        try {
            console.log('🔄 Guardando sesión en memoria...');
            
            // ✅ NO usamos supabase.auth.setSession() - solo guardamos en el store
            // La sesión real de Supabase se establece cuando el usuario hace login con email/contraseña
            // o con Google. El token que recibimos de Auth0 es para nuestro backend, no para Supabase.
            
            set({
                auth_user_id,
                email,
                access_token,
                user: user ?? { id: auth_user_id, email, username: '' },
                isAuthenticated: true,
                isLoading: false,
            });
            
            console.log('✅ Sesión guardada en memoria correctamente');
            
            // ✅ Verificar si hay sesión en Supabase (para logging)
            const session = await supabase.auth.getSession();
            console.log('📱 Sesión en Supabase:', session.data.session ? 'ACTIVA' : 'INACTIVA');
            
        } catch (error) {
            console.error('❌ Error en setSession:', error);
        }
    },

    setUser: (user) =>
        set({ user }),

    updateAccessToken: (access_token) =>
        set({ access_token, isAuthenticated: true }),

    clearSession: async () => {
        try {
            console.log('🔄 Cerrando sesión...');
            await supabase.auth.signOut();
            set({
                user: null,
                auth_user_id: null,
                email: null,
                access_token: null,
                isAuthenticated: false,
                isLoading: false,
            });
            console.log('✅ Sesión cerrada correctamente');
        } catch (error) {
            console.error('❌ Error al cerrar sesión:', error);
        }
    },

    getValidToken: async () => {
        try {
            const state = get();
            if (state.access_token) {
                console.log('✅ Token obtenido del store');
                return state.access_token;
            }
            return null;
        } catch (error) {
            console.error('❌ Error en getValidToken:', error);
            return null;
        }
    },
}));