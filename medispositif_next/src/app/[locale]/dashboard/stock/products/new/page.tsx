"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCreateProduct } from "@/hooks/use-stock";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { motion } from "framer-motion";
import { ImageUpload } from "@/components/stock/image-upload";

const productSchema = z.object({
  nom: z.string().min(3, "Le nom doit contenir au moins 3 caractères"),
  description: z
    .string()
    .min(10, "La description doit contenir au moins 10 caractères"),
  prix: z.number().min(0, "Le prix doit être positif"),
  stock: z.number().min(0, "Le stock doit être positif"),
  idCatalogue: z.string().min(1, "Le catalogue est requis"),
  image: z.any().optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

export default function NewProductPage() {
  const t = useTranslations("stock");
  const locale = useLocale();
  const createProduct = useCreateProduct();
  const [imageFile, setImageFile] = useState<File | undefined>();
  const [userRole, setUserRole] = useState<string>("");

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const user = JSON.parse(userStr);
      setUserRole(user.role || "");
    }
  }, []);

  const getDashboardPath = () => {
    switch (userRole) {
      case "Administrateur":
        return `/${locale}/dashboard/admin`;
      case "ResponsableCommercial":
        return `/${locale}/dashboard/commercial`;
      case "Vendeur":
        return `/${locale}/dashboard/vendeur`;
      case "GestionnaireDeStock":
        return `/${locale}/dashboard/stock`;
      default:
        return `/${locale}/dashboard/stock`;
    }
  };

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
  });

  const onSubmit = (data: ProductFormData) => {
    // Créer FormData pour l'upload de fichier
    const formData = new FormData();
    formData.append("nom", data.nom);
    formData.append("description", data.description);
    formData.append("prix", data.prix.toString());
    formData.append("stock", data.stock.toString());
    formData.append("idCatalogue", data.idCatalogue);

    if (imageFile) {
      formData.append("image", imageFile);
    }

    createProduct.mutate(formData);
  };

  return (
    <div className="min-h-screen bg-background">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="container mx-auto px-4 py-8"
      >
        <div className="mb-8">
          <Link href={`/${locale}/dashboard/stock/products`}>
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour aux produits
            </Button>
          </Link>
          <h1 className="text-4xl font-bold">Nouveau Produit</h1>
          <p className="text-muted-foreground mt-2">
            Ajouter un nouveau produit au catalogue
          </p>
        </div>

        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Informations du Produit</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="nom">Nom du produit *</Label>
                <Input
                  id="nom"
                  placeholder="Ex: Paracétamol 500mg"
                  {...register("nom")}
                  className={errors.nom ? "border-destructive" : ""}
                />
                {errors.nom && (
                  <p className="text-sm text-destructive">
                    {errors.nom.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <textarea
                  id="description"
                  placeholder="Description détaillée du produit..."
                  {...register("description")}
                  className={`flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${errors.description ? "border-destructive" : ""}`}
                />
                {errors.description && (
                  <p className="text-sm text-destructive">
                    {errors.description.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="prix">Prix (FCFA) *</Label>
                  <Input
                    id="prix"
                    type="number"
                    placeholder="5000"
                    {...register("prix", { valueAsNumber: true })}
                    className={errors.prix ? "border-destructive" : ""}
                  />
                  {errors.prix && (
                    <p className="text-sm text-destructive">
                      {errors.prix.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stock">Stock initial *</Label>
                  <Input
                    id="stock"
                    type="number"
                    placeholder="100"
                    {...register("stock", { valueAsNumber: true })}
                    className={errors.stock ? "border-destructive" : ""}
                  />
                  {errors.stock && (
                    <p className="text-sm text-destructive">
                      {errors.stock.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="idCatalogue">Catalogue *</Label>
                <select
                  id="idCatalogue"
                  {...register("idCatalogue")}
                  className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${errors.idCatalogue ? "border-destructive" : ""}`}
                >
                  <option value="1">Général</option>
                </select>
                {errors.idCatalogue && (
                  <p className="text-sm text-destructive">
                    {typeof errors.idCatalogue.message === "string"
                      ? errors.idCatalogue.message
                      : "Le catalogue est requis"}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Image du produit (optionnel)</Label>
                <ImageUpload
                  value={imageFile}
                  onChange={setImageFile}
                  error={
                    typeof errors.image?.message === "string"
                      ? errors.image.message
                      : undefined
                  }
                />
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={isSubmitting || createProduct.isPending}
                >
                  {isSubmitting || createProduct.isPending
                    ? "Création..."
                    : "Créer le produit"}
                </Button>
                <Link href={getDashboardPath()} className="flex-1">
                  <Button type="button" variant="outline" className="w-full">
                    Annuler
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
