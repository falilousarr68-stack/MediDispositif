"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import Sidebar from "../../../components/Sidebar";
import api from "../../../services/api";

export default function FacturesPage() {
  const [factures, setFactures] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");
  const [recherche, setRecherche] = useState("");
  const [factureSelectionnee, setFactureSelectionnee] = useState(null);
  const [utilisateur, setUtilisateur] = useState(null);
  const [dateHeure, setDateHeure] = useState(new Date());

  useEffect(() => {
  const intervalle = setInterval(() => {
    setDateHeure(new Date());
  }, 1000);

  return () => clearInterval(intervalle);
}, []);

  const chargerFactures = async () => {
    try {
      setChargement(true);
      setErreur("");

      const utilisateurStocke =
  localStorage.getItem("utilisateur");

if (utilisateurStocke) {
  setUtilisateur(JSON.parse(utilisateurStocke));
}

      const response = await api.get("/ventes/factures/");

      const donnees = response.data;

      if (Array.isArray(donnees)) {
        setFactures(donnees);
      } else if (Array.isArray(donnees?.results)) {
        setFactures(donnees.results);
      } else {
        setFactures([]);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des factures :", error);

      setErreur(
        error.response?.data?.detail ||
          "Impossible de charger les factures."
      );
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    chargerFactures();
  }, []);

  const facturesFiltrees = factures.filter((facture) => {
    const texte = recherche.toLowerCase();

    const numero = facture.numero?.toLowerCase() || "";
    const commande = String(facture.numero_commande || "");
    const nom = facture.client_info?.nom?.toLowerCase() || "";
    const prenom = facture.client_info?.prenom?.toLowerCase() || "";
    const email = facture.client_info?.email?.toLowerCase() || "";

    return (
      numero.includes(texte) ||
      commande.includes(texte) ||
      nom.includes(texte) ||
      prenom.includes(texte) ||
      email.includes(texte)
    );
  });

  const formaterMontant = (montant) => {
    return Number(montant || 0).toLocaleString("fr-FR") + " FCFA";
  };

  const formaterDate = (date) => {
    if (!date) return "—";

    return new Date(date).toLocaleDateString("fr-FR");
  };

  return (
  <main className="min-h-screen bg-[#f4f8fc]">

    <Sidebar utilisateur={utilisateur} />

    <div className="ml-64 min-h-screen bg-[#f4f8fc]">

      {/* =====================================================
          EN-TÊTE
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
      min-h-[165px]
    "
  >
    {/* Décoration */}
    <div
      className="
        absolute
        -right-20
        -top-24
        w-72
        h-72
        rounded-full
        bg-blue-200/40
        blur-3xl
      "
    />

    <div
      className="
        relative
        flex
        flex-col
        md:flex-row
        md:items-center
        md:justify-between
        gap-6
        px-7
        py-7
      "
    >
      {/* TITRE */}
      <div>
        <p className="text-sm font-semibold text-blue-700 mb-2">
          ESPACE ADMINISTRATION
        </p>

        <h1 className="text-3xl md:text-4xl font-bold text-[#0b1730]">
          Gestion des factures
        </h1>

        <p className="mt-2 text-slate-600">
          Consultez les factures générées après validation des commandes.
        </p>
      </div>

      {/* DATE + HEURE */}
      <div
        className="
          bg-white/90
          backdrop-blur-sm
          rounded-2xl
          border border-blue-100
          shadow-sm
          px-5
          py-4
          min-w-[230px]
        "
      >
        <div className="flex items-center gap-3">
          <div
            className="
              w-11 h-11
              rounded-xl
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

            <p className="font-semibold text-[#0b1730]">
              {dateHeure.toLocaleDateString("fr-FR", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-slate-200 flex items-center gap-3">
          <div
            className="
              w-11 h-11
              rounded-xl
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

            <p className="font-semibold text-[#0b1730]">
              {dateHeure.toLocaleTimeString("fr-FR")}
            </p>
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

        {/* ===================================================
            RECHERCHE
        ==================================================== */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 mb-6">

          <div className="flex flex-col md:flex-row md:items-end gap-4">

            <div className="flex-1">

              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rechercher
              </label>

              <input
                type="text"
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
                placeholder="Numéro de facture, commande, nom ou email du client..."
                className="w-full border border-gray-300 rounded-lg px-4 py-3
                text-gray-900 outline-none focus:ring-2 focus:ring-blue-500
                focus:border-blue-500"
              />

            </div>

            <button
              type="button"
              onClick={() => setRecherche("")}
              className="px-5 py-3 bg-gray-100 text-gray-700
              rounded-lg hover:bg-gray-200 transition"
            >
              Réinitialiser
            </button>

          </div>

        </div>

        {/* ===================================================
            LISTE DES FACTURES
        ==================================================== */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">

          {/* EN-TÊTE */}
          <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between">

            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Factures
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                {facturesFiltrees.length} facture(s)
              </p>
            </div>

            <button
              type="button"
              onClick={chargerFactures}
              className="px-4 py-2 border border-gray-300
              rounded-lg text-gray-700 hover:bg-gray-50 transition"
            >
              🔄 Actualiser
            </button>

          </div>

          {/* CHARGEMENT */}
          {chargement && (
            <div className="px-6 py-12 text-center text-gray-500">
              Chargement des factures...
            </div>
          )}

          {/* ERREUR */}
          {!chargement && erreur && (
            <div className="m-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700">
              {erreur}
            </div>
          )}

          {/* AUCUNE FACTURE */}
          {!chargement &&
            !erreur &&
            facturesFiltrees.length === 0 && (
              <div className="px-6 py-14 text-center">

                <div className="text-5xl mb-4">
                  🧾
                </div>

                <h3 className="text-lg font-semibold text-gray-900">
                  Aucune facture
                </h3>

                <p className="text-gray-500 mt-2">
                  Les factures apparaîtront ici après le paiement complet
                  et la validation d'une commande.
                </p>

              </div>
            )}

          {/* TABLEAU */}
          {!chargement &&
            !erreur &&
            facturesFiltrees.length > 0 && (

              <div className="overflow-x-auto">

                <table className="w-full">

                  <thead className="bg-gray-50 border-b border-gray-200">

                    <tr>

                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                        Facture
                      </th>

                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                        Client
                      </th>

                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                        Commande
                      </th>

                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                        Date
                      </th>

                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                        Montant
                      </th>

                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">
                        Actions
                      </th>

                    </tr>

                  </thead>

                  <tbody className="divide-y divide-gray-200">

                    {facturesFiltrees.map((facture) => (

                      <tr
                        key={facture.id}
                        className="hover:bg-gray-50 transition"
                      >

                        {/* FACTURE */}
                        <td className="px-6 py-5">

                          <div className="flex items-center gap-3">

                            <div className="w-10 h-10 rounded-lg bg-blue-50
                            flex items-center justify-center text-xl">
                              🧾
                            </div>

                            <div>

                              <p className="font-semibold text-gray-900">
                                {facture.numero}
                              </p>

                              <p className="text-sm text-gray-500">
                                ID #{facture.id}
                              </p>

                            </div>

                          </div>

                        </td>

                        {/* CLIENT */}
                        <td className="px-6 py-5">

                          <p className="font-medium text-gray-900">
                            {facture.client_info?.prenom}{" "}
                            {facture.client_info?.nom}
                          </p>

                          <p className="text-sm text-gray-500">
                            {facture.client_info?.email}
                          </p>

                        </td>

                        {/* COMMANDE */}
                        <td className="px-6 py-5">

                          <span className="text-blue-600 font-medium">
                            #{facture.numero_commande}
                          </span>

                        </td>

                        {/* DATE */}
                        <td className="px-6 py-5 text-gray-700">
                          {formaterDate(facture.date_emission)}
                        </td>

                        {/* MONTANT */}
                        <td className="px-6 py-5">

                          <span className="font-bold text-gray-900">
                            {formaterMontant(facture.montant)}
                          </span>

                        </td>

                        {/* ACTION */}
                        <td className="px-6 py-5 text-right">

                          <button
                            type="button"
                            onClick={() =>
                              setFactureSelectionnee(facture)
                            }
                            className="px-4 py-2 bg-blue-50
                            text-blue-700 rounded-lg
                            hover:bg-blue-100 transition"
                          >
                            👁 Voir
                          </button>

                        </td>

                      </tr>

                    ))}

                  </tbody>

                </table>

              </div>

            )}

        </div>

      </div>

      {/* =====================================================
          MODALE DÉTAIL FACTURE
      ====================================================== */}
      {factureSelectionnee && (

        <div
          className="fixed inset-0 bg-black/50 flex items-center
          justify-center z-50 p-4"
          onClick={() => setFactureSelectionnee(null)}
        >

          <div
            className="bg-white rounded-2xl shadow-2xl
            w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >

            {/* EN-TÊTE */}
            <div className="px-6 py-5 border-b border-gray-200
            flex items-center justify-between">

              <div>

                <p className="text-sm text-blue-600 uppercase font-medium">
                  Facture
                </p>

                <h2 className="text-2xl font-bold text-gray-900 mt-1">
                  {factureSelectionnee.numero}
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  Émise le{" "}
                  {formaterDate(
                    factureSelectionnee.date_emission
                  )}
                </p>

              </div>

              <button
                type="button"
                onClick={() => setFactureSelectionnee(null)}
                className="text-gray-400 hover:text-gray-700 text-2xl"
              >
                ×
              </button>

            </div>

            {/* CONTENU */}
            <div className="p-6 space-y-5">

              {/* CLIENT */}
              <div className="bg-gray-50 rounded-xl p-5">

                <p className="text-xs uppercase text-gray-500 font-medium">
                  Client
                </p>

                <p className="font-semibold text-gray-900 text-lg mt-2">
                  {factureSelectionnee.client_info?.prenom}{" "}
                  {factureSelectionnee.client_info?.nom}
                </p>

                <p className="text-gray-600 mt-1">
                  {factureSelectionnee.client_info?.email}
                </p>

              </div>

              {/* COMMANDE */}
              <div className="bg-gray-50 rounded-xl p-5 flex items-center justify-between">

                <div>

                  <p className="text-xs uppercase text-gray-500 font-medium">
                    Commande
                  </p>

                  <p className="text-blue-600 font-semibold text-lg mt-2">
                    #{factureSelectionnee.numero_commande}
                  </p>

                </div>

                <div className="text-right">

                  <p className="text-xs uppercase text-gray-500 font-medium">
                    Montant
                  </p>

                  <p className="font-bold text-gray-900 text-xl mt-2">
                    {formaterMontant(
                      factureSelectionnee.montant
                    )}
                  </p>

                </div>

              </div>

              {/* INFORMATIONS */}
              <div className="border border-gray-200 rounded-xl p-5">

                <h3 className="font-semibold text-gray-900 mb-4">
                  Informations de la facture
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                  <div>
                    <p className="text-sm text-gray-500">
                      Numéro
                    </p>

                    <p className="font-medium text-gray-900 mt-1">
                      {factureSelectionnee.numero}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">
                      Date d'émission
                    </p>

                    <p className="font-medium text-gray-900 mt-1">
                      {formaterDate(
                        factureSelectionnee.date_emission
                      )}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">
                      Commande
                    </p>

                    <p className="font-medium text-gray-900 mt-1">
                      #{factureSelectionnee.numero_commande}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">
                      Montant facturé
                    </p>

                    <p className="font-bold text-blue-700 mt-1">
                      {formaterMontant(
                        factureSelectionnee.montant
                      )}
                    </p>
                  </div>

                </div>

              </div>

              {/* MESSAGE */}
              <div className="bg-blue-50 border border-blue-100
              rounded-xl p-4 text-sm text-blue-800">

                ✓ Cette facture correspond à une commande entièrement
                payée et validée.

              </div>

            </div>

            {/* PIED */}
            <div className="px-6 py-4 border-t border-gray-200
            flex justify-end">

              <button
                type="button"
                onClick={() => setFactureSelectionnee(null)}
                className="px-5 py-2.5 bg-gray-100
                text-gray-700 rounded-lg hover:bg-gray-200 transition"
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