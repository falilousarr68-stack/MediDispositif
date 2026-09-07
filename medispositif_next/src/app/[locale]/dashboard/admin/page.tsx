"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import {
  useUsers,
  useCreateUser,
  useDeleteUser,
  useOrders,
  useValidateOrder,
  useCancelOrder,
  usePayments,
  useInvoices,
  useReports,
  useCreateReport,
} from "@/hooks/use-admin";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import {
  Users,
  Shield,
  Plus,
  Trash2,
  Edit,
  Package,
  ShoppingCart,
  FileText,
  CreditCard,
  Settings,
  BarChart3,
  Home,
  ChevronRight,
  CheckCircle,
  XCircle,
  Sun,
  Moon,
  Monitor,
} from "lucide-react";
import { CreateUserDialog } from "@/components/admin/create-user-dialog";
import { UserTable } from "@/components/admin/user-table";
import Link from "next/link";
import { useLocale } from "next-intl";
import { toast } from "sonner";
import api from "@/lib/axios";

type AdminSection =
  | "dashboard"
  | "users"
  | "catalogue"
  | "commandes"
  | "paiements"
  | "factures"
  | "rapports"
  | "parametres";

export default function AdminDashboardPage() {
  const t = useTranslations("admin");
  const locale = useLocale();
  const router = useRouter();

  // Données React Query gardées (données complexes qui bénéficient du cache)
  const { data: users, isLoading, refetch } = useUsers();
  const { data: orders } = useOrders();
  const { data: payments, refetch: refetchPayments } = usePayments();
  const { data: invoices } = useInvoices();
  const { data: reports } = useReports();

  // Mutations React Query gardées
  const createUserMutation = useCreateUser();
  const deleteUserMutation = useDeleteUser();
  const validateOrderMutation = useValidateOrder();
  const cancelOrderMutation = useCancelOrder();
  const createReportMutation = useCreateReport();

  const downloadReport = async (reportId: number) => {
    try {
      const response = await api.get(
        `api/systeme/rapports/${reportId}/telecharger/`,
        { responseType: "blob" }
      );
      const url = URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = url;
      link.download = `rapport-ventes-${reportId}.html`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading report:", error);
      toast.error("Impossible de télécharger le rapport");
    }
  };

  // Données migrées vers useState/useEffect (données simples)

  // États locaux
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<AdminSection>("dashboard");

  const changeLocale = (newLocale: "fr" | "en") => {
    const pathWithoutLocale = window.location.pathname.replace(
      /^\/(fr|en)(?=\/|$)/,
      ""
    );
    router.push(`/${newLocale}${pathWithoutLocale || "/"}`);
  };

  useEffect(() => {
    if (activeSection === "paiements") {
      refetchPayments();
    }
  }, [activeSection, refetchPayments]);

  // Initialiser le thème au chargement
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else if (savedTheme === "light") {
      document.documentElement.classList.remove("dark");
    } else if (savedTheme === "system" || !savedTheme) {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";
      if (systemTheme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  }, []);

  const handleCreateUser = async (userData: any) => {
    try {
      console.log("Creating user with form data:", userData);

      // Adapter les données au format backend
      const adaptedData = {
        email: userData.email,
        motdepasse: userData.motdepasse,
        confirmation_motdepasse: userData.confirmation_motdepasse,
        prenom: userData.prenom,
        nom: userData.nom,
        telephone: userData.telephone,
        role: userData.role,
      };

      console.log("Sending adapted data to API:", adaptedData);

      await createUserMutation.mutateAsync(adaptedData);
      setIsCreateDialogOpen(false);
      refetch();
      toast.success("Utilisateur créé avec succès");
    } catch (error: any) {
      console.error("Error creating user:", error);
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.message ||
        "Erreur lors de la création de l'utilisateur";
      toast.error(errorMessage);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur ?")) {
      try {
        await deleteUserMutation.mutateAsync(userId);
        refetch();
        toast.success("Utilisateur supprimé avec succès");
      } catch (error) {
        console.error("Error deleting user:", error);
        toast.error("Erreur lors de la suppression de l'utilisateur");
      }
    }
  };

  const sections = [
    {
      id: "dashboard" as AdminSection,
      icon: Home,
      label: t("dashboard"),
      href: "",
    },
    {
      id: "users" as AdminSection,
      icon: Users,
      label: t("users"),
      href: "",
    },
    {
      id: "catalogue" as AdminSection,
      icon: Package,
      label: t("catalogue"),
      href: `/${locale}/dashboard/stock/products`,
    },
    {
      id: "commandes" as AdminSection,
      icon: ShoppingCart,
      label: t("orders"),
      href: "",
    },
    {
      id: "paiements" as AdminSection,
      icon: CreditCard,
      label: t("payments"),
      href: "",
    },
    {
      id: "factures" as AdminSection,
      icon: FileText,
      label: t("invoices"),
      href: "",
    },
    {
      id: "rapports" as AdminSection,
      icon: BarChart3,
      label: "Rapports",
      href: "",
    },
    {
      id: "parametres" as AdminSection,
      icon: Settings,
      label: t("settings"),
      href: "",
    },
  ];

  const renderSection = () => {
    switch (activeSection) {
      case "dashboard":
        return (
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Utilisateurs
                  </CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{users?.length || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    Utilisateurs actifs
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Produits
                  </CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">-</div>
                  <p className="text-xs text-muted-foreground">
                    Produits en catalogue
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Commandes
                  </CardTitle>
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {orders?.length || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Commandes totales
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Revenus</CardTitle>
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">-</div>
                  <p className="text-xs text-muted-foreground">
                    Revenus totaux
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Accès Administrateur
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    En tant qu'administrateur, vous avez accès à toutes les
                    fonctionnalités du système :
                  </p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <ChevronRight className="h-4 w-4 text-primary" />
                      Gestion complète des utilisateurs
                    </li>
                    <li className="flex items-center gap-2">
                      <ChevronRight className="h-4 w-4 text-primary" />
                      Catalogue (lecture et écriture)
                    </li>
                    <li className="flex items-center gap-2">
                      <ChevronRight className="h-4 w-4 text-primary" />
                      Commandes (lecture, création, validation, annulation)
                    </li>
                    <li className="flex items-center gap-2">
                      <ChevronRight className="h-4 w-4 text-primary" />
                      Gestion des paiements et factures
                    </li>
                    <li className="flex items-center gap-2">
                      <ChevronRight className="h-4 w-4 text-primary" />
                      Paramètres système
                    </li>
                    <li className="flex items-center gap-2">
                      <ChevronRight className="h-4 w-4 text-primary" />
                      Rapports (lecture et création)
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        );

      case "users":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Gestion des Utilisateurs
                  </CardTitle>
                  <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nouvel Utilisateur
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8">Chargement...</div>
                ) : (
                  <UserTable users={users || []} onDelete={handleDeleteUser} />
                )}
              </CardContent>
            </Card>
            <CreateUserDialog
              open={isCreateDialogOpen}
              onOpenChange={setIsCreateDialogOpen}
              onSubmit={handleCreateUser}
            />
          </motion.div>
        );

      case "catalogue":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Gestion du Catalogue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">
                    Accès complet au catalogue : lecture et écriture
                  </p>
                  <Link href={`/${locale}/dashboard/stock/products`}>
                    <Button>
                      <Package className="h-4 w-4 mr-2" />
                      Gérer les Produits
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );

      case "commandes":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Gestion des Commandes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        if (orders && orders.length > 0) {
                          toast.success(`${orders.length} commandes trouvées`);
                        } else {
                          toast.info("Aucune commande trouvée");
                        }
                      }}
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Voir toutes les commandes ({orders?.length || 0})
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        toast.info(
                          "Pour créer une commande, allez dans la boutique"
                        );
                        router.push(`/${locale}/boutique`);
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Créer une commande
                    </Button>
                  </div>

                  {orders && orders.length > 0 ? (
                    <div className="space-y-2 mt-4">
                      <h3 className="font-semibold">Commandes récentes:</h3>
                      {orders.slice(0, 5).map((order: any) => {
                        const orderId = order.idCommande || order.id;
                        return (
                          <div
                            key={orderId}
                            className="flex items-center justify-between p-3 bg-muted rounded-lg"
                          >
                            <div>
                              <p className="font-medium">Commande #{orderId}</p>
                              <p className="text-sm text-muted-foreground">
                                Client: {order.nom_client || order.email_client}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Statut: {order.statut || order.status}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Mode de paiement:{" "}
                                {order.mode_paiement_display ||
                                  order.mode_paiement ||
                                  "Non spécifié"}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Total: {order.montant_total || order.total} FCFA
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  validateOrderMutation
                                    .mutateAsync(orderId.toString())
                                    .then(() => {
                                      toast.success("Commande validée");
                                      refetch();
                                      refetchPayments();
                                    })
                                    .catch(error => {
                                      console.error(
                                        "Error validating order:",
                                        error
                                      );
                                      const errorMessage =
                                        error.response?.data?.error ||
                                        error.message ||
                                        "Erreur de validation";
                                      toast.error(errorMessage);
                                    });
                                }}
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  cancelOrderMutation
                                    .mutateAsync({
                                      orderId: orderId.toString(),
                                      motif: "Annulée par l'administrateur",
                                    })
                                    .then(() =>
                                      toast.success("Commande annulée")
                                    )
                                    .catch(() =>
                                      toast.error("Erreur d'annulation")
                                    );
                                }}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      Aucune commande trouvée
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );

      case "paiements":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Gestion des Paiements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    Total des paiements: {payments?.length || 0}
                  </p>
                  {payments && payments.length > 0 && (
                    <div className="space-y-2">
                      {payments.slice(0, 5).map((payment: any) => (
                        <div
                          key={payment.idPaiement || payment.id}
                          className="p-3 bg-muted rounded-lg"
                        >
                          <p className="font-medium">
                            Paiement #{payment.idPaiement || payment.id}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Montant: {payment.montant || payment.amount} FCFA
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Méthode:{" "}
                            {payment.mode_paiement_display ||
                              payment.mode_paiement ||
                              payment.methode ||
                              payment.method ||
                              "Non spécifié"}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );

      case "factures":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Gestion des Factures
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    Total des factures: {invoices?.length || 0}
                  </p>
                  {invoices && invoices.length > 0 && (
                    <div className="space-y-2">
                      {invoices.slice(0, 5).map((invoice: any) => (
                        <div
                          key={invoice.id}
                          className="p-3 bg-muted rounded-lg"
                        >
                          <p className="font-medium">
                            Facture #{invoice.numero || invoice.id}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Montant:{" "}
                            {invoice.montant ??
                              invoice.montant_total ??
                              invoice.total ??
                              0}{" "}
                            FCFA
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Date: {invoice.date_emission || invoice.date}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );

      case "rapports":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Rapports et Statistiques
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    Total des rapports: {reports?.length || 0}
                  </p>

                  <div className="p-3 bg-muted rounded-lg">
                    <p className="font-medium">Type de rapport : Ventes</p>
                    <p className="text-sm text-muted-foreground">
                      Chaque fichier contient le détail des commandes, clients,
                      produits, quantités, paiements et montants.
                    </p>
                  </div>

                  {reports && reports.length > 0 && (
                    <div className="space-y-2 mt-4">
                      <h3 className="font-semibold">Rapports récents:</h3>
                      {reports.slice(0, 5).map((report: any) => (
                        <div
                          key={report.idRapport}
                          className="p-3 bg-muted rounded-lg"
                        >
                          <p className="font-medium">{report.titre}</p>
                          <p className="text-sm text-muted-foreground">
                            Type: {report.type_rapport}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Date: {report.date_generation}
                          </p>
                          {report.chemin_acces_url && (
                            <button
                              type="button"
                              onClick={() => downloadReport(report.idRapport)}
                              className="mt-2 inline-block text-sm font-medium text-primary hover:underline"
                            >
                              Télécharger le rapport
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <Button
                    className="w-full"
                    onClick={() => {
                      createReportMutation
                        .mutateAsync({
                          titre: `Rapport des ventes - ${new Date().toLocaleDateString("fr-FR")}`,
                          type_rapport: "Ventes",
                        })
                        .then(() => toast.success("Rapport créé"))
                        .catch(error => {
                          console.error("Error creating report:", error);
                          toast.error("Erreur de création");
                        });
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {createReportMutation.isPending
                      ? "Génération en cours..."
                      : "Créer un rapport des ventes"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );

      case "parametres":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Paramètres
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Préférences d'affichage */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Thème</h3>
                    <p className="text-sm text-muted-foreground">
                      Choisissez votre préférence d'affichage
                    </p>

                    <div className="grid gap-3">
                      <button
                        className="flex items-center gap-3 p-4 rounded-lg border hover:bg-muted transition-colors"
                        onClick={() => {
                          document.documentElement.classList.remove("dark");
                          localStorage.setItem("theme", "light");
                        }}
                      >
                        <Sun className="h-5 w-5" />
                        <span className="font-medium">Clair</span>
                      </button>

                      <button
                        className="flex items-center gap-3 p-4 rounded-lg border hover:bg-muted transition-colors"
                        onClick={() => {
                          document.documentElement.classList.add("dark");
                          localStorage.setItem("theme", "dark");
                        }}
                      >
                        <Moon className="h-5 w-5" />
                        <span className="font-medium">Sombre</span>
                      </button>

                      <button
                        className="flex items-center gap-3 p-4 rounded-lg border hover:bg-muted transition-colors"
                        onClick={() => {
                          const systemTheme = window.matchMedia(
                            "(prefers-color-scheme: dark)"
                          ).matches
                            ? "dark"
                            : "light";
                          if (systemTheme === "dark") {
                            document.documentElement.classList.add("dark");
                          } else {
                            document.documentElement.classList.remove("dark");
                          }
                          localStorage.setItem("theme", "system");
                        }}
                      >
                        <Monitor className="h-5 w-5" />
                        <span className="font-medium">Système</span>
                      </button>
                    </div>
                  </div>

                  {/* Changement de langue */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">{t("language")}</h3>
                    <p className="text-sm text-muted-foreground">
                      {t("chooseLanguage")}
                    </p>

                    <div className="grid gap-3">
                      <button
                        className={`flex items-center gap-3 p-4 rounded-lg border hover:bg-muted transition-colors ${locale === "fr" ? "bg-primary/10 border-primary" : ""}`}
                        onClick={() => changeLocale("fr")}
                      >
                        <span className="text-2xl">🇫🇷</span>
                        <span className="font-medium">Français</span>
                      </button>

                      <button
                        className={`flex items-center gap-3 p-4 rounded-lg border hover:bg-muted transition-colors ${locale === "en" ? "bg-primary/10 border-primary" : ""}`}
                        onClick={() => changeLocale("en")}
                      >
                        <span className="text-2xl">🇬🇧</span>
                        <span className="font-medium">English</span>
                      </button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="container mx-auto px-4 py-8"
      >
        <h1 className="text-4xl font-bold mb-8 flex items-center gap-3">
          <Shield className="h-8 w-8 text-primary" />
          {t("title")}
        </h1>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Navigation latérale */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Navigation</CardTitle>
              </CardHeader>
              <CardContent>
                <nav className="space-y-2">
                  {sections.map(section => {
                    const Icon = section.icon;
                    return (
                      <div key={section.id}>
                        {section.href ? (
                          <Link href={section.href}>
                            <Button
                              variant={
                                activeSection === section.id
                                  ? "default"
                                  : "ghost"
                              }
                              className="w-full justify-start"
                            >
                              <Icon className="h-4 w-4 mr-2" />
                              {section.label}
                              <ChevronRight className="h-4 w-4 ml-auto" />
                            </Button>
                          </Link>
                        ) : (
                          <Button
                            variant={
                              activeSection === section.id ? "default" : "ghost"
                            }
                            className="w-full justify-start"
                            onClick={() => setActiveSection(section.id)}
                          >
                            <Icon className="h-4 w-4 mr-2" />
                            {section.label}
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Contenu principal */}
          <div className="lg:col-span-3">{renderSection()}</div>
        </div>
      </motion.div>
    </div>
  );
}
