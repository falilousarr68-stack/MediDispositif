"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import api from "../services/api";

export default function Sidebar({ utilisateur }) {
  const pathname = usePathname();
  const router = useRouter();

  const [sidebarOuvert, setSidebarOuvert] = useState(true);

  useEffect(() => {
  document.body.classList.toggle(
    "sidebar-ferme",
    !sidebarOuvert
  );

  return () => {
    document.body.classList.remove("sidebar-ferme");
  };
}, [sidebarOuvert]);

  if (!utilisateur) {
    return null;
  }

  const role = utilisateur.role;

  const getPhotoUrl = (photoUrl) => {
  if (!photoUrl) {
    return null;
  }

  if (photoUrl.startsWith("http")) {
    return photoUrl;
  }

  return `http://127.0.0.1:8000${photoUrl}`;
};

  // =====================================================
  // DÉCONNEXION
  // =====================================================

  const deconnexion = async () => {
  try {
    // Enregistrer la déconnexion dans le journal d'audit
    await api.post("/auth/deconnexion/");
  } catch (error) {
    console.error(
      "Erreur lors de l'enregistrement de la déconnexion :",
      error.response?.data || error.message
    );
  } finally {
    // Supprimer la session locale
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("utilisateur");

    // Retour à la page d'accueil
    router.push("/");
  }
};

  // =====================================================
  // LIEN ACTIF
  // =====================================================

  const estActif = (href) => {
    return pathname === href;
  };

  // =====================================================
  // STYLE DES LIENS
  // =====================================================

  const lienClasse = (href) => `
  group
  relative
  flex
  items-center
  ${sidebarOuvert ? "gap-3 px-3" : "justify-center px-2"}
  py-2.5
  rounded-xl
  text-sm
  font-medium
  transition-all
  duration-200
  ${
    estActif(href)
      ? `
        bg-gradient-to-r
        from-blue-600
        to-cyan-500
        text-white
        shadow-lg
        shadow-blue-900/30
      `
      : `
        text-slate-300
        hover:bg-white/10
        hover:text-white
      `
  }
`;

  // =====================================================
  // TABLEAU DE BORD
  // =====================================================

  const dashboard =
    role === "Administrateur"
      ? "/administration"
      : role === "Client"
      ? "/client"
      : role === "Vendeur"
      ? "/vendeur"
      : role === "ResponsableCommercial"
      ? "/responsable-commercial"
      : role === "GestionnaireDeStock"
      ? "/gestionnaire-stock"
      : "/";

  // =====================================================
  // PETIT COMPOSANT ICÔNE
  // =====================================================

  const Icone = ({ children, actif }) => (
    <span
      className={`
        w-9 h-9
        rounded-lg
        flex items-center justify-center
        text-base
        shrink-0
        transition-all
        ${
          actif
            ? "bg-white/15"
            : "bg-white/5 group-hover:bg-white/10"
        }
      `}
    >
      {children}
    </span>
  );

  const TexteMenu = ({ children }) => (
  <span
    className={`
      whitespace-nowrap
      overflow-hidden
      transition-all
      duration-300
      ${
        sidebarOuvert
          ? "opacity-100 w-auto"
          : "opacity-0 w-0"
      }
    `}
  >
    {children}
  </span>
);

  return (
    <aside
  className={`
    sidebar-container
    fixed
    left-0
    top-0
    h-screen
    ${sidebarOuvert ? "w-64" : "w-20"}
    z-40
    flex
    flex-col
    overflow-visible

    bg-gradient-to-b
    from-[#0b1730]
    via-[#0d1d38]
    to-[#0b2740]

    text-white
    border-r
    border-white/10

    shadow-2xl

    transition-all
    duration-300
  `}
>

      {/* =====================================================
          DÉCORATION SUPÉRIEURE
      ====================================================== */}

      <div
        className="
          absolute
          top-0
          left-0
          right-0
          h-1
          bg-gradient-to-r
          from-blue-500
          via-cyan-400
          to-emerald-400
        "
      />

      {/* =====================================================
          LOGO
      ====================================================== */}

      <div
  className={`
    relative
    pt-7
    pb-5
    border-b
    border-white/10
    transition-all
    duration-300
    ${sidebarOuvert ? "px-5" : "px-2"}
  `}
>

        <Link
           href={dashboard}
  className={`
    flex
    items-center
    group
    transition-all
    duration-300
    ${sidebarOuvert ? "gap-3 justify-start" : "justify-center"}
  `}
        >

          {/* Logo */}

          <div
            className="
              w-11 h-11
              rounded-xl
              bg-gradient-to-br
              from-blue-500
              to-cyan-400
              flex
              items-center
              justify-center
              shadow-lg
              shadow-blue-900/40
              group-hover:scale-105
              transition-transform
            "
          >
            <span className="text-xl">
              ⚕
            </span>
          </div>

          {/* Nom */}

          <div
  className={`
    min-w-0
    overflow-hidden
    transition-all
    duration-300
    ${sidebarOuvert ? "opacity-100 w-auto" : "opacity-0 w-0"}
  `}
>

            <h1
              className="
                text-lg
                font-bold
                text-white
                tracking-tight
              "
            >
              MediDispositif
            </h1>

            <p
              className="
                text-[10px]
                text-slate-400
                mt-0.5
              "
            >
              Vente de dispositifs médicaux
            </p>

          </div>

        </Link>

        <button
  type="button"
  onClick={() => setSidebarOuvert(!sidebarOuvert)}
  className="
  absolute
  top-1/2
  -translate-y-1/2
  -right-3
  z-50
  w-7
  h-7
  rounded-full
  bg-white
  text-slate-700
  border
  border-slate-200
  shadow-lg
  flex
  items-center
  justify-center
  font-bold
  text-lg
  hover:bg-blue-50
  hover:text-blue-600
  transition-all
  duration-200
"
  title={sidebarOuvert ? "Réduire le menu" : "Ouvrir le menu"}
>
  <span className="text-lg leading-none">
    {sidebarOuvert ? "‹" : "›"}
  </span>
</button>
      </div>


      {/* =====================================================
          MENU
      ====================================================== */}

      <nav
        className="
          flex-1
          px-3
          py-5
          overflow-y-auto

          scrollbar-thin
          scrollbar-thumb-white/10
          scrollbar-track-transparent
        "
      >

        {/* =================================================
            PRINCIPAL
        ================================================== */}

        <p
  className={`
    px-3
    mb-2
    text-[10px]
    font-bold
    uppercase
    tracking-[0.15em]
    text-slate-500
    overflow-hidden
    whitespace-nowrap
    transition-all
    duration-300
    ${
      sidebarOuvert
        ? "opacity-100 max-h-10"
        : "opacity-0 max-h-0 mb-0"
    }
  `}
>
  Principal
</p>

        {/* ACCUEIL */}

        <Link
          href={dashboard}
          className={lienClasse(dashboard)}
        >
          <Icone actif={estActif(dashboard)}>
            🏠
          </Icone>

          <TexteMenu>
            Accueil
          </TexteMenu>
        </Link>


        {/* PRODUITS */}

        <Link
          href="/produits"
          className={lienClasse("/produits")}
        >
          <Icone actif={estActif("/produits")}>
            📦
          </Icone>

          <TexteMenu>
            Produits
          </TexteMenu>
        </Link>


        {/* =================================================
            CLIENT
        ================================================== */}

        {role === "Client" && (
          <>
            <div className="h-px bg-white/5 my-5" />

            <p
  className={`
    px-3
    mb-2
    text-[10px]
    font-bold
    uppercase
    tracking-[0.15em]
    text-slate-500
    overflow-hidden
    whitespace-nowrap
    transition-all
    duration-300
    ${
      sidebarOuvert
        ? "opacity-100 max-h-10"
        : "opacity-0 max-h-0 mb-0"
    }
  `}
>
  Mon espace
</p>

            <Link
              href="/panier"
              className={lienClasse("/panier")}
            >
              <Icone actif={estActif("/panier")}>
                🛒
              </Icone>

              <TexteMenu>
                Mon panier
              </TexteMenu>
            </Link>

            <Link
              href="/commandes"
              className={lienClasse("/commandes")}
            >
              <Icone actif={estActif("/commandes")}>
                📋
              </Icone>

              <TexteMenu>
                Mes commandes
              </TexteMenu>
            </Link>

            <Link
              href="/factures"
              className={lienClasse("/factures")}
            >
              <Icone actif={estActif("/factures")}>
                🧾
              </Icone>

              <TexteMenu>
                Mes factures
              </TexteMenu>
            </Link>
          </>
        )}


        {/* =================================================
            VENDEUR
        ================================================== */}

        {role === "Vendeur" && (
          <>
            <div className="h-px bg-white/5 my-5" />

            <p
  className={`
    px-3
    mb-2
    text-[10px]
    font-bold
    uppercase
    tracking-[0.15em]
    text-slate-500
    overflow-hidden
    whitespace-nowrap
    transition-all
    duration-300
    ${
      sidebarOuvert
        ? "opacity-100 max-h-10"
        : "opacity-0 max-h-0 mb-0"
    }
  `}
>
  Gestion commerciale
</p>

            <Link
              href="/gestion-commandes"
              className={lienClasse("/gestion-commandes")}
            >
              <Icone
                actif={estActif("/gestion-commandes")}
              >
                📋
              </Icone>

              <TexteMenu>
                Gestion des commandes
              </TexteMenu>
            </Link>

            
          </>
        )}


        {/* =================================================
            RESPONSABLE COMMERCIAL
        ================================================== */}

        {role === "ResponsableCommercial" && (
          <>
            <div className="h-px bg-white/5 my-5" />

            <p
  className={`
    px-3
    mb-2
    text-[10px]
    font-bold
    uppercase
    tracking-[0.15em]
    text-slate-500
    overflow-hidden
    whitespace-nowrap
    transition-all
    duration-300
    ${
      sidebarOuvert
        ? "opacity-100 max-h-10"
        : "opacity-0 max-h-0 mb-0"
    }
  `}
>
  Gestion commerciale
</p>

            <Link
              href="/gestion-commandes"
              className={lienClasse("/gestion-commandes")}
            >
              <Icone
                actif={estActif("/gestion-commandes")}
              >
                📋
              </Icone>

              <TexteMenu>
                Gestion des commandes
              </TexteMenu>
            </Link>

            <Link
              href="/historique-audit"
              className={lienClasse("/historique-audit")}
            >
              <Icone
                actif={estActif("/historique-audit")}
              >
                📝
              </Icone>

              <TexteMenu>
                Journal d'audit
              </TexteMenu>
            </Link>
          </>
        )}


        {/* =================================================
            GESTIONNAIRE DE STOCK
        ================================================== */}

        {role === "GestionnaireDeStock" && (
          <>
            <div className="h-px bg-white/5 my-5" />

            <p
  className={`
    px-3
    mb-2
    text-[10px]
    font-bold
    uppercase
    tracking-[0.15em]
    text-slate-500
    overflow-hidden
    whitespace-nowrap
    transition-all
    duration-300
    ${
      sidebarOuvert
        ? "opacity-100 max-h-10"
        : "opacity-0 max-h-0 mb-0"
    }
  `}
>
  Gestion du stock
</p>

            <Link
              href="/administration/produits"
              className={lienClasse(
                "/administration/produits"
              )}
            >
              <Icone
                actif={estActif(
                  "/administration/produits"
                )}
              >
                📦
              </Icone>

              <TexteMenu>
                Gestion des produits
              </TexteMenu>
            </Link>

            <Link
              href="/administration/approvisionnements"
              className={lienClasse(
                "/administration/approvisionnements"
              )}
            >
              <Icone
                actif={estActif(
                  "/administration/approvisionnements"
                )}
              >
                🚚
              </Icone>

              <TexteMenu>
                Approvisionnements
              </TexteMenu>
            </Link>

            <Link
              href="/historique-stock"
              className={lienClasse(
                "/historique-stock"
              )}
            >
              <Icone
                actif={estActif("/historique-stock")}
              >
                📊
              </Icone>

              <TexteMenu>
                Historique du stock
              </TexteMenu>
            </Link>

            <Link
              href="/livraisons-stock"
              className={lienClasse(
                "/livraisons-stock"
              )}
            >
              <Icone
                actif={estActif("/livraisons-stock")}
              >
                🚛
              </Icone>

              <TexteMenu>
                Livraisons
              </TexteMenu>
            </Link>

            <Link
              href="/administration/alertes"
              className={lienClasse(
                "/administration/alertes"
              )}
            >
              <Icone
                actif={estActif(
                  "/administration/alertes"
                )}
              >
                ⚠️
              </Icone>

              <TexteMenu>
                Alertes
              </TexteMenu>
            </Link>

            <Link
              href="/historique-audit"
              className={lienClasse(
                "/historique-audit"
              )}
            >
              <Icone
                actif={estActif("/historique-audit")}
              >
                📝
              </Icone>

              <TexteMenu>
                Journal d'audit
              </TexteMenu>
            </Link>
          </>
        )}


        {/* =================================================
            ADMINISTRATEUR
        ================================================== */}

        {role === "Administrateur" && (
          <>
            <div className="h-px bg-white/5 my-5" />

            <p
  className={`
    px-3
    mb-2
    text-[10px]
    font-bold
    uppercase
    tracking-[0.15em]
    text-slate-500
    overflow-hidden
    whitespace-nowrap
    transition-all
    duration-300
    ${
      sidebarOuvert
        ? "opacity-100 max-h-10"
        : "opacity-0 max-h-0 mb-0"
    }
  `}
>
  Administration
</p>

            <Link
              href="/administration/utilisateurs"
              className={lienClasse(
                "/administration/utilisateurs"
              )}
            >
              <Icone
                actif={estActif(
                  "/administration/utilisateurs"
                )}
              >
                👥
              </Icone>

              <TexteMenu>
                Utilisateurs
              </TexteMenu>
            </Link>

            <Link
              href="/administration/produits"
              className={lienClasse(
                "/administration/produits"
              )}
            >
              <Icone
                actif={estActif(
                  "/administration/produits"
                )}
              >
                📦
              </Icone>

              <TexteMenu>
                Gestion des Produits
              </TexteMenu>
            </Link>

            <Link
  href="/administration/approvisionnements"
  className={lienClasse(
    "/administration/approvisionnements"
  )}
>
  <span className="text-lg">🚚</span>
  <TexteMenu>Approvisionnements</TexteMenu>
</Link>

            <Link
              href="/gestion-commandes"
              className={lienClasse(
                "/gestion-commandes"
              )}
            >
              <Icone
                actif={estActif("/gestion-commandes")}
              >
                📋
              </Icone>

              <TexteMenu>
                Commandes
              </TexteMenu>
            </Link>

            

            <Link
              href="/administration/parametres"
              className={lienClasse(
                "/administration/parametres"
              )}
            >
              <Icone
                actif={estActif(
                  "/administration/parametres"
                )}
              >
                ⚙️
              </Icone>

              <TexteMenu>
                Paramètres
              </TexteMenu>
            </Link>

            <Link
              href="/historique-audit"
              className={lienClasse(
                "/historique-audit"
              )}
            >
              <Icone
                actif={estActif("/historique-audit")}
              >
                📝
              </Icone>

              <TexteMenu>
                Journal d'audit
              </TexteMenu>
            </Link>
          </>
        )}

      </nav>


      {/* =====================================================
          PROFIL + DÉCONNEXION
      ====================================================== */}

      <div
        className="
          border-t
          border-white/10
          p-3
          bg-black/10
        "
      >

        {/* Profil */}

        <div
  className={`
    flex
    items-center
    rounded-xl
    bg-white/5
    border
    border-white/5
    transition-all
    duration-300
    ${
      sidebarOuvert
        ? "gap-3 px-2 py-2 justify-start"
        : "px-0 py-2 justify-center"
    }
  `}
>

          <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 bg-white/10 flex items-center justify-center">
  {utilisateur.photo_profil ? (
    <img
      src={getPhotoUrl(utilisateur.photo_profil)}
      alt="Photo de profil"
      className="w-full h-full object-cover"
    />
  ) : (
    <span className="text-sm font-semibold text-white">
      {utilisateur.prenom
        ? utilisateur.prenom.charAt(0).toUpperCase()
        : "U"}
    </span>
  )}
</div>

          <div
  className={`
    min-w-0
    overflow-hidden
    transition-all
    duration-300
    ${
      sidebarOuvert
        ? "opacity-100 w-auto"
        : "opacity-0 w-0"
    }
  `}
>
  <p
    className="
      text-sm
      font-semibold
      text-white
      truncate
    "
  >
    {utilisateur.prenom}{" "}
    {utilisateur.nom}
  </p>

  <p
    className="
      text-[11px]
      text-cyan-300
      truncate
    "
  >
    {utilisateur.role_display ||
      utilisateur.role}
  </p>
</div>

        </div>

        <Link
  href="/profil"
  className={lienClasse("/profil")}
>
  <Icone actif={estActif("/profil")}>
    👤
  </Icone>

  <TexteMenu>
    Mon profil
  </TexteMenu>
</Link>


        {/* Déconnexion */}

        <button
          type="button"
          onClick={deconnexion}
          className={`
  w-full
  mt-2
  flex
  items-center
  ${sidebarOuvert ? "gap-3 px-3" : "justify-center px-2"}
  py-2.5
  rounded-xl
  text-sm
  font-medium
  text-slate-300
  hover:text-white
  hover:bg-red-500/10
  hover:border-red-500/20
  border
  border-transparent
  transition-all
`}
        >

          <span
            className="
              w-8 h-8
              rounded-lg
              bg-white/5
              flex
              items-center
              justify-center
            "
          >
            🚪
          </span>

          <span
  className={`
    whitespace-nowrap
    overflow-hidden
    transition-all
    duration-300
    ${
      sidebarOuvert
        ? "opacity-100 w-auto"
        : "opacity-0 w-0"
    }
  `}
>
  Déconnexion
</span>

        </button>

      </div>

    </aside>
  );
}