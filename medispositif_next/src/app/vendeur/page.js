"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api from "../../services/api";

export default function VendeurPage() {
  const router = useRouter();

  const [utilisateur, setUtilisateur] = useState(null);
  const [commandes, setCommandes] = useState([]);

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

      if (utilisateurConnecte.role !== "Vendeur") {
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
      ]);

    let commandesRecuperees = [];

    if (resultats[0].status === "fulfilled") {
      const data = resultats[0].value?.data;

      commandesRecuperees =
        data?.results || data || [];
    }

    setCommandes(commandesRecuperees);

    if (resultats[0].status === "rejected") {
      setErreur(
        "Impossible de charger les commandes du vendeur."
      );
    }

  } catch (error) {
    console.error(
      "Erreur lors du chargement de l'espace vendeur :",
      error
    );

    setErreur(
      "Impossible de charger les données du vendeur."
    );
  } finally {
    setChargement(false);
  }
};
  /* =========================================================
     STATISTIQUES
  ========================================================= */

  const commandesEnCours = commandes.filter(
    (commande) => commande.statut === "EnCours"
  ).length;

  const commandesValidees = commandes.filter(
    (commande) => commande.statut === "Validee"
  ).length;

  const commandesAnnulees = commandes.filter(
    (commande) => commande.statut === "Annulee"
  ).length;

  return (
  <main className="min-h-screen bg-[#f4f8fc]">

    

    {/* CONTENU PRINCIPAL */}
    <div className="ml-64 min-h-screen">


      {/* =====================================================
          EN-TÊTE VENDEUR
      ====================================================== */}

      <section
  className="
    bg-gradient-to-r
    from-[#0b1730]
    via-[#1d4ed8]
    to-[#0891b2]
    text-white
    shadow-lg
  "
>
        <div className="max-w-7xl mx-auto px-6 py-12">

          <div
            className="
              flex flex-col
              md:flex-row
              md:items-center
              md:justify-between
              gap-6
            "
          >

            <div>

              <p className="text-blue-100 text-sm font-medium mb-2">
  ESPACE VENDEUR
</p>

              <h1 className="text-3xl md:text-4xl font-bold">
                Bonjour{" "}
                {utilisateur?.prenom || "vendeur"} 👋
              </h1>

              <p className="text-blue-50 mt-3 max-w-2xl">
  Consultez les commandes, accompagnez les clients
  et assurez le suivi des ventes.
</p>

            </div>

            <div
              className="
                bg-white/10
                backdrop-blur-sm
                border border-white/20
                rounded-2xl
                px-6 py-5
                shadow-lg
              "
            >
              <p className="text-xs uppercase tracking-wider text-blue-100">
                Connecté en tant que
              </p>

              <p className="text-sm text-blue-100 mt-1">
                {utilisateur
                  ? `${utilisateur.prenom} ${utilisateur.nom}`
                  : "Vendeur"}
              </p>

              <p className="text-sm text-emerald-100 mt-1">
                Vendeur
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
              Résumé de votre activité commerciale
            </p>

          </div>

          <div
            className="
              grid
              grid-cols-1
              sm:grid-cols-2
              lg:grid-cols-3
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
                    Commandes
                  </p>

                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {chargement
                      ? "..."
                      : commandes.length}
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
                href="/gestion-commandes"
                className="
                  inline-block
                  mt-5
                  text-sm font-semibold
                  text-blue-600
                  hover:text-blue-700
                "
              >
                Gérer →
              </Link>

            </div>

            {/* EN COURS */}

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
                    En cours
                  </p>

                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {chargement
                      ? "..."
                      : commandesEnCours}
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
                href="/gestion-commandes"
                className="
                  inline-block
                  mt-5
                  text-sm font-semibold
                  text-blue-600
                  hover:text-blue-700
                "
              >
                Traiter →
              </Link>

            </div>

            {/* VALIDÉES */}

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
                    Validées
                  </p>

                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {chargement
                      ? "..."
                      : commandesValidees}
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
                href="/gestion-commandes"
                className="
                  inline-block
                  mt-5
                  text-sm font-semibold
                  text-blue-600
                  hover:text-blue-700
                "
              >
                Consulter →
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
              Actions rapides
            </h2>

            <p className="text-gray-500 mt-1">
              Accédez rapidement aux opérations commerciales
            </p>

          </div>

          <div
            className="
              grid
              grid-cols-1
              md:grid-cols-3
              gap-5
            "
          >

            {/* COMMANDES */}

            <Link
              href="/gestion-commandes"
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
                📦
              </div>

              <h3 className="text-lg font-bold text-gray-900">
                Gestion des commandes
              </h3>

              <p className="text-sm text-gray-500 mt-2">
  Consultez les commandes des clients et suivez
  leur traitement.
</p>

              <p className="text-sm text-blue-600 font-semibold mt-5">
                Ouvrir →
              </p>

            </Link>

            {/* PRODUITS */}

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
                  bg-green-50
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
                Catalogue produits
              </h3>

              <p className="text-sm text-gray-500 mt-2">
                Consultez les dispositifs médicaux disponibles.
              </p>

              <p className="text-sm text-blue-600 font-semibold mt-5">
                Voir les produits →
              </p>

            </Link>

          </div>

        </section>

        {/* =================================================
            COMMANDES RÉCENTES
        ================================================== */}

        <section>

          <div
            className="
              flex flex-col
              md:flex-row
              md:items-center
              md:justify-between
              gap-3 mb-5
            "
          >

            <div>

              <h2 className="text-2xl font-bold text-gray-900">
                Commandes récentes
              </h2>

              <p className="text-gray-500 mt-1">
                Aperçu des dernières commandes
              </p>

            </div>

            <Link
              href="/gestion-commandes"
              className="
                text-sm font-semibold
                text-blue-600
                hover:text-blue-700
              "
            >
              Voir toutes les commandes →
            </Link>

          </div>

          <div
            className="
              bg-white
              rounded-2xl
              border border-gray-200
              shadow-sm
              overflow-hidden
            "
          >

            {chargement ? (

              <div className="p-8 text-center text-gray-500">
                Chargement des commandes...
              </div>

            ) : commandes.length === 0 ? (

              <div className="p-10 text-center">

                <div className="text-5xl mb-4">
                  📦
                </div>

                <h3 className="text-lg font-semibold text-gray-900">
                  Aucune commande
                </h3>

                <p className="text-gray-500 mt-2">
                  Aucune commande n'est disponible actuellement.
                </p>

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
                        Client
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
                          key={
                            commande.idCommande ||
                            commande.id
                          }
                          className="hover:bg-gray-50 transition"
                        >

                          <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                            #
                            {commande.idCommande ||
                              commande.id}
                          </td>

                          <td className="px-6 py-4 text-sm text-gray-600">
                            {commande.nom_client ||
                              commande.email_client ||
                              "Client"}
                          </td>

                          <td className="px-6 py-4 text-sm text-gray-600">
                            {commande.date_commande
                              ? new Date(
                                  commande.date_commande
                                ).toLocaleDateString(
                                  "fr-FR"
                                )
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
                                ).toLocaleString(
                                  "fr-FR"
                                )
                              : "0"}{" "}
                            FCFA
                          </td>

                          <td className="px-6 py-4 text-right">

                            <Link
                              href={`/gestion-commandes`}
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

      </div>
</div>
    </main>
  );
}