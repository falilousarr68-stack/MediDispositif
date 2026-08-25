import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import { Order, Payment } from "@/types";
import { toast } from "sonner";
import { normalizeOrder, normalizeOrders } from "@/lib/orders";

interface ValidateOrderData {
  reason?: string;
  mode_paiement?: "Especes" | "Carte" | "MobileMoney" | "Cheque";
}

interface CancelOrderData {
  reason: string;
}

interface PaymentData {
  order: string;
  amount: number;
  method: "cash" | "card" | "mobile_money" | "check";
  reference?: string;
}

// Orders Management
export function useOrders() {
  return useQuery({
    queryKey: ["orders"],
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

export function useValidateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data?: ValidateOrderData;
    }) => {
      const response = await api.post<Order>(
        `api/ventes/commandes/${id}/valider/`,
        data || {}
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      toast.success("Commande validée", {
        description: "✅ La commande a été validée et le stock décrémenté",
      });
    },
    onError: (error: any) => {
      const responseError = error.response?.data?.error;
      toast.error("Erreur de validation", {
        description: responseError || "❌ Impossible de valider la commande",
      });
      if (error.response?.data) {
        console.error("Erreur de validation:", error.response.data);
      }
    },
  });
}

export function useCancelOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: CancelOrderData }) => {
      const response = await api.post<Order>(
        `api/ventes/commandes/${id}/annuler/`,
        { motif: data.reason }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Commande annulée", {
        description: "✅ La commande a été annulée avec succès",
      });
    },
    onError: () => {
      toast.error("Erreur d'annulation", {
        description: "❌ Impossible d'annuler la commande",
      });
    },
  });
}

// Payments Management
export function usePayments() {
  return useQuery({
    queryKey: ["payments"],
    queryFn: async () => {
      const response = await api.get<Payment[]>("api/ventes/paiements/");
      return response.data;
    },
  });
}

export function useOrderPayments(orderId: string) {
  return useQuery({
    queryKey: ["payments", orderId],
    queryFn: async () => {
      const response = await api.get<Payment[]>(`api/ventes/paiements/`, {
        params: { order: orderId },
      });
      return response.data;
    },
    enabled: !!orderId,
  });
}

export function useCreatePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: PaymentData) => {
      const response = await api.post<Payment>("api/ventes/paiements/", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Paiement enregistré", {
        description: "✅ Le paiement a été enregistré avec succès",
      });
    },
    onError: () => {
      toast.error("Erreur de paiement", {
        description: "❌ Impossible d'enregistrer le paiement",
      });
    },
  });
}

// Invoice Generation
export function useGenerateInvoice() {
  return useMutation({
    mutationFn: async (orderId: string) => {
      const existingResponse = await api.get("api/ventes/factures/", {
        params: { commande: orderId },
      });
      const existingInvoices = Array.isArray(existingResponse.data)
        ? existingResponse.data
        : existingResponse.data.results || [];

      if (existingInvoices.length > 0) {
        return existingInvoices[0];
      }

      const response = await api.post("api/ventes/factures/", {
        idCommande: orderId,
      });
      return response.data;
    },
    onSuccess: data => {
      // Si l'API retourne un PDF ou une URL de téléchargement
      if (data.url) {
        window.open(data.url, "_blank");
      }
      toast.success("Facture générée", {
        description: "✅ La facture a été générée avec succès",
      });
    },
    onError: (error: any) => {
      const responseData = error.response?.data;
      const errorMessage =
        responseData?.detail ||
        responseData?.error ||
        (typeof responseData === "string" ? responseData : null) ||
        "❌ Impossible de générer la facture";
      toast.error("Erreur de génération", {
        description: errorMessage,
      });
      console.error("Erreur de génération de facture:", responseData || error);
    },
  });
}

// Sales Statistics
export function useSalesStats(dateRange?: { start: string; end: string }) {
  return useQuery({
    queryKey: ["sales-stats", dateRange],
    queryFn: async () => {
      const response = await api.get("api/systeme/statistiques/", {
        params: dateRange,
      });
      return response.data;
    },
  });
}

export function useRecentOrders(limit: number = 10) {
  return useQuery({
    queryKey: ["recent-orders", limit],
    queryFn: async () => {
      const response = await api.get("api/ventes/commandes/", {
        params: { limit, ordering: "-created_at" },
      });
      const orders = Array.isArray(response.data)
        ? response.data
        : response.data.results || [];
      return normalizeOrders(orders).slice(0, limit);
    },
  });
}

export function useOrdersByStatus(
  status: "pending" | "validated" | "cancelled" | "delivered"
) {
  return useQuery({
    queryKey: ["orders", "status", status],
    queryFn: async () => {
      const response = await api.get<Order[]>("api/ventes/commandes/", {
        params: {
          statut:
            status === "pending"
              ? "EnCours"
              : status === "validated"
                ? "Validee"
                : status === "cancelled"
                  ? "Annulee"
                  : status,
        },
      });
      return normalizeOrders(response.data);
    },
  });
}
