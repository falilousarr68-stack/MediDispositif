"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/services/api";
import Sidebar from "@/components/Sidebar";

export default function ApprovisionnementsPage() {
  const [approvisionnements, setApprovisionnements] = useState([]);
  const [produits, setProduits] = useState([]);

  const [chargement, setChargement] = useState(true);
  const [chargementProduits, setChargementProduits] = useState(true);
  const [generation, setGeneration] = useState(false);

  const [message, setMessage] = useState("");
  const [erreur, setErreur] = useState("");
  const [utilisateur, setUtilisateur] = useState(null);

  const [details, setDetails] = useState([
    {
      idProduit: "",
      quantite: "",
      prix_unitaire_achat: "",
      date_peremption: "",
      numero_lot: "",
    },
  ]);

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
      setUtilisateur(user);

      if (
        user.role !== "GestionnaireDeStock" &&
        user.role !== "Administrateur"
      ) {
        window.location.href = "/";
      }
    } catch (error) {
      console.error(error);
      window.location.href = "/";
    }
  }, []);

  // ==========================================================
  // CHARGEMENT DES DONNÉES
  // ==========================================================

  useEffect(() => {
    chargerDonnees();
  }, []);

  const chargerDonnees = async () => {
    setChargement(true);
    setChargementProduits(true);
    setErreur("");

    try {
      const [responseAppro, responseProduits] = await Promise.all([
        api.get("/catalogue/approvisionnements/"),
        api.get("/catalogue/produits/"),
      ]);

      setApprovisionnements(responseAppro.data || []);
      setProduits(responseProduits.data || []);
    } catch (error) {
      console.error("Erreur chargement :", error);

      setErreur(
        error.response?.data?.detail ||
          "Impossible de charger les approvisionnements."
      );
    } finally {
      setChargement(false);
      setChargementProduits(false);
    }
  };

  // ==========================================================
  // GESTION DES LIGNES
  // ==========================================================

  const ajouterLigne = () => {
    setDetails([
      ...details,
      {
        idProduit: "",
        quantite: "",
        prix_unitaire_achat: "",
        date_peremption: "",
        numero_lot: "",
      },
    ]);
  };

  const supprimerLigne = (index) => {
    if (details.length === 1) {
      return;
    }

    setDetails(details.filter((_, i) => i !== index));
  };

  const modifierLigne = (index, champ, valeur) => {
    const nouvellesDetails = [...details];

    nouvellesDetails[index] = {
      ...nouvellesDetails[index],
      [champ]: valeur,
    };

    setDetails(nouvellesDetails);
  };

  // ==========================================================
  // VALIDATION
  // ==========================================================

  const validerFormulaire = () => {
    if (details.length === 0) {
      setErreur("Ajoutez au moins un produit.");
      return false;
    }

    for (let i = 0; i < details.length; i++) {
      const detail = details[i];

      if (!detail.idProduit) {
        setErreur(`Sélectionnez un produit pour la ligne ${i + 1}.`);
        return false;
      }

      if (!detail.quantite || Number(detail.quantite) <= 0) {
        setErreur(`La quantité de la ligne ${i + 1} doit être supérieure à 0.`);
        return false;
      }

      if (
        detail.prix_unitaire_achat === "" ||
        Number(detail.prix_unitaire_achat) < 0
      ) {
        setErreur(
          `Le prix d'achat de la ligne ${i + 1} est obligatoire.`
        );
        return false;
      }

      if (!detail.date_peremption) {
        setErreur(
          `La date de péremption de la ligne ${i + 1} est obligatoire.`
        );
        return false;
      }

      if (!detail.numero_lot.trim()) {
        setErreur(
          `Le numéro de lot de la ligne ${i + 1} est obligatoire.`
        );
        return false;
      }
    }

    return true;
  };

  // ==========================================================
  // CRÉER UN APPROVISIONNEMENT
  // ==========================================================

  const creerApprovisionnement = async (e) => {
    e.preventDefault();

    setMessage("");
    setErreur("");

    if (!validerFormulaire()) {
      return;
    }

    setGeneration(true);

    try {
      const donnees = {
        details: details.map((detail) => ({
          idProduit: Number(detail.idProduit),
          quantite: Number(detail.quantite),
          prix_unitaire_achat: Number(detail.prix_unitaire_achat),
          date_peremption: detail.date_peremption,
          numero_lot: detail.numero_lot.trim(),
        })),
      };

      await api.post(
        "/catalogue/approvisionnements/",
        donnees
      );

      setMessage(
        "Approvisionnement enregistré avec succès. Le stock a été mis à jour."
      );

      setDetails([
        {
          idProduit: "",
          quantite: "",
          prix_unitaire_achat: "",
          date_peremption: "",
          numero_lot: "",
        },
      ]);

      await chargerDonnees();
    } catch (error) {
      console.error("Erreur création :", error);

      const data = error.response?.data;

      if (data?.detail) {
        setErreur(data.detail);
      } else if (typeof data === "object") {
        setErreur(JSON.stringify(data));
      } else {
        setErreur("Impossible d'enregistrer l'approvisionnement.");
      }
    } finally {
      setGeneration(false);
    }
  };

  // ==========================================================
  // SUPPRIMER UN APPROVISIONNEMENT
  // ==========================================================

  const supprimerApprovisionnement = async (id) => {
    const confirmation = window.confirm(
      "Voulez-vous vraiment supprimer cet approvisionnement ?\n\n" +
        "Attention : les quantités correspondantes seront retirées du stock."
    );

    if (!confirmation) {
      return;
    }

    setMessage("");
    setErreur("");

    try {
      await api.delete(
        `/catalogue/approvisionnements/${id}/`
      );

      setMessage(
        "Approvisionnement supprimé. Le stock a été recalculé."
      );

      await chargerDonnees();
    } catch (error) {
      console.error("Erreur suppression :", error);

      setErreur(
        error.response?.data?.detail ||
          "Impossible de supprimer cet approvisionnement."
      );
    }
  };

  // ==========================================================
  // CALCUL DU TOTAL
  // ==========================================================

  const totalGeneral = details.reduce((total, detail) => {
    const quantite = Number(detail.quantite) || 0;
    const prix = Number(detail.prix_unitaire_achat) || 0;

    return total + quantite * prix;
  }, 0);

  // ==========================================================
  // FORMATAGE
  // ==========================================================

  const formaterNombre = (nombre) => {
    return Number(nombre || 0).toLocaleString("fr-FR");
  };

  const formaterDate = (date) => {
    if (!date) return "—";

    return new Date(date).toLocaleDateString("fr-FR");
  };

  // ==========================================================
  // AFFICHAGE
  // ==========================================================

  if (chargement && chargementProduits) {
  return (
    <main className="min-h-screen bg-[#f4f8fc]">

      {utilisateur && (
        <Sidebar utilisateur={utilisateur} />
      )}

      <div className="ml-64 min-h-screen flex items-center justify-center">
        <div className="text-center">

          <div className="w-12 h-12 border-4 border-blue-200
            border-t-blue-600 rounded-full animate-spin mx-auto mb-4">
          </div>

          <p className="text-slate-600 font-medium">
            Chargement des approvisionnements...
          </p>

        </div>
      </div>

    </main>
  );
}

 return (
  <main className="min-h-screen bg-[#f4f8fc]">

    <Sidebar utilisateur={utilisateur} />

    <div className="ml-64 min-h-screen">
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
              🚚 Gestion des approvisionnements
            </h1>

            <p className="text-gray-600 mt-2">
              Enregistrez les entrées de stock et gérez les lots des produits médicaux.
            </p>
          </div>

          <button
            onClick={chargerDonnees}
            className="border border-gray-300 bg-white px-4 py-2 rounded-lg
                       text-gray-700 hover:bg-gray-50 transition"
          >
            🔄 Actualiser
          </button>

        </div>

        {/* ==================================================
            MESSAGES
        ================================================== */}

        {message && (
          <div className="mb-6 bg-green-50 border border-green-300 text-green-800
                          px-5 py-4 rounded-lg">
            ✅ {message}
          </div>
        )}

        {erreur && (
          <div className="mb-6 bg-red-50 border border-red-300 text-red-800
                          px-5 py-4 rounded-lg">
            ⚠️ {erreur}
          </div>
        )}

        {/* ==================================================
            FORMULAIRE
        ================================================== */}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">

          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 mb-6">

            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Nouvel approvisionnement
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                Ajoutez un ou plusieurs produits reçus.
              </p>
            </div>

            <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg font-semibold">
              Total achat : {formaterNombre(totalGeneral)} FCFA
            </div>

          </div>

          <form onSubmit={creerApprovisionnement}>

            {/* ==================================================
                LIGNES
            ================================================== */}

            <div className="space-y-5">

              {details.map((detail, index) => (

                <div
                  key={index}
                  className="border border-gray-200 rounded-xl p-5 bg-gray-50"
                >

                  <div className="flex justify-between items-center mb-4">

                    <h3 className="font-semibold text-gray-800">
                      Produit {index + 1}
                    </h3>

                    {details.length > 1 && (
                      <button
                        type="button"
                        onClick={() => supprimerLigne(index)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        🗑️ Supprimer
                      </button>
                    )}

                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

                    {/* PRODUIT */}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Produit médical *
                      </label>

                      <select
                        value={detail.idProduit}
                        onChange={(e) =>
                          modifierLigne(
                            index,
                            "idProduit",
                            e.target.value
                          )
                        }
                        className="w-full border border-gray-300 rounded-lg
                                   px-3 py-2.5 bg-white text-gray-900
                                   focus:ring-2 focus:ring-blue-500
                                   focus:border-blue-500"
                      >
                        <option value="">
                          Sélectionner un produit
                        </option>

                        {produits.map((produit) => (
                          <option
                            key={produit.idProduit}
                            value={produit.idProduit}
                          >
                            {produit.nom} — Stock actuel : {produit.stock}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* QUANTITÉ */}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Quantité reçue *
                      </label>

                      <input
                        type="number"
                        min="1"
                        value={detail.quantite}
                        onChange={(e) =>
                          modifierLigne(
                            index,
                            "quantite",
                            e.target.value
                          )
                        }
                        placeholder="Ex : 20"
                        className="w-full border border-gray-300 rounded-lg
                                   px-3 py-2.5 bg-white text-gray-900
                                   placeholder-gray-400
                                   focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* PRIX ACHAT */}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Prix unitaire d'achat *
                      </label>

                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={detail.prix_unitaire_achat}
                        onChange={(e) =>
                          modifierLigne(
                            index,
                            "prix_unitaire_achat",
                            e.target.value
                          )
                        }
                        placeholder="Ex : 8500"
                        className="w-full border border-gray-300 rounded-lg
                                   px-3 py-2.5 bg-white text-gray-900
                                   placeholder-gray-400
                                   focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* DATE PÉREMPTION */}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Date de péremption *
                      </label>

                      <input
                        type="date"
                        value={detail.date_peremption}
                        onChange={(e) =>
                          modifierLigne(
                            index,
                            "date_peremption",
                            e.target.value
                          )
                        }
                        className="w-full border border-gray-300 rounded-lg
                                   px-3 py-2.5 bg-white text-gray-900
                                   focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* LOT */}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Numéro de lot *
                      </label>

                      <input
                        type="text"
                        value={detail.numero_lot}
                        onChange={(e) =>
                          modifierLigne(
                            index,
                            "numero_lot",
                            e.target.value
                          )
                        }
                        placeholder="Ex : LOT-2026-001"
                        className="w-full border border-gray-300 rounded-lg
                                   px-3 py-2.5 bg-white text-gray-900
                                   placeholder-gray-400
                                   focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* SOUS-TOTAL */}

                    <div className="flex items-end">
                      <div className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5">
                        <p className="text-xs text-gray-500">
                          Montant de la ligne
                        </p>

                        <p className="font-bold text-blue-700">
                          {formaterNombre(
                            (Number(detail.quantite) || 0) *
                              (Number(detail.prix_unitaire_achat) || 0)
                          )}{" "}
                          FCFA
                        </p>
                      </div>
                    </div>

                  </div>
                </div>

              ))}

            </div>

            {/* ==================================================
                AJOUTER UNE LIGNE
            ================================================== */}

            <button
              type="button"
              onClick={ajouterLigne}
              className="mt-5 border border-blue-600 text-blue-600
                         px-4 py-2 rounded-lg hover:bg-blue-50 transition
                         font-medium"
            >
              ➕ Ajouter un produit
            </button>

            {/* ==================================================
                BOUTON ENREGISTRER
            ================================================== */}

            <div className="mt-6 flex flex-col md:flex-row md:justify-end gap-3">

              <button
                type="submit"
                disabled={generation || chargementProduits}
                className="bg-blue-600 hover:bg-blue-700
                           disabled:bg-gray-400
                           text-white font-semibold
                           px-6 py-3 rounded-lg transition"
              >
                {generation
                  ? "⏳ Enregistrement..."
                  : "🚚 Enregistrer l'approvisionnement"}
              </button>

            </div>

          </form>
        </div>

        {/* ==================================================
            HISTORIQUE DES APPROVISIONNEMENTS
        ================================================== */}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">

          <div className="p-6 border-b border-gray-200">

            <h2 className="text-xl font-bold text-gray-900">
              Historique des approvisionnements
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              {approvisionnements.length} approvisionnement
              {approvisionnements.length > 1 ? "s" : ""} enregistré
              {approvisionnements.length > 1 ? "s" : ""}
            </p>

          </div>

          {approvisionnements.length === 0 ? (

            <div className="p-12 text-center">

              <div className="text-5xl mb-4">
                📦
              </div>

              <p className="text-gray-600">
                Aucun approvisionnement enregistré.
              </p>

            </div>

          ) : (

            <div className="overflow-x-auto">

              <table className="w-full">

                <thead className="bg-gray-50 border-b border-gray-200">

                  <tr>

                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">
                      N°
                    </th>

                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">
                      Date
                    </th>

                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">
                      Quantité totale
                    </th>

                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">
                      Produits
                    </th>

                    <th className="text-right px-6 py-4 text-sm font-semibold text-gray-700">
                      Action
                    </th>

                  </tr>

                </thead>

                <tbody className="divide-y divide-gray-100">

                  {approvisionnements.map((approvisionnement) => (

                    <tr
                      key={approvisionnement.idApp}
                      className="hover:bg-gray-50 transition"
                    >

                      <td className="px-6 py-4 font-semibold text-gray-900">
                        #{approvisionnement.idApp}
                      </td>

                      <td className="px-6 py-4 text-gray-600">
                        {formaterDate(
                          approvisionnement.date_app
                        )}
                      </td>

                      <td className="px-6 py-4">

                        <span className="inline-flex items-center px-3 py-1
                                         rounded-full bg-green-100 text-green-700
                                         font-semibold text-sm">
                          +{approvisionnement.quantite_produit}
                        </span>

                      </td>

                      <td className="px-6 py-4">

                        {approvisionnement.details?.length > 0 ? (

                          <div className="space-y-1">

                            {approvisionnement.details.map(
                              (detail) => (

                                <div
                                  key={detail.idDetailApp}
                                  className="text-sm text-gray-700"
                                >
                                  <span className="font-medium">
                                    {detail.nom_produit}
                                  </span>

                                  {" × "}

                                  {detail.quantite}

                                  <span className="text-gray-500 ml-2">
                                    (Lot : {detail.numero_lot})
                                  </span>

                                </div>

                              )
                            )}

                          </div>

                        ) : (

                          <span className="text-gray-400">
                            Aucun détail
                          </span>

                        )}

                      </td>

                      <td className="px-6 py-4 text-right">

                        <button
                          onClick={() =>
                            supprimerApprovisionnement(
                              approvisionnement.idApp
                            )
                          }
                          className="text-red-600 hover:text-red-800
                                     border border-red-200
                                     hover:bg-red-50
                                     px-3 py-2 rounded-lg
                                     text-sm font-medium transition"
                        >
                          🗑️ Supprimer
                        </button>

                      </td>

                    </tr>

                  ))}

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
            ℹ️ Informations importantes
          </p>

          <ul className="space-y-1 list-disc list-inside">
            <li>
              Chaque approvisionnement augmente automatiquement le stock.
            </li>

            <li>
              Le prix indiqué ici correspond au prix d'achat du produit.
            </li>

            <li>
              Le prix de vente du produit reste géré séparément dans le catalogue.
            </li>

            <li>
              Le numéro de lot et la date de péremption permettent de suivre les produits reçus.
            </li>

            <li>
              La suppression d'un approvisionnement retire les quantités correspondantes du stock.
            </li>
          </ul>

        </div>

      </section>

    </div>
    </main>
  );
}