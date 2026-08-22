import { useEffect, useState } from "react";

import { supabase, signIn, signOut } from "../storage";

export function useAuth(onLogout?: () => void) {
  const [user, setUser] = useState<any>(null);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [showLogin, setShowLogin] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelled) return;

      const nextUser = session?.user ?? null;

      setUser((previousUser: any) => {
        const previousId = previousUser?.id ?? null;
        const nextId = nextUser?.id ?? null;

        if (previousId === nextId) {
          return previousUser;
        }

        return nextUser;
      });
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  async function handleLogin() {
    if (!loginEmail.trim() || !loginPassword) {
      setLoginError("Veuillez saisir votre email et votre mot de passe.");
      return;
    }

    setLoggingIn(true);
    setLoginError("");

    try {
      const { data, error } = await signIn(loginEmail, loginPassword);

      if (error || !data.user) {
        setLoginError("Email ou mot de passe incorrect.");
        return;
      }

      setLoginEmail("");
      setLoginPassword("");
      setShowLogin(false);
    } catch (error) {
      console.error("Erreur lors de la connexion :", error);

      setLoginError("Impossible de se connecter. Veuillez réessayer.");
    } finally {
      setLoggingIn(false);
    }
  }

  async function handleLogout() {
    try {
      await signOut();

      setUser(null);

      onLogout?.();
    } catch (error) {
      console.error("Erreur lors de la déconnexion :", error);
    }
  }

  return {
    user,

    loginEmail,
    setLoginEmail,

    loginPassword,
    setLoginPassword,

    loginError,
    setLoginError,

    showLogin,
    setShowLogin,

    loggingIn,

    handleLogin,
    handleLogout,
  };
}
