"use client";

import React, { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useProducts, useProductCategories } from "@/hooks/use-products";
import { ProductGrid } from "@/components/products/product-grid";
import { ProductFilters } from "@/components/products/product-filters";
import { motion } from "framer-motion";
import { ShoppingBag } from "lucide-react";

export default function BoutiquePage() {
  const t = useTranslations("shop");
  const { data: products, isLoading } = useProducts();
  const { data: categories = [] } = useProductCategories();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000000]);
  const [showFilters, setShowFilters] = useState(false);

  const maxPrice = useMemo(() => {
    if (!products) return 1000000;
    return Math.max(...products.map(p => p.prix ?? p.price ?? 0), 1000000);
  }, [products]);

  const filteredProducts = useMemo(() => {
    if (!products) return [];

    return products.filter(product => {
      const productName = product.nom ?? product.name ?? "";
      const matchesSearch =
        productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase());
      const productCategory = product.nom_catalogue || product.category;
      const matchesCategory =
        selectedCategory === "" || productCategory === selectedCategory;
      const productPrice = product.prix || product.price || 0;
      const matchesPrice =
        productPrice >= priceRange[0] && productPrice <= priceRange[1];

      return matchesSearch && matchesCategory && matchesPrice;
    });
  }, [products, searchQuery, selectedCategory, priceRange]);

  return (
    <div className="min-h-screen bg-background">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="container mx-auto px-4 py-8"
      >
        <div className="mb-8">
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="flex items-center gap-3 mb-2"
          >
            <ShoppingBag className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold">{t("products")}</h1>
          </motion.div>
          <p className="text-muted-foreground">
            Découvrez notre catalogue complet de dispositifs médicaux
          </p>
        </div>

        <ProductFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          categories={categories}
          priceRange={priceRange}
          onPriceRangeChange={setPriceRange}
          maxPrice={maxPrice}
          showFilters={showFilters}
          onToggleFilters={() => setShowFilters(!showFilters)}
        />

        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">
              {filteredProducts.length}{" "}
              {filteredProducts.length === 1
                ? "produit trouvé"
                : "produits trouvés"}
            </p>
          </div>

          <ProductGrid products={filteredProducts} loading={isLoading} />
        </div>
      </motion.div>
    </div>
  );
}
