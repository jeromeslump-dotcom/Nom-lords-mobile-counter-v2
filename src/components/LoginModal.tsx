import { X } from "lucide-react";

export default function LoginModal({
  loginEmail,
  setLoginEmail,
  loginPassword,
  setLoginPassword,
  loginError,
  loggingIn,
  handleLogin,
  onClose,
}: {
  loginEmail: string;
  setLoginEmail: (value: string) => void;
  loginPassword: string;
  setLoginPassword: (value: string) => void;
  loginError: string;
  loggingIn: boolean;
  handleLogin: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#11151c] shadow-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl font-bold text-white">
              🔒 Connexion requise
            </h2>
            <p className="text-xs text-white/40 mt-1">
              Connexion requise pour accéder à cette section
            </p>
          </div>

          <button
            onClick={onClose}
            type="button"
            className="h-8 w-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleLogin();
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs text-white/50 mb-1.5">
              Adresse e-mail
            </label>
            <input
              type="email"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              placeholder="Votre adresse e-mail"
              autoComplete="email"
              className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-amber-400/50"
            />
          </div>

          <div>
            <label className="block text-xs text-white/50 mb-1.5">
              Mot de passe
            </label>
            <input
              type="password"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              placeholder="Votre mot de passe"
              autoComplete="current-password"
              className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-amber-400/50"
            />
          </div>

          {loginError && (
            <div className="rounded-lg border border-rose-400/20 bg-rose-400/10 px-3 py-2 text-xs text-rose-300">
              {loginError}
            </div>
          )}

          <button
            type="submit"
            disabled={loggingIn}
            className="w-full py-2.5 rounded-lg bg-amber-400 text-black font-semibold text-sm hover:bg-amber-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loggingIn ? "Connexion..." : "Se connecter"}
          </button>
        </form>
      </div>
    </div>
  );
}
