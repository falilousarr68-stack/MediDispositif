"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useLocale } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useCart } from "@/hooks/use-cart";
import { ConsomcareLogoText } from "@/components/logo";
import {
  Moon,
  Sun,
  Globe,
  ShoppingCart,
  User,
  LogOut,
  Badge,
} from "lucide-react";

export function Navbar() {
  const [mounted, setMounted] = useState(false);
  const t = useTranslations("nav");
  const { theme, setTheme } = useTheme();
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const { getTotalItems } = useCart();
  const totalItems = getTotalItems();

  useEffect(() => {
    setMounted(true);
    // Vérifier si l'utilisateur est connecté et charger le panier
    const token = localStorage.getItem("access_token");
    if (token) {
      useCart.getState().loadCartFromServer();
    }
  }, []);

  if (!mounted) {
    return null;
  }

  const toggleLocale = () => {
    const newLocale = locale === "fr" ? "en" : "fr";
    const pathWithoutLocale = pathname.replace(/^\/(fr|en)(?=\/|$)/, "");
    router.push(`/${newLocale}${pathWithoutLocale || "/"}`);
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
    useCart.getState().clearCart();
    router.push(`/${locale}/login`);
  };

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50"
    >
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href={`/${locale}`} className="flex items-center space-x-2">
          <ConsomcareLogoText />
        </Link>

        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="relative"
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleLocale}
            className="relative"
          >
            <Globe className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 text-xs font-bold">
              {locale === "fr" ? "🇫🇷" : "🇬🇧"}
            </span>
            <span className="sr-only">Toggle language</span>
          </Button>

          <Link href={`/${locale}/cart`}>
            <Button variant="ghost" size="icon" className="relative">
              <ShoppingCart className="h-5 w-5" />
              {totalItems > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                  {totalItems}
                </Badge>
              )}
              <span className="sr-only">Cart</span>
            </Button>
          </Link>

          <Link href={`/${locale}/profile`}>
            <Button variant="ghost" size="icon">
              <User className="h-5 w-5" />
              <span className="sr-only">Profile</span>
            </Button>
          </Link>

          <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut className="h-5 w-5" />
            <span className="sr-only">Logout</span>
          </Button>
        </div>
      </div>
    </motion.nav>
  );
}
