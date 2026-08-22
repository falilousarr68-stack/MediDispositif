"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Product, CartItem } from "@/types";
import { toast } from "sonner";
import api from "@/lib/axios";

const buildImageUrl = (imageUrl: string | null | undefined): string | null => {
  if (!imageUrl) return null;
  if (imageUrl.startsWith("http")) return imageUrl;
  return `http://127.0.0.1:8000${imageUrl}`;
};

interface CartStore {
  items: CartItem[];
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  loadCartFromServer: () => Promise<void>;
  checkAuthentication: () => void;
  forceUpdate: () => void;
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      checkAuthentication: () => {
        const token = localStorage.getItem("access_token");
        if (token) {
          get().loadCartFromServer();
        } else {
          set({ items: [] }); // Vider le panier si pas de token
        }
      },

      forceUpdate: () => {
        const currentItems = get().items;
        set({ items: [...currentItems] });
      },

      loadCartFromServer: async () => {
        try {
          const token = localStorage.getItem("access_token");
          if (!token) {
            console.log("Pas de token, panier non chargé depuis le serveur");
            return;
          }

          console.log("Chargement du panier depuis le serveur...");
          const response = await api.get("api/ventes/panier/");
          console.log("Réponse panier du serveur:", response.data);

          if (
            response.data &&
            response.data.lignes &&
            response.data.lignes.length > 0
          ) {
            const cartItems = response.data.lignes.map((ligne: any) => ({
              product: {
                id: ligne.idProduit, // Utiliser idProduit comme ID principal
                idProduit: ligne.idProduit,
                nom: ligne.nom_produit,
                name: ligne.nom_produit,
                nom_catalogue: ligne.nom_catalogue,
                category: ligne.nom_catalogue,
                image: buildImageUrl(ligne.image),
                prix: ligne.prix_unitaire,
                price: ligne.prix_unitaire,
                stock: ligne.stock,
              },
              quantity: ligne.quantite,
            }));
            set({ items: cartItems });
            console.log("Panier chargé depuis le serveur:", cartItems);
            get().forceUpdate(); // Force le re-render
          } else {
            console.log(
              "Panier vide sur le serveur, conservation du panier local"
            );
            // Ne pas vider le panier local si le serveur renvoie vide
            // Cela permet de garder les articles ajoutés localement
          }
        } catch (error) {
          console.error("Erreur lors du chargement du panier:", error);
          console.log("Conservation du panier local en cas d'erreur");
          // Ne pas vider le panier local en cas d'erreur
        }
      },

      addItem: async (product: Product, quantity = 1) => {
        console.log("addItem appelé:", product, quantity);
        const token = localStorage.getItem("access_token");

        if (token) {
          // Utiliser l'API si l'utilisateur est connecté
          try {
            const productId = product.idProduit; // Utiliser uniquement idProduit
            console.log(
              "Tentative d'ajout via API avec endpoint:",
              "api/ventes/panier/ajouter/",
              "productId:",
              productId
            );
            const response = await api.post("api/ventes/panier/ajouter/", {
              idProduit: productId,
              quantite: quantity,
            });
            console.log("Réponse API:", response.data);

            if (response.data && response.data.lignes) {
              const cartItems = response.data.lignes.map((ligne: any) => ({
                product: {
                  id: ligne.idProduit, // Utiliser idProduit comme ID principal
                  idProduit: ligne.idProduit,
                  nom: ligne.nom_produit,
                  name: ligne.nom_produit,
                  nom_catalogue: ligne.nom_catalogue,
                  category: ligne.nom_catalogue,
                  image: buildImageUrl(ligne.image),
                  prix: ligne.prix_unitaire,
                  price: ligne.prix_unitaire,
                  stock: ligne.stock,
                },
                quantity: ligne.quantite,
              }));
              set({ items: cartItems });
              console.log("Panier mis à jour après ajout:", cartItems);
              get().forceUpdate(); // Force le re-render
            }

            console.log("✅ Produit ajouté au panier:", productId, quantity);
            toast.success("Produit ajouté", {
              description: `✅ ${product.nom || product.name} ajouté au panier`,
            });
          } catch (error: any) {
            console.error("❌ Erreur lors de l'ajout au panier:", error);
            console.error("Détails de l'erreur:", error.response?.data);
            const errorMessage =
              error.response?.data?.error ||
              error.message ||
              "Erreur lors de l'ajout au panier";
            toast.error("Erreur", {
              description: `❌ ${errorMessage}`,
            });
          }
        } else {
          // Utiliser localStorage si l'utilisateur n'est pas connecté
          console.log("Utilisation de localStorage pour l'ajout");
          const items = get().items;
          const productId = product.idProduit; // Utiliser uniquement idProduit
          const existingItem = items.find(item => {
            return item.product.idProduit === productId;
          });

          if (existingItem) {
            if (existingItem.quantity + quantity <= product.stock) {
              set({
                items: items.map(item => {
                  return item.product.idProduit === productId
                    ? { ...item, quantity: item.quantity + quantity }
                    : item;
                }),
              });
              console.log(
                "✅ Quantité augmentée (localStorage):",
                productId,
                existingItem.quantity + quantity
              );
              toast.success("Panier mis à jour", {
                description: `✅ Quantité de ${product.nom || product.name} augmentée`,
              });
            } else {
              toast.error("Stock insuffisant", {
                description: `❌ Stock disponible : ${product.stock}`,
              });
            }
          } else {
            if (quantity <= product.stock) {
              set({
                items: [...items, { product, quantity }],
              });
              console.log(
                "✅ Nouveau produit ajouté (localStorage):",
                productId,
                quantity
              );
              toast.success("Produit ajouté", {
                description: `✅ ${product.nom || product.name} ajouté au panier`,
              });
            } else {
              toast.error("Stock insuffisant", {
                description: `❌ Stock disponible : ${product.stock}`,
              });
            }
          }
        }
      },

      removeItem: async (productId: string) => {
        console.log("removeItem appelé:", productId);
        const currentItems = get().items;
        const itemExists = currentItems.some(
          item => String(item.product.idProduit) === productId
        );

        if (!itemExists) {
          console.log(
            "Article non trouvé dans le panier local, rechargement depuis le serveur"
          );
          await get().loadCartFromServer();
          return;
        }

        const token = localStorage.getItem("access_token");

        if (token) {
          // Utiliser l'API si l'utilisateur est connecté
          try {
            console.log(
              "Tentative de suppression via API avec endpoint:",
              `api/ventes/panier/supprimer/${productId}/`
            );
            await api.delete(`api/ventes/panier/supprimer/${productId}/`);
            console.log("Produit supprimé avec succès");

            const response = await api.get("api/ventes/panier/");
            console.log("Réponse panier après suppression:", response.data);

            if (response.data && response.data.lignes) {
              const cartItems = response.data.lignes.map((ligne: any) => ({
                product: {
                  id: ligne.idProduit, // Utiliser idProduit comme ID principal
                  idProduit: ligne.idProduit,
                  nom: ligne.nom_produit,
                  name: ligne.nom_produit,
                  nom_catalogue: ligne.nom_catalogue,
                  category: ligne.nom_catalogue,
                  image: buildImageUrl(ligne.image),
                  prix: ligne.prix_unitaire,
                  price: ligne.prix_unitaire,
                  stock: ligne.stock,
                },
                quantity: ligne.quantite,
              }));
              set({ items: cartItems });
              console.log("Panier mis à jour après suppression:", cartItems);
              get().forceUpdate(); // Force le re-render
            }

            toast.success("Produit retiré", {
              description: "🗑️ Produit retiré du panier",
            });
          } catch (error: any) {
            console.error("❌ Erreur lors de la suppression:", error);
            console.error("Détails de l'erreur:", error.response?.data);

            // Si erreur 404, recharger le panier depuis le serveur pour resynchroniser
            if (error.response?.status === 404) {
              console.log(
                "Erreur 404 détectée, rechargement du panier depuis le serveur"
              );
              await get().loadCartFromServer();
              toast.info("Panier synchronisé", {
                description:
                  "🔄 Votre panier a été synchronisé avec le serveur",
              });
              return;
            }

            const errorMessage =
              error.response?.data?.error ||
              error.message ||
              "Erreur lors de la suppression";
            toast.error("Erreur", {
              description: `❌ ${errorMessage}`,
            });
          }
        } else {
          // Utiliser localStorage si l'utilisateur n'est pas connecté
          console.log("Utilisation de localStorage pour la suppression");
          set({
            items: get().items.filter(item => {
              return String(item.product.idProduit) !== productId;
            }),
          });
          toast.success("Produit retiré", {
            description: "🗑️ Produit retiré du panier",
          });
        }
      },

      updateQuantity: async (productId: string, quantity: number) => {
        console.log("updateQuantity appelé:", productId, quantity);
        const currentItems = get().items;
        const item = currentItems.find(
          item => String(item.product.idProduit) === productId
        );

        if (!item) {
          console.log(
            "Article non trouvé dans le panier local, rechargement depuis le serveur"
          );
          await get().loadCartFromServer();
          return;
        }

        const token = localStorage.getItem("access_token");

        if (token) {
          // Utiliser l'API si l'utilisateur est connecté
          try {
            console.log(
              "Tentative de mise à jour via API avec endpoint:",
              `api/ventes/panier/modifier/${productId}/`
            );
            const response = await api.put(
              `api/ventes/panier/modifier/${productId}/`,
              {
                quantite: quantity,
              }
            );
            console.log("Réponse API:", response.data);

            const cartResponse = await api.get("api/ventes/panier/");
            console.log("Réponse panier:", cartResponse.data);

            if (cartResponse.data && cartResponse.data.lignes) {
              const cartItems = cartResponse.data.lignes.map((ligne: any) => ({
                product: {
                  id: ligne.idProduit, // Utiliser idProduit comme ID principal
                  idProduit: ligne.idProduit,
                  nom: ligne.nom_produit,
                  name: ligne.nom_produit,
                  nom_catalogue: ligne.nom_catalogue,
                  category: ligne.nom_catalogue,
                  image: buildImageUrl(ligne.image),
                  prix: ligne.prix_unitaire,
                  price: ligne.prix_unitaire,
                  stock: ligne.stock,
                },
                quantity: ligne.quantite,
              }));
              set({ items: cartItems });
              console.log("Panier mis à jour avec succès:", cartItems);
              get().forceUpdate(); // Force le re-render
            }

            console.log(
              "✅ Quantité mise à jour via API:",
              productId,
              quantity
            );
          } catch (error: any) {
            console.error("❌ Erreur lors de la modification API:", error);
            console.error("Détails de l'erreur:", error.response?.data);

            // Si erreur 404, recharger le panier depuis le serveur pour resynchroniser
            if (error.response?.status === 404) {
              console.log(
                "Erreur 404 détectée, rechargement du panier depuis le serveur"
              );
              await get().loadCartFromServer();
              toast.info("Panier synchronisé", {
                description:
                  "🔄 Votre panier a été synchronisé avec le serveur",
              });
              return;
            }

            const errorMessage =
              error.response?.data?.error ||
              error.message ||
              "Erreur lors de la modification";
            toast.error("Erreur", {
              description: `❌ ${errorMessage}`,
            });
          }
        } else {
          // Utiliser localStorage si l'utilisateur n'est pas connecté
          console.log("Utilisation de localStorage pour la mise à jour");
          const items = get().items;
          const item = items.find(item => {
            return String(item.product.idProduit) === productId;
          });

          if (item) {
            if (quantity <= 0) {
              get().removeItem(productId);
            } else if (quantity <= item.product.stock) {
              set({
                items: items.map(item => {
                  return String(item.product.idProduit) === productId
                    ? { ...item, quantity }
                    : item;
                }),
              });
              console.log(
                "✅ Quantité mise à jour (localStorage):",
                productId,
                quantity
              );
            } else {
              toast.error("Stock insuffisant", {
                description: `❌ Stock disponible : ${item.product.stock}`,
              });
            }
          }
        }
      },

      clearCart: async () => {
        const token = localStorage.getItem("access_token");

        if (token) {
          // Utiliser l'API si l'utilisateur est connecté
          try {
            await api.delete("api/ventes/panier/vider/");
            set({ items: [] });
            toast.success("Panier vidé", {
              description: "🗑️ Votre panier a été vidé",
            });
          } catch (error: any) {
            console.error("Erreur lors du vidage:", error);
            const errorMessage =
              error.response?.data?.error ||
              error.message ||
              "Erreur lors du vidage";
            toast.error("Erreur", {
              description: `❌ ${errorMessage}`,
            });
          }
        } else {
          // Utiliser localStorage si l'utilisateur n'est pas connecté
          set({ items: [] });
          toast.success("Panier vidé", {
            description: "🗑️ Votre panier a été vidé",
          });
        }
      },

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      getTotalPrice: () => {
        return get().items.reduce(
          (total, item) =>
            total +
            (item.product.prix || item.product.price || 0) * item.quantity,
          0
        );
      },
    }),
    {
      name: "cart-storage",
    }
  )
);
