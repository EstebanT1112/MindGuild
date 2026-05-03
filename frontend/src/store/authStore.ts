import { create } from 'zustand';

interface AuthState {
    auth_user_id: string | null;
    email: string | null;
    access_token: string | null;
    isAuthenticated: boolean;
    setSession: (auth_user_id: string, email: string, access_token: string) => void;
    clearSession: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    auth_user_id: null,
    email: null,
    access_token: null,
    isAuthenticated: false,

    setSession: (auth_user_id, email, access_token) =>
        set({ auth_user_id, email, access_token, isAuthenticated: true }),

    clearSession: () =>
        set({ auth_user_id: null, email: null, access_token: null, isAuthenticated: false }),
}));