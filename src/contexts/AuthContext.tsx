import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signUp: (email: string, password: string, userType: "ngo" | "student") => Promise<{ user: User; session: Session }>;
  signIn: (
    email: string,
    password: string,
    userTypeArg?: "ngo" | "student"
  ) => Promise<{ user: User; session: Session }>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
  userType: "ngo" | "student" | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userType, setUserType] = useState<"ngo" | "student" | null>(null);

  const resolveUserType = (authUser: User | null) => {
    const metaType = authUser?.user_metadata?.userType;
    if (metaType === "ngo" || metaType === "student") {
      return metaType;
    }
    return null;
  };

  // Check for existing session on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        setSession(data.session);
        setUser(data.session?.user || null);

        if (data.session?.user) {
          setUserType(resolveUserType(data.session.user));
        }
      } catch (error) {
        console.error("[SafeStory][Auth] Failed to initialize auth:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user || null);

      if (newSession?.user) {
        setUserType(resolveUserType(newSession.user));
      } else {
        setUserType(null);
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, userTypeArg: "ngo" | "student") => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            userType: userTypeArg,
          },
        },
      });

      if (error) throw error;
      if (!data.user) throw new Error("Sign up failed - user not created");

      setUserType(userTypeArg);
      setUser(data.user);
      if (data.session) {
        setSession(data.session);
      }

      // Handle email confirmation case
      if (!data.session) {
        console.info(
          `[SafeStory][Auth] User created: ${email} (${userTypeArg}) - Email confirmation required`
        );
        throw new Error(
          "Account created! Please check your email to confirm before signing in."
        );
      }

      console.info(`[SafeStory][Auth] User signed up: ${email} (${userTypeArg})`);
      return { user: data.user, session: data.session! };
    } catch (error) {
      console.error("[SafeStory][Auth] Sign up failed:", error);
      throw error;
    }
  };

  const signIn = async (email: string, password: string, userTypeArg?: "ngo" | "student") => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      if (!data.user || !data.session) throw new Error("Sign in failed - no user returned");

      let finalUser = data.user;
      let finalUserType = resolveUserType(data.user);

      if (!finalUserType && userTypeArg) {
        const { data: updated, error: updateError } = await supabase.auth.updateUser({
          data: { userType: userTypeArg },
        });
        if (updateError) throw updateError;
        finalUser = updated.user ?? data.user;
        finalUserType = userTypeArg;
      }

      setUser(finalUser);
      setSession(data.session);
      setUserType(finalUserType);

      console.info(`[SafeStory][Auth] User signed in: ${email}`);
      return { user: finalUser, session: data.session };
    } catch (error) {
      console.error("[SafeStory][Auth] Sign in failed:", error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setUser(null);
      setSession(null);
      setUserType(null);

      console.info("[SafeStory][Auth] User signed out");
    } catch (error) {
      console.error("[SafeStory][Auth] Sign out failed:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        signUp,
        signIn,
        signOut,
        isAuthenticated: !!user && !!session,
        userType,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
