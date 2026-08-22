"use client";

import React from "react";
import { Order } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ShoppingCart,
  CheckCircle,
  XCircle,
  Clock,
  MoreVertical,
  FileText,
  CreditCard,
} from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";

interface OrderTableProps {
  orders: Order[];
  onViewDetails: (order: Order) => void;
  onValidate?: (order: Order) => void;
  onCancel?: (order: Order) => void;
  onGenerateInvoice?: (order: Order) => void;
  onRecordPayment?: (order: Order) => void;
  showActions?: boolean;
}

export function OrderTable({
  orders,
  onViewDetails,
  onValidate,
  onCancel,
  onGenerateInvoice,
  onRecordPayment,
  showActions = true,
}: OrderTableProps) {
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
      pending: {
        label: "En attente",
        variant: "secondary" as const,
        icon: Clock,
      },
      validated: {
        label: "Validée",
        variant: "default" as const,
        icon: CheckCircle,
      },
      cancelled: {
        label: "Annulée",
        variant: "destructive" as const,
        icon: XCircle,
      },
      delivered: {
        label: "Livrée",
        variant: "outline" as const,
        icon: CheckCircle,
      },
    };

    const config = statusConfig[mappedStatus];
    const StatusIcon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <StatusIcon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const isPendingStatus = (status: string) => {
    const pendingStatuses = ["EnCours", "En cours", "pending"];
    return pendingStatuses.includes(status);
  };

  const isValidatedStatus = (status: string) => {
    const validatedStatuses = ["Validee", "Validée", "validated"];
    return validatedStatuses.includes(status);
  };

  const getPaymentMethodBadge = (method?: string) => {
    if (!method) return null;

    // Mapping des méthodes de paiement backend (français) vers frontend (anglais)
    const methodMapping: Record<string, keyof typeof methodConfig> = {
      Especes: "cash",
      Espèces: "cash",
      Carte: "card",
      "Carte bancaire": "card",
      MobileMoney: "mobile_money",
      "Mobile Money": "mobile_money",
      Cheque: "check",
      Chèque: "check",
      cash: "cash",
      card: "card",
      mobile_money: "mobile_money",
      check: "check",
    };

    const mappedMethod = methodMapping[method] || method;
    const methodConfig = {
      cash: { label: "Espèces 💵", icon: "💵" },
      card: { label: "Carte 💳", icon: "💳" },
      mobile_money: { label: "Mobile Money 📱", icon: "📱" },
      check: { label: "Chèque 📄", icon: "📄" },
    };

    const config = methodConfig[mappedMethod as keyof typeof methodConfig];
    if (!config) return null;

    return (
      <Badge variant="outline" className="gap-1">
        <span>{config.icon}</span>
        {config.label}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5" />
          Commandes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-3 font-medium">N° Commande</th>
                <th className="text-left p-3 font-medium">Client</th>
                <th className="text-left p-3 font-medium">Date</th>
                <th className="text-left p-3 font-medium">Total</th>
                <th className="text-left p-3 font-medium">Statut</th>
                <th className="text-left p-3 font-medium">Paiement</th>
                {showActions && (
                  <th className="text-right p-3 font-medium">Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {orders.map((order, index) => {
                const orderId = order.id;
                const orderUser = order.user;
                const orderDate = order.created_at;
                const orderTotal = order.total;
                const orderStatus = order.status;
                const orderPaymentMethod = order.payment_method;

                return (
                  <motion.tr
                    key={orderId || index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b hover:bg-muted/50 transition-colors"
                  >
                    <td className="p-3">
                      <span className="font-mono text-sm font-medium">
                        #{orderId ? orderId.toString().slice(-8) : "N/A"}
                      </span>
                    </td>
                    <td className="p-3">
                      {orderUser ? (
                        <div>
                          <p className="font-medium">
                            {orderUser.first_name} {orderUser.last_name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {orderUser.email}
                          </p>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">N/A</span>
                      )}
                    </td>
                    <td className="p-3">
                      <span className="text-sm">
                        {orderDate
                          ? format(new Date(orderDate), "dd MMM yyyy, HH:mm")
                          : "N/A"}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="font-semibold">
                        {orderTotal ? orderTotal.toLocaleString() : "0"} FCFA
                      </span>
                    </td>
                    <td className="p-3">
                      {getStatusBadge(orderStatus as Order["status"])}
                    </td>
                    <td className="p-3">
                      {getPaymentMethodBadge(orderPaymentMethod)}
                    </td>
                    {showActions && (
                      <td className="p-3 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onViewDetails(order)}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                          {onValidate && isPendingStatus(orderStatus) && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onValidate(order)}
                              className="text-green-600 hover:text-green-700"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                          {onCancel && isPendingStatus(orderStatus) && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onCancel(order)}
                              className="text-red-600 hover:text-red-700"
                              title="Annuler la commande"
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          )}
                          {onGenerateInvoice &&
                            isValidatedStatus(orderStatus) && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onGenerateInvoice(order)}
                              >
                                <FileText className="h-4 w-4" />
                              </Button>
                            )}
                          {onRecordPayment &&
                            isValidatedStatus(orderStatus) && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onRecordPayment(order)}
                              >
                                <CreditCard className="h-4 w-4" />
                              </Button>
                            )}
                        </div>
                      </td>
                    )}
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
