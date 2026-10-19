"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api from "../../services/api";


export default function ClientPage() {
  const router = useRouter();

  const [utilisateur, setUtilisateur] = useState(null);
  const [commandes, setCommandes] = useState([]);
  const [factures, setFactures] = useState([]);

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

      if (utilisateurConnecte.role !== "Client") {
        router.push("/");
        return;
      }

      setUtilisateur(utilisateurConnecte);

      chargerDonnees();
    } catch (error) {
      console.error(error);
      router.push("/connexion");
    }
  }, []);

  const chargerDonnees = async () => {
    try {
      setChargement(true);
      setErreur("");

      const resultats =
        await Promise.allSettled([
          api.get("/ventes/commandes/"),
          api.get("/ventes/factures/"),
        ]);

      const commandesResponse = resultats[0];
      const facturesResponse = resultats[1];

      let commandesRecuperees = [];
      let facturesRecuperees = [];

      if (commandesResponse.status === "fulfilled") {
        const data = commandesResponse.value?.data;

        commandesRecuperees =
          data?.results || data || [];
        console.log("Commandes client :", commandesRecuperees);
      }

      if (facturesResponse.status === "fulfilled") {
        const data = facturesResponse.value?.data;

        facturesRecuperees =
          data?.results || data || [];
      }

      setCommandes(commandesRecuperees);
      setFactures(facturesRecuperees);

      if (
        commandesResponse.status === "rejected" &&
        facturesResponse.status === "rejected"
      ) {
        setErreur(
          "Impossible de charger vos informations."
        );
      }
    } catch (error) {
      console.error(
        "Erreur lors du chargement du tableau de bord client :",
        error
      );

      setErreur(
        "Impossible de charger vos informations."
      );
    } finally {
      setChargement(false);
    }
  };

  const commandesEnCours = commandes.filter(
    (commande) => commande.statut === "EnCours"
  ).length;

  const commandesValidees = commandes.filter(
    (commande) => commande.statut === "Validee"
  ).length;

  return (
    <main className="min-h-screen bg-[#f4f8fc]">

    

    <div className="ml-64 min-h-screen">

      {/* =====================================================
          EN-TÊTE CLIENT
      ====================================================== */}

      {/* =====================================================
          EN-TÊTE CLIENT
      ====================================================== */}

      <section
        className="
  bg-gradient-to-r
  from-[#0b1730]
  via-[#1649b8]
  to-[#087f8c]
  text-white
  shadow-lg
"
      >
        <div className="max-w-7xl mx-auto px-6 py-12">

          <p className="text-blue-200 text-sm font-medium mb-2">
            ESPACE CLIENT
          </p>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">

            <div>

              <h1 className="text-3xl md:text-4xl font-bold">
                Bienvenue{" "}
                {utilisateur?.prenom || "chez MediDispositif"} 👋
              </h1>

              <p className="text-blue-100 mt-3 max-w-2xl">
                Retrouvez vos commandes, vos factures
                et accédez rapidement à notre catalogue
                de dispositifs médicaux.
              </p>

            </div>

            <div
              className="
                bg-white/10
                backdrop-blur-sm
                border border-white/20
                rounded-2xl
                px-6 py-5
              "
            >
              <p className="text-xs uppercase tracking-wider text-blue-200">
                Connecté en tant que
              </p>

              <p className="font-bold text-lg mt-1">
                {utilisateur
                  ? `${utilisateur.prenom} ${utilisateur.nom}`
                  : "Client"}
              </p>

              <p className="text-sm text-blue-200 mt-1">
                Client
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* =====================================================
          CONTENU
      ====================================================== */}

      <div className="max-w-7xl mx-auto px-6 py-10">

        {/* ERREUR */}

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
            STATISTIQUES
        ================================================== */}

        <section className="mb-10">

          <div className="mb-5">

            <h2 className="text-2xl font-bold text-gray-900">
              Vue d'ensemble
            </h2>

            <p className="text-gray-500 mt-1">
              Résumé de votre activité
            </p>

          </div>

          <div
            className="
              grid
              grid-cols-1
              sm:grid-cols-2
              lg:grid-cols-4
              gap-5
            "
          >

            {/* COMMANDES */}

            <div
              className="
                bg-white
                border border-gray-200
                rounded-2xl
                p-6
                shadow-sm
                hover:shadow-lg
                transition
              "
            >

              <div className="flex items-center justify-between">

                <div>
                  <p className="text-sm text-gray-500">
                    Mes commandes
                  </p>

                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {chargement ? "..." : commandes.length}
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

              <Link
                href="/commandes"
                className="
                  inline-block
                  mt-5
                  text-sm
                  font-semibold
                  text-blue-600
                  hover:text-blue-700
                "
              >
                Voir mes commandes →
              </Link>

            </div>

            {/* COMMANDES EN COURS */}

            <div
              className="
                bg-white
                border border-gray-200
                rounded-2xl
                p-6
                shadow-sm
                hover:shadow-lg
                transition
              "
            >

              <div className="flex items-center justify-between">

                <div>
                  <p className="text-sm text-gray-500">
                    Commandes en cours
                  </p>

                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {chargement ? "..." : commandesEnCours}
                  </p>
                </div>

                <div
                  className="
                    w-12 h-12 rounded-xl
                    bg-orange-50
                    flex items-center justify-center
                    text-2xl
                  "
                >
                  ⏳
                </div>

              </div>

              <Link
                href="/commandes"
                className="
                  inline-block
                  mt-5
                  text-sm
                  font-semibold
                  text-blue-600
                  hover:text-blue-700
                "
              >
                Suivre mes commandes →
              </Link>

            </div>

            {/* COMMANDES VALIDÉES */}

            <div
              className="
                bg-white
                border border-gray-200
                rounded-2xl
                p-6
                shadow-sm
                hover:shadow-lg
                transition
              "
            >

              <div className="flex items-center justify-between">

                <div>
                  <p className="text-sm text-gray-500">
                    Commandes validées
                  </p>

                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {chargement ? "..." : commandesValidees}
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
                  ✅
                </div>

              </div>

              <Link
                href="/commandes"
                className="
                  inline-block
                  mt-5
                  text-sm
                  font-semibold
                  text-blue-600
                  hover:text-blue-700
                "
              >
                Consulter →
              </Link>

            </div>

            {/* FACTURES */}

            <div
              className="
                bg-white
                border border-gray-200
                rounded-2xl
                p-6
                shadow-sm
                hover:shadow-lg
                transition
              "
            >

              <div className="flex items-center justify-between">

                <div>
                  <p className="text-sm text-gray-500">
                    Mes factures
                  </p>

                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {chargement ? "..." : factures.length}
                  </p>
                </div>

                <div
                  className="
                    w-12 h-12 rounded-xl
                    bg-purple-50
                    flex items-center justify-center
                    text-2xl
                  "
                >
                  🧾
                </div>

              </div>

              <Link
                href="/factures"
                className="
                  inline-block
                  mt-5
                  text-sm
                  font-semibold
                  text-blue-600
                  hover:text-blue-700
                "
              >
                Voir mes factures →
              </Link>

            </div>

          </div>

        </section>

        {/* =================================================
            ACTIONS RAPIDES
        ================================================== */}

        <section className="mb-10">

          <div className="mb-5">

            <h2 className="text-2xl font-bold text-gray-900">
              Que souhaitez-vous faire ?
            </h2>

            <p className="text-gray-500 mt-1">
              Accès rapide à vos principales fonctionnalités
            </p>

          </div>

          <div
            className="
              grid
              grid-cols-1
              md:grid-cols-2
              lg:grid-cols-4
              gap-5
            "
          >

            <Link
              href="/produits"
              className="
                group
                bg-white
                border border-gray-200
                rounded-2xl
                p-6
                shadow-sm
                hover:shadow-xl
                hover:-translate-y-1
                transition-all
              "
            >

              <div
                className="
                  w-14 h-14
                  rounded-xl
                  bg-blue-50
                  flex items-center justify-center
                  text-3xl
                  mb-5
                  group-hover:scale-110
                  transition
                "
              >
                🛍️
              </div>

              <h3 className="text-lg font-bold text-gray-900">
                Acheter un produit
              </h3>

              <p className="text-sm text-gray-500 mt-2">
                Parcourez notre catalogue de dispositifs médicaux.
              </p>

              <p className="text-sm text-blue-600 font-semibold mt-5">
                Voir les produits →
              </p>

            </Link>

            <Link
              href="/panier"
              className="
                group
                bg-white
                border border-gray-200
                rounded-2xl
                p-6
                shadow-sm
                hover:shadow-xl
                hover:-translate-y-1
                transition-all
              "
            >

              <div
                className="
                  w-14 h-14
                  rounded-xl
                  bg-green-50
                  flex items-center justify-center
                  text-3xl
                  mb-5
                  group-hover:scale-110
                  transition
                "
              >
                🛒
              </div>

              <h3 className="text-lg font-bold text-gray-900">
                Mon panier
              </h3>

              <p className="text-sm text-gray-500 mt-2">
                Consultez les produits que vous avez sélectionnés.
              </p>

              <p className="text-sm text-blue-600 font-semibold mt-5">
                Ouvrir mon panier →
              </p>

            </Link>

            <Link
              href="/commandes"
              className="
                group
                bg-white
                border border-gray-200
                rounded-2xl
                p-6
                shadow-sm
                hover:shadow-xl
                hover:-translate-y-1
                transition-all
              "
            >

              <div
                className="
                  w-14 h-14
                  rounded-xl
                  bg-orange-50
                  flex items-center justify-center
                  text-3xl
                  mb-5
                  group-hover:scale-110
                  transition
                "
              >
                📦
              </div>

              <h3 className="text-lg font-bold text-gray-900">
                Mes commandes
              </h3>

              <p className="text-sm text-gray-500 mt-2">
                Consultez l'historique et l'état de vos commandes.
              </p>

              <p className="text-sm text-blue-600 font-semibold mt-5">
                Consulter →
              </p>

            </Link>

            <Link
              href="/factures"
              className="
                group
                bg-white
                border border-gray-200
                rounded-2xl
                p-6
                shadow-sm
                hover:shadow-xl
                hover:-translate-y-1
                transition-all
              "
            >

              <div
                className="
                  w-14 h-14
                  rounded-xl
                  bg-purple-50
                  flex items-center justify-center
                  text-3xl
                  mb-5
                  group-hover:scale-110
                  transition
                "
              >
                🧾
              </div>

              <h3 className="text-lg font-bold text-gray-900">
                Mes factures
              </h3>

              <p className="text-sm text-gray-500 mt-2">
                Retrouvez vos factures générées après vos achats.
              </p>

              <p className="text-sm text-blue-600 font-semibold mt-5">
                Consulter →
              </p>

            </Link>

          </div>

        </section>

        {/* =================================================
            DERNIÈRES COMMANDES
        ================================================== */}

        <section className="mb-10">

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5">

            <div>

              <h2 className="text-2xl font-bold text-gray-900">
                Mes dernières commandes
              </h2>

              <p className="text-gray-500 mt-1">
                Un aperçu de vos commandes récentes
              </p>

            </div>

            <Link
              href="/commandes"
              className="text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              Voir toutes mes commandes →
            </Link>

          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">

            {chargement ? (

              <div className="p-8 text-center text-gray-500">
                Chargement de vos commandes...
              </div>

            ) : commandes.length === 0 ? (

              <div className="p-10 text-center">

                <div className="text-5xl mb-4">
                  📦
                </div>

                <h3 className="text-lg font-semibold text-gray-900">
                  Aucune commande pour le moment
                </h3>

                <p className="text-gray-500 mt-2">
                  Découvrez notre catalogue et passez votre première commande.
                </p>

                <Link
                  href="/produits"
                  className="
                    inline-block
                    mt-5
                    bg-gradient-to-r
from-blue-600
to-cyan-500
text-white
px-5 py-3
rounded-lg
font-semibold
hover:from-blue-700
hover:to-cyan-600
shadow-sm
hover:shadow-md
transition-all
                  "
                >
                  Découvrir les produits
                </Link>

              </div>

            ) : (

              <div className="overflow-x-auto">

                <table className="min-w-full">

                  <thead className="bg-gray-50 border-b">

                    <tr>

                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                        Commande
                      </th>

                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                        Date
                      </th>

                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                        Statut
                      </th>

                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                        Total
                      </th>

                      <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">
                        Action
                      </th>

                    </tr>

                  </thead>

                  <tbody className="divide-y divide-gray-200">

                    {commandes
                      .slice(0, 5)
                      .map((commande) => (

                        <tr
                          key={commande.idCommande || commande.id}
                          className="hover:bg-gray-50 transition"
                        >

                          <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                            #
                            {commande.idCommande ||
                              commande.id}
                          </td>

                          <td className="px-6 py-4 text-sm text-gray-600">
                            {commande.date_commande
                              ? new Date(
                                  commande.date_commande
                                ).toLocaleDateString("fr-FR")
                              : "-"}
                          </td>

                          <td className="px-6 py-4">

                            <span
                              className={`
                                inline-flex
                                rounded-full
                                px-3 py-1
                                text-xs
                                font-semibold
                                ${
                                  commande.statut ===
                                  "Validee"
                                    ? "bg-green-100 text-green-700"
                                    : commande.statut ===
                                      "Annulee"
                                    ? "bg-red-100 text-red-700"
                                    : "bg-orange-100 text-orange-700"
                                }
                              `}
                            >
                              {commande.statut ===
                              "Validee"
                                ? "Validée"
                                : commande.statut ===
                                  "Annulee"
                                ? "Annulée"
                                : "En cours"}
                            </span>

                          </td>

                          <td className="px-6 py-4 text-sm font-semibold text-gray-900">
  {commande.montant_total
    ? Number(
        commande.montant_total
      ).toLocaleString("fr-FR")
    : "0"}{" "}
  FCFA
</td>

                          <td className="px-6 py-4 text-right">

                            <Link
                              href={`/commandes/${commande.idCommande || commande.id}`}
                              className="
                                text-sm
                                font-semibold
                                text-blue-600
                                hover:text-blue-700
                              "
                            >
                              Voir →
                            </Link>

                          </td>

                        </tr>

                      ))}

                  </tbody>

                </table>

              </div>

            )}

          </div>

        </section>

        {/* =================================================
            CONSEIL
        ================================================== */}

        <section>

          <div
            className="
              bg-gradient-to-r
              from-blue-50
              to-indigo-50
              border border-blue-100
              rounded-2xl
              p-7
            "
          >

            <h2 className="text-xl font-bold text-blue-900">
              🩺 MediDispositif à votre service
            </h2>

            <p className="text-sm text-blue-800 mt-3 leading-relaxed">
              Consultez notre catalogue, choisissez vos
              dispositifs médicaux, passez votre commande
              en ligne et retrouvez vos factures directement
              depuis votre espace client.
            </p>

            <Link
              href="/produits"
              className="
                inline-flex
                items-center
                gap-2
                mt-5
                bg-gradient-to-r
from-blue-600
to-cyan-500
text-white
px-5 py-3
rounded-lg
font-semibold
hover:from-blue-700
hover:to-cyan-600
shadow-sm
hover:shadow-md
transition-all
              "
            >
              Explorer le catalogue
              →
            </Link>

          </div>

        </section>

      </div>

    </div>

    </main>
  );
}