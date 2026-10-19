"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

import api from "../../../services/api";
import { useCart } from "../../../context/CartContext";

export default function ProduitDetailPage() {
  const params = useParams();
  const id = params.id;

  const { ajouterAuPanier } = useCart();

  const [produit, setProduit] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");
  const [quantite, setQuantite] = useState(1);
  const [ajoutEffectue, setAjoutEffectue] = useState(false);
  const [utilisateur, setUtilisateur] = useState(null);

  // =========================================================
  // CHARGER LE PRODUIT
  // =========================================================
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

  const chargerProduit = async () => {
      try {
        setChargement(true);
        setErreur("");

        const response = await api.get(
          `/catalogue/produits/${id}/`
        );

        setProduit(response.data);
      } catch (error) {
        console.error(
          "Erreur lors du chargement du produit :",
          error
        );

        setErreur(
          "Impossible de charger les informations de ce produit."
        );
      } finally {
        setChargement(false);
      }
    };

    if (id) {
      chargerProduit();
    }
  }, [id]);

  const peutAcheter = utilisateur?.role === "Client";

  // =========================================================
  // CHARGEMENT
  // =========================================================
  if (chargement) {
  return (
    <main className="min-h-screen bg-[#f4f8fc]">


      <div
        className={
          utilisateur
            ? "ml-64 min-h-screen"
            : "min-h-screen"
        }
      >

        <section className="max-w-7xl mx-auto px-6 py-20 text-center">
          <p className="text-gray-600 text-lg">
            Chargement du produit...
          </p>
        </section>
                </div>

      </main>
    );
  }

  // =========================================================
  // ERREUR
  // =========================================================
  if (erreur || !produit) {
  return (
    <main className="min-h-screen bg-[#f4f8fc]">


      <div
        className={
          utilisateur
            ? "ml-64 min-h-screen"
            : "min-h-screen"
        }
      >

        <section className="max-w-7xl mx-auto px-6 py-20">

          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-6 text-center">
            {erreur || "Produit introuvable."}
          </div>

          <div className="text-center mt-6">
            <Link
              href="/produits"
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              ← Retour aux produits
            </Link>
          </div>

        </section>

              </div>

      </main>
    );
  }

  // =========================================================
  // INFORMATIONS PRODUIT
  // =========================================================

  const stockDisponible = Number(produit.stock) || 0;
  const prix = Number(produit.prix) || 0;

  const total = prix * quantite;

  // =========================================================
  // DIMINUER LA QUANTITÉ
  // =========================================================

  const diminuerQuantite = () => {
    setQuantite((ancienne) =>
      Math.max(1, ancienne - 1)
    );
  };

  // =========================================================
  // AUGMENTER LA QUANTITÉ
  // =========================================================

  const augmenterQuantite = () => {
    setQuantite((ancienne) =>
      Math.min(
        stockDisponible,
        ancienne + 1
      )
    );
  };

  // =========================================================
  // AJOUTER AU PANIER
  // =========================================================

  const handleAjouterAuPanier = () => {
    if (stockDisponible <= 0) {
      return;
    }

    ajouterAuPanier(
      {
        idProduit: produit.idProduit,
        nom: produit.nom,
        description: produit.description,
        prix: produit.prix,
        stock: produit.stock,
        nom_catalogue: produit.nom_catalogue,
        image: produit.image,
      },
      quantite
    );

    setAjoutEffectue(true);

    // Faire disparaître le message après quelques secondes
    setTimeout(() => {
      setAjoutEffectue(false);
    }, 3000);
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

      <section className="max-w-7xl mx-auto px-6 py-10">

        {/* RETOUR */}

        <Link
          href="/produits"
          className="inline-flex items-center text-blue-600
          hover:text-blue-800 font-medium mb-8"
        >
          ← Retour aux produits
        </Link>

        {/* ===================================================
            MESSAGE AJOUT AU PANIER
        =================================================== */}

        {ajoutEffectue && (
          <div className="mb-6 bg-green-50 border border-green-200
            text-green-700 rounded-xl p-4 flex items-center
            justify-between"
          >

            <div>
              <p className="font-semibold">
                Produit ajouté au panier !
              </p>

              <p className="text-sm mt-1">
                {produit.nom} × {quantite}
              </p>
            </div>

            <Link
              href="/panier"
              className="bg-green-600 text-white px-4 py-2
              rounded-lg font-medium hover:bg-green-700"
            >
              Voir le panier
            </Link>

          </div>
        )}

        {/* ===================================================
            PRODUIT
        =================================================== */}

        <div
          className="bg-white rounded-2xl border border-gray-200
          shadow-sm overflow-hidden"
        >

          <div className="grid grid-cols-1 lg:grid-cols-2">

            {/* =================================================
                IMAGE
            ================================================= */}

            <div
  className="bg-gray-50 min-h-[450px]
  flex items-center justify-center overflow-hidden"
>

  {produit.image ? (
    <img
      src={produit.image}
      alt={produit.nom}
      className="w-full h-full object-contain p-8"
    />
  ) : (
    <span className="text-9xl">
      🩺
    </span>
  )}

</div>

            {/* =================================================
                INFORMATIONS
            ================================================= */}

            <div className="p-8 lg:p-12">

              {/* CATALOGUE */}

              <span
                className="inline-block bg-blue-50 text-blue-700
                px-3 py-1 rounded-full text-sm font-medium mb-4"
              >
                {produit.nom_catalogue}
              </span>

              {/* NOM */}

              <h2 className="text-4xl font-bold text-gray-900">
                {produit.nom}
              </h2>

              {/* DESCRIPTION */}

              <p className="text-gray-600 text-lg leading-8 mt-5">
                {produit.description}
              </p>

              {/* PRIX */}

              <div className="mt-8">

                <p className="text-sm text-gray-500">
                  Prix
                </p>

                <p className="text-3xl font-bold text-blue-700 mt-1">
                  {prix.toLocaleString("fr-FR")} FCFA
                </p>

              </div>

              {/* =================================================
                  STOCK
              ================================================= */}

              <div className="mt-6">

                {stockDisponible > 0 ? (

                  <div className="flex items-center gap-2">

                    <span
                      className="w-3 h-3 rounded-full
                      bg-green-500"
                    ></span>

                    <span className="text-green-600 font-medium">
                      {stockDisponible} produit
                      {stockDisponible > 1 ? "s" : ""}
                      {" "}disponible
                      {stockDisponible > 1 ? "s" : ""}
                    </span>

                  </div>

                ) : (

                  <div className="flex items-center gap-2">

                    <span
                      className="w-3 h-3 rounded-full
                      bg-red-500"
                    ></span>

                    <span className="text-red-600 font-medium">
                      Produit en rupture de stock
                    </span>

                  </div>

                )}

              </div>

              {/* =================================================
                  ACHAT
              ================================================= */}

              {peutAcheter && stockDisponible > 0 && (

                <div className="mt-8 border-t pt-8">

                  <p className="text-sm font-medium text-gray-700 mb-3">
                    Quantité
                  </p>

                  {/* QUANTITÉ */}

                  <div
                    className="flex items-center border
                    border-gray-300 rounded-lg overflow-hidden
                    w-fit"
                  >

                    <button
                      onClick={diminuerQuantite}
                      disabled={quantite <= 1}
                      className="px-5 py-3 text-gray-700
                      hover:bg-gray-100
                      disabled:text-gray-300
                      disabled:cursor-not-allowed"
                    >
                      −
                    </button>

                    <span
                      className="px-7 py-3 font-semibold
                      text-gray-900 border-x border-gray-300"
                    >
                      {quantite}
                    </span>

                    <button
                      onClick={augmenterQuantite}
                      disabled={
                        quantite >= stockDisponible
                      }
                      className="px-5 py-3 text-gray-700
                      hover:bg-gray-100
                      disabled:text-gray-300
                      disabled:cursor-not-allowed"
                    >
                      +
                    </button>

                  </div>

                  {/* TOTAL */}

                  <div
                    className="flex items-center justify-between
                    mt-6 bg-gray-50 rounded-lg p-4"
                  >

                    <span className="text-gray-600">
                      Total
                    </span>

                    <span className="text-xl font-bold text-gray-900">
                      {total.toLocaleString("fr-FR")} FCFA
                    </span>

                  </div>

                  {/* AJOUTER AU PANIER */}

                  <button
  onClick={handleAjouterAuPanier}
  className="w-full mt-6 bg-gradient-to-r from-blue-600 to-cyan-500
  text-white py-4 rounded-lg font-semibold text-lg
  hover:from-blue-700 hover:to-cyan-600
  transition shadow-sm"
>
  🛒 Ajouter au panier
</button>

                  {/* VOIR LE PANIER */}

                  <Link
                    href="/panier"
                    className="block text-center mt-4
text-blue-600 hover:text-cyan-600
font-medium transition"
                  >
                    Voir mon panier →
                  </Link>

                </div>

              )}

              {/* =================================================
                  RUPTURE
              ================================================= */}

              {stockDisponible === 0 && (

                <button
                  disabled
                  className="w-full mt-8 bg-gray-300
                  text-gray-500 py-4 rounded-lg
                  font-semibold cursor-not-allowed"
                >
                  Produit indisponible
                </button>

              )}

            </div>

          </div>

        </div>

      </section>

      {/* =====================================================
          FOOTER
      ===================================================== */}

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