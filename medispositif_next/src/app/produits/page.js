"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "../../services/api";
import { useCart } from "../../context/CartContext";


export default function ProduitsPage() {
  const [produits, setProduits] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");
  const [utilisateur, setUtilisateur] = useState(null);

  const [recherche, setRecherche] = useState("");
  const [catalogue, setCatalogue] = useState("");
  const [prixMin, setPrixMin] = useState("");
  const [prixMax, setPrixMax] = useState("");
  const { ajouterAuPanier } = useCart();

  // Charger les produits
  const chargerProduits = async () => {
    try {
      setChargement(true);
      setErreur("");

      const params = {};

      // Recherche par nom
      if (recherche.trim()) {
        params.nom = recherche.trim();
      }

      // IMPORTANT :
      // On ne transmet PAS "catalogue" à Django.
      // Le filtre catalogue sera effectué côté frontend,
      // car le backend actuel peut attendre un ID de catalogue.

      // Prix minimum
      if (prixMin) {
        params.prix_min = prixMin;
      }

      // Prix maximum
      if (prixMax) {
        params.prix_max = prixMax;
      }

      const response = await api.get("/catalogue/produits/", {
        params,
      });

      let produitsFiltres = response.data;
      console.log("PRODUITS RECUS :", produitsFiltres);

      // Filtrage du catalogue côté frontend
      if (catalogue) {
        produitsFiltres = produitsFiltres.filter(
          (produit) => produit.nom_catalogue === catalogue
        );
      }

      setProduits(produitsFiltres);
    } catch (error) {
      console.error("Erreur API :", error);

      setErreur(
        "Impossible de charger les produits. Vérifiez que le serveur Django fonctionne."
      );
    } finally {
      setChargement(false);
    }
  };

  // Chargement initial
  useEffect(() => {
  const utilisateurStocke =
    localStorage.getItem("utilisateur");

  if (utilisateurStocke) {
    try {
      setUtilisateur(JSON.parse(utilisateurStocke));
    } catch (error) {
      console.error(
        "Impossible de récupérer les informations utilisateur",
        error
      );
    }
  }

  chargerProduits();
}, []);

const peutAcheter = utilisateur?.role === "Client";

  // Récupérer les noms de catalogues
  const catalogues = [
    ...new Set(
      produits
        .map((produit) => produit.nom_catalogue)
        .filter(Boolean)
    ),
  ];

  // Réinitialiser les filtres
  const reinitialiserFiltres = () => {
    setRecherche("");
    setCatalogue("");
    setPrixMin("");
    setPrixMax("");

    // Charger tous les produits
    setTimeout(() => {
      chargerProduits();
    }, 0);
  };

  return (
  <main className="min-h-screen bg-[#f4f8fc]">

    

{/* CONTENU PRINCIPAL */}
<div
  className={
    utilisateur
      ? "ml-64 min-h-screen"
      : "min-h-screen"
  }
>
  
{!utilisateur && (
  <div className="bg-white border-b border-slate-200 px-6 py-3">
    <div className="max-w-7xl mx-auto">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-blue-700 font-semibold hover:text-cyan-600 transition-colors"
      >
        <span aria-hidden="true">←</span>
        Retour à l’accueil
      </Link>
    </div>
  </div>
)}


      {/* HEADER */}
      

      {/* TITRE */}
      <section className="bg-gradient-to-r from-[#0b1730] via-[#123b78] to-[#087f8c] text-white shadow-lg">

        <div className="max-w-7xl mx-auto px-6 py-14">

          <p className="text-cyan-200 mb-2">
            MediDispositif
          </p>

          <h2 className="text-4xl font-bold">
            Nos dispositifs médicaux
          </h2>

          <p className="mt-3 text-blue-100 max-w-2xl">
            Trouvez facilement le dispositif médical dont vous avez besoin
            parmi nos produits disponibles.
          </p>

        </div>

      </section>

      {/* CONTENU */}
      <section className="max-w-7xl mx-auto px-6 py-10">

        {/* FILTRES */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-10">

          <h3 className="text-xl font-bold text-[#0b1730] mb-5">
            Rechercher un produit
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

            {/* RECHERCHE PAR NOM */}
            <div>

              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom du produit
              </label>

              <input
                type="text"
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
                placeholder="Ex : thermomètre"
                className="w-full border border-gray-300 rounded-lg px-4 py-3
                text-gray-900 placeholder-gray-400
                outline-none focus:ring-2 focus:ring-blue-500
                focus:border-blue-500"
              />

            </div>

            {/* CATALOGUE */}
            <div>

              <label className="block text-sm font-medium text-gray-700 mb-2">
                Catalogue
              </label>

              <select
                value={catalogue}
                onChange={(e) => setCatalogue(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3
                text-gray-900
                bg-white
                outline-none focus:ring-2 focus:ring-blue-500
                focus:border-blue-500"
              >

                <option value="" className="text-gray-900">
                  Tous les catalogues
                </option>

                {catalogues.map((nomCatalogue) => (
                  <option
                    key={nomCatalogue}
                    value={nomCatalogue}
                    className="text-gray-900"
                  >
                    {nomCatalogue}
                  </option>
                ))}

              </select>

            </div>

            {/* PRIX MINIMUM */}
            <div>

              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prix minimum
              </label>

              <input
                type="number"
                value={prixMin}
                onChange={(e) => setPrixMin(e.target.value)}
                placeholder="Ex : 5000"
                min="0"
                className="w-full border border-gray-300 rounded-lg px-4 py-3
                text-gray-900 placeholder-gray-400
                outline-none focus:ring-2 focus:ring-blue-500
                focus:border-blue-500"
              />

            </div>

            {/* PRIX MAXIMUM */}
            <div>

              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prix maximum
              </label>

              <input
                type="number"
                value={prixMax}
                onChange={(e) => setPrixMax(e.target.value)}
                placeholder="Ex : 50000"
                min="0"
                className="w-full border border-gray-300 rounded-lg px-4 py-3
                text-gray-900 placeholder-gray-400
                outline-none focus:ring-2 focus:ring-blue-500
                focus:border-blue-500"
              />

            </div>

          </div>

          {/* BOUTONS */}
          <div className="flex flex-wrap gap-3 mt-5">

            <button
              onClick={chargerProduits}
              className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white px-6 py-3 rounded-lg font-medium shadow-sm hover:shadow-md transition-all duration-200"
            >
              Rechercher
            </button>

            <button
              onClick={reinitialiserFiltres}
              className="bg-white border border-slate-300 text-slate-700 px-6 py-3 rounded-lg font-medium hover:bg-slate-50 hover:border-cyan-400 transition-all duration-200"
            >
              Réinitialiser
            </button>

          </div>

        </div>

        {/* RÉSULTATS */}
        <div className="flex items-center justify-between mb-6">

          <div>

            <h3 className="text-2xl font-bold text-[#0b1730]">
              Produits disponibles
            </h3>

            {!chargement && (
              <p className="text-slate-500 mt-1">
                {produits.length} produit
                {produits.length > 1 ? "s" : ""} trouvé
                {produits.length > 1 ? "s" : ""}
              </p>
            )}

          </div>

        </div>

        {/* CHARGEMENT */}
        {chargement && (
          <div className="bg-white rounded-xl border p-12 text-center">

            <p className="text-gray-600">
              Chargement des produits...
            </p>

          </div>
        )}

        {/* ERREUR */}
        {erreur && !chargement && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-5">
            {erreur}
          </div>
        )}

        {/* PRODUITS */}
        {!chargement && !erreur && produits.length > 0 && (

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

            {produits.map((produit) => (

              <article
                key={produit.idProduit}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
              >

                {/* IMAGE DU PRODUIT */}
<div className="h-52 bg-gradient-to-br from-slate-50 to-cyan-50 flex items-center justify-center overflow-hidden">

  {produit.image ? (
    <img
      src={produit.image}
      alt={produit.nom}
      className="w-full h-full object-contain p-4"
    />
  ) : (
    <span className="text-6xl">
      🩺
    </span>
  )}

</div>

                <div className="p-6">

                  {/* CATALOGUE */}
                  <span className="text-cyan-600 text-sm font-medium">
                    {produit.nom_catalogue}
                  </span>

                  {/* NOM */}
                  <h4 className="text-xl font-bold text-gray-900">
                    {produit.nom}
                  </h4>

                  {/* DESCRIPTION */}
                  <p className="text-gray-600 text-sm mt-2 min-h-[40px]">
                    {produit.description}
                  </p>

                  {/* PRIX + STOCK */}
                  <div className="flex items-center justify-between mt-5">

                    <span className="text-2xl font-bold text-blue-700">
                      {Number(produit.prix).toLocaleString("fr-FR")} FCFA
                    </span>

                    <span
                      className={
                        produit.stock > 0
                          ? "text-green-600 text-sm font-medium"
                          : "text-red-600 text-sm font-medium"
                      }
                    >
                      {produit.stock > 0
                        ? `${produit.stock} en stock`
                        : "Rupture"}
                    </span>

                  </div>

                  {/* BOUTONS */}
                  <div className="flex gap-3 mt-6">

  <Link
    href={`/produits/${produit.idProduit}`}
    className="flex-1 text-center border border-blue-600 text-blue-600 px-4 py-3 rounded-lg hover:bg-blue-50 transition"
  >
    Voir détails
  </Link>

  {peutAcheter && (
    <button
      onClick={() => ajouterAuPanier(produit)}
      className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-4 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-cyan-600 transition"
    >
      Ajouter au panier
    </button>
  )}

</div>

                </div>

              </article>

            ))}

          </div>

        )}

        {/* AUCUN RÉSULTAT */}
        {!chargement && !erreur && produits.length === 0 && (

          <div className="bg-white rounded-xl border p-12 text-center">

            <div className="text-5xl mb-4">
              🔎
            </div>

            <h3 className="text-xl font-semibold text-gray-900">
              Aucun produit trouvé
            </h3>

            <p className="text-gray-500 mt-2">
              Essayez de modifier vos critères de recherche.
            </p>

          </div>

        )}

      </section>

      {/* FOOTER */}
      <footer className="bg-gray-900 text-gray-300 mt-10">

        <div className="max-w-7xl mx-auto px-6 py-8 text-center">

          <p className="font-semibold text-white">
            Dispositif médical
          </p>

          <p className="text-sm mt-2">
            Vente de dispositifs médicaux en ligne
          </p>

          <p className="text-xs text-gray-500 mt-4">
            © 2026 MediDispositif. Tous droits réservés.
          </p>

        </div>

      </footer>
    </div>

    </main>
  );
}