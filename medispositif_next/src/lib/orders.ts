import { Order, User } from "@/types";

type BackendOrder = Partial<Order> & {
  idCommande?: number | string;
  nom_client?: string;
  email_client?: string;
  client?: {
    id?: number | string;
    nom?: string;
    prenom?: string;
    email?: string;
    telephone?: string;
  };
  date_commande?: string;
  montant_total?: number | string;
  statut?: string;
  motif_annulation?: string;
  lignes?: Array<Record<string, any>>;
};

function normalizeUser(order: BackendOrder): User | undefined {
  const client = order.client;
  const clientName =
    order.nom_client || [client?.prenom, client?.nom].filter(Boolean).join(" ");

  if (!client && !clientName && !order.email_client) return order.user;

  const nameParts = clientName?.split(" ") || [];
  return {
    id: String(client?.id ?? order.user?.id ?? ""),
    email: client?.email || order.email_client || order.user?.email || "",
    first_name: client?.prenom || order.user?.first_name || nameParts[0] || "",
    last_name:
      client?.nom || order.user?.last_name || nameParts.slice(1).join(" "),
    phone: client?.telephone || order.user?.phone,
    role: "Client",
  };
}

export function normalizeOrder(order: BackendOrder): Order {
  return {
    id: String(order.idCommande ?? order.id ?? ""),
    user: normalizeUser(order) as User,
    items: (order.lignes || order.items || []).map((item: any) => ({
      product: {
        idProduit:
          item.idProduit ?? item.produit?.idProduit ?? item.produit?.id ?? "",
        nom: item.nom_produit || item.produit?.nom || "",
        description: item.produit?.description || "",
        prix: Number(
          item.prix_produit ?? item.produit?.prix ?? item.prix_unitaire ?? 0
        ),
        stock: Number(item.produit?.stock ?? 0),
        catalogue: item.catalogue || item.produit?.catalogue || "",
        nom_catalogue: item.nom_catalogue || item.produit?.nom_catalogue,
      },
      quantity: Number(item.quantite ?? item.quantity ?? 0),
    })),
    total: Number(order.montant_total ?? order.total ?? 0),
    status: (order.statut ?? order.status ?? "EnCours") as Order["status"],
    shipping_address: order.shipping_address,
    payment_method: order.payment_method,
    cancellation_reason: order.motif_annulation || order.cancellation_reason,
    created_at: order.date_commande || order.created_at || "",
    updated_at: order.updated_at || order.date_commande || "",
  };
}

export function normalizeOrders(orders: BackendOrder[]): Order[] {
  return orders.map(normalizeOrder);
}
