"use client";

import React from "react";
import { User } from "@/hooks/use-admin";
import { Button } from "@/components/ui/button";
import {
  Trash2,
  Shield,
  User as UserIcon,
  Briefcase,
  Tag,
  Package,
  ShoppingBag,
} from "lucide-react";

interface UserTableProps {
  users: User[];
  onDelete: (userId: string) => void;
}

const roleIcons: Record<string, React.ReactNode> = {
  Administrateur: <Shield className="h-4 w-4 text-purple-500" />,
  ResponsableCommercial: <Briefcase className="h-4 w-4 text-blue-500" />,
  Vendeur: <Tag className="h-4 w-4 text-green-500" />,
  GestionnaireDeStock: <Package className="h-4 w-4 text-orange-500" />,
  Client: <ShoppingBag className="h-4 w-4 text-gray-500" />,
};

const roleLabels: Record<string, string> = {
  Administrateur: "Administrateur",
  ResponsableCommercial: "Responsable Commercial",
  Vendeur: "Vendeur",
  GestionnaireDeStock: "Gestionnaire de Stock",
  Client: "Client",
};

export function UserTable({ users, onDelete }: UserTableProps) {
  return (
    <div className="rounded-md border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground w-[50px]">
                Icon
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                Email
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                Nom
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                Prénom
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                Téléphone
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                Rôle
              </th>
              <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="text-center py-8 text-muted-foreground"
                >
                  Aucun utilisateur trouvé
                </td>
              </tr>
            ) : (
              users.map((user, index) => {
                const userId = user.idUser ?? user.id;
                if (!userId) return null;

                return (
                  <tr
                    key={userId}
                    className={
                      index % 2 === 0 ? "bg-background" : "bg-muted/50"
                    }
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center">
                        {roleIcons[user.role] || (
                          <UserIcon className="h-4 w-4" />
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium">{user.email}</td>
                    <td className="px-4 py-3">{user.nom}</td>
                    <td className="px-4 py-3">{user.prenom}</td>
                    <td className="px-4 py-3">{user.telephone || "-"}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1">
                        {roleIcons[user.role]}
                        {roleLabels[user.role]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(userId)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
