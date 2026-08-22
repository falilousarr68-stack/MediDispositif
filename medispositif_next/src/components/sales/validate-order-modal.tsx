"use client";

import React from "react";
import { Order } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CheckCircle, AlertTriangle } from "lucide-react";

interface ValidateOrderModalProps {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (order: Order) => void;
}

export function ValidateOrderModal({
  order,
  open,
  onOpenChange,
  onConfirm,
}: ValidateOrderModalProps) {
  const handleConfirm = () => {
    if (order) {
      onConfirm(order);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Valider la commande
          </DialogTitle>
          <DialogDescription>
            Êtes-vous sûr de vouloir valider cette commande ? Cette action
            décrémentera automatiquement le stock des produits.
          </DialogDescription>
        </DialogHeader>

        {order && (
          <div className="py-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Commande:</span>
              <span className="font-medium">
                #{order.id ? order.id.toString().slice(-8) : "N/A"}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Client:</span>
              <span className="font-medium">
                {order.user
                  ? `${order.user.first_name} ${order.user.last_name}`
                  : "N/A"}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total:</span>
              <span className="font-bold">
                {order.total.toLocaleString()} FCFA
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Articles:</span>
              <span className="font-medium">
                {order.items.length} produit(s)
              </span>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            onClick={handleConfirm}
            className="bg-green-600 hover:bg-green-700"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Confirmer la validation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
