import { create } from 'zustand';

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
    setSession: (
        auth_user_id: string,
        email: string,
        access_token: string,
        user?: AuthUser
    ) => void;
    setUser: (user: AuthUser) => void;
    clearSession: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    auth_user_id: null,
    email: null,
    access_token: null,
    isAuthenticated: false,

    setSession: (auth_user_id, email, access_token, user) =>
        set({ auth_user_id, email, access_token, user: user ?? null, isAuthenticated: true }),

    setUser: (user) =>
        set({ user }),

    clearSession: () =>
        set({
            user: null,
            auth_user_id: null,
            email: null,
            access_token: null,
            isAuthenticated: false,
        }),
}));
