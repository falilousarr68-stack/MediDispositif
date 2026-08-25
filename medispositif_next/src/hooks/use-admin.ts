import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";

export interface User {
  idUser?: string;
  id?: string;
  email: string;
  prenom: string;
  nom: string;
  telephone?: string;
  role:
    | "Administrateur"
    | "ResponsableCommercial"
    | "Vendeur"
    | "GestionnaireDeStock"
    | "Client";
  created_at?: string;
}

export const useUsers = () => {
  return useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const response = await api.get("api/auth/utilisateurs/");
      // L'API retourne { utilisateurs: [...], total: ... }
      return response.data.utilisateurs || response.data;
    },
  });
};

export const useCreateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userData: {
      email: string;
      motdepasse: string;
      confirmation_motdepasse: string;
      prenom: string;
      nom: string;
      telephone?: string;
      role: "ResponsableCommercial" | "Vendeur" | "GestionnaireDeStock";
    }) => {
      console.log("Creating user with data:", userData);
      const response = await api.post("api/auth/utilisateurs/", userData);
      console.log("User creation response:", response.data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const response = await api.delete(`api/auth/utilisateurs/${userId}/`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      userData,
    }: {
      userId: string;
      userData: Partial<User>;
    }) => {
      const response = await api.put(
        `api/auth/utilisateurs/${userId}/`,
        userData
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
};

// Hooks pour les commandes
export const useOrders = () => {
  return useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      const response = await api.get("api/ventes/commandes/");
      console.log("Orders response:", response.data);
      // Handle both array and paginated response formats
      if (Array.isArray(response.data)) {
        return response.data;
      } else if (response.data.results) {
        return response.data.results;
      } else if (response.data.commandes) {
        return response.data.commandes;
      }
      return response.data;
    },
  });
};

export const useCreateOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderData: any) => {
      const response = await api.post("api/ventes/commandes/", orderData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
};

export const useValidateOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderId: string) => {
      console.log("Validating order with ID:", orderId);
      const response = await api.post(
        `api/ventes/commandes/${orderId}/valider/`
      );
      console.log("Validation response:", response.data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
  });
};

export const useCancelOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      orderId,
      motif,
    }: {
      orderId: string;
      motif: string;
    }) => {
      const response = await api.post(
        `api/ventes/commandes/${orderId}/annuler/`,
        { motif }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
};

// Hooks pour les paiements
export const usePayments = () => {
  return useQuery({
    queryKey: ["payments"],
    queryFn: async () => {
      const response = await api.get("api/ventes/paiements/");
      console.log("Payments response:", response.data);
      // Handle different response formats
      if (Array.isArray(response.data)) {
        return response.data;
      } else if (response.data.results) {
        return response.data.results;
      }
      return response.data;
    },
  });
};

export const useCreatePayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (paymentData: any) => {
      // Correspondance exacte avec les valeurs du backend ModePaiement
      const paymentModes: Record<string, string> = {
        cash: "Especes",
        card: "Carte",
        mobile_money: "MobileMoney",
        check: "Cheque",
      };
      const modePaiement = paymentModes[String(paymentData.method)] || "Especes";
      
      console.log("Creating payment with method:", paymentData.method, "converted to:", modePaiement);
      
      const response = await api.post("api/ventes/paiements/", {
        idCommande: paymentData.order,
        montant: paymentData.amount,
        mode_paiement: modePaiement,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
    },
  });
};

// Hooks pour les factures
export const useInvoices = () => {
  return useQuery({
    queryKey: ["invoices"],
    queryFn: async () => {
      const response = await api.get("api/ventes/factures/");
      console.log("Invoices response:", response.data);
      // Handle different response formats
      if (Array.isArray(response.data)) {
        return response.data;
      } else if (response.data.results) {
        return response.data.results;
      }
      return response.data;
    },
  });
};

export const useCreateInvoice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invoiceData: any) => {
      const response = await api.post("api/ventes/factures/", invoiceData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
  });
};

// Hooks pour les rapports
export const useReports = () => {
  return useQuery({
    queryKey: ["reports"],
    queryFn: async () => {
      const response = await api.get("api/systeme/rapports/");
      return response.data;
    },
  });
};

export const useCreateReport = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reportData: any) => {
      console.log("Creating report with data:", reportData);
      const response = await api.post("api/systeme/rapports/", reportData);
      console.log("Report creation response:", response.data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
  });
};

// Hooks pour les paramètres système
export const useSystemParams = () => {
  return useQuery({
    queryKey: ["system-params"],
    queryFn: async () => {
      const response = await api.get("api/systeme/parametres/");
      console.log("System params response:", response.data);
      // Handle different response formats
      if (Array.isArray(response.data)) {
        return response.data;
      } else if (response.data.results) {
        return response.data.results;
      }
      return response.data;
    },
  });
};

export const useUpdateSystemParam = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      paramId,
      paramData,
    }: {
      paramId: string;
      paramData: any;
    }) => {
      const response = await api.put(
        `api/systeme/parametres/${paramId}/`,
        paramData
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["system-params"] });
    },
  });
};

// Hook pour les statistiques de produits
export const useProductStatistics = () => {
  return useQuery({
    queryKey: ["product-statistics"],
    queryFn: async () => {
      const response = await api.get("api/catalogue/statistiques/produits/");
      console.log("Product statistics response:", response.data);
      return response.data;
    },
  });
};
