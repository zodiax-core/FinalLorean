import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";

interface AuthContextType {
    user: User | null;
    session: Session | null;
    isAdmin: boolean;
    role: string | null;
    loading: boolean;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Clears all Supabase auth tokens from localStorage.
 * Called when a refresh token is found to be invalid/expired.
 */
function clearStaleAuthTokens() {
    try {
        // Remove the namespaced key we set in client.ts
        localStorage.removeItem('lorean-auth-token');
        // Also clear any legacy keys Supabase may have written
        const keysToRemove = Object.keys(localStorage).filter(
            k => k.startsWith('sb-') && k.includes('auth-token')
        );
        keysToRemove.forEach(k => localStorage.removeItem(k));
    } catch (_) {
        // localStorage unavailable — ignore
    }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [role, setRole] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchProfile = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', userId)
                .maybeSingle();

            if (error) throw error;
            setRole(data?.role ?? 'customer');
        } catch (err) {
            console.error("Error fetching profile:", err);
            setRole('customer');
        }
    };

    const signOut = async () => {
        clearStaleAuthTokens();
        await supabase.auth.signOut();
        setUser(null);
        setSession(null);
        setRole(null);
    };

    useEffect(() => {
        // ─── Initial session check ────────────────────────────────────────────
        supabase.auth.getSession().then(({ data: { session }, error }) => {
            if (error || !session) {
                // If there's an error (e.g. invalid token) or no session,
                // clean up any stale localStorage tokens immediately
                if (error) {
                    console.warn("[Auth] Session error on init — clearing stale tokens:", error.message);
                    clearStaleAuthTokens();
                }
                setSession(null);
                setUser(null);
                setRole(null);
            } else {
                setSession(session);
                setUser(session.user);
                fetchProfile(session.user.id);
            }
            setLoading(false);
        });

        // ─── Auth state listener ──────────────────────────────────────────────
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            console.log("[Auth] Event:", event);

            if (event === 'SIGNED_OUT') {
                // Clear any stale tokens on explicit sign-out
                clearStaleAuthTokens();
                setSession(null);
                setUser(null);
                setRole(null);
                setLoading(false);
                return;
            }

            if (event === 'TOKEN_REFRESHED' && !session) {
                // Token refresh failed — clear stale tokens and sign the user out
                console.warn("[Auth] Token refresh failed. Clearing stale session.");
                clearStaleAuthTokens();
                supabase.auth.signOut().catch(() => { });
                setSession(null);
                setUser(null);
                setRole(null);
                setLoading(false);
                return;
            }

            setSession(session);
            setUser(session?.user ?? null);

            if (session?.user) {
                fetchProfile(session.user.id);
            } else {
                setRole(null);
            }

            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const isAdmin = role === 'admin' || role === 'super_admin';

    return (
        <AuthContext.Provider value={{ user, session, isAdmin, role, loading, signOut }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
