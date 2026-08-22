"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import {
  useSupplies,
  useCreateSupply,
  useDeleteSupply,
} from "@/hooks/use-stock";
import { useProducts } from "@/hooks/use-products";
import { SupplyTable } from "@/components/stock/supply-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Plus, Package } from "lucide-react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const supplySchema = z.object({
  product: z.string().min(1, "Veuillez sélectionner un produit"),
  quantity: z.number().min(1, "La quantité doit être positive"),
  lot_number: z.string().min(1, "Le numéro de lot est requis"),
  expiry_date: z.string().min(1, "La date de péremption est requise"),
});

type SupplyFormData = z.infer<typeof supplySchema>;

export default function StockSuppliesPage() {
  const t = useTranslations("stock");
  const locale = useLocale();
  const { data: supplies, isLoading } = useSupplies();
  const { data: products } = useProducts();
  const createSupply = useCreateSupply();
  const deleteSupply = useDeleteSupply();
  const [showForm, setShowForm] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<SupplyFormData>({
    resolver: zodResolver(supplySchema),
  });

  const onSubmit = (data: SupplyFormData) => {
    const product = products?.find(
      item => String(item.idProduit ?? item.id) === data.product
    );
    if (!product) return;

    createSupply.mutate(
      {
        ...data,
        purchase_price: Number(product.prix ?? product.price ?? 0),
      },
      {
        onSuccess: () => {
          reset();
          setShowForm(false);
        },
      }
    );
  };

  const handleDelete = (id: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cet approvisionnement ?")) {
      deleteSupply.mutate(id);
    }
  };

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
          <Link href={`/${locale}/dashboard/stock`}>
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour au tableau de bord
            </Button>
          </Link>
          <h1 className="text-4xl font-bold flex items-center gap-3">
            <Package className="h-8 w-8 text-primary" />
            Approvisionnements
          </h1>
          <p className="text-muted-foreground mt-2">
            Gérer les entrées de stock et les lots
          </p>
        </div>

        <div className="flex justify-end mb-6">
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="h-4 w-4 mr-2" />
            {showForm ? "Fermer" : "Nouvel Approvisionnement"}
          </Button>
        </div>

        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Card className="max-w-2xl mx-auto">
              <CardHeader>
                <CardTitle>Nouvel Approvisionnement</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="product">Produit *</Label>
                    <select
                      id="product"
                      {...register("product")}
                      className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${errors.product ? "border-destructive" : ""}`}
                    >
                      <option value="">Sélectionner un produit</option>
                      {products?.map(product => {
                        const productId = product.idProduit ?? product.id;
                        return (
                          <option key={productId} value={productId}>
                            {product.nom || product.name} (Stock actuel:{" "}
                            {product.stock})
                          </option>
                        );
                      })}
                    </select>
                    {errors.product && (
                      <p className="text-sm text-destructive">
                        {errors.product.message}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="quantity">Quantité *</Label>
                      <Input
                        id="quantity"
                        type="number"
                        placeholder="100"
                        {...register("quantity", { valueAsNumber: true })}
                        className={errors.quantity ? "border-destructive" : ""}
                      />
                      {errors.quantity && (
                        <p className="text-sm text-destructive">
                          {errors.quantity.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="lot_number">Numéro de lot *</Label>
                      <Input
                        id="lot_number"
                        placeholder="LOT-2024-001"
                        {...register("lot_number")}
                        className={
                          errors.lot_number ? "border-destructive" : ""
                        }
                      />
                      {errors.lot_number && (
                        <p className="text-sm text-destructive">
                          {errors.lot_number.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="expiry_date">Date de péremption *</Label>
                    <Input
                      id="expiry_date"
                      type="date"
                      {...register("expiry_date")}
                      className={errors.expiry_date ? "border-destructive" : ""}
                    />
                    {errors.expiry_date && (
                      <p className="text-sm text-destructive">
                        {errors.expiry_date.message}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-4 pt-4">
                    <Button
                      type="submit"
                      className="flex-1"
                      disabled={isSubmitting || createSupply.isPending}
                    >
                      {isSubmitting || createSupply.isPending
                        ? "Enregistrement..."
                        : "Enregistrer"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        reset();
                        setShowForm(false);
                      }}
                      className="flex-1"
                    >
                      Annuler
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {supplies && (
          <SupplyTable supplies={supplies} onDelete={handleDelete} />
        )}
      </motion.div>
    </div>
  );
}
