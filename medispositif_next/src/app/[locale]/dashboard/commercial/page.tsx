"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import {
  useOrders,
  useValidateOrder,
  useCancelOrder,
  useGenerateInvoice,
  useCreatePayment,
  useSalesStats,
  useOrdersByStatus,
  useRecentOrders,
} from "@/hooks/use-sales";
import { Order } from "@/types";
import { OrderTable } from "@/components/sales/order-table";
import { OrderDetailsCard } from "@/components/sales/order-details-card";
import { ValidateOrderModal } from "@/components/sales/validate-order-modal";
import { CancelOrderModal } from "@/components/sales/cancel-order-modal";
import { PaymentModal } from "@/components/sales/payment-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import {
  ShoppingCart,
  TrendingUp,
  DollarSign,
  Clock,
  CheckCircle,
  X,
  FileText,
  CreditCard,
} from "lucide-react";
import { useLocale } from "next-intl";

export default function CommercialDashboardPage() {
  const t = useTranslations("sales");
  const locale = useLocale();

  const { data: orders, isLoading } = useOrders();
  const { data: pendingOrders } = useOrdersByStatus("pending");
  const { data: validatedOrders } = useOrdersByStatus("validated");
  const { data: recentOrders } = useRecentOrders(5);
  const { data: stats } = useSalesStats();

  const validateOrder = useValidateOrder();
  const cancelOrder = useCancelOrder();
  const generateInvoice = useGenerateInvoice();
  const createPayment = useCreatePayment();

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [validateModalOpen, setValidateModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const handleValidate = (order: Order) => {
    setSelectedOrder(order);
    setValidateModalOpen(true);
  };

  const handleCancel = (order: Order) => {
    setSelectedOrder(order);
    setCancelModalOpen(true);
  };

  const handleGenerateInvoice = (order: Order) => {
    generateInvoice.mutate(order.id);
  };

  const handleRecordPayment = (order: Order) => {
    setSelectedOrder(order);
    setPaymentModalOpen(true);
  };

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
    setShowDetails(true);
  };

  // Calculer le chiffre du jour en utilisant les champs backend français
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dailyRevenue =
    orders?.reduce((sum: number, order: any) => {
      const orderDate = new Date(order.date_commande || order.created_at);
      orderDate.setHours(0, 0, 0, 0);

      if (orderDate.getTime() === today.getTime()) {
        return sum + (order.montant_total || order.total || 0);
      }
      return sum;
    }, 0) || 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="container mx-auto px-4 py-8"
      >
        <div className="mb-8">
          <h1 className="text-4xl font-bold flex items-center gap-3">
            <TrendingUp className="h-8 w-8 text-primary" />
            {t("title")}
          </h1>
          <p className="text-muted-foreground mt-2">
            Gestion des ventes et des commandes
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Commandes
                </CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{orders?.length || 0}</div>
                <p className="text-xs text-muted-foreground">Toutes périodes</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  En Attente
                </CardTitle>
                <Clock className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-500">
                  {pendingOrders?.length || 0}
                </div>
                <p className="text-xs text-muted-foreground">À traiter</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Validées</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-500">
                  {validatedOrders?.length || 0}
                </div>
                <p className="text-xs text-muted-foreground">Confirmées</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Chiffre du jour
                </CardTitle>
                <DollarSign className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {dailyRevenue.toLocaleString()} FCFA
                </div>
                <p className="text-xs text-muted-foreground">Total ventes</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Recent Orders */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Commandes Récentes</h2>
          {recentOrders && (
            <OrderTable
              orders={recentOrders}
              onViewDetails={handleViewDetails}
              onValidate={handleValidate}
              onCancel={handleCancel}
              onGenerateInvoice={handleGenerateInvoice}
              onRecordPayment={handleRecordPayment}
            />
          )}
        </div>

        {/* All Orders */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Toutes les Commandes</h2>
          {orders && (
            <OrderTable
              orders={orders}
              onViewDetails={handleViewDetails}
              onValidate={handleValidate}
              onCancel={handleCancel}
              onGenerateInvoice={handleGenerateInvoice}
              onRecordPayment={handleRecordPayment}
            />
          )}
        </div>

        {/* Order Details Modal */}
        {showDetails && selectedOrder && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-background rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold">Détails de la commande</h2>
                  <Button variant="ghost" onClick={() => setShowDetails(false)}>
                    <X className="h-5 w-5" />
                  </Button>
                </div>
                <OrderDetailsCard order={selectedOrder} />
              </div>
            </div>
          </div>
        )}

        {/* Validate Modal */}
        <ValidateOrderModal
          order={selectedOrder}
          open={validateModalOpen}
          onOpenChange={setValidateModalOpen}
          onConfirm={(order) =>
            validateOrder.mutate({ id: order.id })
          }
        />

        {/* Cancel Modal */}
        <CancelOrderModal
          order={selectedOrder}
          open={cancelModalOpen}
          onOpenChange={setCancelModalOpen}
          onConfirm={(order, reason) =>
            cancelOrder.mutate({ id: order.id, data: { reason } })
          }
        />

        {/* Payment Modal */}
        <PaymentModal
          order={selectedOrder}
          open={paymentModalOpen}
          onOpenChange={setPaymentModalOpen}
          onConfirm={(order, data) =>
            createPayment.mutate({ ...data, order: order.id })
          }
        />
      </motion.div>
    </div>
  );
}
