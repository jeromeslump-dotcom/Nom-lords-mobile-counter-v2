import { useEffect, useState } from "react";

import { getCurrentUser, signIn, signOut } from "../storage";

export function useAuth(onLogout?: () => void) {
  const [user, setUser] = useState<any>(null);

  const [loginEmail, setLoginEmail] = useState("");

  const [loginPassword, setLoginPassword] = useState("");

  const [loginError, setLoginError] = useState("");

  const [showLogin, setShowLogin] = useState(false);

  const [loggingIn, setLoggingIn] = useState(false);

  useEffect(() => {
    getCurrentUser().then(setUser);
  }, []);

  async function handleLogin() {
    if (!loginEmail || !loginPassword) {
      setLoginError("Veuillez saisir votre email et votre mot de passe.");
      return;
    }

    setLoggingIn(true);
    setLoginError("");

    const { data, error } = await signIn(loginEmail, loginPassword);

    if (error) {
      setLoginError("Email ou mot de passe incorrect.");
      setLoggingIn(false);
      return;
    }

    setUser(data.user);
    setLoginEmail("");
    setLoginPassword("");
    setShowLogin(false);
    setLoggingIn(false);
  }

  async function handleLogout() {
    await signOut();
    setUser(null);
    onLogout?.();
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
