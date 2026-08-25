"use client";

import React from "react";
import { Supply } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, Calendar, Hash, Trash2, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { getMediaUrl } from "@/lib/utils";

interface SupplyTableProps {
  supplies: Supply[];
  onDelete: (id: string) => void;
}

export function SupplyTable({ supplies, onDelete }: SupplyTableProps) {
  const isExpiringSoon = (expiryDate: string) => {
    const expiry = new Date(expiryDate);
    const today = new Date();
    const diffDays = Math.ceil(
      (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    return diffDays <= 30;
  };

  const isExpired = (expiryDate: string) => {
    const expiry = new Date(expiryDate);
    const today = new Date();
    return expiry < today;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Historique des Approvisionnements
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-3 font-medium">Produit</th>
                <th className="text-left p-3 font-medium">Quantité</th>
                <th className="text-left p-3 font-medium">N° Lot</th>
                <th className="text-left p-3 font-medium">Date Péremption</th>
                <th className="text-left p-3 font-medium">Statut</th>
                <th className="text-right p-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {supplies.map((supply, index) => {
                const expired = isExpired(supply.expiry_date);
                const expiringSoon =
                  !expired && isExpiringSoon(supply.expiry_date);
                const product = supply.product;
                const imageUrl = getMediaUrl(
                  product?.image as string | undefined
                );

                return (
                  <motion.tr
                    key={supply.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b hover:bg-muted/50 transition-colors"
                  >
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center text-xl">
                          {imageUrl ? (
                            <img
                              src={imageUrl}
                              alt={product?.nom || product?.name || "Produit"}
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ) : (
                            "💊"
                          )}
                        </div>
                        <div>
                          <p className="font-medium">
                            {product?.nom || product?.name || "Produit inconnu"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {product?.nom_catalogue || product?.category || ""}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{supply.quantity}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <Hash className="h-4 w-4 text-muted-foreground" />
                        <span className="font-mono text-sm">
                          {supply.lot_number}
                        </span>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {format(new Date(supply.expiry_date), "dd MMM yyyy")}
                        </span>
                      </div>
                    </td>
                    <td className="p-3">
                      {expired ? (
                        <Badge variant="destructive" className="gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          Périmé
                        </Badge>
                      ) : expiringSoon ? (
                        <Badge variant="default" className="gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          Proche péremption
                        </Badge>
                      ) : (
                        <Badge variant="outline">Valide</Badge>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(supply.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
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
