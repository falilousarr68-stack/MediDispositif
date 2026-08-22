"use client";

import React from "react";
import { Order } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Package,
  MapPin,
  CreditCard,
  User,
  Calendar,
  FileText,
} from "lucide-react";
import { format } from "date-fns";

interface OrderDetailsCardProps {
  order: Order;
}

export function OrderDetailsCard({ order }: OrderDetailsCardProps) {
  const getStatusBadge = (status: Order["status"]) => {
    // Mapping des statuts backend (français) vers frontend (anglais)
    const statusMapping: Record<string, keyof typeof statusConfig> = {
      EnCours: "pending",
      Validee: "validated",
      Annulee: "cancelled",
      "En cours": "pending",
      Validée: "validated",
      Annulée: "cancelled",
      pending: "pending",
      validated: "validated",
      cancelled: "cancelled",
      delivered: "delivered",
    };

    const mappedStatus = statusMapping[status] || "pending";
    const statusConfig = {
      pending: { label: "En attente", variant: "secondary" as const },
      validated: { label: "Validée", variant: "default" as const },
      cancelled: { label: "Annulée", variant: "destructive" as const },
      delivered: { label: "Livrée", variant: "outline" as const },
    };

    const config = statusConfig[mappedStatus];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getPaymentMethodLabel = (method?: string) => {
    if (!method) return null;

    const methodMapping: Record<string, string> = {
      Especes: "Espèces 💵",
      Espèces: "Espèces 💵",
      Carte: "Carte bancaire 💳",
      "Carte bancaire": "Carte bancaire 💳",
      MobileMoney: "Mobile Money 📱",
      "Mobile Money": "Mobile Money 📱",
      Cheque: "Chèque 📄",
      Chèque: "Chèque 📄",
      cash: "Espèces 💵",
      card: "Carte bancaire 💳",
      mobile_money: "Mobile Money 📱",
      check: "Chèque 📄",
    };

    return methodMapping[method] || method;
  };

  const orderId = order.id;
  const orderUser = order.user;
  const orderDate = order.created_at;
  const orderTotal = order.total;
  const orderStatus = order.status;
  const orderPaymentMethod = order.payment_method;
  const orderItems = order.items;
  const orderShippingAddress = order.shipping_address;
  const orderCancellationReason = order.cancellation_reason;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>
            Détails de la Commande #
            {orderId ? orderId.toString().slice(-8) : "N/A"}
          </span>
          {getStatusBadge(orderStatus as Order["status"])}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Client Information */}
        <div className="space-y-2">
          <h3 className="font-semibold flex items-center gap-2">
            <User className="h-4 w-4" />
            Client
          </h3>
          <div className="pl-6 space-y-1 text-sm">
            {orderUser ? (
              <>
                <p>
                  {orderUser.first_name} {orderUser.last_name}
                </p>
                <p className="text-muted-foreground">{orderUser.email}</p>
                {orderUser.phone && (
                  <p className="text-muted-foreground">{orderUser.phone}</p>
                )}
              </>
            ) : (
              <p className="text-muted-foreground">N/A</p>
            )}
          </div>
        </div>

        {/* Order Information */}
        <div className="space-y-2">
          <h3 className="font-semibold flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Informations de commande
          </h3>
          <div className="pl-6 space-y-1 text-sm">
            <p>
              Date:{" "}
              {orderDate
                ? format(new Date(orderDate), "dd MMM yyyy, HH:mm")
                : "N/A"}
            </p>
            <p>
              Total:{" "}
              <span className="font-bold">
                {orderTotal ? orderTotal.toLocaleString() : "0"} FCFA
              </span>
            </p>
          </div>
        </div>

        {/* Shipping Address */}
        {orderShippingAddress && (
          <div className="space-y-2">
            <h3 className="font-semibold flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Adresse de livraison
            </h3>
            <div className="pl-6 text-sm">
              <p>{orderShippingAddress}</p>
            </div>
          </div>
        )}

        {/* Payment Method */}
        {orderPaymentMethod && (
          <div className="space-y-2">
            <h3 className="font-semibold flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Mode de paiement
            </h3>
            <div className="pl-6">
              <Badge variant="outline">
                {getPaymentMethodLabel(orderPaymentMethod)}
              </Badge>
            </div>
          </div>
        )}

        {/* Order Items */}
        <div className="space-y-2">
          <h3 className="font-semibold flex items-center gap-2">
            <Package className="h-4 w-4" />
            Articles commandés
          </h3>
          <div className="pl-6 space-y-2">
            {orderItems.map((item: any, index: number) => {
              const productName =
                item.product?.nom || item.product?.name || item.nom_produit;
              const categoryName =
                item.product?.nom_catalogue ||
                item.product?.category ||
                item.catalogue;
              const productPrice =
                item.product?.prix ||
                item.product?.price ||
                item.prix_unitaire ||
                0;
              const itemQuantity = item.quantity || item.quantite || 0;

              return (
                <div
                  key={index}
                  className="flex justify-between items-center text-sm p-2 bg-muted rounded"
                >
                  <div>
                    <p className="font-medium">{productName}</p>
                    <p className="text-muted-foreground">{categoryName}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      {itemQuantity} x {productPrice.toLocaleString()} FCFA
                    </p>
                    <p className="text-muted-foreground">
                      {(productPrice * itemQuantity).toLocaleString()} FCFA
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Cancellation Reason */}
        {orderCancellationReason && (
          <div className="space-y-2">
            <h3 className="font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Motif d'annulation
            </h3>
            <div className="pl-6 text-sm text-muted-foreground">
              <p>{orderCancellationReason}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
