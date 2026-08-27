"use client";

import React, { useState, useEffect } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import {
  User,
  Mail,
  Phone,
  Building,
  Edit,
  Save,
  BarChart3,
  PieChart,
  FileText,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// Composants CSS/SVG simples pour les diagrammes (sans dépendance recharts)

const profileSchema = z.object({
  nom: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  prenom: z.string().min(2, "Le prénom doit contenir au moins 2 caractères"),
  email: z.string().email("Email invalide"),
  telephone: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

// Composant simple de diagramme en barres horizontales CSS
const SimpleBarChart = ({
  data,
}: {
  data: Array<{ name: string; sold: number; total: number }>;
}) => {
  const maxValue = Math.max(...data.map(d => d.total), 1);

  return (
    <div className="space-y-4">
      {data.map((item, index) => (
        <div key={index} className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium">{item.name}</span>
            <span className="text-muted-foreground">
              {item.sold} / {item.total}
            </span>
          </div>
          <div className="h-8 bg-muted rounded-lg overflow-hidden flex">
            <div
              className="bg-primary transition-all duration-500 ease-out"
              style={{ width: `${(item.sold / maxValue) * 100}%` }}
            />
            <div
              className="bg-muted-foreground/20 transition-all duration-500 ease-out"
              style={{
                width: `${((item.total - item.sold) / maxValue) * 100}%`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

// Composant de diagramme en bandes verticales (style géographie)
const SimpleVerticalBarChart = ({
  data,
}: {
  data: Array<{ name: string; sold: number; total: number }>;
}) => {
  const maxValue = Math.max(...data.map(d => d.total), 1);

  if (data.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">Aucun produit à afficher.</p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="max-h-[32rem] space-y-3 overflow-y-auto pr-2">
        {data.map((item, index) => {
          const soldWidth = (item.sold / maxValue) * 100;
          const remaining = Math.max(item.total - item.sold, 0);
          const remainingWidth = (remaining / maxValue) * 100;

          return (
            <div key={index} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="font-medium truncate flex-1">{item.name}</span>
                <span className="text-muted-foreground">
                  {item.sold}/{item.total}
                </span>
              </div>
              <div className="flex h-8 rounded-lg overflow-hidden bg-muted">
                <div
                  className="bg-green-500 transition-all duration-500 ease-out flex items-center justify-center text-xs text-white font-medium"
                  style={{ width: `${soldWidth}%` }}
                >
                  {soldWidth > 10 ? item.sold : ""}
                </div>
                <div
                  className="bg-blue-500 transition-all duration-500 ease-out flex items-center justify-center text-xs text-white font-medium"
                  style={{ width: `${remainingWidth}%` }}
                >
                  {remainingWidth > 10 ? remaining : ""}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex gap-4 justify-center text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded"></div>
          <span>Produits vendus</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-500 rounded"></div>
          <span>Stock restant</span>
        </div>
      </div>
    </div>
  );
};

// Composant simple de diagramme circulaire CSS
const SimplePieChart = ({
  data,
}: {
  data: Array<{ name: string; value: number; color: string }>;
}) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  let currentAngle = 0;

  if (total === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Aucune vente ou stock enregistré.
      </p>
    );
  }

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative w-48 h-48">
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full transform -rotate-90"
        >
          {data.map((item, index) => {
            const percentage = item.value / total;
            const dashArray = `${percentage * circumference} ${circumference}`;
            const angle = currentAngle * 360;
            currentAngle += percentage;

            return (
              <circle
                key={index}
                cx="50"
                cy="50"
                r={radius}
                fill="transparent"
                stroke={item.color}
                strokeWidth="20"
                strokeDasharray={dashArray}
                strokeDashoffset={`-${(angle * circumference) / 360}`}
                className="transition-all duration-500"
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl font-bold">{total}</div>
            <div className="text-xs text-muted-foreground">Total</div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 w-full">
        {data.map((item, index) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span>
              {item.name}: {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function ProfilePage() {
  const router = useRouter();
  const locale = useLocale();
  const [user, setUser] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [salesData, setSalesData] = useState<
    Array<{ name: string; sold: number; total: number }>
  >([]);
  const [pieData, setPieData] = useState<
    Array<{ name: string; value: number; color: string }>
  >([]);
  const [loadingStats, setLoadingStats] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0); // Clé pour forcer le rafraîchissement

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  });

  // Fonction pour rafraîchir les statistiques
  const refreshStatistics = () => {
    setRefreshKey(prev => prev + 1);
  };

  // Récupérer les statistiques depuis l'API
  useEffect(() => {
    const fetchStatistics = async () => {
      if (user?.role === "Administrateur") {
        setLoadingStats(true);
        try {
          const token = localStorage.getItem("access_token");
          const response = await fetch(
            "http://127.0.0.1:8000/api/catalogue/statistiques/produits/",
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          );

          if (response.ok) {
            const data = await response.json();
            const stats = Array.isArray(data.statistiques)
              ? data.statistiques
              : [];
            console.log("Statistiques reçues:", stats);

            // Transformer les données pour le diagramme en barres (par produit)
            const barChartData = stats.map((stat: any) => {
              const sold = Number(stat.quantite_commandee ?? 0);
              const remaining = Number(stat.stock_actuel ?? 0);

              return {
                name: stat.nom || "Produit sans nom",
                sold,
                total: remaining + sold,
              };
            });

            // Calculer les totaux pour le diagramme circulaire (global catalogue)
            const totalSold = stats.reduce(
              (sum: number, stat: any) =>
                sum + Number(stat.quantite_commandee ?? 0),
              0
            );
            const totalStock = stats.reduce(
              (sum: number, stat: any) =>
                sum +
                Number(stat.stock_actuel ?? 0) +
                Number(stat.quantite_commandee ?? 0),
              0
            );
            const remainingStock = Math.max(totalStock - totalSold, 0);

            const pieChartData = [
              { name: "Produits vendus", value: totalSold, color: "#10B981" }, // Vert émeraude
              {
                name: "Stock restant",
                value: remainingStock,
                color: "#3B82F6",
              }, // Bleu royal
            ];

            setSalesData(barChartData);
            setPieData(pieChartData);
          } else {
            console.error(
              "Erreur lors de la récupération des statistiques:",
              response.status
            );
            // Utiliser des données par défaut en cas d'erreur
            setDefaultData();
          }
        } catch (error) {
          console.error("Erreur:", error);
          setDefaultData();
        } finally {
          setLoadingStats(false);
        }
      } else {
        setDefaultData();
      }
    };

    fetchStatistics();
  }, [user?.role, refreshKey]); // Dépend aussi de refreshKey pour forcer le rafraîchissement

  const setDefaultData = () => {
    const defaultSalesData = [{ name: "Général", sold: 0, total: 0 }];

    const defaultPieData = [
      { name: "Produits vendus", value: 0, color: "#10B981" },
      { name: "Stock restant", value: 0, color: "#3B82F6" },
    ];

    setSalesData(defaultSalesData);
    setPieData(defaultPieData);
  };

  useEffect(() => {
    setMounted(true);
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const userData = JSON.parse(userStr);
      // Récupérer la photo de profil séparément si elle existe (clé spécifique à l'utilisateur)
      const photoKey = `user_photo_${userData.email}`;
      const photoData = localStorage.getItem(photoKey);
      if (photoData) {
        userData.photo = photoData;
        console.log("Photo de profil restaurée pour:", userData.email);
      }
      setUser(userData);
      reset({
        nom: userData.nom || "",
        prenom: userData.prenom || "",
        email: userData.email || "",
        telephone: userData.telephone || "",
      });
    }
  }, [reset]);

  if (!mounted) {
    return null;
  }

  const onSubmit = async (data: ProfileFormData) => {
    try {
      // Mise à jour locale pour l'instant (API backend à implémenter)
      const updatedUser = { ...user, ...data };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);
      setIsEditing(false);
      toast.success("Profil mis à jour", {
        description: "✅ Vos informations ont été mises à jour avec succès",
      });
    } catch (error) {
      toast.error("Erreur de mise à jour", {
        description: "❌ Impossible de mettre à jour votre profil",
      });
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (user) {
      reset({
        nom: user.nom || "",
        prenom: user.prenom || "",
        email: user.email || "",
        telephone: user.telephone || "",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="container mx-auto px-4 py-8"
      >
        <h1 className="text-4xl font-bold mb-8">Mon Profil</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Informations utilisateur */}
          <div
            className={`${user?.role === "Administrateur" ? "lg:col-span-1" : "lg:col-span-3"} space-y-6`}
          >
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Informations Personnelles
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center mb-6">
                    <div className="relative mb-4">
                      <div className="w-24 h-24 bg-primary rounded-full flex items-center justify-center text-white text-4xl font-bold overflow-hidden">
                        {user?.photo ? (
                          <img
                            src={user.photo}
                            alt={`${user?.prenom} ${user?.nom}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span>{user?.nom?.[0] || "U"}</span>
                        )}
                      </div>
                      <label
                        htmlFor="photo-upload"
                        className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full cursor-pointer hover:bg-primary/90 transition-colors"
                      >
                        <Edit className="h-4 w-4" />
                      </label>
                      <input
                        id="photo-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              const photoData = reader.result as string;
                              // Stocker la photo séparément avec une clé spécifique à l'utilisateur
                              const photoKey = `user_photo_${user?.email}`;
                              localStorage.setItem(photoKey, photoData);
                              const updatedUser = { ...user, photo: photoData };
                              localStorage.setItem(
                                "user",
                                JSON.stringify(updatedUser)
                              );
                              setUser(updatedUser);
                              console.log(
                                "Photo de profil sauvegardée pour:",
                                user?.email
                              );
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </div>
                    <h3 className="text-xl font-semibold">
                      {user?.prenom} {user?.nom}
                    </h3>
                    <p className="text-muted-foreground">{user?.role}</p>
                  </div>

                  {isEditing ? (
                    <form
                      onSubmit={handleSubmit(onSubmit)}
                      className="space-y-4"
                    >
                      <div>
                        <Label htmlFor="nom">Nom</Label>
                        <Input
                          id="nom"
                          {...register("nom")}
                          error={errors.nom?.message}
                        />
                      </div>
                      <div>
                        <Label htmlFor="prenom">Prénom</Label>
                        <Input
                          id="prenom"
                          {...register("prenom")}
                          error={errors.prenom?.message}
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          {...register("email")}
                          error={errors.email?.message}
                        />
                      </div>
                      <div>
                        <Label htmlFor="telephone">Téléphone</Label>
                        <Input
                          id="telephone"
                          {...register("telephone")}
                          error={errors.telephone?.message}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button type="submit" disabled={isSubmitting}>
                          <Save className="h-4 w-4 mr-2" />
                          Enregistrer
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleCancel}
                        >
                          Annuler
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <Mail className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Email</p>
                          <p className="font-medium">{user?.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Phone className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Téléphone
                          </p>
                          <p className="font-medium">
                            {user?.telephone || "Non renseigné"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Building className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Rôle</p>
                          <p className="font-medium">{user?.role}</p>
                        </div>
                      </div>
                      <Button
                        onClick={() => setIsEditing(true)}
                        className="w-full"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Modifier le profil
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Bouton rapport administrateur */}
            {user?.role === "Administrateur" && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="bg-primary/5 border-primary/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Actions Administrateur
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Button
                      onClick={() => router.push(`/${locale}/dashboard/admin`)}
                      className="w-full"
                    >
                      Retour au tableau de bord
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>

          {/* Statistiques - Uniquement pour l'administrateur */}
          {user?.role === "Administrateur" && (
            <div className="lg:col-span-2 space-y-6">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        Produits Vendus vs Stock Total par Produit
                      </CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={refreshStatistics}
                        disabled={loadingStats}
                        title="Rafraîchir les statistiques"
                      >
                        <RefreshCw
                          className={`h-4 w-4 ${loadingStats ? "animate-spin" : ""}`}
                        />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {loadingStats ? (
                      <div className="flex items-center justify-center h-64">
                        <p className="text-muted-foreground">
                          Chargement des statistiques...
                        </p>
                      </div>
                    ) : (
                      <SimpleVerticalBarChart data={salesData} />
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <PieChart className="h-5 w-5" />
                        Répartition des Ventes sur le Stock Total du Catalogue
                      </CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={refreshStatistics}
                        disabled={loadingStats}
                        title="Rafraîchir les statistiques"
                      >
                        <RefreshCw
                          className={`h-4 w-4 ${loadingStats ? "animate-spin" : ""}`}
                        />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {loadingStats ? (
                      <div className="flex items-center justify-center h-64">
                        <p className="text-muted-foreground">
                          Chargement des statistiques...
                        </p>
                      </div>
                    ) : (
                      <SimplePieChart data={pieData} />
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
