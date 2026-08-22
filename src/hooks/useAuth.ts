import { useEffect, useState } from "react";

import { supabase, signIn, signOut } from "../storage";

export type UserRole = "user" | "contributor" | "admin";

export function useAuth(onLogout?: () => void) {
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<UserRole | null>(null);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [showLogin, setShowLogin] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);

  /* =========================================================
     CHARGEMENT DU ROLE
     ========================================================= */

  async function loadRole(userId: string | null) {
    if (!userId) {
      setRole(null);
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      console.error("Erreur chargement rôle :", error);
      setRole(null);
      return;
    }

    const nextRole = data?.role;

    if (
      nextRole === "user" ||
      nextRole === "contributor" ||
      nextRole === "admin"
    ) {
      setRole(nextRole);
    } else {
      setRole(null);
    }
  }

  /* =========================================================
     AUTH STATE
     ========================================================= */

  useEffect(() => {
    let cancelled = false;

    async function initializeAuth() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (cancelled) return;

      const nextUser = session?.user ?? null;

      setUser(nextUser);

      await loadRole(nextUser?.id ?? null);
    }

    void initializeAuth();

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

      void loadRole(nextUser?.id ?? null);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  /* =========================================================
     LOGIN
     ========================================================= */

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

      /*
       * Recharge immédiatement le rôle après connexion.
       */
      await loadRole(data.user.id);

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

  /* =========================================================
     LOGOUT
     ========================================================= */

  async function handleLogout() {
    try {
      await signOut();

      setUser(null);
      setRole(null);

      onLogout?.();
    } catch (error) {
      console.error("Erreur lors de la déconnexion :", error);
    }
  }

  /* =========================================================
     PERMISSIONS
     ========================================================= */

  /*
   * ADMIN
   *
   * Accès complet à l'Admin Panel et aux fonctions
   * réservées à l'administration.
   */
  const isAdmin = role === "admin";

  /*
   * CONTRIBUTEUR
   *
   * Un admin possède également les permissions
   * du contributeur.
   */
  const isContributor = role === "contributor" || role === "admin";

  /*
   * GESTION DES HÉROS
   *
   * Les rôles user / contributor / admin peuvent gérer
   * leurs propres héros actifs.
   */
  const canManageHeroes =
    role === "user" || role === "contributor" || role === "admin";

  /*
   * AJOUT DE COMBATS
   *
   * Seuls contributor et admin peuvent alimenter
   * l'historique commun.
   */
  const canAddCombat = isContributor;

  /* =========================================================
     RETURN
     ========================================================= */

  return {
    user,

    role,

    isAdmin,
    isContributor,

    canManageHeroes,
    canAddCombat,

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
