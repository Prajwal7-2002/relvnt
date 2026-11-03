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

function setSessionCookie(active) {
  if (typeof document !== "undefined") {
    if (active) {
      document.cookie = "relvnt_session=1; path=/; max-age=604800; SameSite=Lax";
    } else {
      document.cookie = "relvnt_session=; path=/; max-age=0; SameSite=Lax";
    }
  }
}

/**
 * Enterprise Auth Client wrapper with Zero-Lockout Graceful Fallback.
 * If live Supabase credentials are configured, delegates directly to Supabase Auth.
 * If credentials are not yet configured, operates in neutral local sandbox mode without crashing.
 */
export const authService = {
  isConfigured: isSupabaseConfigured,

  async signUp({ email, password, agencyName, auditorName }) {
    const finalAgency = (agencyName || "Your Agency").trim();
    const finalAuditor = (auditorName || "Lead Strategist").trim();

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            agency_name: finalAgency,
            auditor_name: finalAuditor,
          },
        },
      });
      if (error) throw error;
      setSessionCookie(true);
      return { user: data.user, session: data.session, mode: "live" };
    }

    // Local in-memory / storage fallback
    const mockUser = {
      id: "user-" + Date.now(),
      email,
      user_metadata: {
        agency_name: finalAgency,
        auditor_name: finalAuditor,
      },
    };
    if (typeof window !== "undefined") {
      localStorage.setItem("relvnt-auth-session", JSON.stringify(mockUser));
      localStorage.setItem("relvnt-agency-name", finalAgency);
      localStorage.setItem("relvnt-auditor-name", finalAuditor);
    }
    setSessionCookie(true);
    return { user: mockUser, session: null, mode: "local_sandbox" };
  },

  async signIn({ email, password }) {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      setSessionCookie(true);
      return { user: data.user, session: data.session, mode: "live" };
    }

    // Local in-memory / storage fallback with neutral defaults
    const savedAgency = typeof window !== "undefined"
      ? localStorage.getItem("relvnt-agency-name") || "Your Agency"
      : "Your Agency";
    const savedAuditor = typeof window !== "undefined"
      ? localStorage.getItem("relvnt-auditor-name") || "Lead Strategist"
      : "Lead Strategist";

    const mockUser = {
      id: "user-" + Date.now(),
      email,
      user_metadata: {
        agency_name: savedAgency,
        auditor_name: savedAuditor,
      },
    };
    if (typeof window !== "undefined") {
      localStorage.setItem("relvnt-auth-session", JSON.stringify(mockUser));
    }
    setSessionCookie(true);
    return { user: mockUser, session: null, mode: "local_sandbox" };
  },

  async signOut() {
    setSessionCookie(false);
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
      if (data?.session) {
        setSessionCookie(true);
        return { user: data.session.user, session: data.session, mode: "live" };
      }
    }
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("relvnt-auth-session");
      if (saved) {
        try {
          const user = JSON.parse(saved);
          setSessionCookie(true);
          return { user, session: null, mode: "local_sandbox" };
        } catch (_) {}
      }
    }
    setSessionCookie(false);
    return null;
  },
};
