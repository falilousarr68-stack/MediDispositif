"use client";

import { useEffect, useState } from "react";
import api from "../../../services/api";

export default function ApprovisionnementsAdministrationPage() {
  const [approvisionnements, setApprovisionnements] = useState([]);
  const [produits, setProduits] = useState([]);

  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");
  const [utilisateur, setUtilisateur] = useState(null);

  const [creation, setCreation] = useState(false);
  const [details, setDetails] = useState([]);

  const [approvisionnementSelectionne, setApprovisionnementSelectionne] =
    useState(null);

  const [chargementDetails, setChargementDetails] = useState(false);

  useEffect(() => {
    verifierUtilisateur();
  }, []);

  const verifierUtilisateur = () => {
    const utilisateurStocke = localStorage.getItem("utilisateur");

    if (!utilisateurStocke) {
      window.location.href = "/connexion";
      return;
    }

    try {
      const utilisateur = JSON.parse(utilisateurStocke);
      setUtilisateur(utilisateur);

      if (
        utilisateur.role !== "Administrateur" &&
        utilisateur.role !== "GestionnaireDeStock"
      ) {
        window.location.href = "/";
        return;
      }

      chargerDonnees();
    } catch (error) {
      console.error(error);
      window.location.href = "/connexion";
    }
  };

  const chargerDonnees = async () => {
    await Promise.all([
      chargerApprovisionnements(),
      chargerProduits(),
    ]);
  };

  const chargerApprovisionnements = async () => {
    try {
      setChargement(true);
      setErreur("");

      const response = await api.get(
        "/catalogue/approvisionnements/"
      );

      const data = response.data;

      if (Array.isArray(data)) {
        setApprovisionnements(data);
      } else if (Array.isArray(data.results)) {
        setApprovisionnements(data.results);
      } else {
        setApprovisionnements([]);
      }
    } catch (error) {
      console.error(
        "Erreur lors du chargement des approvisionnements :",
        error
      );

      setErreur(
        error.response?.data?.detail ||
          "Impossible de charger les approvisionnements."
      );
    } finally {
      setChargement(false);
    }
  };

  const chargerProduits = async () => {
    try {
      const response = await api.get(
        "/catalogue/produits/"
      );

      const data = response.data;

      if (Array.isArray(data)) {
        setProduits(data);
      } else if (Array.isArray(data.results)) {
        setProduits(data.results);
      } else {
        setProduits([]);
      }
    } catch (error) {
      console.error(
        "Erreur lors du chargement des produits :",
        error
      );
    }
  };

  const creerLigneVide = () => ({
    idProduit: "",
    quantite: "",
    prix_unitaire_achat: "",
    date_peremption: "",
    numero_lot: "",
  });

  const ouvrirCreation = () => {
    setDetails([creerLigneVide()]);
    setCreation(true);
  };

  const fermerCreation = () => {
    setCreation(false);
    setDetails([]);
  };

  const ajouterLigne = () => {
    setDetails((ancienDetails) => [
      ...ancienDetails,
      creerLigneVide(),
    ]);
  };

  const supprimerLigne = (index) => {
    if (details.length === 1) {
      return;
    }

    setDetails((ancienDetails) =>
      ancienDetails.filter((_, i) => i !== index)
    );
  };

  const modifierLigne = (index, champ, valeur) => {
    setDetails((ancienDetails) =>
      ancienDetails.map((detail, i) =>
        i === index
          ? {
              ...detail,
              [champ]: valeur,
            }
          : detail
      )
    );
  };

  const calculerMontant = (detail) => {
    const quantite = Number(detail.quantite) || 0;
    const prix = Number(detail.prix_unitaire_achat) || 0;

    return quantite * prix;
  };

  const calculerTotal = () => {
    return details.reduce(
      (total, detail) =>
        total + calculerMontant(detail),
      0
    );
  };

  const creerApprovisionnement = async (event) => {
    event.preventDefault();

    if (details.length === 0) {
      alert(
        "Ajoutez au moins un produit à l'approvisionnement."
      );
      return;
    }

    const lignesInvalides = details.some(
      (detail) =>
        !detail.idProduit ||
        !detail.quantite ||
        Number(detail.quantite) <= 0 ||
        detail.prix_unitaire_achat === "" ||
        Number(detail.prix_unitaire_achat) < 0 ||
        !detail.date_peremption ||
        !detail.numero_lot.trim()
    );

    if (lignesInvalides) {
      alert(
        "Veuillez remplir correctement tous les champs de chaque produit."
      );
      return;
    }

    try {
      await api.post(
        "/catalogue/approvisionnements/",
        {
          details: details.map((detail) => ({
            idProduit: Number(detail.idProduit),
            quantite: Number(detail.quantite),
            prix_unitaire_achat: detail.prix_unitaire_achat,
            date_peremption: detail.date_peremption,
            numero_lot: detail.numero_lot.trim(),
          })),
        }
      );

      fermerCreation();

      await chargerDonnees();

      alert(
        "Approvisionnement enregistré avec succès."
      );
    } catch (error) {
      console.error(
        "Erreur lors de la création de l'approvisionnement :",
        error
      );

      const donneesErreur = error.response?.data;

      if (donneesErreur) {
        const messages = Object.entries(donneesErreur)
          .map(([champ, message]) => {
            if (Array.isArray(message)) {
              return `${champ} : ${message.join(" ")}`;
            }

            if (typeof message === "object") {
              return `${champ} : ${JSON.stringify(message)}`;
            }

            return `${champ} : ${message}`;
          })
          .join("\n");

        alert(
          messages ||
            "Impossible de créer l'approvisionnement."
        );
      } else {
        alert(
          "Impossible de créer l'approvisionnement."
        );
      }
    }
  };

  const afficherDetails = async (approvisionnement) => {
    setApprovisionnementSelectionne(
      approvisionnement
    );

    setDetails([]);
    setChargementDetails(true);

    try {
      const response = await api.get(
        `/catalogue/approvisionnements/${approvisionnement.idApp}/`
      );

      const data = response.data;

      setDetails(data.details || []);
    } catch (error) {
      console.error(
        "Erreur lors du chargement des détails :",
        error
      );

      setDetails([]);
    } finally {
      setChargementDetails(false);
    }
  };

  const fermerDetails = () => {
    setApprovisionnementSelectionne(null);
    setDetails([]);
  };

  const supprimerApprovisionnement = async (
    approvisionnement
  ) => {
    const confirmation = window.confirm(
      `Voulez-vous vraiment supprimer l'approvisionnement #${approvisionnement.idApp} ?\n\n` +
        `Attention : la suppression de ses détails entraînera également la diminution des stocks correspondants.`
    );

    if (!confirmation) {
      return;
    }

    try {
      await api.delete(
        `/catalogue/approvisionnements/${approvisionnement.idApp}/`
      );

      await chargerDonnees();

      alert(
        "Approvisionnement supprimé avec succès."
      );
    } catch (error) {
      console.error(
        "Erreur lors de la suppression :",
        error
      );

      const message =
        error.response?.data?.detail ||
        error.response?.data?.error ||
        "Impossible de supprimer cet approvisionnement.";

      alert(message);
    }
  };

  return (
  <main className="min-h-screen bg-[#f4f8fc]">

    

    <div className="ml-64 min-h-screen">

      {/* =====================================================
          EN-TÊTE
      ====================================================== */}
      <section className="bg-gradient-to-r from-[#0b1730] via-[#1649b8] to-[#087f8c] text-white shadow-lg">

        <div className="max-w-7xl mx-auto px-8 py-10">

          <p className="text-cyan-200 text-sm font-semibold uppercase tracking-wider mb-2">
  Gestion du stock
</p>

          <h1 className="text-3xl md:text-4xl font-bold">
            Gestion des approvisionnements
          </h1>

          <p className="text-cyan-50 mt-2">
            Gérer les entrées de stock, les lots et les dates
            de péremption
          </p>

        </div>

      </section>

      <div className="max-w-7xl mx-auto px-8 py-8">

        {/* RETOUR */}
<button
  onClick={() => {
    const utilisateur = localStorage.getItem("utilisateur");

    if (!utilisateur) {
      window.location.href = "/connexion";
      return;
    }

    try {
      const user = JSON.parse(utilisateur);

      if (user.role === "Administrateur") {
        window.location.href = "/administration";
      } else if (user.role === "GestionnaireDeStock") {
        window.location.href = "/gestionnaire-stock";
      } else {
        window.location.href = "/";
      }
    } catch (error) {
      console.error(error);
      window.location.href = "/";
    }
  }}
  className="mb-6 inline-flex items-center text-blue-700
hover:text-cyan-600 text-sm font-semibold transition"
>
  ← Retour au tableau de bord
</button>

        {/* =================================================
            INFORMATION
        ================================================== */}
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50
  border border-cyan-100 rounded-2xl p-5 mb-6
  shadow-sm">

          <div className="flex gap-3">

            <div className="w-11 h-11 rounded-xl
  bg-gradient-to-br from-blue-500 to-cyan-400
  flex items-center justify-center
  text-xl shadow-md">
  📦
</div>

            <div>

              <p className="text-cyan-200 text-sm font-semibold uppercase tracking-wider mb-2">
  Gestion du stock
</p>

              <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                Chaque approvisionnement enregistré augmente
                automatiquement le stock des produits concernés.
                Les lots et les dates de péremption sont conservés
                dans les détails de l'approvisionnement.
              </p>

            </div>

          </div>

        </div>

        {/* =================================================
            ERREUR
        ================================================== */}
        {erreur && (
          <div className="mb-6 bg-red-50 border border-red-200
            text-red-700 px-4 py-3 rounded-lg">
            ⚠️ {erreur}
          </div>
        )}

        {/* =================================================
            TABLEAU
        ================================================== */}
        <section className="bg-white border border-slate-200
  rounded-2xl shadow-sm overflow-hidden">

          <div className="px-6 py-5 border-b border-slate-200
  flex items-center justify-between">

            <div>

              <h2 className="text-lg font-bold text-gray-900">
                Approvisionnements
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                {chargement
                  ? "Chargement..."
                  : `${approvisionnements.length} approvisionnement(s)`
                }
              </p>

            </div>

            <div className="flex items-center gap-2">

              <button
                onClick={ouvrirCreation}
                className="px-4 py-2.5
bg-gradient-to-r from-blue-600 to-cyan-500
text-white rounded-xl text-sm font-semibold
shadow-md shadow-blue-500/20
hover:from-blue-700 hover:to-cyan-600
hover:-translate-y-0.5 transition-all"
              >
                + Nouvel approvisionnement
              </button>

              <button
                onClick={chargerDonnees}
                className="px-4 py-2.5
border border-slate-200
rounded-xl text-sm font-medium text-slate-700
bg-white hover:bg-slate-50
hover:border-cyan-300 transition-all"
              >
                🔄 Actualiser
              </button>

            </div>

          </div>

          {chargement ? (

            <div className="py-16 text-center text-gray-500">
              Chargement des approvisionnements...
            </div>

          ) : approvisionnements.length === 0 ? (

            <div className="py-16 text-center">

              <div className="text-5xl mb-4">
                🚚
              </div>

              <h3 className="text-lg font-semibold text-gray-900">
                Aucun approvisionnement
              </h3>

              <p className="text-gray-500 mt-2">
                Aucun approvisionnement n'a encore été enregistré.
              </p>

            </div>

          ) : (

            <div className="overflow-x-auto">

              <table className="w-full">

                <thead className="bg-slate-50 border-b border-slate-200">

                  <tr>

                    <th className="text-left px-6 py-4
  text-xs font-semibold text-slate-500 uppercase">
                      Approvisionnement
                    </th>

                    <th className="text-left px-6 py-4
  text-xs font-semibold text-slate-500 uppercase">
                      Date
                    </th>

                    <th className="text-left px-6 py-4
  text-xs font-semibold text-slate-500 uppercase">
                      Quantité totale
                    </th>

                    <th className="text-left px-6 py-4
  text-xs font-semibold text-slate-500 uppercase">
                      Produits
                    </th>

                    <th className="text-right px-6 py-4
  text-xs font-semibold text-slate-500 uppercase">
                      Actions
                    </th>

                  </tr>

                </thead>

                <tbody className="divide-y divide-gray-100">

                  {approvisionnements.map(
                    (approvisionnement) => (

                      <tr
                        key={approvisionnement.idApp}
                        className="hover:bg-cyan-50/40 transition-colors"
                      >

                        {/* IDENTIFIANT */}
                        <td className="px-6 py-5">

                          <div className="flex items-center gap-3">

                            <div className="w-11 h-11 rounded-xl
  bg-gradient-to-br from-blue-100 to-cyan-100
  flex items-center justify-center text-xl
  border border-blue-100">
  🚚
</div>

                            <div>

                              <p className="font-semibold text-gray-900">
                                Approvisionnement #
                                {approvisionnement.idApp}
                              </p>

                              <p className="text-xs text-gray-500 mt-1">
                                Entrée de stock
                              </p>

                            </div>

                          </div>

                        </td>

                        {/* DATE */}
                        <td className="px-6 py-5 text-sm text-gray-700">
                          {approvisionnement.date_app
                            ? new Date(
                                approvisionnement.date_app
                              ).toLocaleDateString("fr-FR")
                            : "—"}
                        </td>

                        {/* QUANTITÉ */}
                        <td className="px-6 py-5">

                          <span className="inline-flex
  px-3 py-1.5 rounded-full
  bg-emerald-50 text-emerald-700
  border border-emerald-100
  text-sm font-semibold">
                            +{" "}
                            {approvisionnement.quantite_produit || 0}
                          </span>

                        </td>

                        {/* PRODUITS */}
                        <td className="px-6 py-5">

                          <span className="text-sm text-gray-700">
                            {approvisionnement.details?.length || 0}
                            {" "}
                            {approvisionnement.details?.length === 1
                              ? "produit"
                              : "produits"}
                          </span>

                        </td>

                        {/* ACTIONS */}
                        <td className="px-6 py-5">

                          <div className="flex justify-end gap-2">

                            <button
                              onClick={() =>
                                afficherDetails(
                                  approvisionnement
                                )
                              }
                              className="px-3 py-2 rounded-xl
text-sm text-blue-700
bg-blue-50 border border-blue-100
hover:bg-blue-100 hover:border-blue-200
font-medium transition-all"
                            >
                              👁️ Voir
                            </button>

                            <button
                              onClick={() =>
                                supprimerApprovisionnement(
                                  approvisionnement
                                )
                              }
                              className="px-3 py-2 rounded-xl
text-sm text-red-600
bg-red-50 border border-red-100
hover:bg-red-100 hover:border-red-200
font-medium transition-all"
                            >
                              🗑️
                            </button>

                          </div>

                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </div>

          )}

        </section>

      </div>

      {/* =====================================================
          MODALE CRÉATION
      ====================================================== */}
      {creation && (

        <div className="fixed inset-0 bg-black/50 z-50
          flex items-center justify-center p-4">

          <div className="bg-white rounded-2xl shadow-xl
            w-full max-w-5xl max-h-[90vh] overflow-hidden">

            <div className="px-6 py-5 border-b border-gray-200
              flex items-center justify-between">

              <div>

                <h2 className="text-xl font-bold text-gray-900">
                  Nouvel approvisionnement
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  Enregistrer une entrée de stock
                </p>

              </div>

              <button
                onClick={fermerCreation}
                className="text-gray-400 hover:text-gray-700
                text-2xl"
              >
                ×
              </button>

            </div>

            <form
              onSubmit={creerApprovisionnement}
              className="overflow-y-auto max-h-[75vh]"
            >

              <div className="p-6">

                {/* INFORMATION */}
                <div className="bg-gray-50 border
                  border-gray-200 rounded-xl p-4 mb-6">

                  <p className="text-sm text-gray-700">
                    Vous pouvez ajouter plusieurs produits
                    dans un même approvisionnement.
                  </p>

                </div>

                {/* LIGNES */}
                <div className="space-y-5">

                  {details.map((detail, index) => (

                    <div
                      key={index}
                      className="border border-gray-200
                      rounded-xl p-5"
                    >

                      <div className="flex items-center
                        justify-between mb-4">

                        <h3 className="font-semibold
                          text-gray-900">
                          Produit #{index + 1}
                        </h3>

                        {details.length > 1 && (
                          <button
                            type="button"
                            onClick={() =>
                              supprimerLigne(index)
                            }
                            className="text-sm text-red-600
                            hover:text-red-800"
                          >
                            🗑️ Supprimer
                          </button>
                        )}

                      </div>

                      <div className="grid grid-cols-1
                        md:grid-cols-2 lg:grid-cols-3 gap-4">

                        {/* PRODUIT */}
                        <div className="lg:col-span-2">

                          <label className="block text-sm
                            font-medium text-gray-700 mb-2">
                            Produit médical
                          </label>

                          <select
                            value={detail.idProduit}
                            onChange={(event) =>
                              modifierLigne(
                                index,
                                "idProduit",
                                event.target.value
                              )
                            }
                            required
                            className="w-full border
                            border-gray-300 rounded-lg
                            px-4 py-2.5 text-gray-900 bg-white
                            outline-none focus:ring-2
                            focus:ring-blue-500"
                          >

                            <option value="">
                              Sélectionner un produit
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

                        {/* QUANTITÉ */}
                        <div>

                          <label className="block text-sm
                            font-medium text-gray-700 mb-2">
                            Quantité
                          </label>

                          <input
                            type="number"
                            min="1"
                            value={detail.quantite}
                            onChange={(event) =>
                              modifierLigne(
                                index,
                                "quantite",
                                event.target.value
                              )
                            }
                            required
                            className="w-full border
                            border-gray-300 rounded-lg
                            px-4 py-2.5 text-gray-900
                            outline-none focus:ring-2
                            focus:ring-blue-500"
                          />

                        </div>

                        {/* PRIX ACHAT */}
                        <div>

                          <label className="block text-sm
                            font-medium text-gray-700 mb-2">
                            Prix unitaire d'achat (FCFA)
                          </label>

                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={
                              detail.prix_unitaire_achat
                            }
                            onChange={(event) =>
                              modifierLigne(
                                index,
                                "prix_unitaire_achat",
                                event.target.value
                              )
                            }
                            required
                            className="w-full border
                            border-gray-300 rounded-lg
                            px-4 py-2.5 text-gray-900
                            outline-none focus:ring-2
                            focus:ring-blue-500"
                          />

                        </div>

                        {/* DATE PEREMPTION */}
                        <div>

                          <label className="block text-sm
                            font-medium text-gray-700 mb-2">
                            Date de péremption
                          </label>

                          <input
                            type="date"
                            value={
                              detail.date_peremption
                            }
                            onChange={(event) =>
                              modifierLigne(
                                index,
                                "date_peremption",
                                event.target.value
                              )
                            }
                            required
                            className="w-full border
                            border-gray-300 rounded-lg
                            px-4 py-2.5 text-gray-900
                            outline-none focus:ring-2
                            focus:ring-blue-500"
                          />

                        </div>

                        {/* LOT */}
                        <div>

                          <label className="block text-sm
                            font-medium text-gray-700 mb-2">
                            Numéro de lot
                          </label>

                          <input
                            type="text"
                            value={detail.numero_lot}
                            onChange={(event) =>
                              modifierLigne(
                                index,
                                "numero_lot",
                                event.target.value
                              )
                            }
                            placeholder="Ex. LOT-2026-001"
                            required
                            maxLength={50}
                            className="w-full border
                            border-gray-300 rounded-lg
                            px-4 py-2.5 text-gray-900
                            outline-none focus:ring-2
                            focus:ring-blue-500"
                          />

                        </div>

                      </div>

                      {/* MONTANT */}
                      <div className="mt-4 pt-4
                        border-t border-gray-100
                        flex justify-end">

                        <p className="text-sm text-gray-600">

                          Montant :
                          {" "}

                          <strong className="text-gray-900">
                            {calculerMontant(detail).toLocaleString(
                              "fr-FR"
                            )}
                            {" "}FCFA
                          </strong>

                        </p>

                      </div>

                    </div>

                  ))}

                </div>

                {/* AJOUTER LIGNE */}
                <button
                  type="button"
                  onClick={ajouterLigne}
                  className="mt-5 px-4 py-2.5
                  border border-blue-200
                  text-blue-600 rounded-lg
                  font-medium bg-blue-50
                  hover:bg-blue-100 transition"
                >
                  + Ajouter un produit
                </button>

                {/* TOTAL */}
                <div className="mt-6 bg-blue-50
                  border border-blue-100 rounded-xl
                  p-5">

                  <div className="flex items-center
                    justify-between">

                    <div>

                      <p className="text-sm text-blue-700">
                        Total de l'approvisionnement
                      </p>

                      <p className="text-xs text-blue-600 mt-1">
                        {details.reduce(
                          (total, detail) =>
                            total +
                            (Number(detail.quantite) || 0),
                          0
                        )}
                        {" "}unité(s)
                      </p>

                    </div>

                    <p className="text-2xl font-bold text-blue-900">
                      {calculerTotal().toLocaleString(
                        "fr-FR"
                      )}
                      {" "}FCFA
                    </p>

                  </div>

                </div>

              </div>

              {/* BOUTONS */}
              <div className="px-6 py-4 border-t
                border-gray-200 flex justify-end gap-3">

                <button
                  type="button"
                  onClick={fermerCreation}
                  className="px-5 py-2.5 bg-gray-100
                  text-gray-700 rounded-lg font-medium
                  hover:bg-gray-200 transition"
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600
                  text-white rounded-lg font-medium
                  hover:bg-blue-700 transition"
                >
                  Enregistrer l'approvisionnement
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

      {/* =====================================================
          MODALE DÉTAILS
      ====================================================== */}
      {approvisionnementSelectionne && (

        <div className="fixed inset-0 bg-black/50 z-50
          flex items-center justify-center p-4">

          <div className="bg-white rounded-2xl shadow-xl
            w-full max-w-4xl max-h-[90vh] overflow-hidden">

            <div className="px-6 py-5 border-b
              border-gray-200 flex items-center
              justify-between">

              <div>

                <p className="text-sm text-blue-600 font-medium">
                  APPROVISIONNEMENT
                </p>

                <h2 className="text-xl font-bold
                  text-gray-900">
                  #{approvisionnementSelectionne.idApp}
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  {approvisionnementSelectionne.date_app
                    ? new Date(
                        approvisionnementSelectionne.date_app
                      ).toLocaleDateString("fr-FR")
                    : "Date inconnue"}
                </p>

              </div>

              <button
                onClick={fermerDetails}
                className="text-gray-400 hover:text-gray-700
                text-2xl"
              >
                ×
              </button>

            </div>

            <div className="p-6 overflow-y-auto
              max-h-[70vh]">

              {chargementDetails ? (

                <div className="py-12 text-center
                  text-gray-500">
                  Chargement des détails...
                </div>

              ) : details.length === 0 ? (

                <div className="py-12 text-center">

                  <div className="text-4xl mb-3">
                    📦
                  </div>

                  <p className="font-medium text-gray-900">
                    Aucun détail
                  </p>

                </div>

              ) : (

                <div className="space-y-4">

                  {details.map((detail) => (

                    <div
                      key={detail.idDetailApp}
                      className="border border-gray-200
                      rounded-xl p-5"
                    >

                      <div className="flex flex-col
                        md:flex-row md:items-center
                        md:justify-between gap-4">

                        <div>

                          <h3 className="font-semibold
                            text-gray-900">
                            {detail.nom_produit}
                          </h3>

                          <p className="text-sm text-gray-500 mt-1">
                            Lot :{" "}
                            <strong>
                              {detail.numero_lot}
                            </strong>
                          </p>

                        </div>

                        <div className="flex flex-wrap gap-2">

                          <span className="px-3 py-1.5
                            rounded-full bg-green-50
                            text-green-700 text-sm
                            font-medium">
                            +{detail.quantite} unité(s)
                          </span>

                        </div>

                      </div>

                      <div className="grid grid-cols-1
                        md:grid-cols-3 gap-4 mt-5
                        pt-4 border-t border-gray-100">

                        <div>

                          <p className="text-xs text-gray-500">
                            Prix d'achat unitaire
                          </p>

                          <p className="font-semibold
                            text-gray-900 mt-1">
                            {Number(
                              detail.prix_unitaire_achat
                            ).toLocaleString("fr-FR")}
                            {" "}FCFA
                          </p>

                        </div>

                        <div>

                          <p className="text-xs text-gray-500">
                            Montant
                          </p>

                          <p className="font-semibold
                            text-gray-900 mt-1">
                            {Number(
                              detail.montant
                            ).toLocaleString("fr-FR")}
                            {" "}FCFA
                          </p>

                        </div>

                        <div>

                          <p className="text-xs text-gray-500">
                            Date de péremption
                          </p>

                          <p className="font-semibold
                            text-gray-900 mt-1">
                            {detail.date_peremption
                              ? new Date(
                                  detail.date_peremption
                                ).toLocaleDateString("fr-FR")
                              : "—"}
                          </p>

                        </div>

                      </div>

                    </div>

                  ))}

                </div>

              )}

            </div>

            <div className="px-6 py-4 border-t
              border-gray-200 flex justify-between
              items-center">

              <p className="text-sm text-gray-500">
                Quantité totale :{" "}
                <strong className="text-gray-900">
                  {approvisionnementSelectionne.quantite_produit}
                </strong>
              </p>

              <button
                onClick={fermerDetails}
                className="px-5 py-2.5 bg-gray-100
                text-gray-700 rounded-lg font-medium
                hover:bg-gray-200 transition"
              >
                Fermer
              </button>

            </div>

          </div>

        </div>

      )}

     </div>
    </main>
  );
}