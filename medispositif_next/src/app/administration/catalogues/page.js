"use client";

import { useEffect, useState } from "react";
import api from "../../../services/api";

export default function CataloguesAdministrationPage() {
  const [catalogues, setCatalogues] = useState([]);

  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");

  const [recherche, setRecherche] = useState("");
  const [dateHeure, setDateHeure] = useState(new Date());

  const [creation, setCreation] = useState(false);
  const [modification, setModification] = useState(false);

  const [catalogueSelectionne, setCatalogueSelectionne] = useState(null);

  const [nouveauNom, setNouveauNom] = useState("");
  const [produitsCatalogue, setProduitsCatalogue] = useState([]);

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

      if (
        utilisateur.role !== "Administrateur" &&
        utilisateur.role !== "GestionnaireDeStock"
      ) {
        window.location.href = "/";
        return;
      }

      chargerCatalogues();
    } catch (error) {
      console.error(error);
      window.location.href = "/connexion";
    }
  };

  const chargerCatalogues = async () => {
    try {
      setChargement(true);
      setErreur("");

      const response = await api.get(
        "/catalogue/catalogues/"
      );

      const data = response.data;

      let liste = [];

      if (Array.isArray(data)) {
        liste = data;
      } else if (Array.isArray(data.results)) {
        liste = data.results;
      }

      setCatalogues(liste);

    } catch (error) {
      console.error(
        "Erreur lors du chargement des catalogues :",
        error
      );

      setErreur(
        error.response?.data?.detail ||
        "Impossible de charger les catalogues."
      );

    } finally {
      setChargement(false);
    }
  };

  const ouvrirCreation = () => {
    setNouveauNom("");
    setCreation(true);
  };

  const fermerCreation = () => {
    setCreation(false);
    setNouveauNom("");
  };

  const creerCatalogue = async (event) => {
    event.preventDefault();

    if (!nouveauNom.trim()) {
      alert("Le nom du catalogue est obligatoire.");
      return;
    }

    try {
      await api.post(
        "/catalogue/catalogues/",
        {
          nom: nouveauNom.trim(),
        }
      );

      fermerCreation();
      await chargerCatalogues();

    } catch (error) {
      console.error(
        "Erreur lors de la création du catalogue :",
        error
      );

      const donneesErreur = error.response?.data;

      if (donneesErreur) {
        const messages = Object.entries(donneesErreur)
          .map(([champ, message]) => {
            if (Array.isArray(message)) {
              return `${champ} : ${message.join(" ")}`;
            }

            return `${champ} : ${message}`;
          })
          .join("\n");

        alert(
          messages ||
          "Impossible de créer le catalogue."
        );
      } else {
        alert("Impossible de créer le catalogue.");
      }
    }
  };

  const ouvrirModification = (catalogue) => {
    setCatalogueSelectionne(catalogue);
    setNouveauNom(catalogue.nom);
    setModification(true);
  };

  const fermerModification = () => {
    setModification(false);
    setCatalogueSelectionne(null);
    setNouveauNom("");
  };

  const modifierCatalogue = async (event) => {
    event.preventDefault();

    if (!catalogueSelectionne) {
      return;
    }

    if (!nouveauNom.trim()) {
      alert("Le nom du catalogue est obligatoire.");
      return;
    }

    try {
      await api.patch(
        `/catalogue/catalogues/${catalogueSelectionne.idCatalogue}/`,
        {
          nom: nouveauNom.trim(),
        }
      );

      fermerModification();
      await chargerCatalogues();

    } catch (error) {
      console.error(
        "Erreur lors de la modification du catalogue :",
        error
      );

      const donneesErreur = error.response?.data;

      if (donneesErreur) {
        const messages = Object.entries(donneesErreur)
          .map(([champ, message]) => {
            if (Array.isArray(message)) {
              return `${champ} : ${message.join(" ")}`;
            }

            return `${champ} : ${message}`;
          })
          .join("\n");

        alert(
          messages ||
          "Impossible de modifier le catalogue."
        );
      } else {
        alert("Impossible de modifier le catalogue.");
      }
    }
  };

  const chargerProduitsCatalogue = async (catalogue) => {
    try {
      const response = await api.get(
        "/catalogue/produits/",
        {
          params: {
            catalogue: catalogue.idCatalogue,
          },
        }
      );

      const data = response.data;

      if (Array.isArray(data)) {
        setProduitsCatalogue(data);
      } else if (Array.isArray(data.results)) {
        setProduitsCatalogue(data.results);
      } else {
        setProduitsCatalogue([]);
      }

    } catch (error) {
      console.error(
        "Erreur lors du chargement des produits du catalogue :",
        error
      );

      setProduitsCatalogue([]);
    }
  };

  const afficherProduits = async (catalogue) => {
    setCatalogueSelectionne(catalogue);
    setProduitsCatalogue([]);

    await chargerProduitsCatalogue(catalogue);
  };

  const fermerProduits = () => {
    setCatalogueSelectionne(null);
    setProduitsCatalogue([]);
  };

  const supprimerCatalogue = async (catalogue) => {
    if (catalogue.nombre_produits > 0) {
      alert(
        `Impossible de supprimer "${catalogue.nom}".\n\n` +
        `Ce catalogue contient ${catalogue.nombre_produits} produit(s). ` +
        `Veuillez d'abord déplacer ou supprimer ces produits.`
      );

      return;
    }

    const confirmation = window.confirm(
      `Voulez-vous vraiment supprimer le catalogue "${catalogue.nom}" ?\n\n` +
      `Cette action est irréversible.`
    );

    if (!confirmation) {
      return;
    }

    try {
      await api.delete(
        `/catalogue/catalogues/${catalogue.idCatalogue}/`
      );

      await chargerCatalogues();

    } catch (error) {
      console.error(
        "Erreur lors de la suppression du catalogue :",
        error
      );

      const message =
        error.response?.data?.detail ||
        error.response?.data?.error ||
        "Impossible de supprimer ce catalogue.";

      alert(message);
    }
  };

  const cataloguesFiltres = catalogues.filter((catalogue) =>
    catalogue.nom
      ?.toLowerCase()
      .includes(recherche.toLowerCase().trim())
  );

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
            📚
          </span>

          <p className="text-blue-700 text-sm font-semibold uppercase tracking-wide">
            Espace Administration
          </p>

        </div>

        <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
          Gestion des catalogues
        </h1>

        <p className="text-slate-500 mt-1">
          Organisez les produits médicaux par catalogue.
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

        {/* =================================================
            RECHERCHE
        ================================================== */}
        <section className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 mb-6">

          <div className="flex flex-col md:flex-row
            md:items-end gap-4">

            <div className="flex-1">

              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
  Rechercher un catalogue
</label>

              <input
                type="text"
                value={recherche}
                onChange={(event) =>
                  setRecherche(event.target.value)
                }
                placeholder="Nom du catalogue..."
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

            <button
  onClick={() => setRecherche("")}
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
  Réinitialiser
</button>

          </div>

        </section>

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
            LISTE
        ================================================== */}
        <section className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">

          <div className="px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-white to-slate-50 flex items-center justify-between">

            <div>

              <h2 className="text-lg font-bold text-slate-900">
  Catalogues
</h2>

              <p className="text-sm text-slate-500 mt-1">
                {chargement
                  ? "Chargement..."
                  : `${cataloguesFiltres.length} catalogue(s)`
                }
              </p>

            </div>

            <div className="flex items-center gap-2">

              <button
  onClick={ouvrirCreation}
  className="
    inline-flex
    items-center
    gap-2
    px-4
    py-2.5
    rounded-xl
    bg-blue-600
    text-white
    text-sm
    font-semibold
    shadow-sm
    hover:bg-blue-700
    hover:shadow-md
    transition-all
  "
>
  + Ajouter un catalogue
</button>

              <button
  onClick={chargerCatalogues}
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

          </div>

          {chargement ? (

            <div className="py-16 text-center text-gray-500">
              Chargement des catalogues...
            </div>

          ) : cataloguesFiltres.length === 0 ? (

            <div className="py-16 text-center">

              <div className="text-5xl mb-4">
                📚
              </div>

              <h3 className="text-lg font-semibold text-gray-900">
                Aucun catalogue trouvé
              </h3>

              <p className="text-gray-500 mt-2">
                Aucun catalogue ne correspond à votre recherche.
              </p>

            </div>

          ) : (

            <div className="overflow-x-auto">

              <table className="w-full">

                <thead className="bg-slate-50/80 border-b border-slate-200">

                  <tr>

                    <th className="
  text-left
  px-6
  py-4
  text-xs
  font-bold
  text-slate-500
  uppercase
  tracking-wider
">
                      Catalogue
                    </th>

                    <th className="
  text-left
  px-6
  py-4
  text-xs
  font-bold
  text-slate-500
  uppercase
  tracking-wider
">
                      Produits
                    </th>

                    <th className="
  text-right
  px-6
  py-4
  text-xs
  font-bold
  text-slate-500
  uppercase
  tracking-wider
">
                      Actions
                    </th>

                  </tr>

                </thead>

                <tbody className="divide-y divide-slate-100">

                  {cataloguesFiltres.map((catalogue) => (

                    <tr
                      key={catalogue.idCatalogue}
                      className="hover:bg-blue-50/50 transition-colors duration-200"
                    >

                      {/* NOM */}
                      <td className="px-6 py-5">

                        <div className="flex items-center gap-4">

                          <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-2xl">
  📚
</div>

                          <div>

                            <p className="font-semibold text-slate-900">
                              {catalogue.nom}
                            </p>

                            <p className="text-xs text-slate-500 mt-1">
                              ID #{catalogue.idCatalogue}
                            </p>

                          </div>

                        </div>

                      </td>

                      {/* NOMBRE DE PRODUITS */}
                      <td className="px-6 py-5">

                        <button
                          onClick={() =>
                            afficherProduits(catalogue)
                          }
                          className="
  inline-flex
  items-center
  gap-2
  px-3
  py-1.5
  rounded-full
  bg-blue-50
  text-blue-700
  border
  border-blue-100
  text-sm
  font-semibold
  hover:bg-blue-100
  transition-all
"
                        >
                          📦 {catalogue.nombre_produits || 0}
                          {catalogue.nombre_produits === 1
                            ? " produit"
                            : " produits"
                          }
                        </button>

                      </td>

                      {/* ACTIONS */}
                      <td className="px-6 py-5">

                        <div className="flex justify-end gap-2">

                          <button
                            onClick={() =>
                              afficherProduits(catalogue)
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
  text-slate-600
  bg-slate-50
  border
  border-slate-200
  hover:bg-blue-50
  hover:text-blue-700
  hover:border-blue-200
  transition-all
"
                          >
                            👁️ Voir
                          </button>

                          <button
                            onClick={() =>
                              ouvrirModification(catalogue)
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
                            ✏️ Modifier
                          </button>

                          <button
                            onClick={() =>
                              supprimerCatalogue(catalogue)
                            }
                            className="
  inline-flex
  items-center
  justify-center
  px-3
  py-2
  rounded-xl
  text-sm
  font-semibold
  text-red-600
  bg-red-50
  border
  border-red-100
  hover:bg-red-100
  hover:border-red-200
  transition-all
"
                          >
                            🗑️
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
          MODALE CRÉATION
      ====================================================== */}
      {creation && (

        <div className="
  fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-50
  flex items-center justify-center p-4
">

          <div className="
  bg-white rounded-2xl shadow-2xl
  w-full max-w-lg overflow-hidden
  border border-slate-200
">

            <div className="
  px-6 py-5 border-b border-slate-100
  bg-gradient-to-r from-[#eaf4ff] via-[#effaff] to-[#e9fbf7]
  flex items-center justify-between
">

              <div>

                <h2 className="text-xl font-bold text-slate-900">
                  Ajouter un catalogue
                </h2>

                <p className="text-sm text-slate-500 mt-1">
                  Créer une nouvelle catégorie de produits
                </p>

              </div>

              <button
                onClick={fermerCreation}
                className="
  w-9 h-9 rounded-xl flex items-center justify-center
  text-xl text-slate-400 bg-white/70 border border-white
  hover:bg-white hover:text-slate-700 transition-all
"
              >
                ×
              </button>

            </div>

            <form
              onSubmit={creerCatalogue}
              className="p-6"
            >

              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                Nom du catalogue
              </label>

              <input
                type="text"
                value={nouveauNom}
                onChange={(event) =>
                  setNouveauNom(event.target.value)
                }
                placeholder="Ex. Dispositifs de diagnostic"
                required
                maxLength={150}
                autoFocus
                className="
  w-full border border-slate-200 rounded-xl
  px-4 py-3 text-sm text-slate-800 bg-slate-50
  outline-none focus:bg-white focus:border-blue-400
  focus:ring-4 focus:ring-blue-100 transition-all
"
              />

              <div className="flex justify-end gap-3 mt-6">

                <button
                  type="button"
                  onClick={fermerCreation}
                  className="
  px-5 py-2.5 bg-slate-100 text-slate-700 rounded-xl
  font-semibold border border-slate-200
  hover:bg-slate-200 transition-all
"
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  className="
  px-5 py-2.5 bg-blue-600 text-white rounded-xl
  font-semibold shadow-sm hover:bg-blue-700
  hover:shadow-md transition-all
"
                >
                  Créer
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

      {/* =====================================================
          MODALE MODIFICATION
      ====================================================== */}
      {modification && catalogueSelectionne && (

        <div className="
  fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-50
  flex items-center justify-center p-4
">

          <div className="
  bg-white rounded-2xl shadow-2xl
  w-full max-w-lg overflow-hidden
  border border-slate-200
">

            <div className="
  px-6 py-5 border-b border-slate-100
  bg-gradient-to-r from-[#eaf4ff] via-[#effaff] to-[#e9fbf7]
  flex items-center justify-between
">

              <div>

                <h2 className="text-xl font-bold text-slate-900">
                  Modifier le catalogue
                </h2>

                <p className="text-sm text-slate-500 mt-1">
                  Modifier le nom du catalogue
                </p>

              </div>

              <button
                onClick={fermerModification}
                className="
  w-9 h-9 rounded-xl flex items-center justify-center
  text-xl text-slate-400 bg-white/70 border border-white
  hover:bg-white hover:text-slate-700 transition-all
"
              >
                ×
              </button>

            </div>

            <form
              onSubmit={modifierCatalogue}
              className="p-6"
            >

              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                Nom du catalogue
              </label>

              <input
                type="text"
                value={nouveauNom}
                onChange={(event) =>
                  setNouveauNom(event.target.value)
                }
                required
                maxLength={150}
                autoFocus
                className="
  w-full border border-slate-200 rounded-xl
  px-4 py-3 text-sm text-slate-800 bg-slate-50
  outline-none focus:bg-white focus:border-blue-400
  focus:ring-4 focus:ring-blue-100 transition-all
"
              />

              <div className="mt-4 bg-blue-50 border border-blue-100 rounded-xl p-4">

                <p className="text-sm text-blue-800">
                  📦 Ce catalogue contient actuellement{" "}
                  <strong>
                    {catalogueSelectionne.nombre_produits || 0}
                  </strong>{" "}
                  produit(s).
                </p>

              </div>

              <div className="flex justify-end gap-3 mt-6">

                <button
                  type="button"
                  onClick={fermerModification}
                  className="
  px-5 py-2.5 bg-slate-100 text-slate-700 rounded-xl
  font-semibold border border-slate-200
  hover:bg-slate-200 transition-all
"
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  className="
  px-5 py-2.5 bg-blue-600 text-white rounded-xl
  font-semibold shadow-sm hover:bg-blue-700
  hover:shadow-md transition-all
"
                >
                  Enregistrer
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

      {/* =====================================================
          MODALE PRODUITS DU CATALOGUE
      ====================================================== */}
      {catalogueSelectionne &&
        !modification &&
        !creation && (
          <div className="
  fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-50
  flex items-center justify-center p-4
">

            <div className="
  bg-white rounded-2xl shadow-2xl
  w-full max-w-3xl max-h-[85vh]
  overflow-hidden border border-slate-200
">

              <div className="
  px-6 py-5 border-b border-slate-100
  bg-gradient-to-r from-[#eaf4ff] via-[#effaff] to-[#e9fbf7]
  flex items-center justify-between
">

                <div>

                  <p className="text-xs text-blue-700 font-bold uppercase tracking-wider">
                    CATALOGUE
                  </p>

                  <h2 className="text-xl font-bold text-slate-900">
                    {catalogueSelectionne.nom}
                  </h2>

                </div>

                <button
                  onClick={fermerProduits}
                  className="
  w-9 h-9 rounded-xl flex items-center justify-center
  text-xl text-slate-400 bg-white/70 border border-white
  hover:bg-white hover:text-slate-700 transition-all
"
                >
                  ×
                </button>

              </div>

              <div className="p-6 overflow-y-auto max-h-[65vh]">

                {produitsCatalogue.length === 0 ? (

                  <div className="py-10 text-center">

                    <div className="text-4xl mb-3">
                      📦
                    </div>

                    <p className="py-10 text-center text-slate-500">
                      Aucun produit dans ce catalogue
                    </p>

                  </div>

                ) : (

                  <div className="space-y-3">

                    {produitsCatalogue.map((produit) => (

                      <div
                        key={produit.idProduit}
                        className="
  border border-slate-200 rounded-xl p-4
  flex flex-col sm:flex-row sm:items-center
  sm:justify-between gap-3
  hover:bg-blue-50/40 transition-colors
"
                      >

                        <div>

                          <p className="font-semibold text-slate-900">
                            {produit.nom}
                          </p>

                          <p className="text-sm text-slate-500 mt-1">
                            {produit.description || "Aucune description"}
                          </p>

                        </div>

                        <div className="text-right ml-4">

                          <p className="font-semibold text-slate-900">
                            {Number(produit.prix).toLocaleString("fr-FR")}
                            {" "}FCFA
                          </p>

                          <p className="text-sm text-slate-500 mt-1">
                            Stock : {produit.stock}
                          </p>

                        </div>

                      </div>

                    ))}

                  </div>

                )}

              </div>

              <div className="
  px-6 py-4 border-t border-slate-100
  bg-slate-50/50 flex justify-end
">

                <button
                  onClick={fermerProduits}
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