"use client";

import { createContext, useContext, useEffect, useState } from "react";

const CartContext = createContext();

export function CartProvider({ children }) {
  const [panier, setPanier] = useState([]);

  // Charger le panier depuis le navigateur
  useEffect(() => {
    const panierSauvegarde = localStorage.getItem("medispositif_panier");

    if (panierSauvegarde) {
      try {
        setPanier(JSON.parse(panierSauvegarde));
      } catch (error) {
        console.error("Erreur lors du chargement du panier :", error);
        localStorage.removeItem("medispositif_panier");
      }
    }
  }, []);

  // Sauvegarder automatiquement le panier
  useEffect(() => {
    localStorage.setItem(
      "medispositif_panier",
      JSON.stringify(panier)
    );
  }, [panier]);

  // Ajouter un produit
  const ajouterAuPanier = (produit, quantite = 1) => {
    setPanier((panierActuel) => {
      const produitExiste = panierActuel.find(
        (item) => item.idProduit === produit.idProduit
      );

      if (produitExiste) {
        return panierActuel.map((item) =>
          item.idProduit === produit.idProduit
            ? {
                ...item,
                quantite: Math.min(
                  item.quantite + quantite,
                  produit.stock
                ),
              }
            : item
        );
      }

      return [
        ...panierActuel,
        {
          ...produit,
          quantite: Math.min(quantite, produit.stock),
        },
      ];
    });
  };

  // Modifier la quantité
  const modifierQuantite = (idProduit, nouvelleQuantite) => {
    if (nouvelleQuantite <= 0) {
      supprimerDuPanier(idProduit);
      return;
    }

    setPanier((panierActuel) =>
      panierActuel.map((item) =>
        item.idProduit === idProduit
          ? {
              ...item,
              quantite: Math.min(nouvelleQuantite, item.stock),
            }
          : item
      )
    );
  };

  // Supprimer un produit
  const supprimerDuPanier = (idProduit) => {
    setPanier((panierActuel) =>
      panierActuel.filter(
        (item) => item.idProduit !== idProduit
      )
    );
  };

  // Vider complètement le panier
  const viderPanier = () => {
    setPanier([]);
  };

  // Nombre total d'articles
  const nombreArticles = panier.reduce(
    (total, item) => total + item.quantite,
    0
  );

  // Montant total
  const totalPanier = panier.reduce(
    (total, item) =>
      total + Number(item.prix) * item.quantite,
    0
  );

  return (
    <CartContext.Provider
      value={{
        panier,
        ajouterAuPanier,
        modifierQuantite,
        supprimerDuPanier,
        viderPanier,
        nombreArticles,
        totalPanier,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(
      "useCart doit être utilisé à l'intérieur de CartProvider"
    );
  }

  return context;
}