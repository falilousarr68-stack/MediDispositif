"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "../../../services/api";

export default function RapportsPage() {
  const router = useRouter();

  const [utilisateur, setUtilisateur] = useState(null);
  const [rapports, setRapports] = useState([]);
  const [types, setTypes] = useState([]);

  const [chargement, setChargement] = useState(true);
  const [generation, setGeneration] = useState(false);

  const [message, setMessage] = useState("");
  const [erreur, setErreur] = useState("");

  const [formulaire, setFormulaire] = useState({
    type_rapport: "Ventes",
    periode_debut: "",
    periode_fin: "",
    commentaires: "",
  });

  // =========================================================
  // VERIFICATION ADMIN
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
  user.role !== "ResponsableCommercial"
) {
  router.push("/");
  return;
}

      setUtilisateur(user);
      chargerDonnees();
    } catch (error) {
      console.error(error);
      router.push("/connexion");
    }
  }, [router]);

  // =========================================================
  // CHARGER RAPPORTS + TYPES
  // =========================================================

  const chargerDonnees = async () => {
    try {
      setChargement(true);
      setErreur("");

      const [rapportsResponse, typesResponse] = await Promise.all([
        api.get("/systeme/rapports/"),
        api.get("/systeme/rapports/types/"),
      ]);

      setRapports(rapportsResponse.data.results || rapportsResponse.data || []);
      setTypes(typesResponse.data || []);
    } catch (error) {
      console.error("Erreur chargement rapports :", error);

      setErreur(
        error.response?.data?.detail ||
          "Impossible de charger les rapports."
      );
    } finally {
      setChargement(false);
    }
  };

  // =========================================================
  // CHANGEMENT FORMULAIRE
  // =========================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormulaire((ancien) => ({
      ...ancien,
      [name]: value,
    }));
  };

  // =========================================================
  // GENERER RAPPORT
  // =========================================================

  const genererRapport = async (e) => {
    e.preventDefault();

    setGeneration(true);
    setMessage("");
    setErreur("");

    try {
      const response = await api.post(
        "/systeme/rapports/generer/",
        formulaire
      );

      console.log("Rapport généré :", response.data);

      setMessage("✅ Rapport généré avec succès.");

      // Réinitialisation
      setFormulaire({
        type_rapport: "Ventes",
        periode_debut: "",
        periode_fin: "",
        commentaires: "",
      });

      // Recharger la liste
      await chargerDonnees();
    } catch (error) {
      console.error("Erreur génération :", error);

      const data = error.response?.data;

      if (typeof data === "object") {
        const premierErreur = Object.values(data)[0];

        if (Array.isArray(premierErreur)) {
          setErreur(premierErreur[0]);
        } else if (typeof premierErreur === "string") {
          setErreur(premierErreur);
        } else {
          setErreur("Impossible de générer le rapport.");
        }
      } else {
        setErreur("Impossible de générer le rapport.");
      }
    } finally {
      setGeneration(false);
    }
  };

  // =========================================================
  // TELECHARGER PDF
  // =========================================================

  const telechargerPDF = async (rapport) => {
    try {
      setErreur("");

      const response = await api.get(
        `/systeme/rapports/${rapport.idRapport}/pdf/`,
        {
          responseType: "blob",
        }
      );

      const blob = new Blob([response.data], {
        type: "application/pdf",
      });

      const url = window.URL.createObjectURL(blob);

      const lien = document.createElement("a");

      lien.href = url;
      lien.download = `rapport-${rapport.idRapport}.pdf`;

      document.body.appendChild(lien);
      lien.click();

      lien.remove();

      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Erreur téléchargement PDF :", error);

      setErreur(
        "Impossible de télécharger le rapport en PDF."
      );
    }
  };

  // =========================================================
  // SUPPRIMER RAPPORT
  // =========================================================

  const supprimerRapport = async (id) => {
    const confirmation = window.confirm(
      "Voulez-vous vraiment supprimer ce rapport ?"
    );

    if (!confirmation) {
      return;
    }

    try {
      setErreur("");
      setMessage("");

      await api.delete(`/systeme/rapports/${id}/`);

      setMessage("✅ Rapport supprimé avec succès.");

      await chargerDonnees();
    } catch (error) {
      console.error("Erreur suppression :", error);

      setErreur(
        error.response?.data?.detail ||
          "Impossible de supprimer le rapport."
      );
    }
  };

  // =========================================================
  // FORMAT DATE
  // =========================================================

  const formaterDate = (date) => {
    if (!date) return "-";

    return new Date(date).toLocaleDateString("fr-FR");
  };

  const formaterDateHeure = (date) => {
    if (!date) return "-";

    return new Date(date).toLocaleString("fr-FR");
  };

  // =========================================================
  // CHARGEMENT
  // =========================================================

  if (!utilisateur || chargement) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-3">📊</div>

          <p className="text-gray-600">
            Chargement des rapports...
          </p>
        </div>
      </div>
    );
  }

  // =========================================================
  // AFFICHAGE
  // =========================================================

  return (
    <div className="ml-64 min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">

        {/* =====================================================
            EN-TETE
        ====================================================== */}

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">

          <div>
           <button
  type="button"
  onClick={() =>
    router.push(
      utilisateur?.role === "Administrateur"
        ? "/administration"
        : "/profil"
    )
  }
  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
>
  ←{" "}
  {utilisateur?.role === "Administrateur"
    ? "Retour à l'administration"
    : "Retour au profil"}
</button>

            <h1 className="text-3xl font-bold text-gray-900">
              📊 Gestion des rapports
            </h1>

            <p className="text-gray-600 mt-2">
              Générez et consultez les rapports de MediDispositif.
            </p>
          </div>

          <button
            onClick={chargerDonnees}
            className="px-4 py-2 bg-white border border-gray-300
            rounded-lg text-gray-700 hover:bg-gray-100 transition"
          >
            🔄 Actualiser
          </button>

        </div>

        {/* =====================================================
            MESSAGES
        ====================================================== */}

        {message && (
          <div className="mb-6 p-4 bg-green-100 border border-green-300
          text-green-800 rounded-lg">
            {message}
          </div>
        )}

        {erreur && (
          <div className="mb-6 p-4 bg-red-100 border border-red-300
          text-red-800 rounded-lg">
            ❌ {erreur}
          </div>
        )}

        {/* =====================================================
            FORMULAIRE GENERATION
        ====================================================== */}

        {utilisateur?.role === "Administrateur" && (
        <div className="bg-white rounded-2xl shadow-sm border
         border-gray-200 p-6 mb-8">

          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              Générer un nouveau rapport
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Sélectionnez le type et la période du rapport.
            </p>
          </div>

          <form onSubmit={genererRapport}>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">

              {/* TYPE */}

              <div>
                <label className="block text-sm font-medium
                text-gray-700 mb-2">
                  Type de rapport
                </label>

                <select
                  name="type_rapport"
                  value={formulaire.type_rapport}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300
                  rounded-lg text-gray-900 bg-white
                  focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  {types.length > 0 ? (
                    types.map((type) => (
                      <option
                        key={type.value}
                        value={type.value}
                      >
                        {type.label}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="Ventes">
                        Rapport des ventes
                      </option>

                      <option value="Stock">
                        Rapport de stock
                      </option>

                      <option value="Approvisionnements">
                        Rapport des approvisionnements
                      </option>

                      <option value="Paiements">
                        Rapport des paiements
                      </option>

                      <option value="Factures">
                        Rapport des factures
                      </option>

                      <option value="Clients">
                        Rapport des clients
                      </option>
                    </>
                  )}
                </select>
              </div>

              {/* DATE DEBUT */}

              <div>
                <label className="block text-sm font-medium
                text-gray-700 mb-2">
                  Période début
                </label>

                <input
                  type="date"
                  name="periode_debut"
                  value={formulaire.periode_debut}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300
                  rounded-lg text-gray-900 bg-white
                  focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* DATE FIN */}

              <div>
                <label className="block text-sm font-medium
                text-gray-700 mb-2">
                  Période fin
                </label>

                <input
                  type="date"
                  name="periode_fin"
                  value={formulaire.periode_fin}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300
                  rounded-lg text-gray-900 bg-white
                  focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* COMMENTAIRE */}

              <div>
                <label className="block text-sm font-medium
                text-gray-700 mb-2">
                  Commentaire
                </label>

                <input
                  type="text"
                  name="commentaires"
                  value={formulaire.commentaires}
                  onChange={handleChange}
                  placeholder="Ex: Rapport mensuel..."
                  className="w-full px-4 py-3 border border-gray-300
                  rounded-lg text-gray-900 placeholder-gray-400
                  focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

            </div>

            {/* BOUTON */}

            <div className="mt-6 flex justify-end">

              <button
                type="submit"
                disabled={generation}
                className="px-6 py-3 bg-blue-600 text-white
                rounded-lg font-medium hover:bg-blue-700
                disabled:opacity-50 disabled:cursor-not-allowed
                transition"
              >
                {generation
                  ? "⏳ Génération..."
                  : "📊 Générer le rapport"}
              </button>

            </div>

          </form>
        </div>
        )}

        {/* =====================================================
            LISTE DES RAPPORTS
        ====================================================== */}

        <div className="bg-white rounded-2xl shadow-sm border
        border-gray-200 overflow-hidden">

          <div className="p-6 border-b border-gray-200">

            <h2 className="text-xl font-bold text-gray-900">
              Rapports générés
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              {rapports.length} rapport
              {rapports.length > 1 ? "s" : ""} disponible
              {rapports.length > 1 ? "s" : ""}
            </p>

          </div>

          {rapports.length === 0 ? (

            <div className="p-12 text-center">

              <div className="text-5xl mb-4">
                📄
              </div>

              <h3 className="text-lg font-semibold text-gray-800">
                Aucun rapport
              </h3>

              <p className="text-gray-500 mt-2">
                Générez votre premier rapport à l'aide du formulaire
                ci-dessus.
              </p>

            </div>

          ) : (

            <div className="overflow-x-auto">

              <table className="w-full">

                <thead className="bg-gray-50">

                  <tr>

                    <th className="px-6 py-4 text-left text-xs
                    font-semibold text-gray-600 uppercase">
                      Rapport
                    </th>

                    <th className="px-6 py-4 text-left text-xs
                    font-semibold text-gray-600 uppercase">
                      Type
                    </th>

                    <th className="px-6 py-4 text-left text-xs
                    font-semibold text-gray-600 uppercase">
                      Période
                    </th>

                    <th className="px-6 py-4 text-left text-xs
                    font-semibold text-gray-600 uppercase">
                      Généré le
                    </th>

                    <th className="px-6 py-4 text-left text-xs
                    font-semibold text-gray-600 uppercase">
                      Généré par
                    </th>

                    <th className="px-6 py-4 text-right text-xs
                    font-semibold text-gray-600 uppercase">
                      Actions
                    </th>

                  </tr>

                </thead>

                <tbody className="divide-y divide-gray-200">

                  {rapports.map((rapport) => (

                    <tr
                      key={rapport.idRapport}
                      className="hover:bg-gray-50 transition"
                    >

                      {/* RAPPORT */}

                      <td className="px-6 py-4">

                        <div className="font-medium text-gray-900">
                          {rapport.titre}
                        </div>

                        <div className="text-xs text-gray-500 mt-1">
                          ID : #{rapport.idRapport}
                        </div>

                      </td>

                      {/* TYPE */}

                      <td className="px-6 py-4">

                        <span className="inline-flex px-3 py-1
                        rounded-full bg-blue-100 text-blue-700
                        text-sm font-medium">
                          {rapport.type_rapport_display ||
                            rapport.type_rapport}
                        </span>

                      </td>

                      {/* PERIODE */}

                      <td className="px-6 py-4 text-sm text-gray-700">

                        {rapport.periode_debut ||
                        rapport.periode_fin ? (
                          <div>
                            <div>
                              Du{" "}
                              <strong>
                                {formaterDate(
                                  rapport.periode_debut
                                )}
                              </strong>
                            </div>

                            <div>
                              Au{" "}
                              <strong>
                                {formaterDate(
                                  rapport.periode_fin
                                )}
                              </strong>
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400">
                            Toutes les périodes
                          </span>
                        )}

                      </td>

                      {/* DATE */}

                      <td className="px-6 py-4 text-sm text-gray-700">
                        {formaterDateHeure(
                          rapport.date_generation
                        )}
                      </td>

                      {/* GENERATEUR */}

                      <td className="px-6 py-4 text-sm text-gray-700">

                        {rapport.genere_par_nom || "Administrateur"}

                      </td>

                      {/* ACTIONS */}

                      <td className="px-6 py-4">

                        <div className="flex justify-end gap-2">

                          <button
                            onClick={() =>
                              telechargerPDF(rapport)
                            }
                            className="px-3 py-2 bg-blue-600
                            text-white rounded-lg text-sm
                            hover:bg-blue-700 transition"
                          >
                            📄 PDF
                          </button>

                          {utilisateur?.role === "Administrateur" && (
  <button
    onClick={() =>
      supprimerRapport(rapport.idRapport)
    }
    className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition"
  >
    🗑️
  </button>
)}

                        </div>

                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

          )}

        </div>

      </div>
    </div>
  );
}