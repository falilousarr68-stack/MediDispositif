"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "../../../services/api";

export default function ParametresPage() {
  const [parametres, setParametres] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");

  const [modalOuverte, setModalOuverte] = useState(false);
  const [modeModification, setModeModification] = useState(false);
  const [parametreSelectionne, setParametreSelectionne] = useState(null);

  const [utilisateur, setUtilisateur] = useState(null);
  const [dateHeure, setDateHeure] = useState(new Date());

  const [formulaire, setFormulaire] = useState({
    nom: "",
    valeur: "",
    description: "",
  });

  // =====================================================
  // VÉRIFICATION ADMINISTRATEUR + DATE/HEURE
  // =====================================================

  useEffect(() => {
    const utilisateurStocke = localStorage.getItem("utilisateur");

    if (!utilisateurStocke) {
      window.location.href = "/connexion";
      return;
    }

    try {
      const utilisateurConnecte = JSON.parse(utilisateurStocke);

      if (utilisateurConnecte.role !== "Administrateur") {
        window.location.href = "/";
        return;
      }

      setUtilisateur(utilisateurConnecte);
    } catch (error) {
      console.error(error);
      window.location.href = "/connexion";
      return;
    }

    chargerParametres();

    const interval = setInterval(() => {
      setDateHeure(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // =====================================================
  // CHARGER LES PARAMÈTRES
  // =====================================================

  const chargerParametres = async () => {
    try {
      setChargement(true);
      setErreur("");

      const response = await api.get("/systeme/parametres/");

      const data = response.data;

      if (Array.isArray(data)) {
        setParametres(data);
      } else if (data?.results) {
        setParametres(data.results);
      } else {
        setParametres([]);
      }
    } catch (error) {
      console.error(
        "Erreur lors du chargement des paramètres :",
        error
      );

      if (error.response?.status === 403) {
        setErreur(
          "Vous n'avez pas l'autorisation d'accéder aux paramètres système."
        );
      } else {
        setErreur(
          "Impossible de charger les paramètres système."
        );
      }
    } finally {
      setChargement(false);
    }
  };

  // =====================================================
  // OUVRIR AJOUT
  // =====================================================

  const ouvrirAjout = () => {
    setModeModification(false);
    setParametreSelectionne(null);

    setFormulaire({
      nom: "",
      valeur: "",
      description: "",
    });

    setErreur("");
    setModalOuverte(true);
  };

  // =====================================================
  // OUVRIR MODIFICATION
  // =====================================================

  const ouvrirModification = (parametre) => {
    setModeModification(true);
    setParametreSelectionne(parametre);

    setFormulaire({
      nom: parametre.nom || "",
      valeur: parametre.valeur || "",
      description: parametre.description || "",
    });

    setErreur("");
    setModalOuverte(true);
  };

  // =====================================================
  // FERMER MODAL
  // =====================================================

  const fermerModal = () => {
    setModalOuverte(false);
    setModeModification(false);
    setParametreSelectionne(null);

    setFormulaire({
      nom: "",
      valeur: "",
      description: "",
    });
  };

  // =====================================================
  // MODIFICATION DU FORMULAIRE
  // =====================================================

  const modifierChamp = (champ, valeur) => {
    setFormulaire((ancien) => ({
      ...ancien,
      [champ]: valeur,
    }));
  };

  // =====================================================
  // ENREGISTRER
  // =====================================================

  const enregistrerParametre = async (event) => {
    event.preventDefault();

    if (!formulaire.nom.trim()) {
      setErreur("Le nom du paramètre est obligatoire.");
      return;
    }

    if (!formulaire.valeur.trim()) {
      setErreur("La valeur du paramètre est obligatoire.");
      return;
    }

    try {
      setErreur("");

      if (modeModification && parametreSelectionne) {
        await api.put(
          `/systeme/parametres/${parametreSelectionne.id}/`,
          formulaire
        );
      } else {
        await api.post(
          "/systeme/parametres/",
          formulaire
        );
      }

      fermerModal();
      await chargerParametres();
    } catch (error) {
      console.error(
        "Erreur lors de l'enregistrement :",
        error
      );

      const message =
        error.response?.data?.nom?.[0] ||
        error.response?.data?.valeur?.[0] ||
        error.response?.data?.detail ||
        "Impossible d'enregistrer le paramètre.";

      setErreur(message);
    }
  };

  // =====================================================
  // SUPPRIMER
  // =====================================================

  const supprimerParametre = async (parametre) => {
    const confirmation = window.confirm(
      `Voulez-vous vraiment supprimer le paramètre "${parametre.nom}" ?`
    );

    if (!confirmation) {
      return;
    }

    try {
      setErreur("");

      await api.delete(
        `/systeme/parametres/${parametre.id}/`
      );

      await chargerParametres();
    } catch (error) {
      console.error(
        "Erreur lors de la suppression :",
        error
      );

      setErreur(
        "Impossible de supprimer ce paramètre."
      );
    }
  };

  // =====================================================
  // FORMAT DATE
  // =====================================================

  const formaterDate = (date) => {
    return new Intl.DateTimeFormat("fr-FR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(date);
  };

  const formaterHeure = (date) => {
    return date.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  // =====================================================
  // CHARGEMENT
  // =====================================================

  if (chargement) {
    return (
      <main className="min-h-screen bg-[#f4f8fc]">

        <div className="ml-64 min-h-screen">
          <section className="relative overflow-hidden bg-gradient-to-r from-[#eaf4ff] via-[#effaff] to-[#e9fbf7] border-b border-blue-100">
            <div className="max-w-7xl mx-auto px-8 py-10">

              <p className="text-blue-600 text-sm font-semibold uppercase tracking-wider mb-2">
                Espace administration
              </p>

              <h1 className="text-3xl font-bold text-slate-900">
                ⚙️ Paramètres système
              </h1>

              <p className="text-slate-600 mt-2">
                Configuration générale de MediDispositif
              </p>

            </div>
          </section>

          <div className="max-w-7xl mx-auto px-8 py-20 text-center">
            <div className="inline-flex items-center gap-3 bg-white px-6 py-4 rounded-2xl shadow-sm border border-slate-200">
              <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-slate-600">
                Chargement des paramètres...
              </p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // =====================================================
  // PAGE PRINCIPALE
  // =====================================================

  return (
    <main className="min-h-screen bg-[#f4f8fc]">


      <div className="ml-64 min-h-screen">

        {/* =====================================================
            BANNIÈRE
        ====================================================== */}

        <section className="relative overflow-hidden bg-gradient-to-r from-[#eaf4ff] via-[#effaff] to-[#e9fbf7] border-b border-blue-100">

          <div className="absolute -right-20 -top-24 w-80 h-80 bg-blue-200/30 rounded-full blur-3xl" />
          <div className="absolute right-40 bottom-[-100px] w-72 h-72 bg-cyan-200/20 rounded-full blur-3xl" />

          <div className="relative max-w-7xl mx-auto px-8 py-8">

            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">

              <div>

                <div className="flex items-center gap-2 mb-3">
                  <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wider">
                    Espace administration
                  </span>
                </div>

                <h1 className="text-3xl md:text-4xl font-bold text-slate-900">
                  Paramètres système
                </h1>

                <p className="text-slate-600 mt-2">
                  Configurez les paramètres généraux utilisés par
                  MediDispositif.
                </p>

              </div>

              <div className="bg-white/80 backdrop-blur-sm border border-white rounded-2xl px-5 py-4 shadow-sm min-w-[230px]">

                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Aujourd'hui
                </p>

                <p className="text-sm font-medium text-slate-700 mt-1 capitalize">
                  {formaterDate(dateHeure)}
                </p>

                <p className="text-2xl font-bold text-blue-700 mt-1">
                  {formaterHeure(dateHeure)}
                </p>

              </div>

            </div>

          </div>
        </section>

        {/* =====================================================
            CONTENU
        ====================================================== */}

        <div className="max-w-7xl mx-auto px-8 py-8">

          {/* ERREUR */}

          {erreur && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-2xl flex items-start gap-3">
              <span className="text-lg">⚠️</span>

              <div>
                <p className="font-semibold">
                  Une erreur est survenue
                </p>

                <p className="text-sm mt-1">
                  {erreur}
                </p>
              </div>
            </div>
          )}

          {/* =====================================================
              CARTES STATISTIQUES
          ====================================================== */}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="h-1 bg-blue-500" />

              <div className="p-5 flex items-center gap-4">

                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-2xl">
                  ⚙️
                </div>

                <div>
                  <p className="text-sm text-slate-500">
                    Paramètres configurés
                  </p>

                  <p className="text-2xl font-bold text-slate-900">
                    {parametres.length}
                  </p>
                </div>

              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="h-1 bg-cyan-500" />

              <div className="p-5 flex items-center gap-4">

                <div className="w-12 h-12 rounded-xl bg-cyan-50 flex items-center justify-center text-2xl">
                  🛠️
                </div>

                <div>
                  <p className="text-sm text-slate-500">
                    Gestion
                  </p>

                  <p className="text-lg font-bold text-slate-900">
                    Configuration
                  </p>
                </div>

              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="h-1 bg-emerald-500" />

              <div className="p-5 flex items-center gap-4">

                <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-2xl">
                  🔐
                </div>

                <div>
                  <p className="text-sm text-slate-500">
                    Accès
                  </p>

                  <p className="text-lg font-bold text-slate-900">
                    Administrateur
                  </p>
                </div>

              </div>
            </div>

          </div>

          {/* =====================================================
              BARRE D'ACTIONS
          ====================================================== */}

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">

            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Paramètres de l'application
              </h2>

              <p className="text-sm text-slate-500 mt-1">
                {parametres.length} paramètre
                {parametres.length > 1 ? "s" : ""} configuré
                {parametres.length > 1 ? "s" : ""}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">

              <button
                type="button"
                onClick={chargerParametres}
                className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-700 font-medium hover:bg-slate-50 hover:border-slate-300 transition shadow-sm"
              >
                🔄 Actualiser
              </button>

              <button
                type="button"
                onClick={ouvrirAjout}
                className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-cyan-600 transition shadow-md shadow-blue-500/20"
              >
                + Ajouter un paramètre
              </button>

            </div>

          </div>

          {/* =====================================================
              LISTE DES PARAMÈTRES
          ====================================================== */}

          {parametres.length === 0 ? (

            <div className="bg-white border border-slate-200 rounded-2xl p-14 text-center shadow-sm">

              <div className="w-16 h-16 mx-auto rounded-2xl bg-blue-50 flex items-center justify-center text-3xl mb-5">
                ⚙️
              </div>

              <h3 className="text-xl font-bold text-slate-900">
                Aucun paramètre configuré
              </h3>

              <p className="text-slate-500 mt-2">
                Commencez par ajouter un paramètre système.
              </p>

              <button
                type="button"
                onClick={ouvrirAjout}
                className="mt-6 bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-5 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-cyan-600 transition shadow-md"
              >
                + Ajouter un paramètre
              </button>

            </div>

          ) : (

            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">

              <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">

                <div>
                  <h3 className="font-bold text-slate-900">
                    Configuration système
                  </h3>

                  <p className="text-xs text-slate-500 mt-1">
                    Gestion des paramètres utilisés par l'application
                  </p>
                </div>

                <span className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-xs font-semibold">
                  {parametres.length} élément
                  {parametres.length > 1 ? "s" : ""}
                </span>

              </div>

              <div className="overflow-x-auto">

                <table className="w-full">

                  <thead className="bg-white border-b border-slate-200">

                    <tr>

                      <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Paramètre
                      </th>

                      <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Valeur
                      </th>

                      <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Description
                      </th>

                      <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Dernière modification
                      </th>

                      <th className="text-right px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Actions
                      </th>

                    </tr>

                  </thead>

                  <tbody>

                    {parametres.map((parametre) => (

                      <tr
                        key={parametre.id}
                        className="border-b border-slate-100 last:border-b-0 hover:bg-blue-50/30 transition"
                      >

                        <td className="px-6 py-5">

                          <div className="flex items-center gap-3">

                            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-lg">
                              ⚙️
                            </div>

                            <div>
                              <p className="font-semibold text-slate-900">
                                {parametre.nom}
                              </p>

                              <p className="text-xs text-slate-400 mt-0.5">
                                Paramètre système
                              </p>
                            </div>

                          </div>

                        </td>

                        <td className="px-6 py-5">

                          <span className="inline-flex bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg text-sm font-semibold max-w-xs break-words">
                            {parametre.valeur}
                          </span>

                        </td>

                        <td className="px-6 py-5">

                          <p className="text-sm text-slate-600 max-w-sm">
                            {parametre.description || "Aucune description"}
                          </p>

                        </td>

                        <td className="px-6 py-5">

                          <p className="text-sm text-slate-500">
                            {parametre.date_modification
                              ? new Date(
                                  parametre.date_modification
                                ).toLocaleString("fr-FR")
                              : "—"}
                          </p>

                        </td>

                        <td className="px-6 py-5">

                          <div className="flex justify-end gap-2">

                            <button
                              type="button"
                              onClick={() =>
                                ouvrirModification(parametre)
                              }
                              className="px-3 py-2 bg-blue-50 text-blue-700 rounded-xl text-sm font-semibold hover:bg-blue-100 transition"
                            >
                              ✏️ Modifier
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                supprimerParametre(parametre)
                              }
                              className="px-3 py-2 bg-red-50 text-red-700 rounded-xl text-sm font-semibold hover:bg-red-100 transition"
                            >
                              🗑️ Supprimer
                            </button>

                          </div>

                        </td>

                      </tr>

                    ))}

                  </tbody>

                </table>

              </div>

            </div>

          )}

          {/* =====================================================
              INFORMATION
          ====================================================== */}

          <div className="mt-8 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-100 rounded-2xl p-6">

            <div className="flex items-start gap-4">

              <div className="w-11 h-11 rounded-xl bg-white flex items-center justify-center text-xl shadow-sm shrink-0">
                ℹ️
              </div>

              <div>

                <h3 className="font-bold text-blue-900">
                  À propos des paramètres système
                </h3>

                <p className="text-sm text-blue-800 mt-2 leading-relaxed">
                  Les paramètres système permettent de définir les
                  informations générales utilisées par l'application.
                  Leur modification est réservée à l'administrateur.
                </p>

              </div>

            </div>

          </div>

        </div>
      </div>

      {/* =====================================================
          MODALE AJOUT / MODIFICATION
      ====================================================== */}

      {modalOuverte && (

        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm px-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              fermerModal();
            }
          }}
        >

          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">

            {/* TITRE */}

            <div className="px-6 py-5 border-b border-slate-200 bg-slate-50">

              <div className="flex items-center justify-between">

                <div className="flex items-center gap-3">

                  <div className="w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center text-xl">
                    ⚙️
                  </div>

                  <div>

                    <h2 className="text-xl font-bold text-slate-900">
                      {modeModification
                        ? "Modifier le paramètre"
                        : "Ajouter un paramètre"}
                    </h2>

                    <p className="text-sm text-slate-500 mt-1">
                      Configuration système
                    </p>

                  </div>

                </div>

                <button
                  type="button"
                  onClick={fermerModal}
                  className="w-9 h-9 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition text-2xl"
                >
                  ×
                </button>

              </div>

            </div>

            {/* FORMULAIRE */}

            <form
              onSubmit={enregistrerParametre}
              className="p-6"
            >

              <div className="space-y-5">

                {/* NOM */}

                <div>

                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Nom du paramètre *
                  </label>

                  <input
                    type="text"
                    value={formulaire.nom}
                    onChange={(event) =>
                      modifierChamp(
                        "nom",
                        event.target.value
                      )
                    }
                    placeholder="ex: nom_entreprise"
                    disabled={modeModification}
                    className="w-full border border-slate-300 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-500 transition"
                  />

                  <p className="text-xs text-slate-500 mt-1.5">
                    Utilisez un nom simple en snake_case.
                  </p>

                </div>

                {/* VALEUR */}

                <div>

                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Valeur *
                  </label>

                  <input
                    type="text"
                    value={formulaire.valeur}
                    onChange={(event) =>
                      modifierChamp(
                        "valeur",
                        event.target.value
                      )
                    }
                    placeholder="ex: MediDispositif"
                    className="w-full border border-slate-300 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  />

                </div>

                {/* DESCRIPTION */}

                <div>

                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Description
                  </label>

                  <textarea
                    value={formulaire.description}
                    onChange={(event) =>
                      modifierChamp(
                        "description",
                        event.target.value
                      )
                    }
                    placeholder="Décrivez le rôle de ce paramètre..."
                    rows={4}
                    className="w-full border border-slate-300 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition"
                  />

                </div>

              </div>

              {/* BOUTONS */}

              <div className="flex justify-end gap-3 mt-7 pt-5 border-t border-slate-100">

                <button
                  type="button"
                  onClick={fermerModal}
                  className="px-5 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition"
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-cyan-600 transition shadow-md"
                >
                  {modeModification
                    ? "Enregistrer les modifications"
                    : "Ajouter"}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </main>
  );
}