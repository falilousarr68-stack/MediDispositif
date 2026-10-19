"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import api from "@/services/api";

export default function HistoriqueStockPage() {
  const [mouvements, setMouvements] = useState([]);
  const [produits, setProduits] = useState([]);

  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");

  const [filtreType, setFiltreType] = useState("TOUS");
  const [filtreProduit, setFiltreProduit] = useState("");
  const [recherche, setRecherche] = useState("");

  // ==========================================================
  // VÉRIFICATION DU RÔLE
  // ==========================================================

  useEffect(() => {
    const utilisateur = localStorage.getItem("utilisateur");

    if (!utilisateur) {
      window.location.href = "/connexion";
      return;
    }

    try {
      const user = JSON.parse(utilisateur);

      const rolesAutorises = [
        "Administrateur",
        "GestionnaireDeStock",
      ];

      if (!rolesAutorises.includes(user.role)) {
        window.location.href = "/";
      }
    } catch (error) {
      console.error(error);
      window.location.href = "/";
    }
  }, []);

  // ==========================================================
  // CHARGEMENT
  // ==========================================================

  useEffect(() => {
    chargerHistorique();
  }, []);

  const chargerHistorique = async () => {
    setChargement(true);
    setErreur("");

    try {
      const [responseMouvements, responseProduits] =
        await Promise.all([
          api.get("/catalogue/mouvements-stock/"),
          api.get("/catalogue/produits/"),
        ]);

      setMouvements(responseMouvements.data || []);
      setProduits(responseProduits.data || []);
    } catch (error) {
      console.error("Erreur historique :", error);

      setErreur(
        error.response?.data?.detail ||
          "Impossible de charger l'historique du stock."
      );
    } finally {
      setChargement(false);
    }
  };

  // ==========================================================
  // PRODUIT PAR ID
  // ==========================================================

  const trouverProduit = (idProduit) => {
    return produits.find(
      (produit) =>
        Number(produit.idProduit) === Number(idProduit)
    );
  };

  // ==========================================================
  // FILTRAGE
  // ==========================================================

  const mouvementsFiltres = useMemo(() => {
    return mouvements.filter((mouvement) => {
      const produit = trouverProduit(mouvement.produit_id);

      const correspondType =
        filtreType === "TOUS" ||
        mouvement.type_mouvement === filtreType;

      const correspondProduit =
        !filtreProduit ||
        Number(mouvement.produit_id) === Number(filtreProduit);

      const texteRecherche = recherche.toLowerCase();

      const correspondRecherche =
        !recherche ||
        produit?.nom?.toLowerCase().includes(texteRecherche) ||
        String(mouvement.reference || "")
          .toLowerCase()
          .includes(texteRecherche);

      return (
        correspondType &&
        correspondProduit &&
        correspondRecherche
      );
    });
  }, [
    mouvements,
    produits,
    filtreType,
    filtreProduit,
    recherche,
  ]);

  // ==========================================================
  // STATISTIQUES
  // ==========================================================

  const statistiques = useMemo(() => {
    const entrees = mouvements.filter(
      (m) =>
        m.type_mouvement === "APPROVISIONNEMENT" ||
        m.type_mouvement === "Approvisionnement"
    );

    const ventes = mouvements.filter(
      (m) =>
        m.type_mouvement === "VENTE" ||
        m.type_mouvement === "Vente"
    );

    const annulations = mouvements.filter(
      (m) =>
        m.type_mouvement === "ANNULATION" ||
        m.type_mouvement === "Annulation"
    );

    return {
      total: mouvements.length,
      entrees: entrees.length,
      ventes: ventes.length,
      annulations: annulations.length,
    };
  }, [mouvements]);

  // ==========================================================
  // FORMATAGE
  // ==========================================================

  const formaterDate = (date) => {
    if (!date) return "—";

    return new Date(date).toLocaleString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formaterType = (type) => {
    const types = {
      APPROVISIONNEMENT: "Approvisionnement",
      Approvisionnement: "Approvisionnement",

      VENTE: "Vente",
      Vente: "Vente",

      ANNULATION: "Annulation",
      Annulation: "Annulation",
    };

    return types[type] || type;
  };

  const couleurType = (type) => {
    if (
      type === "APPROVISIONNEMENT" ||
      type === "Approvisionnement"
    ) {
      return "bg-green-100 text-green-700";
    }

    if (
      type === "VENTE" ||
      type === "Vente"
    ) {
      return "bg-red-100 text-red-700";
    }

    if (
      type === "ANNULATION" ||
      type === "Annulation"
    ) {
      return "bg-orange-100 text-orange-700";
    }

    return "bg-gray-100 text-gray-700";
  };

  // ==========================================================
  // CHARGEMENT
  // ==========================================================

  if (chargement) {
    return (
      <main className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <p className="text-gray-600">
            Chargement de l'historique du stock...
          </p>
        </div>
      </main>
    );
  }

  // ==========================================================
  // AFFICHAGE
  // ==========================================================

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4">

      <section className="max-w-7xl mx-auto">

        {/* ==================================================
            EN-TÊTE
        ================================================== */}

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">

          <div>

            <Link
              href="/"
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              ← Retour à l'accueil
            </Link>

            <h1 className="text-3xl font-bold text-gray-900 mt-3">
              📊 Historique du stock
            </h1>

            <p className="text-gray-600 mt-2">
              Consultez toutes les entrées et sorties de stock.
            </p>

          </div>

          <button
            onClick={chargerHistorique}
            className="border border-gray-300 bg-white px-4 py-2
                       rounded-lg text-gray-700
                       hover:bg-gray-50 transition"
          >
            🔄 Actualiser
          </button>

        </div>

        {/* ==================================================
            ERREUR
        ================================================== */}

        {erreur && (
          <div className="mb-6 bg-red-50 border border-red-300
                          text-red-800 px-5 py-4 rounded-lg">
            ⚠️ {erreur}
          </div>
        )}

        {/* ==================================================
            STATISTIQUES
        ================================================== */}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">

          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              Total mouvements
            </p>

            <p className="text-3xl font-bold text-gray-900 mt-2">
              {statistiques.total}
            </p>
          </div>

          <div className="bg-white rounded-xl border border-green-200 p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              Entrées de stock
            </p>

            <p className="text-3xl font-bold text-green-600 mt-2">
              {statistiques.entrees}
            </p>
          </div>

          <div className="bg-white rounded-xl border border-red-200 p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              Ventes
            </p>

            <p className="text-3xl font-bold text-red-600 mt-2">
              {statistiques.ventes}
            </p>
          </div>

          <div className="bg-white rounded-xl border border-orange-200 p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              Annulations
            </p>

            <p className="text-3xl font-bold text-orange-600 mt-2">
              {statistiques.annulations}
            </p>
          </div>

        </div>

        {/* ==================================================
            FILTRES
        ================================================== */}

        <div className="bg-white rounded-2xl border border-gray-200
                        shadow-sm p-6 mb-8">

          <h2 className="text-xl font-bold text-gray-900 mb-5">
            🔎 Rechercher un mouvement
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            {/* RECHERCHE */}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Recherche
              </label>

              <input
                type="text"
                value={recherche}
                onChange={(e) =>
                  setRecherche(e.target.value)
                }
                placeholder="Produit ou référence..."
                className="w-full border border-gray-300 rounded-lg
                           px-3 py-2.5 bg-white text-gray-900
                           placeholder-gray-400
                           focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* TYPE */}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type de mouvement
              </label>

              <select
                value={filtreType}
                onChange={(e) =>
                  setFiltreType(e.target.value)
                }
                className="w-full border border-gray-300 rounded-lg
                           px-3 py-2.5 bg-white text-gray-900
                           focus:ring-2 focus:ring-blue-500"
              >
                <option value="TOUS">
                  Tous les mouvements
                </option>

                <option value="APPROVISIONNEMENT">
                  Approvisionnement
                </option>

                <option value="VENTE">
                  Vente
                </option>

                <option value="ANNULATION">
                  Annulation
                </option>
              </select>
            </div>

            {/* PRODUIT */}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Produit
              </label>

              <select
                value={filtreProduit}
                onChange={(e) =>
                  setFiltreProduit(e.target.value)
                }
                className="w-full border border-gray-300 rounded-lg
                           px-3 py-2.5 bg-white text-gray-900
                           focus:ring-2 focus:ring-blue-500"
              >
                <option value="">
                  Tous les produits
                </option>

                {produits.map((produit) => (
                  <option
                    key={produit.idProduit}
                    value={produit.idProduit}
                  >
                    {produit.nom}
                  </option>
                ))}
              </select>
            </div>

          </div>

        </div>

        {/* ==================================================
            HISTORIQUE
        ================================================== */}

        <div className="bg-white rounded-2xl border border-gray-200
                        shadow-sm overflow-hidden">

          <div className="p-6 border-b border-gray-200">

            <h2 className="text-xl font-bold text-gray-900">
              Mouvements de stock
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              {mouvementsFiltres.length} mouvement
              {mouvementsFiltres.length > 1 ? "s" : ""} affiché
              {mouvementsFiltres.length > 1 ? "s" : ""}
            </p>

          </div>

          {mouvementsFiltres.length === 0 ? (

            <div className="p-14 text-center">

              <div className="text-5xl mb-4">
                📦
              </div>

              <p className="text-gray-600 font-medium">
                Aucun mouvement de stock trouvé.
              </p>

              <p className="text-sm text-gray-400 mt-2">
                Les mouvements apparaîtront ici lors des
                approvisionnements, ventes et annulations.
              </p>

            </div>

          ) : (

            <div className="overflow-x-auto">

              <table className="w-full">

                <thead className="bg-gray-50 border-b border-gray-200">

                  <tr>

                    <th className="text-left px-5 py-4 text-sm font-semibold text-gray-700">
                      Date
                    </th>

                    <th className="text-left px-5 py-4 text-sm font-semibold text-gray-700">
                      Produit
                    </th>

                    <th className="text-left px-5 py-4 text-sm font-semibold text-gray-700">
                      Type
                    </th>

                    <th className="text-center px-5 py-4 text-sm font-semibold text-gray-700">
                      Quantité
                    </th>

                    <th className="text-center px-5 py-4 text-sm font-semibold text-gray-700">
                      Stock avant
                    </th>

                    <th className="text-center px-5 py-4 text-sm font-semibold text-gray-700">
                      Stock après
                    </th>

                    <th className="text-left px-5 py-4 text-sm font-semibold text-gray-700">
                      Référence
                    </th>

                  </tr>

                </thead>

                <tbody className="divide-y divide-gray-100">

                  {mouvementsFiltres.map((mouvement) => {

                    const produit = trouverProduit(
                      mouvement.produit_id
                    );

                    const entree =
                      mouvement.type_mouvement ===
                        "APPROVISIONNEMENT" ||
                      mouvement.type_mouvement ===
                        "Approvisionnement" ||
                      mouvement.type_mouvement ===
                        "ANNULATION" ||
                      mouvement.type_mouvement ===
                        "Annulation";

                    return (
                      <tr
                        key={mouvement.id}
                        className="hover:bg-gray-50 transition"
                      >

                        {/* DATE */}

                        <td className="px-5 py-4 text-sm text-gray-600 whitespace-nowrap">
                          {formaterDate(
                            mouvement.date_mouvement
                          )}
                        </td>

                        {/* PRODUIT */}

                        <td className="px-5 py-4">

                          <p className="font-semibold text-gray-900">
                            {produit?.nom ||
                              `Produit #${mouvement.produit_id}`}
                          </p>

                        </td>

                        {/* TYPE */}

                        <td className="px-5 py-4">

                          <span
                            className={`inline-flex px-3 py-1 rounded-full
                              text-xs font-semibold
                              ${couleurType(
                                mouvement.type_mouvement
                              )}`}
                          >
                            {formaterType(
                              mouvement.type_mouvement
                            )}
                          </span>

                        </td>

                        {/* QUANTITÉ */}

                        <td className="px-5 py-4 text-center">

                          <span
                            className={`font-bold ${
                              entree
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {entree ? "+" : "-"}
                            {mouvement.quantite}
                          </span>

                        </td>

                        {/* STOCK AVANT */}

                        <td className="px-5 py-4 text-center text-gray-700">
                          {mouvement.stock_avant}
                        </td>

                        {/* STOCK APRÈS */}

                        <td className="px-5 py-4 text-center">

                          <span className="font-bold text-gray-900">
                            {mouvement.stock_apres}
                          </span>

                        </td>

                        {/* RÉFÉRENCE */}

                        <td className="px-5 py-4 text-sm text-gray-600">
                          {mouvement.reference || "—"}
                        </td>

                      </tr>
                    );
                  })}

                </tbody>

              </table>

            </div>

          )}

        </div>

        {/* ==================================================
            INFORMATION
        ================================================== */}

        <div className="mt-6 bg-blue-50 border border-blue-200
                        rounded-xl p-5 text-sm text-blue-800">

          <p className="font-semibold mb-2">
            ℹ️ Traçabilité du stock
          </p>

          <p>
            Chaque mouvement permet de connaître le produit concerné,
            la quantité déplacée, le stock avant et après l'opération,
            ainsi que la référence associée.
          </p>

        </div>

      </section>

    </main>
  );
}