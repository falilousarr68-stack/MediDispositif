"use client";

import { useEffect, useMemo, useState } from "react";
import api from "../../../services/api";

export default function CommandesAdministrationPage() {
  const [commandes, setCommandes] = useState([]);
  const [commandeSelectionnee, setCommandeSelectionnee] = useState(null);

  const [chargement, setChargement] = useState(true);
  const [chargementDetail, setChargementDetail] = useState(false);
  const [erreur, setErreur] = useState("");

  const [recherche, setRecherche] = useState("");
  const [statut, setStatut] = useState("Tous");
  const [dateHeure, setDateHeure] = useState(new Date());

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
    const utilisateurStocke =
      localStorage.getItem("utilisateur");

    if (!utilisateurStocke) {
      window.location.href = "/connexion";
      return;
    }

    try {
      const utilisateur = JSON.parse(utilisateurStocke);

      if (utilisateur.role !== "Administrateur") {
        window.location.href = "/";
        return;
      }

      chargerCommandes();
    } catch (error) {
      console.error(error);
      window.location.href = "/connexion";
    }
  };

  const chargerCommandes = async () => {
    try {
      setChargement(true);
      setErreur("");

      const response = await api.get("/ventes/commandes/");

      const data = response.data;

      if (Array.isArray(data)) {
        setCommandes(data);
      } else if (Array.isArray(data.results)) {
        setCommandes(data.results);
      } else {
        setCommandes([]);
      }
    } catch (error) {
      console.error(
        "Erreur lors du chargement des commandes :",
        error
      );

      setErreur(
        error.response?.data?.detail ||
          "Impossible de charger les commandes."
      );
    } finally {
      setChargement(false);
    }
  };

  const afficherDetail = async (commande) => {
    setCommandeSelectionnee(commande);
    setChargementDetail(true);

    try {
      const response = await api.get(
        `/ventes/commandes/${commande.idCommande}/`
      );

      setCommandeSelectionnee(response.data);
    } catch (error) {
      console.error(
        "Erreur lors du chargement du détail :",
        error
      );
    } finally {
      setChargementDetail(false);
    }
  };

  const fermerDetail = () => {
    setCommandeSelectionnee(null);
  };

  const commandesFiltrees = useMemo(() => {
    return commandes.filter((commande) => {
      const texteRecherche = recherche
        .toLowerCase()
        .trim();

      const client = commande.client || {};

      const nomClient = `${client.prenom || ""} ${
        client.nom || ""
      }`.toLowerCase();

      const emailClient = (
        client.email || ""
      ).toLowerCase();

      const numeroCommande = String(
        commande.idCommande || ""
      ).toLowerCase();

      const correspondRecherche =
        !texteRecherche ||
        nomClient.includes(texteRecherche) ||
        emailClient.includes(texteRecherche) ||
        numeroCommande.includes(texteRecherche);

      const correspondStatut =
        statut === "Tous" ||
        commande.statut === statut ||
        commande.statut_display === statut;

      return (
        correspondRecherche &&
        correspondStatut
      );
    });
  }, [commandes, recherche, statut]);

  const formatMontant = (montant) => {
    return Number(montant || 0).toLocaleString(
      "fr-FR"
    );
  };

  const formatDate = (date) => {
    if (!date) return "—";

    return new Date(date).toLocaleDateString(
      "fr-FR"
    );
  };

  const getNomClient = (commande) => {
    const client = commande.client;

    if (!client) {
      return "Client inconnu";
    }

    if (typeof client === "string") {
      return client;
    }

    return (
      `${client.prenom || ""} ${
        client.nom || ""
      }`.trim() ||
      client.email ||
      "Client"
    );
  };

  const getEmailClient = (commande) => {
    const client = commande.client;

    if (!client || typeof client === "string") {
      return "";
    }

    return client.email || "";
  };

  const getStatutLabel = (commande) => {
    return (
      commande.statut_display ||
      commande.statut ||
      "Inconnu"
    );
  };

  const getStatutClasses = (commande) => {
    const valeur = commande.statut;

    if (valeur === "Validee") {
      return "bg-green-50 text-green-700";
    }

    if (valeur === "Annulee") {
      return "bg-red-50 text-red-700";
    }

    if (valeur === "EnCours") {
      return "bg-yellow-50 text-yellow-700";
    }

    return "bg-gray-100 text-gray-700";
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
                  🛒
                </span>

                <p className="text-blue-700 text-sm font-semibold uppercase tracking-wide">
                  Espace Administration
                </p>
              </div>

              <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
                Gestion des commandes
              </h1>

              <p className="text-slate-500 mt-1">
                Consultez les commandes enregistrées sur la plateforme.
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

        <section className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 mb-6">

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
                placeholder="Numéro de commande, nom ou email du client..."
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

                <option value="EnCours">
                  En cours
                </option>

                <option value="Validee">
                  Validée
                </option>

                <option value="Annulee">
                  Annulée
                </option>
              </select>

            </div>

          </div>
        </section>

        {/* =====================================================
            ERREUR
        ====================================================== */}

        {erreur && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
            ⚠️ {erreur}
          </div>
        )}

        {/* =====================================================
            LISTE DES COMMANDES
        ====================================================== */}

        <section className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">

          <div className="px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-white to-slate-50 flex items-center justify-between">

            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Commandes
              </h2>

              <p className="text-sm text-slate-500 mt-1">
                {chargement
                  ? "Chargement..."
                  : `${commandesFiltrees.length} commande(s)`
                }
              </p>
            </div>

            <button
              onClick={chargerCommandes}
              className="
                inline-flex items-center gap-2 px-4 py-2.5
                border border-slate-200 rounded-xl
                text-sm font-semibold text-slate-600 bg-white shadow-sm
                hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200
                transition-all
              "
            >
              🔄 Actualiser
            </button>

          </div>

          {chargement ? (

            <div className="py-16 text-center text-slate-500">
              Chargement des commandes...
            </div>

          ) : commandesFiltrees.length === 0 ? (

            <div className="py-16 text-center">

              <div className="text-5xl mb-4">
                🛒
              </div>

              <h3 className="text-lg font-semibold text-slate-900">
                Aucune commande trouvée
              </h3>

              <p className="text-slate-500 mt-2">
                Aucune commande ne correspond aux critères.
              </p>

            </div>

          ) : (

            <div className="overflow-x-auto">

              <table className="w-full">

                <thead className="bg-slate-50/80 border-b border-slate-200">

                  <tr>

                    <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Commande
                    </th>

                    <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Client
                    </th>

                    <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Date
                    </th>

                    <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Montant
                    </th>

                    <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Statut
                    </th>

                    <th className="text-right px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Actions
                    </th>

                  </tr>

                </thead>

                <tbody className="divide-y divide-slate-100">

                  {commandesFiltrees.map((commande) => (

                    <tr
                      key={commande.idCommande}
                      className="hover:bg-blue-50/50 transition-colors duration-200"
                    >

                      {/* COMMANDE */}

                      <td className="px-6 py-5">

                        <div className="flex items-center gap-3">

                          <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center text-2xl">
                            🛒
                          </div>

                          <div>

                            <p className="font-semibold text-slate-900">
                              Commande #{commande.idCommande}
                            </p>

                            <p className="text-xs text-slate-500 mt-1">
                              {commande.nombre_lignes !== undefined
                                ? `${commande.nombre_lignes} ligne(s)`
                                : "Commande"
                              }
                            </p>

                          </div>

                        </div>

                      </td>

                      {/* CLIENT */}

                      <td className="px-6 py-5">

                        <p className="text-sm font-medium text-slate-900">
                          {getNomClient(commande)}
                        </p>

                        {getEmailClient(commande) && (
                          <p className="text-xs text-slate-500 mt-1">
                            {getEmailClient(commande)}
                          </p>
                        )}

                      </td>

                      {/* DATE */}

                      <td className="px-6 py-5 text-sm text-slate-700">
                        {formatDate(commande.date_commande)}
                      </td>

                      {/* MONTANT */}

                      <td className="px-6 py-5">

                        <span className="font-semibold text-slate-900">
                          {formatMontant(commande.montant_total)} FCFA
                        </span>

                      </td>

                      {/* STATUT */}

                      <td className="px-6 py-5">

                        <span
                          className={`inline-flex px-3 py-1.5 rounded-full text-xs font-semibold ${getStatutClasses(commande)}`}
                        >
                          {getStatutLabel(commande)}
                        </span>

                      </td>

                      {/* ACTIONS */}

                      <td className="px-6 py-5">

                        <div className="flex justify-end">

                          <button
                            onClick={() =>
                              afficherDetail(commande)
                            }
                            className="
                              inline-flex items-center gap-2 px-3 py-2 rounded-xl
                              text-sm font-semibold text-blue-700 bg-blue-50
                              border border-blue-100 hover:bg-blue-100 hover:border-blue-200
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

      {commandeSelectionnee && (

        <div
          className="
            fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-50
            flex items-center justify-center p-4
          "
        >

          <div
            className="
              bg-white rounded-2xl shadow-2xl
              w-full max-w-4xl max-h-[90vh]
              overflow-hidden border border-slate-200
            "
          >

            {/* HEADER MODALE */}

            <div
              className="
                px-6 py-5 border-b border-slate-100
                bg-gradient-to-r from-[#eaf4ff] via-[#effaff] to-[#e9fbf7]
                flex items-center justify-between
              "
            >

              <div>

                <p className="text-xs text-blue-700 font-bold uppercase tracking-wider">
                  COMMANDE
                </p>

                <h2 className="text-2xl font-bold text-slate-900">
                  #{commandeSelectionnee.idCommande}
                </h2>

                <p className="text-sm text-slate-500 mt-1">
                  {formatDate(
                    commandeSelectionnee.date_commande
                  )}
                </p>

              </div>

              <button
                onClick={fermerDetail}
                className="
                  w-9 h-9 rounded-xl flex items-center justify-center
                  text-xl text-slate-400 bg-white/70 border border-white
                  hover:bg-white hover:text-slate-700 transition-all
                "
              >
                ×
              </button>

            </div>

            {/* CONTENU MODALE */}

            <div className="p-6 overflow-y-auto max-h-[70vh]">

              {chargementDetail ? (

                <div className="py-12 text-center text-slate-500">
                  Chargement du détail...
                </div>

              ) : (

                <>

                  {/* CLIENT + STATUT */}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">

                    {/* CLIENT */}

                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-5">

                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        Client
                      </p>

                      <p className="font-semibold text-slate-900 mt-2">
                        {getNomClient(
                          commandeSelectionnee
                        )}
                      </p>

                      {getEmailClient(
                        commandeSelectionnee
                      ) && (

                        <p className="text-sm text-slate-500 mt-1">
                          {getEmailClient(
                            commandeSelectionnee
                          )}
                        </p>

                      )}

                    </div>

                    {/* STATUT */}

                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-5">

                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        Statut
                      </p>

                      <span
                        className={`
                          inline-flex mt-2 px-3 py-1.5
                          rounded-full text-xs font-semibold
                          ${getStatutClasses(
                            commandeSelectionnee
                          )}
                        `}
                      >
                        {getStatutLabel(
                          commandeSelectionnee
                        )}
                      </span>

                    </div>

                  </div>

                  {/* =====================================================
                      LIGNES DE COMMANDE
                  ====================================================== */}

                  <div>

                    <h3 className="font-bold text-slate-900 mb-4">
                      Produits commandés
                    </h3>

                    {commandeSelectionnee.lignes?.length > 0 ? (

                      <div className="border border-slate-200 rounded-xl overflow-hidden">

                        <div className="divide-y divide-slate-100">

                          {commandeSelectionnee.lignes.map(
                            (ligne, index) => (

                              <div
                                key={
                                  ligne.idLigneCommande ||
                                  ligne.id ||
                                  index
                                }
                                className="
                                  p-4 flex flex-col
                                  md:flex-row md:items-center
                                  md:justify-between gap-3
                                  hover:bg-blue-50/40
                                  transition-colors
                                "
                              >

                                {/* INFORMATIONS PRODUIT */}

                                <div>

                                  <p className="font-semibold text-slate-900">

                                    {ligne.nom_produit ||
                                      ligne.produit?.nom ||
                                      ligne.nom ||
                                      `Produit #${
                                        ligne.idProduit || ""
                                      }`
                                    }

                                  </p>

                                  <p className="text-sm text-slate-500 mt-1">
                                    Quantité :{" "}
                                    {ligne.quantite || 0}
                                  </p>

                                </div>

                                {/* PRIX */}

                                <div className="text-right">

                                  <p className="font-semibold text-slate-900">

                                    {formatMontant(
                                      ligne.montant ||
                                        (
                                          Number(
                                            ligne.quantite || 0
                                          ) *
                                          Number(
                                            ligne.prix_unitaire || 0
                                          )
                                        )
                                    )}{" "}
                                    FCFA

                                  </p>

                                  {ligne.prix_unitaire && (

                                    <p className="text-xs text-slate-500">
                                      {formatMontant(
                                        ligne.prix_unitaire
                                      )}{" "}
                                      FCFA / unité
                                    </p>

                                  )}

                                </div>

                              </div>

                            )
                          )}

                        </div>

                      </div>

                    ) : (

                      <div className="bg-slate-50 border border-slate-100 rounded-xl p-6 text-center text-slate-500">
                        Aucun détail de produit disponible.
                      </div>

                    )}

                  </div>

                  {/* =====================================================
                      TOTAL
                  ====================================================== */}

                  <div
                    className="
                      mt-6 bg-blue-50
                      border border-blue-100 rounded-xl p-5
                    "
                  >

                    <div className="flex items-center justify-between">

                      <span className="text-blue-700 font-semibold">
                        Montant total
                      </span>

                      <span className="text-2xl font-bold text-blue-900">

                        {formatMontant(
                          commandeSelectionnee.montant_total
                        )}{" "}
                        FCFA

                      </span>

                    </div>

                  </div>

                  {/* =====================================================
                      MOTIF ANNULATION
                  ====================================================== */}

                  {commandeSelectionnee.motif_annulation && (

                    <div
                      className="
                        mt-4 bg-red-50
                        border border-red-100 rounded-xl p-4
                      "
                    >

                      <p className="text-sm font-semibold text-red-800">
                        Motif d'annulation
                      </p>

                      <p className="text-sm text-red-700 mt-1">
                        {commandeSelectionnee.motif_annulation}
                      </p>

                    </div>

                  )}

                </>

              )}

            </div>

            {/* FOOTER MODALE */}

            <div
              className="
                px-6 py-4 border-t border-slate-100
                bg-slate-50/50 flex justify-end
              "
            >

              <button
                onClick={fermerDetail}
                className="
                  px-5 py-2.5 bg-slate-100 text-slate-700 rounded-xl
                  font-semibold border border-slate-200
                  hover:bg-slate-200 transition-all
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