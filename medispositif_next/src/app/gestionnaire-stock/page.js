"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

/*import Header from "../../components/Header";*/
import api from "../../services/api";

export default function GestionnaireStockPage() {
  const router = useRouter();

  const [utilisateur, setUtilisateur] = useState(null);

  const [statistiques, setStatistiques] = useState({
    produits: 0,
    approvisionnements: 0,
    mouvements: 0,
    ruptures: 0,
  });

  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");

  useEffect(() => {
    const utilisateurStocke =
      localStorage.getItem("utilisateur");

    if (!utilisateurStocke) {
      router.push("/connexion");
      return;
    }

    try {
      const utilisateurConnecte =
        JSON.parse(utilisateurStocke);

      if (
        utilisateurConnecte.role !==
        "GestionnaireDeStock"
      ) {
        router.push("/");
        return;
      }

      setUtilisateur(utilisateurConnecte);
      chargerDonnees();
    } catch (error) {
      console.error(error);
      router.push("/connexion");
    }
  }, [router]);

  const chargerDonnees = async () => {
    try {
      setChargement(true);
      setErreur("");

      const resultats =
        await Promise.allSettled([
          api.get("/catalogue/produits/"),
          api.get("/catalogue/approvisionnements/"),
          api.get("/catalogue/mouvements-stock/"),
        ]);

      let produits = [];
      let approvisionnements = [];
      let mouvements = [];

      if (resultats[0].status === "fulfilled") {
        const data = resultats[0].value?.data;
        produits = data?.results || data || [];
      }

      if (resultats[1].status === "fulfilled") {
        const data = resultats[1].value?.data;
        approvisionnements =
          data?.results || data || [];
      }

      if (resultats[2].status === "fulfilled") {
        const data = resultats[2].value?.data;
        mouvements =
          data?.results || data || [];
      }

      const ruptures = produits.filter(
        (produit) => Number(produit.stock || 0) === 0
      ).length;

      setStatistiques({
        produits: produits.length,
        approvisionnements: approvisionnements.length,
        mouvements: mouvements.length,
        ruptures,
      });

    } catch (error) {
      console.error(error);
      setErreur(
        "Impossible de charger les données du stock."
      );
    } finally {
      setChargement(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f4f8fc]">

      

    {/* CONTENU PRINCIPAL */}
    <div className="ml-64 min-h-screen bg-[#f4f8fc]">

      {/* =====================================================
          EN-TÊTE
      ====================================================== */}

      <section
  className="
    bg-gradient-to-r
    from-[#064e5b]
    via-[#087f8c]
    to-[#1649b8]
    text-white
    shadow-lg
  "
>
        <div className="max-w-7xl mx-auto px-6 py-12">

          <div
            className="
              flex flex-col md:flex-row
              md:items-center md:justify-between
              gap-6
            "
          >

            <div>

              <p className="text-emerald-200 text-sm font-medium mb-2">
                ESPACE GESTIONNAIRE DE STOCK
              </p>

              <h1 className="text-3xl md:text-4xl font-bold">
                Tableau de bord du stock
              </h1>

              <p className="text-emerald-100 mt-3">
                Supervisez les produits, les approvisionnements
                et les mouvements de stock.
              </p>

            </div>

            <div
              className="
                bg-white/10
                border border-white/20
                backdrop-blur-sm
                rounded-2xl
                px-6 py-5
              "
            >

              <p className="text-xs uppercase tracking-wider text-emerald-200">
                Connecté en tant que
              </p>

              <p className="font-bold text-lg mt-1">
                {utilisateur
                  ? `${utilisateur.prenom} ${utilisateur.nom}`
                  : "Gestionnaire de Stock"}
              </p>

              <p className="text-sm text-emerald-200 mt-1">
                Gestionnaire de Stock
              </p>

            </div>

          </div>

        </div>
      </section>

      {/* =====================================================
          CONTENU
      ====================================================== */}

      <section className="max-w-7xl mx-auto px-6 py-10">

        {erreur && (
          <div
            className="
              mb-6
              bg-yellow-50
              border border-yellow-200
              text-yellow-800
              rounded-xl
              px-5 py-4
            "
          >
            ⚠️ {erreur}
          </div>
        )}

        {/* =================================================
            STATISTIQUES
        ================================================== */}

        <div className="mb-10">

          <div className="mb-6">

            <h2 className="text-2xl font-bold text-[#0f2747]">
              Vue d'ensemble
            </h2>

            <p className="text-slate-500 mt-1">
              État général de la gestion du stock
            </p>

          </div>

          <div
            className="
              grid grid-cols-1
              sm:grid-cols-2
              lg:grid-cols-4
              gap-5
            "
          >

            <div
              className="
  bg-white
  border border-slate-200
  rounded-2xl
  p-6
  shadow-sm
  hover:shadow-xl
  hover:-translate-y-1
  transition-all duration-300
"
            >
              <div className="flex items-center justify-between">

                <div>
                  <p className="text-sm text-gray-500">
                    Produits médicaux
                  </p>

                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {chargement
                      ? "..."
                      : statistiques.produits}
                  </p>
                </div>

                <div
                  className="
                    w-12 h-12 rounded-xl
                    bg-blue-50
                    flex items-center justify-center
                    text-2xl
                  "
                >
                  📦
                </div>

              </div>
            </div>

            <div
              className="
  bg-white
  border border-slate-200
  rounded-2xl
  p-6
  shadow-sm
  hover:shadow-xl
  hover:-translate-y-1
  transition-all duration-300
"
            >
              <div className="flex items-center justify-between">

                <div>
                  <p className="text-sm text-gray-500">
                    Approvisionnements
                  </p>

                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {chargement
                      ? "..."
                      : statistiques.approvisionnements}
                  </p>
                </div>

                <div
                  className="
                    w-12 h-12 rounded-xl
                    bg-green-50
                    flex items-center justify-center
                    text-2xl
                  "
                >
                  🚚
                </div>

              </div>
            </div>

            <div
              className="
  bg-white
  border border-slate-200
  rounded-2xl
  p-6
  shadow-sm
  hover:shadow-xl
  hover:-translate-y-1
  transition-all duration-300
"
            >
              <div className="flex items-center justify-between">

                <div>
                  <p className="text-sm text-gray-500">
                    Mouvements de stock
                  </p>

                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {chargement
                      ? "..."
                      : statistiques.mouvements}
                  </p>
                </div>

                <div
                  className="
                    w-12 h-12 rounded-xl
                    bg-indigo-50
                    flex items-center justify-center
                    text-2xl
                  "
                >
                  📊
                </div>

              </div>
            </div>

            <div
              className="
  bg-white
  border border-slate-200
  rounded-2xl
  p-6
  shadow-sm
  hover:shadow-xl
  hover:-translate-y-1
  transition-all duration-300
"
            >
              <div className="flex items-center justify-between">

                <div>
                  <p className="text-sm text-gray-500">
                    Produits en rupture
                  </p>

                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {chargement
                      ? "..."
                      : statistiques.ruptures}
                  </p>
                </div>

                <div
                  className="
                    w-12 h-12 rounded-xl
                    bg-red-50
                    flex items-center justify-center
                    text-2xl
                  "
                >
                  ⚠️
                </div>

              </div>

              <Link
                href="/administration/alertes"
                className="
                  inline-block mt-5
                  text-sm font-semibold
                  text-blue-600
                  hover:text-blue-700
                "
              >
                Voir les alertes →
              </Link>

            </div>

          </div>

        </div>

        {/* =================================================
            ACTIONS RAPIDES
        ================================================== */}

        <div className="mb-10">

          <div className="mb-6">

            <h2 className="text-2xl font-bold text-[#0f2747]">
              Gestion du stock
            </h2>

            <p className="text-slate-500 mt-1">
              Accédez rapidement aux opérations de stock.
            </p>

          </div>

          <div
            className="
              grid grid-cols-1
              md:grid-cols-2
              lg:grid-cols-4
              gap-5
            "
          >

            <Link
              href="/administration/produits"
              className="
  group
  bg-white
  border border-slate-200
  rounded-2xl
  p-6
  shadow-sm
  hover:shadow-xl
  hover:-translate-y-1
  hover:border-cyan-200
  transition-all
  duration-300
"
            >
              <div
                className="
                  w-14 h-14 rounded-xl
                  bg-blue-50
                  flex items-center justify-center
                  text-3xl mb-5
                  group-hover:scale-110
                  transition
                "
              >
                📦
              </div>

              <h3 className="font-bold text-lg text-gray-900">
                Produits
              </h3>

              <p className="text-sm text-gray-500 mt-2">
                Consulter et gérer les produits médicaux.
              </p>

              <p className="text-sm text-blue-600 font-semibold mt-5">
                Ouvrir →
              </p>
            </Link>

            <Link
              href="/administration/approvisionnements"
              className="
  group
  bg-white
  border border-slate-200
  rounded-2xl
  p-6
  shadow-sm
  hover:shadow-xl
  hover:-translate-y-1
  hover:border-cyan-200
  transition-all
  duration-300
"
            >
              <div
                className="
                  w-14 h-14 rounded-xl
                  bg-green-50
                  flex items-center justify-center
                  text-3xl mb-5
                  group-hover:scale-110
                  transition
                "
              >
                🚚
              </div>

              <h3 className="font-bold text-lg text-gray-900">
                Approvisionnements
              </h3>

              <p className="text-sm text-gray-500 mt-2">
                Enregistrer et suivre les approvisionnements.
              </p>

              <p className="text-sm text-blue-600 font-semibold mt-5">
                Ouvrir →
              </p>
            </Link>

            <Link
  href="/livraisons-stock"
  className="
  group
  bg-white
  border border-slate-200
  rounded-2xl
  p-6
  shadow-sm
  hover:shadow-xl
  hover:-translate-y-1
  hover:border-cyan-200
  transition-all
  duration-300
"
>
  <div
    className="
      w-14 h-14 rounded-xl
      bg-purple-50
      flex items-center justify-center
      text-3xl mb-5
      group-hover:scale-110
      transition
    "
  >
    🚚
  </div>

  <h3 className="font-bold text-lg text-gray-900">
    Livraisons
  </h3>

  <p className="text-sm text-gray-500 mt-2">
    Préparer, expédier et suivre les commandes à livrer.
  </p>

  <p className="text-sm text-blue-600 font-semibold mt-5">
    Gérer →
  </p>
</Link>

            <Link
              href="/historique-stock"
              className="
  group
  bg-white
  border border-slate-200
  rounded-2xl
  p-6
  shadow-sm
  hover:shadow-xl
  hover:-translate-y-1
  hover:border-cyan-200
  transition-all
  duration-300
"
            >
              <div
                className="
                  w-14 h-14 rounded-xl
                  bg-indigo-50
                  flex items-center justify-center
                  text-3xl mb-5
                  group-hover:scale-110
                  transition
                "
              >
                📊
              </div>

              <h3 className="font-bold text-lg text-gray-900">
                Mouvements de stock
              </h3>

              <p className="text-sm text-gray-500 mt-2">
                Consulter les entrées et sorties de stock.
              </p>

              <p className="text-sm text-blue-600 font-semibold mt-5">
                Consulter →
              </p>
            </Link>

            <Link
              href="/administration/alertes"
              className="
  group
  bg-white
  border border-slate-200
  rounded-2xl
  p-6
  shadow-sm
  hover:shadow-xl
  hover:-translate-y-1
  hover:border-cyan-200
  transition-all
  duration-300
"
            >
              <div
                className="
                  w-14 h-14 rounded-xl
                  bg-red-50
                  flex items-center justify-center
                  text-3xl mb-5
                  group-hover:scale-110
                  transition
                "
              >
                ⚠️
              </div>

              <h3 className="font-bold text-lg text-gray-900">
                Alertes
              </h3>

              <p className="text-sm text-gray-500 mt-2">
                Surveiller les situations nécessitant une intervention.
              </p>

              <p className="text-sm text-blue-600 font-semibold mt-5">
                Voir les alertes →
              </p>
            </Link>

          </div>

        </div>

        {/* =================================================
            MESSAGE
        ================================================== */}

        <div
  className="
    bg-gradient-to-r
    from-[#e8f8f7]
    via-[#eef8ff]
    to-[#eaf0ff]
    border border-cyan-100
    rounded-2xl
    p-7
    shadow-sm
  "
>

          <h2 className="text-xl font-bold text-[#0f2747]">
            📦 Gestion du stock MediDispositif
          </h2>

          <p className="text-sm text-slate-600 mt-3 leading-relaxed">
            Cet espace permet de superviser les produits,
            les approvisionnements, les mouvements de stock
            et les alertes liées aux disponibilités.
          </p>

        </div>

      </section>

    </div>

    </main>
  );
}