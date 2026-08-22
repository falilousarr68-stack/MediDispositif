'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';


const createUserSchema = z.object({
  email: z.string().email('Email invalide'),
  motdepasse: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
  confirmation_motdepasse: z.string().min(8, 'La confirmation doit contenir au moins 8 caractères'),
  prenom: z.string().min(2, 'Le prénom doit contenir au moins 2 caractères'),
  nom: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  telephone: z.string().optional(),
  role: z.enum(['ResponsableCommercial', 'Vendeur', 'GestionnaireDeStock']),
}).refine((data) => data.motdepasse === data.confirmation_motdepasse, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmation_motdepasse"],
});

type CreateUserFormData = z.infer<typeof createUserSchema>;

interface CreateUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateUserFormData) => void;
  isLoading?: boolean;
}

export function CreateUserDialog({ open, onOpenChange, onSubmit, isLoading }: CreateUserDialogProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      role: 'Vendeur',
      nom: '',
      prenom: '',
      email: '',
      motdepasse: '',
      confirmation_motdepasse: '',
      telephone: '',
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Créer un nouvel utilisateur</DialogTitle>
          <DialogDescription>
            Remplissez les informations pour créer un nouveau compte utilisateur avec un rôle spécifique.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@example.com"
                {...register('email')}
                className={errors.email ? 'border-destructive' : ''}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="motdepasse">Mot de passe *</Label>
              <Input
                id="motdepasse"
                type="password"
                placeholder="••••••••"
                {...register('motdepasse')}
                className={errors.motdepasse ? 'border-destructive' : ''}
              />
              {errors.motdepasse && (
                <p className="text-sm text-destructive">{errors.motdepasse.message}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="confirmation_motdepasse">Confirmation du mot de passe *</Label>
              <Input
                id="confirmation_motdepasse"
                type="password"
                placeholder="••••••••"
                {...register('confirmation_motdepasse')}
                className={errors.confirmation_motdepasse ? 'border-destructive' : ''}
              />
              {errors.confirmation_motdepasse && (
                <p className="text-sm text-destructive">{errors.confirmation_motdepasse.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="prenom">Prénom *</Label>
                <Input
                  id="prenom"
                  placeholder="Jean"
                  {...register('prenom')}
                  className={errors.prenom ? 'border-destructive' : ''}
                />
                {errors.prenom && (
                  <p className="text-sm text-destructive">{errors.prenom.message}</p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="nom">Nom *</Label>
                <Input
                  id="nom"
                  placeholder="Dupont"
                  {...register('nom')}
                  className={errors.nom ? 'border-destructive' : ''}
                />
                {errors.nom && (
                  <p className="text-sm text-destructive">{errors.nom.message}</p>
                )}
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="telephone">Téléphone</Label>
              <Input
                id="telephone"
                type="tel"
                placeholder="+221 77 123 45 67"
                {...register('telephone')}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="role">Rôle *</Label>
              <select
                id="role"
                {...register('role')}
                className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${errors.role ? 'border-destructive' : ''}`}
              >
                <option value="ResponsableCommercial">💼 Responsable Commercial</option>
                <option value="Vendeur">🏷️ Vendeur</option>
                <option value="GestionnaireDeStock">📦 Gestionnaire de Stock</option>
              </select>
              {errors.role && (
                <p className="text-sm text-destructive">{errors.role.message}</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Création...' : 'Créer l\'utilisateur'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}