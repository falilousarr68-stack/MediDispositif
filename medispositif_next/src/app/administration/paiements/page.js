"use client";

import { useEffect, useMemo, useState } from "react";
import api from "../../../services/api";

export default function PaiementsAdministrationPage() {
  const [paiements, setPaiements] = useState([]);
  const [paiementSelectionne, setPaiementSelectionne] = useState(null);

  const [chargement, setChargement] = useState(true);
  const [chargementDetail, setChargementDetail] = useState(false);
  const [utilisateur, setUtilisateur] = useState(null);
  const [dateHeure, setDateHeure] = useState(new Date());
  const [erreur, setErreur] = useState("");

  const [recherche, setRecherche] = useState("");
  const [statut, setStatut] = useState("Tous");

  useEffect(() => {
    verifierUtilisateur();
  }, []);

  useEffect(() => {
  const intervalle = setInterval(() => {
    setDateHeure(new Date());
  }, 1000);

  return () => clearInterval(intervalle);
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

      if (utilisateur.role !== "Administrateur") {
        window.location.href = "/";
        return;
      }

      chargerPaiements();
    } catch (error) {
      console.error(error);
      window.location.href = "/connexion";
    }
  };

  const chargerPaiements = async () => {
    try {
      setChargement(true);
      setErreur("");

      const response = await api.get("/ventes/paiements/");

      const data = response.data;

      if (Array.isArray(data)) {
        setPaiements(data);
      } else if (Array.isArray(data.results)) {
        setPaiements(data.results);
      } else {
        setPaiements([]);
      }
    } catch (error) {
      console.error(
        "Erreur lors du chargement des paiements :",
        error
      );

      setErreur(
        error.response?.data?.detail ||
          "Impossible de charger les paiements."
      );
    } finally {
      setChargement(false);
    }
  };

  const afficherDetail = async (paiement) => {
    setPaiementSelectionne(paiement);
    setChargementDetail(true);

    try {
      const response = await api.get(
        `/ventes/paiements/${paiement.idPaiement}/`
      );

      setPaiementSelectionne(response.data);
    } catch (error) {
      console.error(
        "Erreur lors du chargement du paiement :",
        error
      );
    } finally {
      setChargementDetail(false);
    }
  };

  const fermerDetail = () => {
    setPaiementSelectionne(null);
  };

  const paiementsFiltres = useMemo(() => {
    return paiements.filter((paiement) => {
      const rechercheTexte = recherche
        .toLowerCase()
        .trim();

      const correspondRecherche =
        !rechercheTexte ||
        String(paiement.idPaiement || "")
          .toLowerCase()
          .includes(rechercheTexte) ||
        String(paiement.numero_commande || "")
          .toLowerCase()
          .includes(rechercheTexte) ||
        String(paiement.nom_client || "")
          .toLowerCase()
          .includes(rechercheTexte) ||
        String(paiement.email_client || "")
          .toLowerCase()
          .includes(rechercheTexte) ||
        String(paiement.reference || "")
          .toLowerCase()
          .includes(rechercheTexte);

      const correspondStatut =
        statut === "Tous" ||
        paiement.statut === statut;

      return (
        correspondRecherche &&
        correspondStatut
      );
    });
  }, [paiements, recherche, statut]);

  const formatMontant = (montant) => {
    return Number(montant || 0).toLocaleString("fr-FR");
  };

  const formatDate = (date) => {
    if (!date) {
      return "—";
    }

    return new Date(date).toLocaleDateString("fr-FR");
  };

  const getStatutLabel = (paiement) => {
    return (
      paiement.statut_display ||
      paiement.statut ||
      "Inconnu"
    );
  };

  const getStatutClasses = (paiement) => {
    switch (paiement.statut) {
      case "Reussi":
        return "bg-green-50 text-green-700";

      case "EnAttente":
        return "bg-yellow-50 text-yellow-700";

      case "Echoue":
        return "bg-red-50 text-red-700";

      case "Annule":
        return "bg-gray-100 text-gray-700";

      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getNomClient = (paiement) => {
    if (paiement.nom_client) {
      return paiement.nom_client;
    }

    if (paiement.client_info) {
      return (
        `${paiement.client_info.prenom || ""} ${
          paiement.client_info.nom || ""
        }`.trim() || "Client"
      );
    }

    return "Client";
  };

  return (
    <main className="min-h-screen bg-[#f4f8fc] ml-64 transition-all duration-300">

      {/* =====================================================
          EN-TÊTE
      ====================================================== */}
       <section className="relative overflow-hidden bg-gradient-to-r from-[#eaf4ff] via-[#effaff] to-[#e9fbf7] border-b border-slate-200">
  <div className="max-w-7xl mx-auto px-6 py-7">

    <div className="flex items-center justify-between gap-6">

      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-lg">
            💳
          </span>

          <p className="text-blue-700 text-sm font-semibold uppercase tracking-wide">
            Espace Administration
          </p>
        </div>

        <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
          Gestion des paiements
        </h1>

        <p className="text-slate-500 mt-1">
          Consultez les paiements enregistrés sur la plateforme.
        </p>
      </div>

      <div className="hidden md:flex items-center gap-3">
        <div className="px-4 py-3 rounded-xl bg-white/80 border border-white shadow-sm">
          <p className="text-xs text-slate-500">
            Aujourd'hui
          </p>

          <p className="text-sm font-semibold text-slate-800">
            {dateHeure.toLocaleDateString("fr-FR", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>

        <div className="px-4 py-3 rounded-xl bg-white/80 border border-white shadow-sm">
          <p className="text-xs text-slate-500">
            Heure
          </p>

          <p className="text-sm font-semibold text-blue-700">
            {dateHeure.toLocaleTimeString("fr-FR")}
          </p>
        </div>
      </div>

    </div>

  </div>
</section>

      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* RETOUR */}
        <button
  onClick={() => window.history.back()}
  className="
    mb-5
    inline-flex
    items-center
    gap-2
    px-4
    py-2
    rounded-xl
    bg-white
    border
    border-slate-200
    text-sm
    font-medium
    text-slate-600
    shadow-sm
    hover:bg-blue-50
    hover:text-blue-700
    hover:border-blue-200
    transition-all
  "
>
  ←
  <span>Retour à l'administration</span>
</button>

        {/* =====================================================
            FILTRES
        ====================================================== */}
        <section
  className="
    bg-white
    border
    border-slate-200
    rounded-2xl
    shadow-sm
    p-5
    mb-6
  "
>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            <div className="md:col-span-2">

              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                Rechercher
              </label>

              <input
                type="text"
                value={recherche}
                onChange={(event) =>
                  setRecherche(event.target.value)
                }
                placeholder="Paiement, commande, client ou référence..."
                className="
  w-full
  border
  border-slate-200
  rounded-xl
  px-4
  py-3
  text-sm
  text-slate-800
  bg-slate-50
  outline-none
  focus:bg-white
  focus:border-blue-400
  focus:ring-4
  focus:ring-blue-100
  transition-all
"
              />

            </div>

            <div>

              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                Statut
              </label>

              <select
                value={statut}
                onChange={(event) =>
                  setStatut(event.target.value)
                }
                className="
  w-full
  border
  border-slate-200
  rounded-xl
  px-4
  py-3
  text-sm
  text-slate-800
  bg-slate-50
  outline-none
  focus:bg-white
  focus:border-blue-400
  focus:ring-4
  focus:ring-blue-100
  transition-all
"
              >

                <option value="Tous">
                  Tous les statuts
                </option>

                <option value="EnAttente">
                  En attente
                </option>

                <option value="Reussi">
                  Réussi
                </option>

                <option value="Echoue">
                  Échoué
                </option>

                <option value="Annule">
                  Annulé
                </option>

              </select>

            </div>

          </div>

        </section>

        {/* =====================================================
            ERREUR
        ====================================================== */}
        {erreur && (
          <div
            className="mb-6 bg-red-50 border border-red-200
            text-red-700 px-4 py-3 rounded-lg"
          >
            ⚠️ {erreur}
          </div>
        )}

        {/* =====================================================
            LISTE
        ====================================================== */}
        <section
          className="
  bg-white
  border
  border-slate-200
  rounded-2xl
  shadow-sm
  overflow-hidden
"
        >

          <div
  className="
    px-6
    py-5
    border-b
    border-slate-100
    bg-gradient-to-r
    from-white
    to-slate-50
    flex
    items-center
    justify-between
  "
>

            <div>

              <h2 className="text-lg font-bold text-slate-900">
  Paiements
</h2>

              <p className="text-sm text-slate-500 mt-1">
                {chargement
                  ? "Chargement..."
                  : `${paiementsFiltres.length} paiement(s)`
                }
              </p>

            </div>

            <button
              onClick={chargerPaiements}
              className="
  inline-flex
  items-center
  gap-2
  px-4
  py-2.5
  border
  border-slate-200
  rounded-xl
  text-sm
  font-semibold
  text-slate-600
  bg-white
  shadow-sm
  hover:bg-blue-50
  hover:text-blue-700
  hover:border-blue-200
  transition-all
"
            >
              🔄 Actualiser
            </button>

          </div>

          {chargement ? (

            <div className="py-16 text-center text-slate-500">
              Chargement des paiements...
            </div>

          ) : paiementsFiltres.length === 0 ? (

            <div className="py-16 text-center">

              <div className="text-5xl mb-4">
                💳
              </div>

              <h3 className="text-lg font-semibold text-gray-900">
                Aucun paiement trouvé
              </h3>

              <p className="text-gray-500 mt-2">
                Aucun paiement ne correspond aux critères.
              </p>

            </div>

          ) : (

            <div className="overflow-x-auto">

              <table className="w-full">

                <thead className="bg-slate-50/80 border-b border-slate-200">

                  <tr>

                    <th className="text-left px-6 py-4
                      text-xs
font-bold
text-slate-500
uppercase
tracking-wider"
                    >
                      Paiement
                    </th>

                    <th className="text-left px-6 py-4
                      text-xs
font-bold
text-slate-500
uppercase
tracking-wider"
                    >
                      Client
                    </th>

                    <th className="text-left px-6 py-4
                      text-xs
font-bold
text-slate-500
uppercase
tracking-wider"
                    >
                      Commande
                    </th>

                    <th className="text-left px-6 py-4
                      text-xs
font-bold
text-slate-500
uppercase
tracking-wider"
                    >
                      Montant
                    </th>

                    <th className="text-left px-6 py-4
                      text-xs
font-bold
text-slate-500
uppercase
tracking-wider"
                    >
                      Mode
                    </th>

                    <th className="text-left px-6 py-4
                      text-xs
font-bold
text-slate-500
uppercase
tracking-wider"
                    >
                      Statut
                    </th>

                    <th className="text-right px-6 py-4
                      text-xs
font-bold
text-slate-500
uppercase
tracking-wider"
                    >
                      Actions
                    </th>

                  </tr>

                </thead>

                <tbody className="divide-y divide-gray-100">

                  {paiementsFiltres.map((paiement) => (

                    <tr
                      key={paiement.idPaiement}
                      className="
  hover:bg-blue-50/50
  transition-colors
  duration-200
"
                    >

                      {/* PAIEMENT */}
                      <td className="px-6 py-5">

                        <div className="flex items-center gap-3">

                          <div
                            className="w-11 h-11 rounded-xl
                            bg-blue-50 flex items-center
                            justify-center text-2xl"
                          >
                            💳
                          </div>

                          <div>

                            <p className="font-semibold text-gray-900">
                              Paiement #{paiement.idPaiement}
                            </p>

                            <p className="text-xs text-slate-500 mt-1">
                              {formatDate(
                                paiement.date_paiement
                              )}
                            </p>

                          </div>

                        </div>

                      </td>

                      {/* CLIENT */}
                      <td className="px-6 py-5">

                        <p className="text-sm font-medium text-gray-900">
                          {getNomClient(paiement)}
                        </p>

                        {paiement.email_client && (
                          <p className="text-xs text-slate-500 mt-1">
                            {paiement.email_client}
                          </p>
                        )}

                      </td>

                      {/* COMMANDE */}
                      <td className="px-6 py-5">

                        <span className="font-medium text-blue-600">
                          #{paiement.numero_commande}
                        </span>

                      </td>

                      {/* MONTANT */}
                      <td className="px-6 py-5">

                        <span className="font-semibold text-gray-900">
                          {formatMontant(
                            paiement.montant
                          )}{" "}
                          FCFA
                        </span>

                      </td>

                      {/* MODE */}
                      <td className="px-6 py-5">

                        <span className="text-sm text-gray-700">
                          {paiement.mode_paiement_display ||
                            paiement.mode_paiement ||
                            "—"}
                        </span>

                      </td>

                      {/* STATUT */}
                      <td className="px-6 py-5">

                        <span
                          className={`inline-flex px-3 py-1.5
                          rounded-full text-xs font-semibold
                          ${getStatutClasses(paiement)}`}
                        >
                          {getStatutLabel(paiement)}
                        </span>

                      </td>

                      {/* ACTION */}
                      <td className="px-6 py-5">

                        <div className="flex justify-end">

                          <button
                            onClick={() =>
                              afficherDetail(paiement)
                            }
                            className="
  inline-flex
  items-center
  gap-2
  px-3
  py-2
  rounded-xl
  text-sm
  font-semibold
  text-blue-700
  bg-blue-50
  border
  border-blue-100
  hover:bg-blue-100
  hover:border-blue-200
  transition-all
"
                          >
                            👁️ Voir
                          </button>

                        </div>

                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

          )}

        </section>

      </div>

      {/* =====================================================
          MODALE DÉTAIL
      ====================================================== */}
      {paiementSelectionne && (

        <div
  className="
    fixed
    inset-0
    bg-slate-950/50
    backdrop-blur-sm
    z-50
    flex
    items-center
    justify-center
    p-4
  "
>

          <div
  className="
    bg-white
    rounded-2xl
    shadow-2xl
    w-full
    max-w-2xl
    max-h-[90vh]
    overflow-hidden
    border
    border-slate-200
  "
>

            {/* HEADER */}
            <div
  className="
    px-6
    py-5
    border-b
    border-slate-100
    bg-gradient-to-r
    from-[#eaf4ff]
    via-[#effaff]
    to-[#e9fbf7]
    flex
    items-center
    justify-between
  "
>

              <div>

                <p className="text-xs text-blue-700 font-bold uppercase tracking-wider">
  Paiement
</p>

                <h2 className="text-2xl font-bold text-slate-900">
                  #{paiementSelectionne.idPaiement}
                </h2>

                <p className="text-sm text-slate-500 mt-1">
                  {formatDate(
                    paiementSelectionne.date_paiement
                  )}
                </p>

              </div>

              <button
                onClick={fermerDetail}
                className="
  w-9
  h-9
  rounded-xl
  flex
  items-center
  justify-center
  text-xl
  text-slate-400
  bg-white/70
  border
  border-white
  hover:bg-white
  hover:text-slate-700
  transition-all
"
              >
                ×
              </button>

            </div>

            <div className="p-6 overflow-y-auto max-h-[70vh]">

              {chargementDetail ? (

                <div className="py-12 text-center text-gray-500">
                  Chargement du détail...
                </div>

              ) : (

                <div className="space-y-4">

                  {/* CLIENT */}
                  <div
                    className="
  bg-slate-50
  border
  border-slate-100
  rounded-xl
  p-5
"
                  >

                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Client
                    </p>

                    <p className="font-semibold text-slate-900 mt-2">
                      {getNomClient(
                        paiementSelectionne
                      )}
                    </p>

                    {paiementSelectionne.email_client && (
                      <p className="text-sm text-gray-500 mt-1">
                        {paiementSelectionne.email_client}
                      </p>
                    )}

                  </div>

                  {/* COMMANDE */}
                  <div
                    className="bg-gray-50 rounded-xl p-5
                    flex items-center justify-between"
                  >

                    <div>

                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        Commande
                      </p>

                      <p className="font-semibold text-blue-600 mt-2">
                        #{paiementSelectionne.numero_commande}
                      </p>

                    </div>

                    <div className="text-right">

                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        Montant
                      </p>

                      <p className="font-bold text-gray-900 mt-2">
                        {formatMontant(
                          paiementSelectionne.montant
                        )}{" "}
                        FCFA
                      </p>

                    </div>

                  </div>

                  {/* MODE + STATUT */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                    <div
                      className="
  bg-slate-50
  border
  border-slate-100
  rounded-xl
  p-5
"
                    >

                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        Mode de paiement
                      </p>

                      <p className="font-semibold text-slate-900 mt-2">
                        {paiementSelectionne.mode_paiement_display ||
                          paiementSelectionne.mode_paiement ||
                          "—"}
                      </p>

                    </div>

                    <div
                      className="
  bg-slate-50
  border
  border-slate-100
  rounded-xl
  p-5
"
                    >

                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        Statut
                      </p>

                      <span
                        className={`inline-flex mt-2
                        px-3 py-1.5 rounded-full
                        text-xs font-semibold
                        ${getStatutClasses(
                          paiementSelectionne
                        )}`}
                      >
                        {getStatutLabel(
                          paiementSelectionne
                        )}
                      </span>

                    </div>

                  </div>

                  {/* REFERENCE */}
                  <div
                    className="
  bg-slate-50
  border
  border-slate-100
  rounded-xl
  p-5
"
                  >

                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Référence
                    </p>

                    <p className="font-mono font-medium
                      text-gray-900 mt-2 break-all"
                    >
                      {paiementSelectionne.reference ||
                        "—"}
                    </p>

                  </div>

                </div>

              )}

            </div>

            <div
              className="px-6 py-4 border-t border-gray-200
              flex justify-end"
            >

              <button
  onClick={fermerDetail}
  className="
    px-5
    py-2.5
    bg-slate-100
    text-slate-700
    rounded-xl
    font-semibold
    border
    border-slate-200
    hover:bg-slate-200
    transition-all
  "
>
  Fermer
</button>

            </div>

          </div>

        </div>

      )}

    </main>
  );
}