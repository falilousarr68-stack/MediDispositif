"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "../context/CartContext";
import api from "../services/api";

export default function Header() {
  const router = useRouter();

  const [utilisateur, setUtilisateur] = useState(null);
  const [menuOuvert, setMenuOuvert] = useState(false);
  

  // Panier
  const { nombreArticles } = useCart();

  useEffect(() => {
    const utilisateurStocke = localStorage.getItem("utilisateur");

    if (utilisateurStocke) {
      try {
        setUtilisateur(JSON.parse(utilisateurStocke));
      } catch (error) {
        console.error(
          "Impossible de récupérer les informations utilisateur",
          error
        );

        localStorage.removeItem("utilisateur");
      }
    }
  }, []);

  const deconnexion = async () => {
  try {
    await api.post("/auth/deconnexion/");
  } catch (error) {
    console.error(
      "Erreur lors de l'enregistrement de la déconnexion :",
      error
    );
  } finally {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("utilisateur");

    setUtilisateur(null);
    setMenuOuvert(false);

    router.push("/");
  }
};

  /*
   * Déterminer le rôle de l'utilisateur.
   *
   * On utilise d'abord "role", qui correspond
   * normalement à la valeur enregistrée dans Django.
   */
  const roleUtilisateur = utilisateur?.role;

  const estAdministrateur =
  roleUtilisateur === "Administrateur";

const estClient =
  roleUtilisateur === "Client";

const estVendeur =
  roleUtilisateur === "Vendeur";

const estResponsable =
  roleUtilisateur === "ResponsableCommercial";

const estGestionnaireStock =
  roleUtilisateur === "GestionnaireDeStock";

  return (
    
    <header className="sticky top-0 z-50 bg-white border-b shadow-sm">

      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">

        {/* =====================================================
            LOGO
        ====================================================== */}
        <Link
  href={
    !utilisateur
      ? "/"
      : estAdministrateur
      ? "/administration"
      : estClient
      ? "/client"
      : estVendeur
      ? "/vendeur"
      : estResponsable
      ? "/responsable-commercial"
      : estGestionnaireStock
      ? "/gestionnaire-stock"
      : "/"
  }
  className="group"
>
          <h1 className="text-2xl font-bold text-blue-700 group-hover:text-blue-800">
            MediDispositif
          </h1>

          <p className="text-sm text-gray-500">
            Vente de dispositifs médicaux
          </p>
        </Link>

        {/* =====================================================
            NAVIGATION
        ====================================================== */}
        <nav className="flex items-center gap-6">

          <Link
  href={
    !utilisateur
      ? "/"
      : estAdministrateur
      ? "/administration"
      : estClient
      ? "/client"
      : estVendeur
      ? "/vendeur"
      : estResponsable
      ? "/responsable-commercial"
      : estGestionnaireStock
      ? "/gestionnaire-stock"
      : "/"
  }
  className="text-gray-700 hover:text-blue-600 transition"
>
  Accueil
</Link>

          {/* PRODUITS */}
          <Link
            href="/produits"
            className="text-gray-700 hover:text-blue-600 transition"
          >
            Produits
          </Link>

          {/* =================================================
              PANIER
          ================================================== */}
          {estClient && (
  <Link
    href="/panier"
    className="relative flex items-center gap-2 text-gray-700 hover:text-blue-600 transition"
  >
    <span className="text-xl">
      🛒
    </span>

    <span className="font-medium">
      Panier
    </span>

    {nombreArticles > 0 && (
      <span
        className="absolute -top-3 -right-4 min-w-[22px]
        h-[22px] px-1 bg-blue-600 text-white text-xs
        font-bold rounded-full flex items-center justify-center"
      >
        {nombreArticles}
      </span>
    )}
  </Link>
)}

          {/* =================================================
              UTILISATEUR CONNECTÉ
          ================================================== */}
          {utilisateur ? (
            <div className="relative">

              {/* BOUTON UTILISATEUR */}
              <button
                type="button"
                onClick={() => setMenuOuvert(!menuOuvert)}
                className="flex items-center gap-3 bg-blue-50
                border border-blue-100 px-4 py-2 rounded-lg
                hover:bg-blue-100 transition"
              >

                {/* INITIAL */}
                <div
                  className="w-9 h-9 bg-blue-600 text-white
                  rounded-full flex items-center justify-center
                  font-semibold"
                >
                  {utilisateur.prenom
                    ? utilisateur.prenom
                        .charAt(0)
                        .toUpperCase()
                    : "U"}
                </div>

                {/* NOM + ROLE */}
                <div className="text-left">

                  <p className="text-sm font-semibold text-gray-900">
                    {utilisateur.prenom} {utilisateur.nom}
                  </p>

                  <p className="text-xs text-blue-600">
                    {utilisateur.role_display || utilisateur.role}
                  </p>

                </div>

                {/* FLÈCHE */}
                <span className="text-gray-500">
                  {menuOuvert ? "▲" : "▼"}
                </span>

              </button>

              {/* =================================================
                  MENU DÉROULANT
              ================================================== */}
              {menuOuvert && (
                <div
                  className="absolute right-0 mt-2 w-64
                  bg-white border border-gray-200 rounded-xl
                  shadow-lg z-50 overflow-hidden"
                >

                  {/* INFORMATIONS UTILISATEUR */}
                  <div className="px-4 py-4 border-b bg-gray-50">

                    <p className="font-semibold text-gray-900">
                      {utilisateur.prenom} {utilisateur.nom}
                    </p>

                    <p className="text-sm text-gray-500 mt-1">
                      {utilisateur.email}
                    </p>

                    <p className="text-xs text-blue-600 font-medium mt-2">
                      {utilisateur.role_display || utilisateur.role}
                    </p>

                  </div>

                  <div className="p-2">

                    {/* =================================================
                        MON PROFIL
                    ================================================== */}
                    <Link
                      href="/profil"
                      onClick={() => setMenuOuvert(false)}
                      className="block px-3 py-2 rounded-lg
                      text-gray-700 hover:bg-gray-100 transition"
                    >
                      👤 Mon profil
                    </Link>

                    {/* =================================================
    ADMINISTRATEUR → TABLEAU DE BORD
================================================== */}
{estAdministrateur && (
  <Link
    href="/administration"
    onClick={() => setMenuOuvert(false)}
    className="block px-3 py-2 rounded-lg
    text-gray-700 hover:bg-blue-50 text-blue-700 font-medium transition"
  >
    🛡️ Espace Administrateur
  </Link>
)}

{/* =================================================
    ADMINISTRATEUR → SYSTÈME
================================================== */}
{estAdministrateur && (
  <Link
    href="/administration/parametres"
    onClick={() => setMenuOuvert(false)}
    className="block px-3 py-2 rounded-lg
    text-gray-700 hover:bg-gray-100 transition"
  >
    ⚙️ Système
  </Link>
)}



                    {/* =================================================
                        MON PANIER
                    ================================================== */}
                    {estClient && (
  <Link
    href="/panier"
    onClick={() => setMenuOuvert(false)}
    className="block px-3 py-2 rounded-lg
    text-gray-700 hover:bg-gray-100 transition"
  >
    🛒 Mon panier
  </Link>
)}

                    {/* =================================================
                        CLIENT → MES COMMANDES
                    ================================================== */}
                    {estClient && (
                      <Link
                        href="/commandes"
                        onClick={() => setMenuOuvert(false)}
                        className="block px-3 py-2 rounded-lg
                        text-gray-700 hover:bg-gray-100 transition"
                      >
                        📦 Mes commandes
                      </Link>
                    )}

                    {estClient && (
  <Link
    href="/factures"
    className="block px-4 py-2 hover:bg-gray-100"
  >
    🧾 Mes factures
  </Link>
)}

                    {/* =================================================
                        VENDEUR → GESTION DES COMMANDES
                    ================================================== */}
                    {estVendeur && (
                      <Link
                        href="/gestion-commandes"
                        onClick={() => setMenuOuvert(false)}
                        className="block px-3 py-2 rounded-lg
                        text-gray-700 hover:bg-gray-100 transition"
                      >
                        📦 Gestion des commandes
                      </Link>
                    )}

                    {/* =================================================
                        RESPONSABLE COMMERCIAL → GESTION DES COMMANDES
                    ================================================== */}
                    {estResponsable && (
                      <Link
                        href="/gestion-commandes"
                        onClick={() => setMenuOuvert(false)}
                        className="block px-3 py-2 rounded-lg
                        text-gray-700 hover:bg-gray-100 transition"
                      >
                        📦 Gestion des commandes
                      </Link>
                    )}

                  

                    {/* =================================================
    GESTIONNAIRE DE STOCK
================================================== */}
{estGestionnaireStock && (
  <>
    <Link
      href="/administration/produits"
      onClick={() => setMenuOuvert(false)}
      className="block px-3 py-2 rounded-lg
      text-gray-700 hover:bg-gray-100 transition"
    >
      📦 Gestion des produits
    </Link>

    <Link
      href="/administration/approvisionnements"
      onClick={() => setMenuOuvert(false)}
      className="block px-3 py-2 rounded-lg
      text-gray-700 hover:bg-gray-100 transition"
    >
      🚚 Approvisionnements
    </Link>

    <Link
      href="/historique-stock"
      onClick={() => setMenuOuvert(false)}
      className="block px-3 py-2 rounded-lg
      text-gray-700 hover:bg-gray-100 transition"
    >
      📊 Historique du stock
    </Link>

    <Link
  href="/historique-audit"
  onClick={() => setMenuOuvert(false)}
  className="block px-3 py-2 rounded-lg
  text-gray-700 hover:bg-gray-100 transition"
>
  📝 Journal d’audit
</Link>

    <Link
      href="/administration/alertes"
      onClick={() => setMenuOuvert(false)}
      className="block px-3 py-2 rounded-lg
      text-gray-700 hover:bg-gray-100 transition"
    >
      ⚠️ Alertes
    </Link>
  </>
)}

{estResponsable && (
  <Link
    href="/historique-audit"
    onClick={() => setMenuOuvert(false)}
    className="
      block px-3 py-2 rounded-lg
      text-gray-700 hover:bg-gray-100
      transition
    "
  >
    📝 Journal d’audit
  </Link>
)}

{estAdministrateur && (
  <Link
    href="/historique-audit"
    onClick={() => setMenuOuvert(false)}
    className="
      block px-3 py-2 rounded-lg
      text-gray-700 hover:bg-gray-100
      transition
    "
  >
    📝 Journal d’audit
  </Link>
)}

                    {/* =================================================
                        DÉCONNEXION
                    ================================================== */}
                    <button
                      type="button"
                      onClick={deconnexion}
                      className="w-full text-left px-3 py-2
                      rounded-lg text-red-600 hover:bg-red-50
                      transition"
                    >
                      🚪 Déconnexion
                    </button>

                  </div>
                </div>
              )}
            </div>
          ) : (

            /* =================================================
               UTILISATEUR NON CONNECTÉ
            ================================================== */
            <Link
              href="/connexion"
              className="bg-blue-600 text-white px-5 py-2
              rounded-lg hover:bg-blue-700 transition"
            >
              Connexion
            </Link>

          )}

        </nav>
      </div>
    </header>
  );
}