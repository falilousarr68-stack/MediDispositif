
"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import api from "../services/api";

export default function AppShell({ children }) {
  const pathname = usePathname();
  const [utilisateur, setUtilisateur] = useState(null);

  useEffect(() => {
    
const actualiserUtilisateur = async () => {
  const utilisateurStocke =
    localStorage.getItem("utilisateur");

  if (!utilisateurStocke) {
    setUtilisateur(null);
    return;
  }

  try {
    const utilisateurLocal = JSON.parse(utilisateurStocke);

    // Afficher immédiatement les informations déjà disponibles
    setUtilisateur(utilisateurLocal);

    // Récupérer les informations complètes du profil depuis Django
    const response = await api.get("/auth/profil/");

    const utilisateurComplet = {
      ...utilisateurLocal,
      ...response.data,
    };

    // Conserver les informations actualisées
    localStorage.setItem(
      "utilisateur",
      JSON.stringify(utilisateurComplet)
    );

    setUtilisateur(utilisateurComplet);
  } catch (error) {
    console.error(
      "Erreur lors de l'actualisation du profil :",
      error
    );
  }
};


    actualiserUtilisateur();

    window.addEventListener(
      "utilisateurMisAJour",
      actualiserUtilisateur
    );

    window.addEventListener("storage", actualiserUtilisateur);

    return () => {
      window.removeEventListener(
        "utilisateurMisAJour",
        actualiserUtilisateur
      );

      window.removeEventListener(
        "storage",
        actualiserUtilisateur
      );
    };
  }, [pathname]);

  const pagesSansSidebar = [
    "/",
    "/connexion",
    "/inscription",
    "/réinitialiser-mot-de-passe",
  ];

  const afficherSidebar =
    utilisateur &&
    !pagesSansSidebar.includes(pathname);

  return (
    <>
      {afficherSidebar && (
        <Sidebar utilisateur={utilisateur} />
      )}

      {children}
    </>
  );
}
