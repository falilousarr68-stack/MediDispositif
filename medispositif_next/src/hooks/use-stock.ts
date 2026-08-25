import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import { Product, Supply } from "@/types";
import { toast } from "sonner";

interface CreateProductData {
  nom: string;
  description: string;
  prix: number;
  stock: number;
  idCatalogue: number;
  image?: string | File;
}

interface CreateProductFormData extends FormData {
  append(name: string, value: string | Blob): void;
}

interface UpdateProductData {
  id: string;
  data: CreateProductData | FormData;
}

interface CreateSupplyData {
  product: string;
  quantity: number;
  lot_number: string;
  expiry_date: string;
  purchase_price: number;
}

// Products Management
export function useStockProducts() {
  return useQuery({
    queryKey: ["stock-products"],
    queryFn: async () => {
      const response = await api.get<Product[]>("api/catalogue/produits/");
      return response.data;
    },
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateProductData | FormData) => {
      const isFormData = data instanceof FormData;

      // Pour les uploads de fichiers, ne pas définir Content-Type
      // Axios va automatiquement ajouter le bon Content-Type avec boundary
      const config = isFormData
        ? { headers: { "Content-Type": undefined } }
        : {};

      console.log("Données envoyées:", data);
      console.log("Est FormData:", isFormData);

      const response = await api.post<Product>(
        "api/catalogue/produits/",
        data,
        config
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock-products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product"] });
      toast.success("Produit créé", {
        description: "✅ Produit ajouté au catalogue avec succès",
      });
    },
    onError: (error: any) => {
      console.error("Erreur détaillée:", error);
      console.error("Response data:", error.response?.data);
      console.error("Response status:", error.response?.status);

      let errorMessage = "❌ Impossible de créer le produit";

      if (error.response?.data) {
        if (typeof error.response.data === "string") {
          errorMessage = `❌ ${error.response.data}`;
        } else if (typeof error.response.data === "object") {
          const errors = Object.entries(error.response.data)
            .map(
              ([key, value]) =>
                `${key}: ${Array.isArray(value) ? value.join(", ") : value}`
            )
            .join(", ");
          errorMessage = `❌ ${errors}`;
        }
      } else if (error.message) {
        errorMessage = `❌ ${error.message}`;
      }

      toast.error("Erreur de création", {
        description: errorMessage,
      });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: UpdateProductData) => {
      const isFormData = data instanceof FormData;

      // Pour les uploads de fichiers, ne pas définir Content-Type
      const config = isFormData
        ? { headers: { "Content-Type": undefined } }
        : {};

      console.log("Update données:", data);
      console.log("Est FormData:", isFormData);

      const response = await api.put<Product>(
        `api/catalogue/produits/${id}/`,
        data,
        config
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock-products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product"] });
      toast.success("Produit mis à jour", {
        description: "✅ Produit modifié avec succès",
      });
    },
    onError: (error: any) => {
      console.error("Erreur update:", error);
      console.error("Response data:", error.response?.data);

      toast.error("Erreur de mise à jour", {
        description: "❌ Impossible de modifier le produit",
      });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`api/catalogue/produits/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock-products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product"] });
      toast.success("Produit supprimé", {
        description: "✅ Produit retiré du catalogue",
      });
    },
    onError: () => {
      toast.error("Erreur de suppression", {
        description: "❌ Impossible de supprimer le produit",
      });
    },
  });
}

// Supplies Management
export function useSupplies() {
  return useQuery({
    queryKey: ["supplies"],
    queryFn: async () => {
      const response = await api.get<Array<Record<string, any>>>(
        "api/catalogue/approvisionnements/"
      );
      return response.data.flatMap(approvisionnement =>
        (approvisionnement.details || []).map(
          (detail: Record<string, any>) => ({
            id: String(detail.idDetailApp),
            product: {
              idProduit: detail.idProduit,
              nom: detail.nom_produit || "Produit inconnu",
              description: "",
              prix: Number(detail.prix_unitaire_achat || 0),
              stock: 0,
              catalogue: "",
              image: detail.image || undefined,
            },
            quantity: Number(detail.quantite || 0),
            lot_number: detail.numero_lot || "",
            expiry_date: detail.date_peremption,
            received_at: approvisionnement.date_app,
          })
        )
      ) as Supply[];
    },
  });
}

export function useCreateSupply() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateSupplyData) => {
      const response = await api.post<Supply>(
        "api/catalogue/approvisionnements/",
        {
          details: [
            {
              idProduit: data.product,
              quantite: data.quantity,
              prix_unitaire_achat: data.purchase_price,
              date_peremption: data.expiry_date,
              numero_lot: data.lot_number,
            },
          ],
        }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supplies"] });
      queryClient.invalidateQueries({ queryKey: ["stock-products"] });
      toast.success("Approvisionnement enregistré", {
        description: "✅ Stock mis à jour avec succès",
      });
    },
    onError: () => {
      toast.error("Erreur d'approvisionnement", {
        description: "❌ Impossible d'enregistrer l'approvisionnement",
      });
    },
  });
}

export function useDeleteSupply() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`api/catalogue/approvisionnements/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supplies"] });
      toast.success("Approvisionnement supprimé", {
        description: "✅ Approvisionnement retiré",
      });
    },
    onError: () => {
      toast.error("Erreur de suppression", {
        description: "❌ Impossible de supprimer l'approvisionnement",
      });
    },
  });
}

// Stock Alerts
export function useLowStockProducts(threshold: number = 5) {
  return useQuery({
    queryKey: ["low-stock", threshold],
    queryFn: async () => {
      const response = await api.get<Product[]>("api/catalogue/produits/", {
        params: { low_stock: threshold },
      });
      return response.data;
    },
  });
}

export function useExpiringProducts() {
  return useQuery({
    queryKey: ["expiring-products"],
    queryFn: async () => {
      const response = await api.get<Array<Record<string, any>>>(
        "api/catalogue/details-approvisionnement/",
        {
          params: { expiring_soon: true },
        }
      );
      return response.data.map(detail => ({
        id: String(detail.idDetailApp),
        product: {
          idProduit: detail.idProduit,
          nom: detail.nom_produit || "Produit inconnu",
          description: "",
          prix: Number(detail.prix_unitaire_achat || 0),
          stock: 0,
          catalogue: "",
        },
        quantity: Number(detail.quantite || 0),
        lot_number: detail.numero_lot || "",
        expiry_date: detail.date_peremption,
        received_at: detail.date_peremption,
      })) as Supply[];
    },
  });
}

// Dashboard Stats
export function useStockStats() {
  return useQuery({
    queryKey: ["stock-stats"],
    queryFn: async () => {
      const response = await api.get("api/systeme/statistiques/");
      return response.data;
    },
  });
}
