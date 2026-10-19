"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/services/api";

export default function HistoriqueAuditPage() {
  const router = useRouter();

  const [audits, setAudits] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");
  const [recherche, setRecherche] = useState("");
  const [utilisateur, setUtilisateur] = useState(null);
  
const [dateHeure, setDateHeure] = useState(null);


  // =====================================================
  // CONFIGURATION SELON LE RÔLE
  // =====================================================

  const estAdmin = utilisateur?.role === "Administrateur";
  const estGestionnaire =
    utilisateur?.role === "GestionnaireDeStock";
  const estResponsable =
    utilisateur?.role === "ResponsableCommercial";

  const espaceTitre = estAdmin
    ? "ESPACE ADMINISTRATION"
    : estResponsable
    ? "ESPACE RESPONSABLE COMMERCIAL"
    : "ESPACE GESTION DU STOCK";

  // =====================================================
  // CHARGER LES AUDITS
  // =====================================================

  const chargerAudits = async (texteRecherche = "") => {
    try {
      setChargement(true);
      setErreur("");

      const params = {};

      if (texteRecherche.trim()) {
        params.recherche = texteRecherche.trim();
      }

      const response = await api.get("/systeme/audit/", {
        params,
      });

      setAudits(response.data.results || response.data);
    } catch (error) {
      console.error(error);
      setErreur("Impossible de charger le journal d’audit.");
    } finally {
      setChargement(false);
    }
  };

  // =====================================================
  // VÉRIFICATION UTILISATEUR
  // =====================================================

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
        utilisateurConnecte.role !== "GestionnaireDeStock" &&
        utilisateurConnecte.role !== "Administrateur" &&
        utilisateurConnecte.role !== "ResponsableCommercial"
      ) {
        router.push("/");
        return;
      }

      setUtilisateur(utilisateurConnecte);
    } catch (error) {
      console.error(error);
      router.push("/connexion");
    }
  }, [router]);

  // =====================================================
  // DATE + HEURE EN TEMPS RÉEL
  // =====================================================

  
useEffect(() => {
  setDateHeure(new Date());

  const interval = setInterval(() => {
    setDateHeure(new Date());
  }, 1000);

  return () => clearInterval(interval);
}, []);


  // =====================================================
  // RECHERCHE AVEC DÉLAI
  // =====================================================

  useEffect(() => {
    const delai = setTimeout(() => {
      chargerAudits(recherche);
    }, 300);

    return () => clearTimeout(delai);
  }, [recherche]);

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
  // PAGE
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
                    {espaceTitre}
                  </span>

                </div>

                <h1 className="text-3xl md:text-4xl font-bold text-slate-900">
                  Journal d’audit
                </h1>

                <p className="text-slate-600 mt-2">
                  Historique des actions effectuées sur la plateforme.
                </p>

              </div>

              {/* DATE / HEURE */}

              <div className="bg-white/80 backdrop-blur-sm border border-white rounded-2xl px-5 py-4 shadow-sm min-w-[230px]">

                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Aujourd'hui
                </p>

                <p className="text-sm font-medium text-slate-700 mt-1 capitalize">
                  {dateHeure ? formaterDate(dateHeure) : "Chargement..."}
                </p>

                <p className="text-2xl font-bold text-blue-700 mt-1">
                  {dateHeure ? formaterHeure(dateHeure) : "--:--:--"}
                </p>

              </div>

            </div>

          </div>

        </section>

        {/* =====================================================
            CONTENU
        ====================================================== */}

        <div className="max-w-7xl mx-auto px-8 py-8">

          {/* =====================================================
              CARTES STATISTIQUES
          ====================================================== */}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">

            {/* TOTAL */}

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

              <div className="h-1 bg-blue-500" />

              <div className="p-5 flex items-center gap-4">

                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-2xl">
                  📑
                </div>

                <div>

                  <p className="text-sm text-slate-500">
                    Actions affichées
                  </p>

                  <p className="text-2xl font-bold text-slate-900">
                    {audits.length}
                  </p>

                </div>

              </div>

            </div>

            {/* RECHERCHE */}

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

              <div className="h-1 bg-cyan-500" />

              <div className="p-5 flex items-center gap-4">

                <div className="w-12 h-12 rounded-xl bg-cyan-50 flex items-center justify-center text-2xl">
                  🔎
                </div>

                <div>

                  <p className="text-sm text-slate-500">
                    Recherche
                  </p>

                  <p className="text-lg font-bold text-slate-900">
                    {recherche ? "Active" : "Aucune"}
                  </p>

                </div>

              </div>

            </div>

            {/* ACCÈS */}

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
                    {estAdmin
                      ? "Administrateur"
                      : estResponsable
                      ? "Responsable Commercial"
                      : "Gestionnaire Stock"}
                  </p>

                </div>

              </div>

            </div>

          </div>

          {/* =====================================================
              RECHERCHE
          ====================================================== */}

          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 mb-6">

            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">

              <div className="flex-1">

                <div className="flex items-center gap-2 mb-2">

                  <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
                    🔎
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-800">
                      Rechercher dans le journal
                    </label>

                    <p className="text-xs text-slate-500">
                      Utilisateur, email, module, description ou référence
                    </p>
                  </div>

                </div>

                <input
                  type="text"
                  value={recherche}
                  onChange={(e) =>
                    setRecherche(e.target.value)
                  }
                  placeholder="Rechercher une action..."
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />

              </div>

              {recherche && (

                <button
                  type="button"
                  onClick={() => setRecherche("")}
                  className="px-5 py-3 rounded-xl bg-slate-100 text-slate-700 text-sm font-semibold hover:bg-slate-200 transition"
                >
                  ✕ Effacer
                </button>

              )}

            </div>

            {recherche && (

              <div className="mt-4 px-4 py-3 rounded-xl bg-blue-50 border border-blue-100">

                <p className="text-sm text-blue-700">

                  Recherche en cours pour :{" "}

                  <span className="font-bold">
                    "{recherche}"
                  </span>

                </p>

              </div>

            )}

          </div>

          {/* =====================================================
              ERREUR
          ====================================================== */}

          {erreur && (

            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-2xl flex items-start gap-3">

              <span className="text-lg">
                ⚠️
              </span>

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
              CHARGEMENT
          ====================================================== */}

          {chargement ? (

            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-12 text-center">

              <div className="inline-flex items-center gap-3">

                <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />

                <p className="text-slate-600">
                  Chargement du journal...
                </p>

              </div>

            </div>

          ) : audits.length === 0 ? (

            /* =====================================================
                AUCUN RÉSULTAT
            ====================================================== */

            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-14 text-center">

              <div className="w-16 h-16 mx-auto rounded-2xl bg-blue-50 flex items-center justify-center text-3xl mb-5">
                📑
              </div>

              <h3 className="text-xl font-bold text-slate-900">
                {recherche
                  ? "Aucune action trouvée"
                  : "Aucune action enregistrée"}
              </h3>

              <p className="text-slate-500 mt-2">
                {recherche
                  ? "Aucune action ne correspond à votre recherche."
                  : "Le journal d’audit ne contient aucune action pour le moment."}
              </p>

              {recherche && (

                <button
                  type="button"
                  onClick={() => setRecherche("")}
                  className="mt-6 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition"
                >
                  Réinitialiser la recherche
                </button>

              )}

            </div>

          ) : (

            /* =====================================================
                TABLEAU
            ====================================================== */

            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">

              {/* EN-TÊTE TABLEAU */}

              <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

                <div>

                  <h2 className="font-bold text-slate-900">
                    Historique des actions
                  </h2>

                  <p className="text-xs text-slate-500 mt-1">
                    Consultez les opérations enregistrées sur la plateforme.
                  </p>

                </div>

                <span className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-xs font-semibold">
                  {audits.length} action
                  {audits.length > 1 ? "s" : ""}
                </span>

              </div>

              <div className="overflow-x-auto">

                <table className="min-w-full">

                  <thead className="bg-white border-b border-slate-200">

                    <tr>

                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Date
                      </th>

                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Utilisateur
                      </th>

                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Module
                      </th>

                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Action
                      </th>

                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Description
                      </th>

                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Référence
                      </th>

                    </tr>

                  </thead>

                  <tbody>

                    {audits.map((audit) => (

                      <tr
                        key={audit.idAudit}
                        className="border-b border-slate-100 last:border-b-0 hover:bg-blue-50/30 transition"
                      >

                        {/* DATE */}

                        <td className="whitespace-nowrap px-6 py-5">

                          <div className="flex items-center gap-3">

                            <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center">
                              🕐
                            </div>

                            <span className="text-sm text-slate-600">
                              {new Date(
                                audit.date_action
                              ).toLocaleString("fr-FR")}
                            </span>

                          </div>

                        </td>

                        {/* UTILISATEUR */}

                        <td className="px-6 py-5">

                          {audit.utilisateur_info ? (

                            <div className="flex items-center gap-3">

                              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 text-white flex items-center justify-center text-xs font-bold">
                                {audit.utilisateur_info.prenom
                                  ?.charAt(0)
                                  .toUpperCase() || "U"}
                              </div>

                              <div>

                                <p className="text-sm font-semibold text-slate-900">
                                  {audit.utilisateur_info.prenom}{" "}
                                  {audit.utilisateur_info.nom}
                                </p>

                                <p className="text-xs text-slate-500">
                                  {audit.utilisateur_info.email}
                                </p>

                              </div>

                            </div>

                          ) : (

                            <span className="text-sm text-slate-400">
                              Utilisateur supprimé
                            </span>

                          )}

                        </td>

                        {/* MODULE */}

                        <td className="px-6 py-5">

                          <span className="inline-flex px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-sm font-medium">
                            {audit.module}
                          </span>

                        </td>

                        {/* ACTION */}

                        <td className="px-6 py-5">

                          <span className="inline-flex rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">
                            {audit.action_display}
                          </span>

                        </td>

                        {/* DESCRIPTION */}

                        <td className="min-w-[300px] px-6 py-5">

                          <p className="text-sm text-slate-700 leading-relaxed">
                            {audit.description}
                          </p>

                        </td>

                        {/* RÉFÉRENCE */}

                        <td className="px-6 py-5">

                          {audit.reference ? (

                            <span className="inline-flex px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-semibold">
                              {audit.reference}
                            </span>

                          ) : (

                            <span className="text-slate-400">
                              —
                            </span>

                          )}

                        </td>

                      </tr>

                    ))}

                  </tbody>

                </table>

              </div>

              {/* =====================================================
                  PIED DU TABLEAU
              ====================================================== */}

              <div className="border-t border-slate-100 bg-slate-50/70 px-6 py-4">

                <p className="text-sm text-slate-600">

                  <span className="font-semibold text-slate-900">
                    {audits.length}
                  </span>{" "}

                  action{audits.length > 1 ? "s" : ""}{" "}

                  {recherche
                    ? "correspondant à la recherche."
                    : "affichée(s) dans le journal."}

                </p>

              </div>

            </div>

          )}

          {/* =====================================================
              INFORMATION
          ====================================================== */}

          <div className="mt-8 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-100 rounded-2xl p-6">

            <div className="flex items-start gap-4">

              <div className="w-11 h-11 rounded-xl bg-white flex items-center justify-center text-xl shadow-sm shrink-0">
                📝
              </div>

              <div>

                <h3 className="font-bold text-blue-900">
                  À propos du journal d’audit
                </h3>

                <p className="text-sm text-blue-800 mt-2 leading-relaxed">
                  Le journal d’audit conserve l’historique des actions
                  effectuées sur la plateforme afin de faciliter le suivi
                  et la traçabilité des opérations.
                </p>

              </div>

            </div>

          </div>

        </div>

      </div>

    </main>
  );
}