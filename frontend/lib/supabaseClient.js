import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.startsWith("https://") &&
  supabaseAnonKey.length > 20
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/**
 * Enterprise Auth Client wrapper with Zero-Lockout Graceful Fallback.
 * If live Supabase credentials are configured, delegates directly to Supabase Auth.
 * If credentials are not yet configured, operates in local Demo/Guest Mode without crashing.
 */
export const authService = {
  isConfigured: isSupabaseConfigured,

  async signUp({ email, password, agencyName, auditorName }) {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            agency_name: agencyName || "Your Agency",
            auditor_name: auditorName || "Lead Strategist",
          },
        },
      });
      if (error) throw error;
      return { user: data.user, session: data.session, mode: "live" };
    }

    // Local in-memory / storage fallback
    const mockUser = {
      id: "demo-user-" + Date.now(),
      email,
      user_metadata: {
        agency_name: agencyName || "Your Agency",
        auditor_name: auditorName || "Lead Strategist",
      },
    };
    if (typeof window !== "undefined") {
      localStorage.setItem("relvnt-auth-session", JSON.stringify(mockUser));
      localStorage.setItem("relvnt-agency-name", agencyName || "Your Agency");
      localStorage.setItem("relvnt-auditor-name", auditorName || "Lead Strategist");
    }
    return { user: mockUser, session: null, mode: "local_demo" };
  },

  async signIn({ email, password }) {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      return { user: data.user, session: data.session, mode: "live" };
    }

    // Local in-memory / storage fallback
    const mockUser = {
      id: "demo-user-1",
      email,
      user_metadata: {
        agency_name: "BrandVitamin Advisory",
        auditor_name: "Bhagwan Das",
      },
    };
    if (typeof window !== "undefined") {
      localStorage.setItem("relvnt-auth-session", JSON.stringify(mockUser));
    }
    return { user: mockUser, session: null, mode: "local_demo" };
  },

  async signOut() {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    if (typeof window !== "undefined") {
      localStorage.removeItem("relvnt-auth-session");
    }
  },

  async getSession() {
    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase.auth.getSession();
      if (data?.session) return { user: data.session.user, session: data.session, mode: "live" };
    }
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("relvnt-auth-session");
      if (saved) {
        try {
          return { user: JSON.parse(saved), session: null, mode: "local_demo" };
        } catch (_) {}
      }
    }
    return null;
  },

  demoLogin({ agencyName = "BrandVitamin Advisory", auditorName = "Bhagwan Das", email = "demo@agency.com" }) {
    const mockUser = {
      id: "demo-agency-lead",
      email,
      user_metadata: {
        agency_name: agencyName,
        auditor_name: auditorName,
      },
    };
    if (typeof window !== "undefined") {
      localStorage.setItem("relvnt-auth-session", JSON.stringify(mockUser));
      localStorage.setItem("relvnt-agency-name", agencyName);
      localStorage.setItem("relvnt-auditor-name", auditorName);
    }
    return mockUser;
  },
};
