"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "../../../services/api";


export default function AlertesPage() {
  const router = useRouter();

  const [utilisateur, setUtilisateur] = useState(null);
  const [alertes, setAlertes] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");

  const [jours, setJours] = useState(30);

  // =========================================================
  // VÉRIFICATION UTILISATEUR
  // =========================================================

  useEffect(() => {
    const utilisateurStocke = localStorage.getItem("utilisateur");

    if (!utilisateurStocke) {
      router.push("/connexion");
      return;
    }

    try {
      const user = JSON.parse(utilisateurStocke);

      if (
        user.role !== "Administrateur" &&
        user.role !== "GestionnaireDeStock"
      ) {
        router.push("/");
        return;
      }

      setUtilisateur(user);
      chargerAlertes();
    } catch (error) {
      console.error(error);
      router.push("/connexion");
    }
  }, [router]);

  // =========================================================
  // CHARGER LES ALERTES
  // =========================================================

  const chargerAlertes = async (nombreJours = jours) => {
    try {
      setChargement(true);
      setErreur("");

      const response = await api.get(
        `/catalogue/produits/alertes/?jours=${nombreJours}`
      );

      setAlertes(response.data);
    } catch (error) {
      console.error("Erreur chargement alertes :", error);

      setErreur(
        error.response?.data?.detail ||
          "Impossible de charger les alertes."
      );
    } finally {
      setChargement(false);
    }
  };

  // =========================================================
  // CHANGEMENT NOMBRE DE JOURS
  // =========================================================

  const modifierPeriode = (e) => {
    const valeur = Number(e.target.value);

    setJours(valeur);
    chargerAlertes(valeur);
  };

  // =========================================================
  // RECHARGEMENT
  // =========================================================

  const actualiser = () => {
    chargerAlertes();
  };

  // =========================================================
  // CHARGEMENT INITIAL
  // =========================================================

  if (!utilisateur || chargement) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">
            ⚠️
          </div>

          <p className="text-gray-600">
            Chargement des alertes...
          </p>
        </div>
      </div>
    );
  }

  // =========================================================
  // AFFICHAGE
  // =========================================================

  return (
  <main className="min-h-screen bg-[#f4f8fc]">


    <div className="ml-64 min-h-screen">

      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* =====================================================
            EN-TÊTE
        ====================================================== */}

        <section className="bg-gradient-to-r from-[#0b1730] via-[#1649b8] to-[#087f8c] text-white -mx-6 -mt-8 mb-8 shadow-lg">

  <div className="px-6 py-9">

    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">

      <div>

        <p className="text-cyan-300 text-sm font-semibold tracking-wide mb-2">
          GESTION DU STOCK
        </p>

        <h1 className="text-3xl md:text-4xl font-bold">
          Alertes
        </h1>

        <p className="text-blue-100 mt-2">
          Surveillance du stock et des dates de péremption.
        </p>

      </div>

      <button
        onClick={actualiser}
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
        🔄 Actualiser
      </button>

    </div>

  </div>

</section>

        {/* =====================================================
            ERREUR
        ====================================================== */}

        {erreur && (
          <div className="mb-6 p-4 bg-red-100 border
          border-red-300 text-red-800 rounded-lg">
            ❌ {erreur}
          </div>
        )}

        {/* =====================================================
            RÉSUMÉ
        ====================================================== */}

        {alertes && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">

              {/* TOTAL */}

              <div className="bg-white border border-gray-200
              rounded-2xl shadow-sm p-6">

                <div className="flex items-center
                justify-between">

                  <div>

                    <p className="text-sm text-gray-500">
                      Total des alertes
                    </p>

                    <p className="text-3xl font-bold
                    text-gray-900 mt-2">
                      {alertes.resume.total}
                    </p>

                  </div>

                  <div className="text-3xl">
                    ⚠️
                  </div>

                </div>

              </div>

              {/* STOCK FAIBLE */}

              <div className="bg-white border border-red-200
              rounded-2xl shadow-sm p-6">

                <div className="flex items-center
                justify-between">

                  <div>

                    <p className="text-sm text-gray-500">
                      Stock faible
                    </p>

                    <p className="text-3xl font-bold
                    text-red-600 mt-2">
                      {alertes.resume.stock_faible}
                    </p>

                  </div>

                  <div className="text-3xl">
                    📦
                  </div>

                </div>

              </div>

              {/* PÉRIMÉS */}

              <div className="bg-white border border-red-200
              rounded-2xl shadow-sm p-6">

                <div className="flex items-center
                justify-between">

                  <div>

                    <p className="text-sm text-gray-500">
                      Produits périmés
                    </p>

                    <p className="text-3xl font-bold
                    text-red-600 mt-2">
                      {alertes.resume.produits_perimes}
                    </p>

                  </div>

                  <div className="text-3xl">
                    🚫
                  </div>

                </div>

              </div>

              {/* PÉREMPTION PROCHE */}

              <div className="bg-white border border-orange-200
              rounded-2xl shadow-sm p-6">

                <div className="flex items-center
                justify-between">

                  <div>

                    <p className="text-sm text-gray-500">
                      Péremption proche
                    </p>

                    <p className="text-3xl font-bold
                    text-orange-500 mt-2">
                      {alertes.resume.peremptions_proches}
                    </p>

                  </div>

                  <div className="text-3xl">
                    ⏳
                  </div>

                </div>

              </div>

            </div>

            {/* =================================================
                PARAMÈTRES
            ================================================== */}

            <div className="bg-white border border-gray-200
            rounded-2xl shadow-sm p-6 mb-8">

              <div className="flex flex-col md:flex-row
              md:items-center md:justify-between gap-4">

                <div>

                  <h2 className="text-lg font-bold text-gray-900">
                    Paramètres des alertes
                  </h2>

                  <p className="text-sm text-gray-500 mt-1">
                    Définissez combien de jours avant la
                    péremption une alerte doit apparaître.
                  </p>

                </div>

                <div className="flex items-center gap-3">

                  <label className="text-sm font-medium
                  text-gray-700">
                    Alerte :
                  </label>

                  <select
                    value={jours}
                    onChange={modifierPeriode}
                    className="px-4 py-2 border border-gray-300
                    rounded-lg text-gray-900 bg-white
                    focus:outline-none focus:ring-2
                    focus:ring-blue-500"
                  >
                    <option value={7}>
                      7 jours
                    </option>

                    <option value={15}>
                      15 jours
                    </option>

                    <option value={30}>
                      30 jours
                    </option>

                    <option value={60}>
                      60 jours
                    </option>

                    <option value={90}>
                      90 jours
                    </option>
                  </select>

                </div>

              </div>

            </div>

            {/* =================================================
                STOCK FAIBLE
            ================================================== */}

            <div className="bg-white border border-gray-200
            rounded-2xl shadow-sm overflow-hidden mb-8">

              <div className="p-6 border-b border-gray-200">

                <div className="flex items-center gap-3">

                  <span className="text-2xl">
                    📦
                  </span>

                  <div>

                    <h2 className="text-xl font-bold text-gray-900">
                      Stock faible
                    </h2>

                    <p className="text-sm text-gray-500 mt-1">
                      Produits avec un stock inférieur ou égal à{" "}
                      {alertes.seuil_stock_faible} unités.
                    </p>

                  </div>

                </div>

              </div>

              {alertes.alertes_stock.length === 0 ? (

                <div className="p-8 text-center">

                  <div className="text-4xl mb-3">
                    ✅
                  </div>

                  <p className="text-gray-600">
                    Aucun produit en stock faible.
                  </p>

                </div>

              ) : (

                <div className="overflow-x-auto">

                  <table className="w-full">

                    <thead className="bg-gray-50">

                      <tr>

                        <th className="px-6 py-4 text-left
                        text-xs font-semibold text-gray-600
                        uppercase">
                          Produit
                        </th>

                        <th className="px-6 py-4 text-left
                        text-xs font-semibold text-gray-600
                        uppercase">
                          Catalogue
                        </th>

                        <th className="px-6 py-4 text-center
                        text-xs font-semibold text-gray-600
                        uppercase">
                          Stock
                        </th>

                        <th className="px-6 py-4 text-left
                        text-xs font-semibold text-gray-600
                        uppercase">
                          Alerte
                        </th>

                      </tr>

                    </thead>

                    <tbody className="divide-y divide-gray-200">

                      {alertes.alertes_stock.map(
                        (alerte, index) => (

                          <tr
                            key={index}
                            className="hover:bg-red-50 transition"
                          >

                            <td className="px-6 py-4">

                              <div className="font-medium
                              text-gray-900">
                                {alerte.produit.nom}
                              </div>

                            </td>

                            <td className="px-6 py-4
                            text-sm text-gray-600">
                              {alerte.produit.catalogue}
                            </td>

                            <td className="px-6 py-4 text-center">

                              <span className="inline-flex
                              px-3 py-1 rounded-full
                              bg-red-100 text-red-700
                              font-bold">
                                {alerte.produit.stock}
                              </span>

                            </td>

                            <td className="px-6 py-4
                            text-sm text-red-700">
                              {alerte.message}
                            </td>

                          </tr>

                        )
                      )}

                    </tbody>

                  </table>

                </div>

              )}

            </div>

            {/* =================================================
                PÉREMPTION
            ================================================== */}

            <div className="bg-white border border-gray-200
            rounded-2xl shadow-sm overflow-hidden">

              <div className="p-6 border-b border-gray-200">

                <div className="flex items-center gap-3">

                  <span className="text-2xl">
                    ⏳
                  </span>

                  <div>

                    <h2 className="text-xl font-bold text-gray-900">
                      Dates de péremption
                    </h2>

                    <p className="text-sm text-gray-500 mt-1">
                      Lots déjà périmés ou arrivant prochainement
                      à expiration.
                    </p>

                  </div>

                </div>

              </div>

              {alertes.alertes_peremption.length === 0 ? (

                <div className="p-8 text-center">

                  <div className="text-4xl mb-3">
                    ✅
                  </div>

                  <p className="text-gray-600">
                    Aucun lot périmé ou proche de la péremption.
                  </p>

                </div>

              ) : (

                <div className="overflow-x-auto">

                  <table className="w-full">

                    <thead className="bg-gray-50">

                      <tr>

                        <th className="px-6 py-4 text-left
                        text-xs font-semibold text-gray-600
                        uppercase">
                          Produit
                        </th>

                        <th className="px-6 py-4 text-left
                        text-xs font-semibold text-gray-600
                        uppercase">
                          Lot
                        </th>

                        <th className="px-6 py-4 text-center
                        text-xs font-semibold text-gray-600
                        uppercase">
                          Quantité
                        </th>

                        <th className="px-6 py-4 text-left
                        text-xs font-semibold text-gray-600
                        uppercase">
                          Péremption
                        </th>

                        <th className="px-6 py-4 text-left
                        text-xs font-semibold text-gray-600
                        uppercase">
                          État
                        </th>

                      </tr>

                    </thead>

                    <tbody className="divide-y divide-gray-200">

                      {alertes.alertes_peremption.map(
                        (alerte, index) => {

                          const estPerime =
                            alerte.type === "produit_perime";

                          return (
                            <tr
                              key={index}
                              className={
                                estPerime
                                  ? "hover:bg-red-50 transition"
                                  : "hover:bg-orange-50 transition"
                              }
                            >

                              <td className="px-6 py-4">

                                <div className="font-medium
                                text-gray-900">
                                  {alerte.produit.nom}
                                </div>

                                <div className="text-xs
                                text-gray-500 mt-1">
                                  {alerte.produit.catalogue}
                                </div>

                              </td>

                              <td className="px-6 py-4">

                                <span className="font-medium
                                text-gray-800">
                                  {alerte.lot.numero}
                                </span>

                              </td>

                              <td className="px-6 py-4 text-center
                              text-gray-700">
                                {alerte.lot.quantite}
                              </td>

                              <td className="px-6 py-4">

                                <span
                                  className={
                                    estPerime
                                      ? "font-bold text-red-600"
                                      : "font-bold text-orange-600"
                                  }
                                >
                                  {new Date(
                                    alerte.lot.date_peremption
                                  ).toLocaleDateString(
                                    "fr-FR"
                                  )}
                                </span>

                              </td>

                              <td className="px-6 py-4">

                                {estPerime ? (

                                  <span className="inline-flex
                                  px-3 py-1 rounded-full
                                  bg-red-100 text-red-700
                                  text-sm font-medium">
                                    🔴 Périmé
                                  </span>

                                ) : (

                                  <span className="inline-flex
                                  px-3 py-1 rounded-full
                                  bg-orange-100 text-orange-700
                                  text-sm font-medium">
                                    🟠 Bientôt périmé
                                  </span>

                                )}

                              </td>

                            </tr>
                          );
                        }
                      )}

                    </tbody>

                  </table>

                </div>

              )}

            </div>

            {/* =================================================
                INFORMATIONS
            ================================================== */}

            <div className="mt-8 p-5 bg-blue-50 border
            border-blue-200 rounded-xl">

              <p className="text-sm text-blue-800">

                <strong>ℹ️ Informations :</strong>{" "}

                Les alertes de stock sont déclenchées à partir
                de{" "}
                <strong>
                  {alertes.seuil_stock_faible} unités
                </strong>
                . Les alertes de péremption sont calculées
                à partir de la date du jour.

              </p>

            </div>

          </>
        )}

      </div>
    </div>

    </main>
  );
}