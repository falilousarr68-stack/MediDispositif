"use client";

import { useEffect, useState } from "react";
import api from "../../../services/api";

export default function ProduitsAdministrationPage() {
  const [produits, setProduits] = useState([]);
  const [catalogues, setCatalogues] = useState([]);

  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");

  const [utilisateur, setUtilisateur] = useState(null);
  const [dateActuelle, setDateActuelle] = useState(null);

  const [recherche, setRecherche] = useState("");
  const [catalogueFiltre, setCatalogueFiltre] = useState("");

  const [creation, setCreation] = useState(false);
  const [modification, setModification] = useState(false);

  const [produitSelectionne, setProduitSelectionne] = useState(null);

  const [nouveauProduit, setNouveauProduit] = useState({
    idCatalogue: "",
    nom: "",
    description: "",
    prix: "",
    image: null,
  });

  
useEffect(() => {
  verifierAdministrateur();

  setDateActuelle(new Date());

  const intervalle = setInterval(() => {
    setDateActuelle(new Date());
  }, 1000);

  return () => clearInterval(intervalle);
}, []);


  const verifierAdministrateur = () => {
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
      chargerProduits(),
      chargerCatalogues(),
    ]);
  };

  const chargerProduits = async () => {
    try {
      setChargement(true);
      setErreur("");

      const params = {};

      if (recherche.trim()) {
        params.nom = recherche.trim();
      }

      if (catalogueFiltre) {
        params.catalogue = catalogueFiltre;
      }

      const response = await api.get(
        "/catalogue/produits/",
        { params }
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

      setErreur(
        error.response?.data?.detail ||
        "Impossible de charger les produits."
      );

    } finally {
      setChargement(false);
    }
  };

  const chargerCatalogues = async () => {
    try {
      const response = await api.get(
        "/catalogue/catalogues/"
      );

      const data = response.data;

      if (Array.isArray(data)) {
        setCatalogues(data);
      } else if (Array.isArray(data.results)) {
        setCatalogues(data.results);
      } else {
        setCatalogues([]);
      }

    } catch (error) {
      console.error(
        "Erreur lors du chargement des catalogues :",
        error
      );
    }
  };

  const rechercher = (event) => {
    event.preventDefault();
    chargerProduits();
  };

  const reinitialiserFiltres = () => {
    setRecherche("");
    setCatalogueFiltre("");

    setTimeout(() => {
      chargerProduits();
    }, 0);
  };

  const ouvrirCreation = () => {
    setNouveauProduit({
      idCatalogue:
        catalogues.length > 0
          ? catalogues[0].idCatalogue
          : "",
      nom: "",
      description: "",
      prix: "",
      image: null,
    });

    setCreation(true);
  };

  const fermerCreation = () => {
    setCreation(false);
  };

  const creerProduit = async (event) => {
    event.preventDefault();

    try {
      const formulaire = new FormData();

formulaire.append(
  "idCatalogue",
  nouveauProduit.idCatalogue
);

formulaire.append(
  "nom",
  nouveauProduit.nom
);

formulaire.append(
  "description",
  nouveauProduit.description
);

formulaire.append(
  "prix",
  nouveauProduit.prix
);

if (nouveauProduit.image) {
  formulaire.append(
    "image",
    nouveauProduit.image
  );
}

await api.post(
  "/catalogue/produits/",
  formulaire
);

      setCreation(false);

      setNouveauProduit({
        idCatalogue: "",
        nom: "",
        description: "",
        prix: "",
      });

      await chargerProduits();

    } catch (error) {
      console.error(
        "Erreur lors de la création du produit :",
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
          "Impossible de créer le produit."
        );
      } else {
        alert("Impossible de créer le produit.");
      }
    }
  };

  const ouvrirModification = (produit) => {
    setProduitSelectionne({
      ...produit,
      idCatalogue:
        produit.idCatalogue ||
        "",
      imageFichier: null,
    });

    setModification(true);
  };

  const fermerModification = () => {
    setModification(false);
    setProduitSelectionne(null);
  };

  const modifierProduit = async (event) => {
    event.preventDefault();

    if (!produitSelectionne) {
      return;
    }

    try {
      const formulaire = new FormData();

formulaire.append(
  "idCatalogue",
  produitSelectionne.idCatalogue
);

formulaire.append(
  "nom",
  produitSelectionne.nom
);

formulaire.append(
  "description",
  produitSelectionne.description
);

formulaire.append(
  "prix",
  produitSelectionne.prix
);

if (produitSelectionne.imageFichier) {
  formulaire.append(
    "image",
    produitSelectionne.imageFichier
  );
}

await api.patch(
  `/catalogue/produits/${produitSelectionne.idProduit}/`,
  formulaire
);

      fermerModification();

      await chargerProduits();

    } catch (error) {
      console.error(
        "Erreur lors de la modification du produit :",
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
          "Impossible de modifier le produit."
        );
      } else {
        alert("Impossible de modifier le produit.");
      }
    }
  };

  const supprimerProduit = async (produit) => {
    const confirmation = window.confirm(
      `Voulez-vous vraiment supprimer le produit "${produit.nom}" ?\n\nCette action est irréversible.`
    );

    if (!confirmation) {
      return;
    }

    try {
      await api.delete(
        `/catalogue/produits/${produit.idProduit}/`
      );

      await chargerProduits();

    } catch (error) {
      console.error(
        "Erreur lors de la suppression du produit :",
        error
      );

      const message =
        error.response?.data?.detail ||
        error.response?.data?.error ||
        "Impossible de supprimer ce produit.";

      alert(message);
    }
  };

  const obtenirCouleurStock = (stock) => {
    if (stock === 0) {
      return "bg-red-100 text-red-700";
    }

    if (stock <= 5) {
      return "bg-orange-100 text-orange-700";
    }

    return "bg-green-100 text-green-700";
  };

  const obtenirLibelleStock = (stock) => {
    if (stock === 0) {
      return "Rupture";
    }

    if (stock <= 5) {
      return "Stock faible";
    }

    return "Disponible";
  };

  return (
  <main className="min-h-screen bg-[#f4f8fc]">


    {/* CONTENU PRINCIPAL */}
    <div className="ml-64 min-h-screen bg-[#f4f8fc]">

      {/* =====================================================
          EN-TÊTE
      ====================================================== */}
      <section className="px-6 pt-6">

        <div
          className="
            relative overflow-hidden
            min-h-[190px]
            rounded-2xl
            bg-gradient-to-r
            from-[#e8f1ff]
            via-[#e8f8ff]
            to-[#e8fbf8]
            border border-blue-100
            shadow-sm
          "
        >

          {/* IMAGE MÉDICALE À DROITE */}
          {produits.length > 3 && produits[3]?.image && (
            <img
              src={produits[3].image}
              alt=""
              className="
                absolute
                right-0
                top-0
                h-full
                w-[42%]
                object-cover
                opacity-25
              "
            />
          )}

          {/* DÉGRADÉ PAR-DESSUS L'IMAGE */}
          <div
            className="
              absolute
              inset-0
              bg-gradient-to-r
              from-[#e8f1ff]
              via-[#e8f8ff]/90
              to-transparent
            "
          />

          <div
            className="
              relative z-10
              h-full
              min-h-[190px]
              flex
              items-center
              justify-between
              px-8
              py-7
              gap-6
            "
          >

            {/* TITRE */}
            <div>

              <p
                className="
                  text-blue-700
                  text-sm
                  font-bold
                  uppercase
                  tracking-wide
                  mb-2
                "
              >
                ESPACE ADMINISTRATION
              </p>

              <h1
                className="
                  text-3xl
                  md:text-4xl
                  font-bold
                  text-[#0b1730]
                "
              >
                Gestion des produits médicaux
              </h1>

              <p className="text-slate-600 mt-2">
                Gérez les dispositifs médicaux, leurs informations
                et leur catalogue.
              </p>

            </div>

            {/* DATE + HEURE */}
            <div
              className="
                hidden
                md:block
                min-w-[280px]
                bg-white/90
                backdrop-blur-sm
                border border-white
                rounded-2xl
                shadow-sm
                p-5
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

                  <p className="font-bold text-[#0b1730]">
                    {dateActuelle
  ? dateActuelle.toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  : "Chargement..."}
                  </p>

                </div>

              </div>

              <div className="border-t border-slate-200 my-3" />

              <div className="flex items-center gap-3">

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
                  🕒
                </div>

                <div>

                  <p className="text-xs text-slate-500">
                    Heure
                  </p>

                  <p className="font-bold text-[#0b1730]">
                    
{dateActuelle
  ? dateActuelle.toLocaleTimeString("fr-FR")
  : "--:--:--"}

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

        {/* ERREUR */}
        {erreur && (
          <div
            className="
              mb-6
              bg-red-50
              border border-red-200
              text-red-700
              px-4 py-3
              rounded-xl
            "
          >
            ⚠️ {erreur}
          </div>
        )}


        {/* =================================================
            RETOUR
        ================================================== */}
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
          className="
            mb-6
            text-blue-700
            hover:text-cyan-600
            text-sm
            font-semibold
            transition-colors
          "
        >
          ← Retour au tableau de bord
        </button>


        {/* =================================================
            FILTRES
        ================================================== */}
        <section
          className="
            bg-white
            border border-slate-200
            rounded-2xl
            shadow-sm
            p-6
            mb-6
          "
        >

          <div className="mb-5">

            <h2 className="text-xl font-bold text-[#0b1730]">
              Rechercher un produit
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              Filtrez les dispositifs médicaux selon leur nom ou leur catalogue.
            </p>

          </div>

          <form
            onSubmit={rechercher}
            className="
              grid
              grid-cols-1
              lg:grid-cols-[1fr_280px_auto]
              gap-4
              items-end
            "
          >

            {/* RECHERCHE */}
            <div>

              <label
                className="
                  block
                  text-sm
                  font-medium
                  text-[#0b1730]
                  mb-2
                "
              >
                Nom du produit
              </label>

              <input
                type="text"
                value={recherche}
                onChange={(event) =>
                  setRecherche(event.target.value)
                }
                placeholder="Rechercher un produit..."
                className="
                  w-full
                  border border-slate-300
                  rounded-xl
                  px-4 py-3
                  text-gray-900
                  bg-white
                  outline-none
                  focus:ring-2
                  focus:ring-cyan-400
                  focus:border-cyan-400
                  transition
                "
              />

            </div>


            {/* CATALOGUE */}
            <div>

              <label
                className="
                  block
                  text-sm
                  font-medium
                  text-[#0b1730]
                  mb-2
                "
              >
                Catalogue
              </label>

              <select
                value={catalogueFiltre}
                onChange={(event) =>
                  setCatalogueFiltre(event.target.value)
                }
                className="
                  w-full
                  border border-slate-300
                  rounded-xl
                  px-4 py-3
                  text-gray-900
                  bg-white
                  outline-none
                  focus:ring-2
                  focus:ring-cyan-400
                  focus:border-cyan-400
                  transition
                "
              >

                <option value="">
                  Tous les catalogues
                </option>

                {catalogues.map((catalogue) => (
                  <option
                    key={catalogue.idCatalogue}
                    value={catalogue.idCatalogue}
                  >
                    {catalogue.nom}
                  </option>
                ))}

              </select>

            </div>


            {/* BOUTONS */}
            <div className="flex gap-2">

              <button
                type="submit"
                className="
                  px-5 py-3
                  bg-gradient-to-r
                  from-blue-600
                  to-cyan-500
                  text-white
                  rounded-xl
                  font-semibold
                  shadow-sm
                  hover:shadow-md
                  hover:from-blue-700
                  hover:to-cyan-600
                  transition-all
                "
              >
                🔍 Rechercher
              </button>

              <button
                type="button"
                onClick={reinitialiserFiltres}
                className="
                  px-5 py-3
                  bg-slate-100
                  text-slate-700
                  rounded-xl
                  font-semibold
                  hover:bg-slate-200
                  transition
                "
              >
                Réinitialiser
              </button>

            </div>

          </form>

        </section>


        {/* =================================================
            TABLEAU
        ================================================== */}
        <section
          className="
            bg-white
            border border-slate-200
            rounded-2xl
            shadow-sm
            overflow-hidden
          "
        >

          {/* EN-TÊTE DU TABLEAU */}
          <div
            className="
              px-6 py-5
              border-b border-slate-200
              flex
              flex-col
              md:flex-row
              md:items-center
              md:justify-between
              gap-4
            "
          >

            <div>

              <h2 className="text-xl font-bold text-[#0b1730]">
                Produits médicaux
              </h2>

              <p className="text-sm text-slate-500 mt-1">
                {chargement
                  ? "Chargement..."
                  : `${produits.length} produit(s)`
                }
              </p>

            </div>


            <div className="flex items-center gap-2">

              <button
                onClick={ouvrirCreation}
                className="
                  px-5 py-2.5
                  bg-gradient-to-r
                  from-blue-600
                  to-cyan-500
                  text-white
                  rounded-xl
                  text-sm
                  font-semibold
                  shadow-sm
                  hover:shadow-md
                  hover:from-blue-700
                  hover:to-cyan-600
                  transition-all
                "
              >
                + Ajouter un produit
              </button>

              <button
                onClick={chargerDonnees}
                className="
                  px-4 py-2.5
                  bg-slate-100
                  border border-slate-200
                  rounded-xl
                  text-sm
                  font-medium
                  text-slate-700
                  hover:bg-cyan-50
                  hover:border-cyan-300
                  transition
                "
              >
                🔄 Actualiser
              </button>

            </div>

          </div>


          {chargement ? (

            <div className="py-16 text-center text-slate-500">
              Chargement des produits...
            </div>

          ) : produits.length === 0 ? (

            <div className="py-16 text-center">

              <div className="text-5xl mb-4">
                📦
              </div>

              <h3 className="text-lg font-semibold text-[#0b1730]">
                Aucun produit trouvé
              </h3>

              <p className="text-slate-500 mt-2">
                Aucun produit ne correspond aux critères.
              </p>

            </div>

          ) : (

            <div className="overflow-x-auto">

              <table className="w-full">

                <thead
                  className="
                    bg-slate-50
                    border-b border-slate-200
                  "
                >

                  <tr>

                    <th className="text-left px-6 py-4 text-xs font-bold text-[#0b1730] uppercase">
                      Produit
                    </th>

                    <th className="text-left px-6 py-4 text-xs font-bold text-[#0b1730] uppercase">
                      Catalogue
                    </th>

                    <th className="text-left px-6 py-4 text-xs font-bold text-[#0b1730] uppercase">
                      Prix
                    </th>

                    <th className="text-left px-6 py-4 text-xs font-bold text-[#0b1730] uppercase">
                      Stock
                    </th>

                    <th className="text-right px-6 py-4 text-xs font-bold text-[#0b1730] uppercase">
                      Actions
                    </th>

                  </tr>

                </thead>


                <tbody className="divide-y divide-slate-100">

                  {produits.map((produit) => (

                    <tr
                      key={produit.idProduit}
                      className="
                        hover:bg-cyan-50/40
                        transition-colors
                      "
                    >

                      {/* PRODUIT */}
                      <td className="px-6 py-4">

                        <div>

                          <p className="font-semibold text-[#0b1730]">
                            {produit.nom}
                          </p>

                          <p className="text-xs text-slate-500 mt-1">
                            ID #{produit.idProduit}
                          </p>

                          {produit.description && (
                            <p
                              className="
                                text-xs
                                text-slate-500
                                mt-1
                                max-w-md
                                truncate
                              "
                            >
                              {produit.description}
                            </p>
                          )}

                        </div>

                      </td>


                      {/* CATALOGUE */}
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {produit.nom_catalogue || "—"}
                      </td>


                      {/* PRIX */}
                      <td className="px-6 py-4">

                        <span className="font-bold text-blue-700">
                          {Number(produit.prix).toLocaleString("fr-FR")} FCFA
                        </span>

                      </td>


                      {/* STOCK */}
                      <td className="px-6 py-4">

                        <div className="flex flex-col items-start gap-1">

                          <span className="font-bold text-[#0b1730]">
                            {produit.stock}
                          </span>

                          <span
                            className={`
                              px-2.5 py-1
                              rounded-full
                              text-xs
                              font-semibold
                              ${obtenirCouleurStock(produit.stock)}
                            `}
                          >
                            {obtenirLibelleStock(produit.stock)}
                          </span>

                        </div>

                      </td>


                      {/* ACTIONS */}
                      <td className="px-6 py-4">

                        <div className="flex justify-end gap-2">

                          <button
                            onClick={() =>
                              ouvrirModification(produit)
                            }
                            className="
                              px-4 py-2
                              rounded-xl
                              text-sm
                              font-semibold
                              text-blue-700
                              bg-blue-50
                              hover:bg-cyan-50
                              hover:text-cyan-700
                              transition
                            "
                          >
                            ✏️ Modifier
                          </button>

                          <button
                            onClick={() =>
                              supprimerProduit(produit)
                            }
                            className="
                              px-3 py-2
                              rounded-xl
                              text-sm
                              font-semibold
                              text-red-600
                              bg-red-50
                              hover:bg-red-100
                              transition
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
          CONSERVE TON CODE ACTUEL
      ====================================================== */}

      {creation && (

        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">

          {/* GARDE ICI EXACTEMENT TON CONTENU ACTUEL
              DE LA MODALE CRÉATION */}

          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">

            <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between">

              <div>

                <h2 className="text-xl font-bold text-[#0b1730]">
                  Ajouter un produit
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  Ajouter un dispositif médical au catalogue
                </p>

              </div>

              <button
                onClick={fermerCreation}
                className="text-gray-400 hover:text-gray-700 text-2xl"
              >
                ×
              </button>

            </div>

            <form
              onSubmit={creerProduit}
              className="p-6 space-y-5 overflow-y-auto"
            >

              {/* CATALOGUE */}
              <div>

                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Catalogue
                </label>

                <select
                  value={nouveauProduit.idCatalogue}
                  onChange={(event) =>
                    setNouveauProduit({
                      ...nouveauProduit,
                      idCatalogue: event.target.value,
                    })
                  }
                  required
                  className="
                    w-full
                    border border-gray-300
                    rounded-xl
                    px-4 py-2.5
                    text-gray-900
                    bg-white
                    outline-none
                    focus:ring-2
                    focus:ring-cyan-400
                    focus:border-cyan-400
                  "
                >

                  <option value="">
                    Sélectionner un catalogue
                  </option>

                  {catalogues.map((catalogue) => (
                    <option
                      key={catalogue.idCatalogue}
                      value={catalogue.idCatalogue}
                    >
                      {catalogue.nom}
                    </option>
                  ))}

                </select>

              </div>


              {/* NOM */}
              <div>

                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom du produit
                </label>

                <input
                  type="text"
                  value={nouveauProduit.nom}
                  onChange={(event) =>
                    setNouveauProduit({
                      ...nouveauProduit,
                      nom: event.target.value,
                    })
                  }
                  required
                  className="
                    w-full
                    border border-gray-300
                    rounded-xl
                    px-4 py-2.5
                    text-gray-900
                    outline-none
                    focus:ring-2
                    focus:ring-cyan-400
                    focus:border-cyan-400
                  "
                />

              </div>


              {/* DESCRIPTION */}
              <div>

                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>

                <textarea
                  value={nouveauProduit.description}
                  onChange={(event) =>
                    setNouveauProduit({
                      ...nouveauProduit,
                      description: event.target.value,
                    })
                  }
                  rows={4}
                  className="
                    w-full
                    border border-gray-300
                    rounded-xl
                    px-4 py-2.5
                    text-gray-900
                    outline-none
                    focus:ring-2
                    focus:ring-cyan-400
                    focus:border-cyan-400
                  "
                />

              </div>


              {/* PHOTO */}
              <div>

                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Photo du produit
                </label>

                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) =>
                    setNouveauProduit({
                      ...nouveauProduit,
                      image: event.target.files?.[0] || null,
                    })
                  }
                  className="
                    w-full
                    border border-gray-300
                    rounded-xl
                    px-4 py-2.5
                    text-gray-900
                    bg-white
                    outline-none
                    focus:ring-2
                    focus:ring-cyan-400
                  "
                />

                <p className="text-xs text-gray-500 mt-2">
                  Formats acceptés : JPG, JPEG, PNG, WEBP.
                </p>

              </div>


              {/* PRIX */}
              <div>

                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prix de vente (FCFA)
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={nouveauProduit.prix}
                  onChange={(event) =>
                    setNouveauProduit({
                      ...nouveauProduit,
                      prix: event.target.value,
                    })
                  }
                  required
                  className="
                    w-full
                    border border-gray-300
                    rounded-xl
                    px-4 py-2.5
                    text-gray-900
                    outline-none
                    focus:ring-2
                    focus:ring-cyan-400
                    focus:border-cyan-400
                  "
                />

              </div>


              {/* INFORMATION STOCK */}
              <div
                className="
                  bg-gradient-to-r
                  from-blue-50
                  to-cyan-50
                  border border-cyan-100
                  rounded-xl
                  p-4
                "
              >

                <p className="text-sm font-semibold text-[#0b1730]">
                  📦 Gestion du stock
                </p>

                <p className="text-sm text-slate-600 mt-1">
                  Le stock initial sera de 0. Il sera augmenté
                  lors de l'enregistrement d'un approvisionnement.
                </p>

              </div>


              {/* BOUTONS */}
              <div className="flex justify-end gap-3 pt-3">

                <button
                  type="button"
                  onClick={fermerCreation}
                  className="
                    px-5 py-2.5
                    bg-slate-100
                    text-slate-700
                    rounded-xl
                    font-medium
                    hover:bg-slate-200
                    transition
                  "
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  className="
                    px-5 py-2.5
                    bg-gradient-to-r
                    from-blue-600
                    to-cyan-500
                    text-white
                    rounded-xl
                    font-semibold
                    shadow-sm
                    hover:shadow-md
                    transition
                  "
                >
                  Créer le produit
                </button>

              </div>

            </form>

          </div>

        </div>

      )}


      {/* =====================================================
          MODALE MODIFICATION
          GARDE TON CODE ACTUEL
      ====================================================== */}

      {modification && produitSelectionne && (

        
<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-sm p-4">
  <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
    <div className="px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-[#eaf4ff] via-[#effaff] to-[#e9fbf7] flex items-center justify-between">
      <div>
        <h2 className="text-xl font-bold text-slate-900">
          Modifier le produit
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Modifiez les informations du dispositif médical.
        </p>
      </div>

      <button
        type="button"
        onClick={fermerModification}
        className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-slate-500 hover:bg-slate-100 transition"
      >
        ×
      </button>
    </div>

    <form
      onSubmit={modifierProduit}
      className="p-6 space-y-5 overflow-y-auto"
    >
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          Catalogue
        </label>
        <select
          value={produitSelectionne.idCatalogue}
          onChange={(event) =>
            setProduitSelectionne({
              ...produitSelectionne,
              idCatalogue: event.target.value,
            })
          }
          required
          className="w-full border border-slate-300 rounded-xl px-4 py-3 text-slate-900 bg-white focus:ring-2 focus:ring-blue-400 outline-none"
        >
          <option value="">Sélectionner un catalogue</option>
          {catalogues.map((catalogue) => (
            <option
              key={catalogue.idCatalogue}
              value={catalogue.idCatalogue}
            >
              {catalogue.nom}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          Nom du produit
        </label>
        <input
          type="text"
          value={produitSelectionne.nom || ""}
          onChange={(event) =>
            setProduitSelectionne({
              ...produitSelectionne,
              nom: event.target.value,
            })
          }
          required
          className="w-full border border-slate-300 rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-blue-400 outline-none"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          Description
        </label>
        <textarea
          value={produitSelectionne.description || ""}
          onChange={(event) =>
            setProduitSelectionne({
              ...produitSelectionne,
              description: event.target.value,
            })
          }
          rows={4}
          className="w-full border border-slate-300 rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-blue-400 outline-none"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          Photo du produit
        </label>

        {produitSelectionne.image && (
          <div className="mb-3">
            <p className="text-xs text-slate-500 mb-2">
              Photo actuelle
            </p>
            <img
              src={produitSelectionne.image}
              alt={produitSelectionne.nom || "Produit médical"}
              className="w-28 h-28 object-cover rounded-xl border border-slate-200"
            />
          </div>
        )}

        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(event) =>
            setProduitSelectionne({
              ...produitSelectionne,
              imageFichier: event.target.files?.[0] || null,
            })
          }
          className="w-full border border-slate-300 rounded-xl px-4 py-3 text-slate-900 bg-white"
        />

        <p className="text-xs text-slate-500 mt-2">
          Choisissez une nouvelle image uniquement si vous souhaitez remplacer la photo actuelle.
        </p>
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          Prix de vente (FCFA)
        </label>
        <input
          type="number"
          min="0"
          step="0.01"
          value={produitSelectionne.prix ?? ""}
          onChange={(event) =>
            setProduitSelectionne({
              ...produitSelectionne,
              prix: event.target.value,
            })
          }
          required
          className="w-full border border-slate-300 rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-blue-400 outline-none"
        />
      </div>

      <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
        <button
          type="button"
          onClick={fermerModification}
          className="px-5 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-semibold border border-slate-200 hover:bg-slate-200 transition"
        >
          Annuler
        </button>

        <button
          type="submit"
          className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl font-semibold shadow-sm hover:shadow-md transition"
        >
          Enregistrer les modifications
        </button>
      </div>
    </form>
  </div>
</div>


      )}

    </div>

  </main>
);
}