"use client";

import React from "react";
import { Order } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CreditCard } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const paymentSchema = z.object({
  amount: z.number().min(1, "Le montant doit être positif"),
  method: z.enum(["cash", "card", "mobile_money", "check"]),
  reference: z.string().optional(),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

interface PaymentModalProps {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (order: Order, data: PaymentFormData) => void;
}

export function PaymentModal({
  order,
  open,
  onOpenChange,
  onConfirm,
}: PaymentModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: order?.total || 0,
    },
  });

  const onSubmit = (data: PaymentFormData) => {
    if (order) {
      onConfirm(order, data);
      reset();
      onOpenChange(false);
    }
  };

  const handleClose = () => {
    reset();
    onOpenChange(false);
  };

  const orderId = order?.id || "";
  const orderTotal = order?.total || 0;
  const userFirstName = order?.user?.first_name || "";
  const userLastName = order?.user?.last_name || "";

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Enregistrer un paiement
          </DialogTitle>
          <DialogDescription>
            Enregistrez le paiement pour cette commande
          </DialogDescription>
        </DialogHeader>

        {order && (
          <div className="py-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Commande:</span>
              <span className="font-medium">#{String(orderId).slice(-8)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Client:</span>
              <span className="font-medium">
                {userFirstName} {userLastName}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total à payer:</span>
              <span className="font-bold text-primary">
                {orderTotal.toLocaleString()} FCFA
              </span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Montant (FCFA) *</Label>
            <Input
              id="amount"
              type="number"
              placeholder="5000"
              {...register("amount", { valueAsNumber: true })}
              className={errors.amount ? "border-destructive" : ""}
            />
            {errors.amount && (
              <p className="text-sm text-destructive">
                {errors.amount.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Mode de paiement *</Label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: "cash", label: "Espèces 💵", icon: "💵" },
                { value: "card", label: "Carte 💳", icon: "💳" },
                { value: "mobile_money", label: "Mobile Money 📱", icon: "📱" },
                { value: "check", label: "Chèque 📄", icon: "📄" },
              ].map(method => (
                <div key={method.value}>
                  <input
                    type="radio"
                    id={method.value}
                    value={method.value}
                    {...register("method")}
                    className="sr-only peer"
                  />
                  <Label
                    htmlFor={method.value}
                    className="flex items-center justify-center gap-2 p-3 border-2 rounded-lg cursor-pointer peer-checked:border-primary peer-checked:bg-primary/5 transition-all"
                  >
                    <span className="text-xl">{method.icon}</span>
                    <span className="font-medium text-sm">{method.label}</span>
                  </Label>
                </div>
              ))}
            </div>
            {errors.method && (
              <p className="text-sm text-destructive">
                {errors.method.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="reference">Référence (optionnel)</Label>
            <Input
              id="reference"
              placeholder="Numéro de transaction, chèque, etc."
              {...register("reference")}
              className={errors.reference ? "border-destructive" : ""}
            />
            {errors.reference && (
              <p className="text-sm text-destructive">
                {errors.reference.message}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Annuler
            </Button>
            <Button type="submit">
              <CreditCard className="h-4 w-4 mr-2" />
              Enregistrer le paiement
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
