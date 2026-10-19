"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "../../services/api";

export default function LivraisonsStockPage() {
  const router = useRouter();

  const [utilisateur, setUtilisateur] = useState(null);
  const [livraisons, setLivraisons] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");
  const [message, setMessage] = useState("");
  const [miseAJour, setMiseAJour] = useState(null);
  const [filtreStatut, setFiltreStatut] = useState("Tous");

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
      chargerLivraisons();

    } catch (error) {
      console.error(error);
      router.push("/connexion");
    }
  }, [router]);

  const chargerLivraisons = async () => {
    try {
      setChargement(true);
      setErreur("");

      const response =
        await api.get("/ventes/livraisons/");

      const data = response.data;

      setLivraisons(
        data?.results || data || []
      );

    } catch (error) {
      console.error(error);

      setErreur(
        "Impossible de charger les livraisons."
      );

    } finally {
      setChargement(false);
    }
  };

  const modifierStatut = async (
    idLivraison,
    nouveauStatut
  ) => {
    try {
      setMiseAJour(idLivraison);
      setErreur("");
      setMessage("");

      await api.patch(
        `/ventes/livraisons/${idLivraison}/`,
        {
          statut: nouveauStatut,
        }
      );

      setMessage(
        "Le statut de la livraison a été mis à jour avec succès."
      );

      await chargerLivraisons();

    } catch (error) {
      console.error(error);

      const data = error.response?.data;

      setErreur(
        data?.detail ||
        data?.error ||
        "Impossible de modifier le statut de la livraison."
      );

    } finally {
      setMiseAJour(null);
    }
  };

  const afficherDate = (date) => {
    if (!date) return "—";

    return new Date(date).toLocaleDateString(
      "fr-FR"
    );
  };

  const obtenirClasseStatut = (statut) => {
    switch (statut) {
      case "A_Preparer":
        return "bg-yellow-100 text-yellow-800";

      case "En_Preparation":
        return "bg-blue-100 text-blue-800";

      case "Expediee":
        return "bg-purple-100 text-purple-800";

      case "Livree":
        return "bg-green-100 text-green-800";

      case "Annulee":
        return "bg-red-100 text-red-800";

      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const livraisonsFiltrees =
  filtreStatut === "Tous"
    ? livraisons
    : livraisons.filter(
        (livraison) =>
          livraison.statut === filtreStatut
      );

  return (
    <main className="min-h-screen bg-[#f4f8fc]">

      <div className="ml-64 min-h-screen">

      {/* =====================================================
          EN-TÊTE
      ====================================================== */}

      <section
        className="
          bg-gradient-to-r
          from-[#0b1730]
          via-[#1649b8]
          to-[#087f8c]
          text-white
        "
      >
        <div className="max-w-7xl mx-auto px-6 py-10">

          <div
            className="
              flex flex-col md:flex-row
              md:items-center md:justify-between
              gap-5
            "
          >

            <div>

              <p className="text-cyan-300 text-sm font-semibold tracking-wide mb-2">
  GESTION DU STOCK
</p>

              <h1 className="text-3xl md:text-4xl font-bold">
                Suivi des livraisons
              </h1>

              <p className="text-blue-100 mt-3">
                Préparez, expédiez et suivez les commandes
                jusqu'à leur livraison.
              </p>

            </div>

            <Link
              href="/gestionnaire-stock"
              className="
                inline-flex items-center justify-center
                bg-white/10
                border border-white/20
                rounded-xl
                px-5 py-3
                font-semibold
                hover:bg-white/20
                transition
              "
            >
              ← Tableau de bord
            </Link>

          </div>

        </div>
      </section>

      {/* =====================================================
          CONTENU
      ====================================================== */}

      <section className="max-w-7xl mx-auto px-6 py-10">

        {/* MESSAGES */}

        {erreur && (
          <div
            className="
              mb-5
              bg-red-50
              border border-red-200
              text-red-700
              rounded-xl
              px-5 py-4
            "
          >
            ⚠️ {erreur}
          </div>
        )}

        {message && (
          <div
            className="
              mb-5
              bg-green-50
              border border-green-200
              text-green-700
              rounded-xl
              px-5 py-4
            "
          >
            ✅ {message}
          </div>
        )}

        {/* =================================================
            STATISTIQUES RAPIDES
        ================================================== */}

        <div
          className="
            grid grid-cols-1
            sm:grid-cols-2
            lg:grid-cols-4
            gap-5
            mb-8
          "
        >

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm
hover:shadow-md transition">
            <p className="text-sm text-gray-500">
              Total
            </p>

            <p className="text-3xl font-bold text-gray-900 mt-2">
              {livraisons.length}
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm
hover:shadow-md transition">
            <p className="text-sm text-gray-500">
              À préparer
            </p>

            <p className="text-3xl font-bold text-yellow-600 mt-2">
              {
                livraisons.filter(
                  (l) => l.statut === "A_Preparer"
                ).length
              }
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm
hover:shadow-md transition">
            <p className="text-sm text-gray-500">
              En préparation
            </p>

            <p className="text-3xl font-bold text-blue-600 mt-2">
              {
                livraisons.filter(
                  (l) => l.statut === "En_Preparation"
                ).length
              }
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm
hover:shadow-md transition">
            <p className="text-sm text-gray-500">
              Livrées
            </p>

            <p className="text-3xl font-bold text-green-600 mt-2">
              {
                livraisons.filter(
                  (l) => l.statut === "Livree"
                ).length
              }
            </p>
          </div>

        </div>

        {/* =================================================
            LISTE DES LIVRAISONS
        ================================================== */}

        <div
          className="
            bg-white
            border border-slate-200
            rounded-2xl
            shadow-sm
            overflow-hidden
          "
        >

          <div className="px-6 py-5 border-b border-gray-200">

  <h2 className="text-xl font-bold text-gray-900">
    Livraisons
  </h2>

  <p className="text-sm text-gray-500 mt-1">
    Gérez l'état d'avancement des commandes.
  </p>

  {/* =================================================
      FILTRE PAR STATUT
  ================================================== */}

  <div className="flex flex-wrap gap-2 mt-5">

    {[
      {
        valeur: "Tous",
        label: "Toutes",
        compteur: livraisons.length,
      },
      {
        valeur: "A_Preparer",
        label: "À préparer",
        compteur: livraisons.filter(
          (l) => l.statut === "A_Preparer"
        ).length,
      },
      {
        valeur: "En_Preparation",
        label: "En préparation",
        compteur: livraisons.filter(
          (l) => l.statut === "En_Preparation"
        ).length,
      },
      {
        valeur: "Expediee",
        label: "Expédiées",
        compteur: livraisons.filter(
          (l) => l.statut === "Expediee"
        ).length,
      },
      {
        valeur: "Livree",
        label: "Livrées",
        compteur: livraisons.filter(
          (l) => l.statut === "Livree"
        ).length,
      },
      {
        valeur: "Annulee",
        label: "Annulées",
        compteur: livraisons.filter(
          (l) => l.statut === "Annulee"
        ).length,
      },
    ].map((filtre) => (

      <button
        key={filtre.valeur}
        type="button"
        onClick={() =>
          setFiltreStatut(filtre.valeur)
        }
        className={`
          px-4 py-2
          rounded-lg
          text-sm
          font-semibold
          transition
          border
          ${
            filtreStatut === filtre.valeur
              ? "bg-blue-600 text-white border-blue-600 shadow-sm"
              : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
          }
        `}
      >
        {filtre.label}

        <span
          className={`
            ml-2
            px-1.5 py-0.5
            rounded-full
            text-xs
            ${
              filtreStatut === filtre.valeur
                ? "bg-white/20 text-white"
                : "bg-gray-100 text-gray-600"
            }
          `}
        >
          {filtre.compteur}
        </span>

      </button>

    ))}

  </div>

</div>

          {chargement ? (

            <div className="p-10 text-center text-gray-500">
              Chargement des livraisons...
            </div>

          ) : livraisonsFiltrees.length === 0 ? (

            <div className="p-10 text-center">

              <div className="text-5xl mb-4">
                📦
              </div>

              <p className="font-semibold text-gray-900">
                Aucune livraison
              </p>

              <p className="text-sm text-gray-500 mt-1">
                Les nouvelles commandes payées apparaîtront ici.
              </p>

            </div>

          ) : (

            <div className="overflow-x-auto">

              <table className="w-full">

                <thead className="bg-slate-50 border-b border-slate-200">

                  <tr>

                    <th className="text-left px-6 py-4 text-xs font-semibold text-slate-600 uppercase">
                      Commande
                    </th>

                    <th className="text-left px-6 py-4 text-xs font-semibold text-slate-600 uppercase">
                      Adresse
                    </th>

                    <th className="text-left px-6 py-4 text-xs font-semibold text-slate-600 uppercase">
                      Téléphone
                    </th>

                    <th className="text-left px-6 py-4 text-xs font-semibold text-slate-600 uppercase">
                      Date prévue
                    </th>

                    <th className="text-left px-6 py-4 text-xs font-semibold text-slate-600 uppercase">
                      Statut
                    </th>

                    <th className="text-left px-6 py-4 text-xs font-semibold text-slate-600 uppercase">
                      Action
                    </th>

                  </tr>

                </thead>

                <tbody className="divide-y divide-gray-100">

                  {livraisonsFiltrees.map((livraison) => (

                    <tr
                      key={livraison.idLivraison}
                      className="hover:bg-cyan-50/40 transition-colors"
                    >

                      <td className="px-6 py-5">

                        <p className="font-bold text-gray-900">
                          #{livraison.numero_commande}
                        </p>

                        <p className="text-xs text-gray-500 mt-1">
                          Livraison #{livraison.idLivraison}
                        </p>

                      </td>

                      <td className="px-6 py-5">

                        <p className="text-sm text-gray-800 max-w-xs">
                          {livraison.adresse_livraison || "Adresse non renseignée"}
                        </p>

                      </td>

                      <td className="px-6 py-5">

                        <p className="text-sm text-gray-800">
                          {livraison.telephone_contact || "—"}
                        </p>

                      </td>

                      <td className="px-6 py-5">

                        <p className="text-sm font-medium text-gray-800">
                          {afficherDate(
                            livraison.date_prevue
                          )}
                        </p>

                      </td>

                      <td className="px-6 py-5">

                        <span
                          className={`
                            inline-flex
                            px-3 py-1.5
                            rounded-full
                            text-xs
                            font-semibold
                            ${obtenirClasseStatut(
                              livraison.statut
                            )}
                          `}
                        >
                          {livraison.statut_display}
                        </span>

                        {livraison.date_expedition && (
                          <p className="text-xs text-gray-500 mt-2">
                            Expédiée :{" "}
                            {afficherDate(
                              livraison.date_expedition
                            )}
                          </p>
                        )}

                        {livraison.date_livraison && (
                          <p className="text-xs text-green-600 mt-1">
                            Livrée :{" "}
                            {afficherDate(
                              livraison.date_livraison
                            )}
                          </p>
                        )}

                      </td>

                      <td className="px-6 py-5">

                        {livraison.statut ===
                          "A_Preparer" && (

                          <button
                            onClick={() =>
                              modifierStatut(
                                livraison.idLivraison,
                                "En_Preparation"
                              )
                            }
                            disabled={
                              miseAJour ===
                              livraison.idLivraison
                            }
                            className="
                              bg-blue-600
                              text-white
                              px-4 py-2
                              rounded-lg
                              text-sm
                              font-semibold
                              hover:bg-blue-700
                              disabled:bg-gray-400
                            "
                          >
                            {miseAJour ===
                            livraison.idLivraison
                              ? "..."
                              : "Commencer"}
                          </button>
                        )}

                        {livraison.statut ===
                          "En_Preparation" && (

                          <button
                            onClick={() =>
                              modifierStatut(
                                livraison.idLivraison,
                                "Expediee"
                              )
                            }
                            disabled={
                              miseAJour ===
                              livraison.idLivraison
                            }
                            className="
                              bg-purple-600
                              text-white
                              px-4 py-2
                              rounded-lg
                              text-sm
                              font-semibold
                              hover:bg-purple-700
                              disabled:bg-gray-400
                            "
                          >
                            {miseAJour ===
                            livraison.idLivraison
                              ? "..."
                              : "Expédier"}
                          </button>
                        )}

                        {livraison.statut ===
                          "Expediee" && (

                          <button
                            onClick={() =>
                              modifierStatut(
                                livraison.idLivraison,
                                "Livree"
                              )
                            }
                            disabled={
                              miseAJour ===
                              livraison.idLivraison
                            }
                            className="
                              bg-green-600
                              text-white
                              px-4 py-2
                              rounded-lg
                              text-sm
                              font-semibold
                              hover:bg-green-700
                              disabled:bg-gray-400
                            "
                          >
                            {miseAJour ===
                            livraison.idLivraison
                              ? "..."
                              : "Marquer livrée"}
                          </button>
                        )}

                        {livraison.statut ===
                          "Livree" && (

                          <span className="text-sm font-semibold text-green-600">
                            ✓ Livraison terminée
                          </span>
                        )}

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

    </main>
  );
}