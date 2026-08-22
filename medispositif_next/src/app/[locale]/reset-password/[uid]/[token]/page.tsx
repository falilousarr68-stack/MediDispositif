"use client";

import { FormEvent, useState } from "react";
import { useLocale } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function ResetPasswordPage() {
  const locale = useLocale();
  const router = useRouter();
  const params = useParams<{ uid: string; token: string }>();
  const [password, setPassword] = useState("");
  const mutation = useMutation({
    mutationFn: () =>
      api.post(
        `api/auth/reinitialiser-mot-de-passe/${params.uid}/${params.token}/`,
        { password }
      ),
    onSuccess: () => router.push(`/${locale}/login`),
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (password.length >= 6) mutation.mutate();
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>
            {locale === "en"
              ? "Reset password"
              : "Réinitialiser le mot de passe"}
          </CardTitle>
          <CardDescription>
            {locale === "en"
              ? "Choose a new password (at least 6 characters)."
              : "Choisissez un nouveau mot de passe (6 caractères minimum)."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <Input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={event => setPassword(event.target.value)}
            />
            {mutation.isError && (
              <p className="text-sm text-destructive">
                {locale === "en"
                  ? "This link is invalid or expired."
                  : "Ce lien est invalide ou expiré."}
              </p>
            )}
            <Button
              type="submit"
              className="w-full"
              disabled={mutation.isPending}
            >
              {mutation.isPending
                ? "..."
                : locale === "en"
                  ? "Reset password"
                  : "Réinitialiser"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
