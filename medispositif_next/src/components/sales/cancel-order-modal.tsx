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
import { XCircle, AlertTriangle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const cancelSchema = z.object({
  reason: z.string().min(10, "Le motif doit contenir au moins 10 caractères"),
});

type CancelFormData = z.infer<typeof cancelSchema>;

interface CancelOrderModalProps {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (order: Order, reason: string) => void;
}

export function CancelOrderModal({
  order,
  open,
  onOpenChange,
  onConfirm,
}: CancelOrderModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CancelFormData>({
    resolver: zodResolver(cancelSchema),
  });

  const onSubmit = (data: CancelFormData) => {
    if (order) {
      onConfirm(order, data.reason);
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
            <XCircle className="h-5 w-5 text-red-600" />
            Annuler la commande
          </DialogTitle>
          <DialogDescription>
            Attention : cette action est irréversible. Veuillez indiquer le
            motif de l'annulation.
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
              <span className="text-muted-foreground">Total:</span>
              <span className="font-bold">
                {orderTotal.toLocaleString()} FCFA
              </span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reason">Motif de l'annulation *</Label>
            <textarea
              id="reason"
              placeholder="Veuillez expliquer pourquoi cette commande est annulée..."
              {...register("reason")}
              className={`flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${errors.reason ? "border-destructive" : ""}`}
            />
            {errors.reason && (
              <p className="text-sm text-destructive">
                {errors.reason.message}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Annuler
            </Button>
            <Button type="submit" variant="destructive">
              <XCircle className="h-4 w-4 mr-2" />
              Confirmer l'annulation
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
