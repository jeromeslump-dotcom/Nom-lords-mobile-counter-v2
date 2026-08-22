import { useEffect, useMemo, useState } from "react";

import {
  User,
  Save,
  Loader2,
  X,
  Check,
  AlertCircle,
  Search,
} from "lucide-react";

import { supabase } from "../storage";

type UserRole = "user" | "contributor" | "admin";

type Profile = {
  id: string;
  display_name: string | null;
  role: UserRole | null;
  active: boolean | null;
  created_at: string | null;
};

type UserManagementProps = {
  currentUserId: string;
  onClose: () => void;
};

const ROLE_OPTIONS: Array<{
  value: "" | UserRole;
  label: string;
}> = [
  {
    value: "",
    label: "Aucun",
  },
  {
    value: "user",
    label: "Utilisateur",
  },
  {
    value: "contributor",
    label: "Contributeur",
  },
  {
    value: "admin",
    label: "Administrateur",
  },
];

export default function UserManagement({
  currentUserId,
  onClose,
}: UserManagementProps) {
  const [profiles, setProfiles] = useState<Profile[]>([]);

  const [loading, setLoading] = useState(true);

  const [savingId, setSavingId] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");

  const [message, setMessage] = useState("");

  const [error, setError] = useState("");

  /* =========================================================
     CHARGEMENT
     ========================================================= */

  async function loadProfiles() {
    setLoading(true);
    setError("");

    const { data, error } = await supabase
      .from("profiles")
      .select("id, display_name, role, active, created_at")
      .order("display_name", {
        ascending: true,
      });

    if (error) {
      console.error("Erreur chargement profiles :", error);

      setError(`Impossible de charger les utilisateurs : ${error.message}`);

      setProfiles([]);

      setLoading(false);

      return;
    }

    setProfiles((data ?? []) as Profile[]);

    setLoading(false);
  }

  useEffect(() => {
    loadProfiles();
  }, []);

  /* =========================================================
     RECHERCHE
     ========================================================= */

  const filteredProfiles = useMemo(() => {
    const search = searchQuery.trim().toLowerCase();

    if (!search) {
      return profiles;
    }

    return profiles.filter((profile) => {
      const name = profile.display_name?.toLowerCase() ?? "";

      const id = profile.id.toLowerCase();

      return name.includes(search) || id.includes(search);
    });
  }, [profiles, searchQuery]);

  /* =========================================================
     CHANGEMENT ROLE
     ========================================================= */

  function changeRole(id: string, role: "" | UserRole) {
    setProfiles((current) =>
      current.map((profile) =>
        profile.id === id
          ? {
              ...profile,
              role: role === "" ? null : role,
            }
          : profile
      )
    );

    setMessage("");
    setError("");
  }

  /* =========================================================
     SAUVEGARDE
     ========================================================= */

  async function saveRole(profile: Profile) {
    setSavingId(profile.id);
    setMessage("");
    setError("");

    const { error } = await supabase
      .from("profiles")
      .update({
        role: profile.role,
      })
      .eq("id", profile.id);

    if (error) {
      console.error("Erreur modification rôle :", error);

      setError(
        `Impossible de modifier le rôle de ${
          profile.display_name ?? "cet utilisateur"
        } : ${error.message}`
      );

      setSavingId(null);

      return;
    }

    setMessage(
      `Rôle de ${profile.display_name ?? "l'utilisateur"} mis à jour.`
    );

    setSavingId(null);
  }

  /* =========================================================
     LABEL ROLE
     ========================================================= */

  function roleLabel(role: UserRole | null) {
    if (!role) {
      return "Aucun";
    }

    const option = ROLE_OPTIONS.find((item) => item.value === role);

    return option?.label ?? role;
  }

  /* =========================================================
     RENDER
     ========================================================= */

  return (
    <div className="w-full rounded-2xl border border-white/10 bg-[#111318] shadow-2xl overflow-hidden">
      {/* =================================================
          HEADER
          ================================================= */}

      <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400/10 border border-amber-400/20">
            <User className="h-5 w-5 text-amber-400" />
          </div>

          <div>
            <h2 className="text-lg font-bold text-white">
              Gestion des utilisateurs
            </h2>

            <p className="text-xs text-white/40">
              Gestion des rôles utilisateurs
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
          title="Fermer"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* =================================================
          RECHERCHE
          ================================================= */}

      <div className="px-5 pt-5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30 pointer-events-none" />

          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Rechercher un utilisateur..."
            className="w-full rounded-xl border border-white/10 bg-white/[0.025] pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-amber-400/50 transition-colors"
          />
        </div>

        {searchQuery.trim() && (
          <div className="mt-2 text-[11px] text-white/30">
            {filteredProfiles.length} résultat
            {filteredProfiles.length > 1 ? "s" : ""}
          </div>
        )}
      </div>

      {/* =================================================
          MESSAGES
          ================================================= */}

      {(message || error) && (
        <div className="px-5 pt-4">
          {message && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-300">
              <Check className="h-4 w-4 shrink-0" />

              <span>{message}</span>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />

              <span>{error}</span>
            </div>
          )}
        </div>
      )}

      {/* =================================================
          USERS
          ================================================= */}

      <div className="p-5">
        {loading ? (
          <div className="flex items-center justify-center py-12 text-white/50">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            Chargement des utilisateurs…
          </div>
        ) : profiles.length === 0 ? (
          <div className="py-12 text-center text-white/40">
            Aucun utilisateur trouvé.
          </div>
        ) : filteredProfiles.length === 0 ? (
          <div className="py-12 text-center text-white/40">
            Aucun utilisateur ne correspond à cette recherche.
          </div>
        ) : (
          <div className="space-y-3">
            {filteredProfiles.map((profile) => {
              const isCurrentUser = profile.id === currentUserId;

              return (
                <div
                  key={profile.id}
                  className="rounded-xl border border-white/10 bg-white/[0.025] p-4"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    {/* USER */}

                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/5 border border-white/10">
                        <User className="h-4 w-4 text-white/50" />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-white truncate">
                            {profile.display_name ?? "Utilisateur"}
                          </span>

                          {isCurrentUser && (
                            <span className="shrink-0 rounded-full bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 text-[10px] text-amber-300">
                              Vous
                            </span>
                          )}
                        </div>

                        <div className="text-[11px] text-white/30 mt-0.5">
                          Rôle actuel : {roleLabel(profile.role)}
                        </div>
                      </div>
                    </div>

                    {/* ROLE */}

                    <div className="flex items-center gap-2">
                      <select
                        value={profile.role ?? ""}
                        onChange={(event) =>
                          changeRole(
                            profile.id,
                            event.target.value as "" | UserRole
                          )
                        }
                        className="min-w-[190px] rounded-lg border border-white/10 bg-[#181b21] px-3 py-2 text-sm text-white outline-none focus:border-amber-400/50"
                      >
                        {ROLE_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>

                      <button
                        onClick={() => saveRole(profile)}
                        disabled={savingId === profile.id}
                        className="inline-flex items-center gap-2 rounded-lg bg-amber-400 px-3 py-2 text-sm text-black hover:bg-amber-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {savingId === profile.id ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Sauvegarde…
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4" />
                            Enregistrer
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* =================================================
          FOOTER
          ================================================= */}

      <div className="flex items-center justify-between gap-4 px-5 py-4 border-t border-white/10 bg-white/[0.02]">
        <div className="text-xs text-white/30">
          {searchQuery.trim()
            ? `${filteredProfiles.length} / ${profiles.length}`
            : profiles.length}{" "}
          utilisateur
          {profiles.length > 1 ? "s" : ""}
        </div>

        <button
          onClick={onClose}
          className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white/70 hover:bg-white/10 hover:text-white transition-colors"
        >
          Fermer
        </button>
      </div>
    </div>
  );
}
