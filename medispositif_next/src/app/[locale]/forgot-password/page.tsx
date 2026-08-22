"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
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

export default function ForgotPasswordPage() {
  const locale = useLocale();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [resetUrl, setResetUrl] = useState<string | null>(null);
  const mutation = useMutation({
    mutationFn: () =>
      api.post("api/auth/mot-de-passe-oublie/", { email, locale }),
    onSuccess: response => {
      setResetUrl(response.data.reset_url || null);
      setSent(true);
    },
  });

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Card>
          <CardHeader>
            <CardTitle>
              {locale === "en" ? "Forgot password" : "Mot de passe oublié"}
            </CardTitle>
            <CardDescription>
              {locale === "en"
                ? "Enter your email to receive a reset link."
                : "Saisissez votre email pour recevoir un lien de réinitialisation."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sent ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {locale === "en"
                    ? "If this address exists, a reset link has been sent."
                    : "Si cette adresse existe, un lien de réinitialisation a été envoyé."}
                </p>
                {resetUrl && (
                  <a
                    href={resetUrl.replace("/fr/", `/${locale}/`)}
                    className="block text-sm text-primary underline break-all"
                  >
                    {locale === "en"
                      ? "Open the reset link"
                      : "Ouvrir le lien de réinitialisation"}
                  </a>
                )}
                <Button
                  className="w-full"
                  onClick={() => router.push(`/${locale}/login`)}
                >
                  {locale === "en" ? "Back to login" : "Retour à la connexion"}
                </Button>
              </div>
            ) : (
              <form
                onSubmit={event => {
                  event.preventDefault();
                  mutation.mutate();
                }}
                className="space-y-4"
              >
                <Input
                  type="email"
                  required
                  value={email}
                  onChange={event => setEmail(event.target.value)}
                  placeholder="email@example.com"
                />
                {mutation.isError && (
                  <p className="text-sm text-destructive">
                    {locale === "en"
                      ? "Unable to send the reset link."
                      : "Impossible d'envoyer le lien de réinitialisation."}
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
                      ? "Send reset link"
                      : "Envoyer le lien"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
