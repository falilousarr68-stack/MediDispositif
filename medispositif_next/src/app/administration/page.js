"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "../../services/api";


export default function AdministrationPage() {
  const [statistiques, setStatistiques] = useState({
    utilisateurs: 0,
    produits: 0,
    catalogues: 0,
    approvisionnements: 0,
    commandes: 0,
    paiements: 0,
    factures: 0,
    rapports: 0,
    parametres: 0,
    historiqueStock: 0,
  });

  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");
  const [utilisateur, setUtilisateur] = useState(null);
  const [dateHeure, setDateHeure] = useState(null);

  useEffect(() => {
  const utilisateurStocke =
    localStorage.getItem("utilisateur");

  if (!utilisateurStocke) {
    window.location.href = "/connexion";
    return;
  }

  try {
    const utilisateurConnecte =
      JSON.parse(utilisateurStocke);

    if (utilisateurConnecte.role !== "Administrateur") {
      window.location.href = "/";
      return;
    }

    setUtilisateur(utilisateurConnecte);
  } catch (error) {
    console.error(error);
    window.location.href = "/connexion";
    return;
  }

  chargerStatistiques();

  // Mise à jour de l'heure chaque seconde
  
 // Mise à jour de l'heure après le montage
setDateHeure(new Date());

const interval = setInterval(() => {
  setDateHeure(new Date());
}, 1000);

return () => clearInterval(interval);

}, []);

  const chargerStatistiques = async () => {
    try {
      setChargement(true);
      setErreur("");

      const resultats = await Promise.allSettled([
        api.get("/auth/utilisateurs/"),
        api.get("/catalogue/produits/"),
        api.get("/catalogue/catalogues/"),
        api.get("/catalogue/approvisionnements/"),
        api.get("/ventes/commandes/"),
        api.get("/ventes/paiements/"),
        api.get("/ventes/factures/"),
        api.get("/systeme/rapports/"),
        api.get("/systeme/parametres/"),
        api.get("/catalogue/mouvements-stock/")
      ]);

      const recupererNombre = (resultat) => {
        if (resultat.status !== "fulfilled") {
          return 0;
        }

        const data = resultat.value?.data;

        if (Array.isArray(data)) {
          return data.length;
        }

        if (data?.results && Array.isArray(data.results)) {
          return data.results.length;
        }

        return 0;
      };

      setStatistiques({
  utilisateurs: recupererNombre(resultats[0]),
  produits: recupererNombre(resultats[1]),
  catalogues: recupererNombre(resultats[2]),
  approvisionnements: recupererNombre(resultats[3]),
  commandes: recupererNombre(resultats[4]),
  paiements: recupererNombre(resultats[5]),
  factures: recupererNombre(resultats[6]),
  rapports: recupererNombre(resultats[7]),
  parametres: recupererNombre(resultats[8]),
});

      const nombreErreurs = resultats.filter(
        (resultat) => resultat.status === "rejected"
      ).length;

      if (nombreErreurs > 0) {
        setErreur(
          "Certaines informations n'ont pas pu être chargées."
        );
      }
    } catch (error) {
      console.error(
        "Erreur lors du chargement du tableau de bord :",
        error
      );

      setErreur(
        "Impossible de charger les statistiques du tableau de bord."
      );
    } finally {
      setChargement(false);
    }
  };

  const cartesStatistiques = [
    {
  titre: "Utilisateurs",
  valeur: statistiques.utilisateurs,
  icone: "👥",
  couleur: "red",
  lien: "/administration/utilisateurs",
},

    {
      titre: "Produits médicaux",
      valeur: statistiques.produits,
      icone: "📦",
      couleur: "blue",
      lien: "/administration/produits",
    },
    {
      titre: "Catalogues",
      valeur: statistiques.catalogues,
      icone: "📚",
      couleur: "indigo",
      lien: "/administration/catalogues",
    },
    {
      titre: "Approvisionnements",
      valeur: statistiques.approvisionnements,
      icone: "🚚",
      couleur: "green",
      lien: "/administration/approvisionnements",
    },
 
    {
  titre: "Historique du stock",
  valeur: statistiques.historiqueStock,
  icone: "📊",
  couleur: "emerald",
  lien: "/historique-stock",
},

    {
      titre: "Commandes",
      valeur: statistiques.commandes,
      icone: "🛒",
      couleur: "orange",
      lien: "/administration/commandes",
    },
    {
      titre: "Paiements",
      valeur: statistiques.paiements,
      icone: "💳",
      couleur: "purple",
      lien: "/administration/paiements",
    },
    {
      titre: "Factures",
      valeur: statistiques.factures,
      icone: "🧾",
      couleur: "cyan",
      lien: "/administration/factures",
    },
    {
      titre: "Rapports",
      valeur: statistiques.rapports,
      icone: "📊",
      couleur: "pink",
      lien: "/administration/rapports",
    },
    {
      titre: "Paramètres",
      valeur: statistiques.parametres,
      icone: "⚙️",
      couleur: "gray",
      lien: "/administration/parametres",
    },
  ];

  const accesRapides = [
    {
  titre: "Utilisateurs",
  description: "Gérer les comptes et les rôles des utilisateurs.",
  icone: "👥",
  lien: "/administration/utilisateurs",
},
    {
      titre: "Produits médicaux",
      description: "Gérer les produits et leurs informations.",
      icone: "📦",
      lien: "/administration/produits",
    },
    {
      titre: "Catalogues",
      description: "Gérer les catalogues de produits.",
      icone: "📚",
      lien: "/administration/catalogues",
    },
    {
      titre: "Approvisionnements",
      description: "Suivre les approvisionnements et le stock.",
      icone: "🚚",
      lien: "/administration/approvisionnements",
    },

    {
  titre: "Historique du stock",
  description: "Consulter les entrées et sorties de stock.",
  icone: "📊",
  lien: "/historique-stock",
},
    {
      titre: "Commandes",
      description: "Consulter et gérer les commandes.",
      icone: "🛒",
      lien: "/administration/commandes",
    },
    {
      titre: "Paiements",
      description: "Consulter les paiements effectués.",
      icone: "💳",
      lien: "/administration/paiements",
    },
    {
      titre: "Factures",
      description: "Consulter et gérer les factures.",
      icone: "🧾",
      lien: "/administration/factures",
    },
    {
      titre: "Rapports",
      description: "Consulter les rapports du système.",
      icone: "📊",
      lien: "/administration/rapports",
    },
    {
      titre: "Paramètres système",
      description: "Configurer les paramètres de l'application.",
      icone: "⚙️",
      lien: "/administration/parametres",
    },
  ];

  return (
  <main className="min-h-screen bg-[#eef6ff]">

    {/* =====================================================
        SIDEBAR
    ====================================================== */}
    

    {/* =====================================================
        CONTENU PRINCIPAL
    ====================================================== */}
    <div className="ml-64 min-h-screen bg-[#eef6ff]">

      {/* =====================================================
          EN-TÊTE / BANNIÈRE D'ACCUEIL
      ====================================================== */}
      {/* =====================================================
    EN-TÊTE / BANNIÈRE D'ACCUEIL
====================================================== */}

<section className="px-6 pt-6">

  <div
    className="
      relative overflow-hidden
      rounded-2xl
      bg-gradient-to-r
      from-blue-100
      via-cyan-50
      to-blue-50
      border border-blue-100
      shadow-sm
      min-h-[145px]
    "
  >

    {/* =================================================
        IMAGE MÉDICALE EN ARRIÈRE-PLAN
    ================================================== */}

    <div
      className="
        absolute
        right-0
        top-0
        w-[48%]
        h-full
        overflow-hidden
        pointer-events-none
      "
    >

      <img
        src="http://127.0.0.1:8000/media/produits/pro.jpeg"
        alt=""
        className="
          w-full
          h-full
          object-cover
          opacity-90
        "
      />

      {/* Dégradé pour que le texte reste lisible */}
      <div
        className="
          absolute
          inset-0
          bg-gradient-to-r
          from-blue-100
          via-blue-100/70
          to-transparent
        "
      />

    </div>


    {/* =================================================
        CONTENU DE LA BANNIÈRE
    ================================================== */}

    <div
      className="
        relative
        z-10
        px-7
        py-6
      "
    >

      <div
        className="
          flex
          flex-col
          lg:flex-row
          lg:items-center
          lg:justify-between
          gap-6
        "
      >

        {/* =================================================
            MESSAGE DE BIENVENUE
        ================================================== */}

        <div>

          <p
            className="
              text-blue-700
              text-sm
              font-semibold
              mb-1
            "
          >
            ESPACE ADMINISTRATION
          </p>

          <h1
            className="
              text-3xl
              md:text-4xl
              font-bold
              text-slate-900
            "
          >
            Bonjour{" "}
            {utilisateur
              ? `${utilisateur.prenom} ${utilisateur.nom}`
              : "Administrateur"}{" "}
            👋
          </h1>

          <p className="text-slate-600 mt-2">
            Bienvenue sur votre espace d'administration
            MediDispositif.
          </p>

        </div>


        {/* =================================================
            DATE + HEURE
        ================================================== */}

        <div
          className="
            relative
            bg-white/85
            backdrop-blur-sm
            border border-white
            rounded-xl
            px-5
            py-4
            shadow-sm
            min-w-[250px]
          "
        >

          {/* DATE */}

          <div className="flex items-center gap-3">

            <div
              className="
                w-10
                h-10
                rounded-lg
                bg-blue-50
                flex
                items-center
                justify-center
                text-xl
              "
            >
              📅
            </div>

            <div>

              <p className="text-xs text-slate-500">
                Date
              </p>

              
<p className="font-semibold text-slate-900">
  {dateHeure
    ? dateHeure.toLocaleDateString("fr-FR", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : "Chargement..."}
</p>


            </div>

          </div>


          {/* HEURE */}

          <div
            className="
              flex
              items-center
              gap-3
              mt-3
              pt-3
              border-t
              border-slate-200
            "
          >

            <div
              className="
                w-10
                h-10
                rounded-lg
                bg-cyan-50
                flex
                items-center
                justify-center
                text-xl
              "
            >
              🕐
            </div>

            <div>

              <p className="text-xs text-slate-500">
                Heure
              </p>

              
<p className="font-bold text-slate-900">
  {dateHeure
    ? dateHeure.toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : "--:--:--"}
</p>


            </div>

          </div>

        </div>

      </div>

    </div>

  </div>

</section>


      {/* =====================================================
          CONTENU
      ====================================================== */}
      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* =================================================
            ERREUR PARTIELLE
        ================================================== */}
        {erreur && (
          <div
            className="
              mb-6
              bg-yellow-50
              border border-yellow-200
              text-yellow-800
              px-4 py-3
              rounded-xl
            "
          >
            ⚠️ {erreur}
          </div>
        )}


        {/* =================================================
            VUE D'ENSEMBLE
        ================================================== */}
        <section>

          {/* TITRE */}
          <div className="flex items-center justify-between mb-6">

            <div>

              <h2 className="text-2xl font-bold text-slate-900">
                Vue d'ensemble
              </h2>

              <p className="text-slate-500 text-sm mt-1">
                Statistiques générales de la gestion de MediDispositif
              </p>

            </div>


            {/* ACTUALISER */}
            <button
              onClick={chargerStatistiques}
              className="
                px-4 py-2.5
                bg-white
                border border-slate-200
                rounded-xl
                text-sm
                font-semibold
                text-blue-600
                shadow-sm
                hover:bg-blue-50
                hover:border-blue-200
                transition
              "
            >
              🔄 Actualiser
            </button>

          </div>


          {/* =================================================
              CARTES STATISTIQUES
          ================================================== */}
          <div
            className="
              grid
              grid-cols-1
              sm:grid-cols-2
              lg:grid-cols-4
              gap-5
            "
          >

            {cartesStatistiques.map((carte) => (

              <Link
                key={carte.titre}
                href={carte.lien}
                className="
                  group
                  relative
                  overflow-hidden
                  bg-white
                  rounded-2xl
                  border border-slate-200
                  p-5
                  shadow-sm
                  hover:shadow-xl
                  hover:-translate-y-1
                  transition-all duration-300
                "
              >

                {/* Petite barre colorée en haut */}
                <div
                  className={`
                    absolute
                    top-0
                    left-0
                    right-0
                    h-1
                    ${
                      carte.couleur === "red"
                        ? "bg-red-500"
                        : carte.couleur === "blue"
                        ? "bg-blue-500"
                        : carte.couleur === "indigo"
                        ? "bg-indigo-500"
                        : carte.couleur === "green"
                        ? "bg-green-500"
                        : carte.couleur === "emerald"
                        ? "bg-emerald-500"
                        : carte.couleur === "orange"
                        ? "bg-orange-500"
                        : carte.couleur === "purple"
                        ? "bg-purple-500"
                        : carte.couleur === "cyan"
                        ? "bg-cyan-500"
                        : carte.couleur === "pink"
                        ? "bg-pink-500"
                        : "bg-slate-400"
                    }
                  `}
                />


                <div className="flex items-start justify-between gap-4">

                  {/* INFORMATIONS */}
                  <div className="min-w-0">

                    <p className="text-sm font-medium text-slate-500">
                      {carte.titre}
                    </p>

                    <p className="text-3xl font-bold text-slate-900 mt-2">
                      {chargement ? "..." : carte.valeur}
                    </p>

                  </div>


                  {/* ICÔNE */}
                  <div
                    className={`
                      flex-shrink-0
                      w-12
                      h-12
                      rounded-xl
                      flex
                      items-center
                      justify-center
                      text-2xl
                      group-hover:scale-110
                      transition-transform duration-300

                      ${
                        carte.couleur === "red"
                          ? "bg-red-50"
                          : carte.couleur === "blue"
                          ? "bg-blue-50"
                          : carte.couleur === "indigo"
                          ? "bg-indigo-50"
                          : carte.couleur === "green"
                          ? "bg-green-50"
                          : carte.couleur === "emerald"
                          ? "bg-emerald-50"
                          : carte.couleur === "orange"
                          ? "bg-orange-50"
                          : carte.couleur === "purple"
                          ? "bg-purple-50"
                          : carte.couleur === "cyan"
                          ? "bg-cyan-50"
                          : carte.couleur === "pink"
                          ? "bg-pink-50"
                          : "bg-slate-100"
                      }
                    `}
                  >
                    {carte.icone}
                  </div>

                </div>


                {/* ACTIONS */}
                <div className="mt-5 space-y-1">

                  <p
                    className="
                      text-sm
                      text-blue-600
                      font-semibold
                      group-hover:translate-x-1
                      transition-transform
                    "
                  >
                    Consulter →
                  </p>

                  <p className="text-xs text-slate-500 font-medium">
                    Gérer →
                  </p>

                </div>

              </Link>

            ))}

          </div>

        </section>


        {/* =================================================
            MESSAGE ADMINISTRATION
            CONSERVÉ
        ================================================== */}
        <section className="mt-10">

          <div
            className="
              relative
              overflow-hidden
              bg-gradient-to-r
              from-blue-50
              via-cyan-50
              to-indigo-50
              border border-blue-100
              rounded-2xl
              p-7
              shadow-sm
            "
          >

            {/* Décoration */}
            <div
              className="
                absolute
                right-0
                top-0
                w-40
                h-40
                rounded-full
                bg-blue-200/20
                blur-3xl
              "
            />

            <div className="relative">

              <h2
                className="
                  text-xl
                  font-bold
                  text-blue-900
                  flex
                  items-center
                  gap-2
                "
              >
                🛡️ Administration MediDispositif
              </h2>

              <p className="text-sm text-blue-800 mt-2 max-w-3xl">
                Cet espace permet à l'administrateur de superviser
                les différents modules de l'application et d'accéder
                aux fonctionnalités de gestion du système.
              </p>

            </div>

          </div>

        </section>

      </div>

    </div>

  </main>
);
}