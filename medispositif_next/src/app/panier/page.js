"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useCart } from "../../context/CartContext";
import api from "../../services/api";

export default function PanierPage() {

  const router = useRouter();
  const [utilisateur, setUtilisateur] = useState(null);

  const {
    panier,
    modifierQuantite,
    supprimerDuPanier,
    viderPanier,
    nombreArticles,
    totalPanier,
  } = useCart();

  useEffect(() => {
  const utilisateurStocke = localStorage.getItem("utilisateur");

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
}, []);

  const [commandeEnCours, setCommandeEnCours] = useState(false);
  const [erreurCommande, setErreurCommande] = useState("");
  const [succesCommande, setSuccesCommande] = useState("");

  /*
   * Passer la commande
   */
  const passerCommande = async () => {
    setErreurCommande("");
    setSuccesCommande("");

    // Vérifier que le panier n'est pas vide
    if (panier.length === 0) {
      setErreurCommande("Votre panier est vide.");
      return;
    }

    // Vérifier que l'utilisateur est connecté
    const accessToken = localStorage.getItem("access_token");
    const utilisateurStocke = localStorage.getItem("utilisateur");

    if (!accessToken || !utilisateurStocke) {
      setErreurCommande(
        "Vous devez être connecté pour passer une commande."
      );

      setTimeout(() => {
        router.push("/connexion");
      }, 1500);

      return;
    }

    // Récupérer l'utilisateur connecté
    let utilisateur;

    try {
      utilisateur = JSON.parse(utilisateurStocke);
    } catch (error) {
      console.error(
        "Erreur lors de la récupération de l'utilisateur :",
        error
      );

      setErreurCommande(
        "Votre session est invalide. Veuillez vous reconnecter."
      );

      return;
    }

    /*
     * Le backend n'autorise pas l'Administrateur
     * à créer une commande.
     */
    const rolesAutorises = [
      "Client",
      "Vendeur",
      "ResponsableCommercial",
    ];

    if (!rolesAutorises.includes(utilisateur.role)) {
      setErreurCommande(
        "Votre rôle ne vous permet pas de passer une commande. Connectez-vous avec un compte Client."
      );

      return;
    }

    /*
     * Préparer les lignes pour Django.
     *
     * Le backend attend :
     *
     * {
     *   "lignes": [
     *     {
     *       "idProduit": 1,
     *       "quantite": 2,
     *       "prix_unitaire": 15000
     *     }
     *   ]
     * }
     */
    const lignes = panier.map((article) => ({
      idProduit: article.idProduit,
      quantite: Number(article.quantite),
      prix_unitaire: Number(article.prix),
    }));

    try {
      setCommandeEnCours(true);

      const response = await api.post(
  "/ventes/commandes/",
  {
    lignes: lignes,
  }
);

console.log("Commande créée :", response.data);

viderPanier();

setSuccesCommande(
  `Votre commande #${response.data.idCommande} a été créée avec succès.`
);

setTimeout(() => {
  router.push(
    `/paiements/${response.data.idCommande}`
  );
}, 1200);

    } catch (error) {
      console.error(
        "Erreur lors de la création de la commande :",
        error
      );

      /*
       * Gestion des erreurs venant de Django
       */
      if (error.response) {
        console.error(
          "Réponse Django :",
          error.response.data
        );

        if (error.response.status === 401) {
          setErreurCommande(
            "Votre session a expiré. Veuillez vous reconnecter."
          );
        } else if (error.response.status === 403) {
          setErreurCommande(
            "Vous n'avez pas l'autorisation de passer cette commande."
          );
        } else if (error.response.status === 400) {
          const data = error.response.data;

          if (data.detail) {
            setErreurCommande(data.detail);
          } else if (data.error) {
            setErreurCommande(data.error);
          } else if (data.lignes) {
            setErreurCommande(
              "Une ou plusieurs lignes de votre commande sont invalides. Vérifiez les quantités et le stock disponible."
            );
          } else {
            setErreurCommande(
              "Les informations de la commande sont invalides."
            );
          }
        } else {
          setErreurCommande(
            "Une erreur est survenue lors de la création de la commande."
          );
        }
      } else {
        setErreurCommande(
          "Impossible de contacter le serveur Django."
        );
      }
    } finally {
      setCommandeEnCours(false);
    }
  };

  return (
  <main className="min-h-screen bg-[#f4f8fc]">

    

    <div
      className={
        utilisateur?.role === "Client"
          ? "ml-64 min-h-screen"
          : "min-h-screen"
      }
    >

      {/* TITRE */}
      <section className="bg-gradient-to-r from-[#0b1730] via-[#1649b8] to-[#087f8c] text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-12">

          <p className="text-blue-200 mb-2">
            MediDispositif
          </p>

          <h2 className="text-4xl font-bold">
            Mon panier
          </h2>

          <p className="mt-3 text-blue-100">
            Vérifiez vos produits avant de passer votre commande.
          </p>

        </div>
      </section>

      {/* CONTENU */}
      <section className="max-w-7xl mx-auto px-6 py-10">

        {/* MESSAGE ERREUR */}
        {erreurCommande && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-xl p-5">
            <p className="font-medium">
              {erreurCommande}
            </p>
          </div>
        )}

        {/* MESSAGE SUCCÈS */}
        {succesCommande && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 rounded-xl p-5">
            <p className="font-medium">
              {succesCommande}
            </p>
          </div>
        )}

        {/* PANIER VIDE */}
        {panier.length === 0 ? (

          <div className="bg-white rounded-2xl border shadow-sm p-16 text-center">

            <div className="text-7xl mb-6">
              🛒
            </div>

            <h3 className="text-2xl font-bold text-gray-900">
              Votre panier est vide
            </h3>

            <p className="text-gray-500 mt-3">
              Découvrez nos dispositifs médicaux et ajoutez vos produits
              préférés au panier.
            </p>

            <Link
              href="/produits"
              className="inline-block mt-7 bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-7 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-cyan-600 transition"
            >
              Découvrir les produits
            </Link>

          </div>

        ) : (

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* ARTICLES */}
            <div className="lg:col-span-2 space-y-5">

              <div className="flex items-center justify-between">

                <div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    Vos articles
                  </h3>

                  <p className="text-gray-500 text-sm mt-1">
                    {nombreArticles} article
                    {nombreArticles > 1 ? "s" : ""}
                  </p>
                </div>

                <button
                  onClick={viderPanier}
                  disabled={commandeEnCours}
                  className="text-red-600 hover:text-red-700 text-sm font-medium disabled:text-gray-400"
                >
                  Vider le panier
                </button>

              </div>

              {panier.map((article) => {

                const sousTotal =
                  Number(article.prix) *
                  Number(article.quantite);

                return (

                  <article
                    key={article.idProduit}
                    className="bg-white rounded-xl border border-gray-200 shadow-sm p-5"
                  >

                    <div className="flex flex-col sm:flex-row gap-5">

                      {/* IMAGE */}
<div
  className="w-full sm:w-32 h-32 bg-gray-50
  rounded-lg flex items-center justify-center
  flex-shrink-0 overflow-hidden"
>
  {article.image ? (
    <img
      src={article.image}
      alt={article.nom}
      className="w-full h-full object-contain p-2"
    />
  ) : (
    <span className="text-5xl">
      🩺
    </span>
  )}
</div>

                      {/* INFORMATIONS */}
                      <div className="flex-1">

                        <p className="text-sm text-blue-600 font-medium">
                          {article.nom_catalogue}
                        </p>

                        <h4 className="text-xl font-bold text-gray-900 mt-1">
                          {article.nom}
                        </h4>

                        {article.description && (
                          <p className="text-gray-500 text-sm mt-2">
                            {article.description}
                          </p>
                        )}

                        <p className="text-blue-700 font-semibold mt-2">
                          {Number(article.prix).toLocaleString("fr-FR")} FCFA
                          {" "}par unité
                        </p>

                        {/* ACTIONS */}
                        <div
                          className="flex flex-wrap items-center
                          justify-between gap-4 mt-5"
                        >

                          {/* QUANTITÉ */}
                          <div
                            className="flex items-center border
                            border-gray-300 rounded-lg overflow-hidden"
                          >

                            <button
                              onClick={() =>
                                modifierQuantite(
                                  article.idProduit,
                                  article.quantite - 1
                                )
                              }
                              disabled={
                                article.quantite <= 1 ||
                                commandeEnCours
                              }
                              className="px-4 py-2 text-gray-700
                              hover:bg-gray-100
                              disabled:text-gray-300
                              disabled:cursor-not-allowed"
                            >
                              −
                            </button>

                            <span
                              className="px-5 py-2 font-semibold
                              text-gray-900 border-x border-gray-300"
                            >
                              {article.quantite}
                            </span>

                            <button
                              onClick={() =>
                                modifierQuantite(
                                  article.idProduit,
                                  article.quantite + 1
                                )
                              }
                              disabled={
                                article.quantite >=
                                  Number(article.stock) ||
                                commandeEnCours
                              }
                              className="px-4 py-2 text-gray-700
                              hover:bg-gray-100
                              disabled:text-gray-300
                              disabled:cursor-not-allowed"
                            >
                              +
                            </button>

                          </div>

                          {/* SOUS-TOTAL */}
                          <div className="text-right">

                            <p className="text-xl font-bold text-blue-700">
                              {sousTotal.toLocaleString("fr-FR")} FCFA
                            </p>

                            <button
                              onClick={() =>
                                supprimerDuPanier(
                                  article.idProduit
                                )
                              }
                              disabled={commandeEnCours}
                              className="text-red-500 hover:text-red-700 text-sm mt-1 disabled:text-gray-400"
                            >
                              Supprimer
                            </button>

                          </div>

                        </div>

                        {/* STOCK */}
                        <p className="text-xs text-gray-500 mt-3">
                          Stock disponible : {article.stock}
                        </p>

                      </div>

                    </div>

                  </article>
                );
              })}

            </div>

            {/* RÉSUMÉ */}
            <aside className="lg:col-span-1">

              <div
                className="bg-white rounded-xl border shadow-sm
                p-6 sticky top-6"
              >

                <h3 className="text-xl font-bold text-gray-900">
                  Résumé de la commande
                </h3>

                <div className="border-t border-gray-200 mt-5 pt-5">

                  <div className="flex justify-between text-gray-600">
                    <span>
                      Articles
                    </span>

                    <span>
                      {nombreArticles}
                    </span>
                  </div>

                  <div className="flex justify-between text-gray-600 mt-3">
                    <span>
                      Sous-total
                    </span>

                    <span>
                      {totalPanier.toLocaleString("fr-FR")} FCFA
                    </span>
                  </div>

                  <div className="flex justify-between text-gray-600 mt-3">
                    <span>
                      Livraison
                    </span>

                    <span>
                      À définir
                    </span>
                  </div>

                </div>

                {/* TOTAL */}
                <div className="border-t border-gray-200 mt-5 pt-5">

                  <div className="flex justify-between items-center">

                    <span className="text-lg font-semibold text-gray-900">
                      Total
                    </span>

                    <span className="text-2xl font-bold text-blue-700">
                      {totalPanier.toLocaleString("fr-FR")} FCFA
                    </span>

                  </div>

                </div>

                {/* PASSER LA COMMANDE */}
                <button
                  onClick={passerCommande}
                  disabled={commandeEnCours}
                  className="w-full mt-6 bg-gradient-to-r from-blue-600 to-cyan-500 text-white
py-4 rounded-lg font-semibold text-lg
hover:from-blue-700 hover:to-cyan-600 transition
disabled:bg-gray-400
disabled:cursor-not-allowed"
                >
                  {commandeEnCours
                    ? "Création de la commande..."
                    : "Passer la commande"}
                </button>

                {/* CONTINUER ACHATS */}
                <Link
                  href="/produits"
                  className="block text-center mt-4
                  text-blue-600 hover:text-blue-800 font-medium"
                >
                  ← Continuer mes achats
                </Link>

              </div>

            </aside>

          </div>

        )}

      </section>

      {/* FOOTER */}
      <footer className="bg-gray-900 text-gray-300 mt-10">

        <div className="max-w-7xl mx-auto px-6 py-8 text-center">

          <p className="font-semibold text-white">
            MediDispositif
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