import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import { Order, CartItem } from "@/types";
import { toast } from "sonner";
import { normalizeOrder, normalizeOrders } from "@/lib/orders";

interface CreateOrderData {
  lignes: Array<{
    idProduit: number;
    quantite: number;
    prix_unitaire: number;
  }>;
}

export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateOrderData) => {
      console.log("Creating order with data:", data);
      const response = await api.post<Order>("api/ventes/commandes/", data);
      return response.data;
    },
    onSuccess: data => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Commande créée", {
        description: `✅ Commande #${data.id} créée avec succès`,
      });
    },
    onError: (error: any) => {
      console.error("Order creation failed:", error);
      console.error("Response data:", error.response?.data);
      console.error("Response status:", error.response?.status);

      let errorMessage = "❌ Impossible de créer la commande";

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

      toast.error("Erreur de commande", {
        description: errorMessage,
      });
    },
  });
}

export function useUserOrders() {
  return useQuery({
    queryKey: ["orders", "user"],
    queryFn: async () => {
      const response = await api.get("api/ventes/commandes/");
      return normalizeOrders(response.data);
    },
  });
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: ["order", id],
    queryFn: async () => {
      const response = await api.get(`api/ventes/commandes/${id}/`);
      return normalizeOrder(response.data);
    },
    enabled: !!id,
  });
}
