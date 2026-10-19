"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "../../services/api";

export default function GestionCommandesPage() {
  const [commandes, setCommandes] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");

  // Utilisateur connecté
  const [utilisateur, setUtilisateur] = useState(null);

  // Action actuellement en cours
  const [actionEnCours, setActionEnCours] = useState(null);

  // Annulation
  const [commandeAAnnuler, setCommandeAAnnuler] = useState(null);
  const [motifAnnulation, setMotifAnnulation] = useState("");

  // Date et heure
  const [dateActuelle, setDateActuelle] = useState(new Date());

  /*
   * =========================================================
   * RÔLE DE L'UTILISATEUR
   * =========================================================
   */

  const role = utilisateur?.role;

  const estAdministrateur =
    role === "Administrateur" ||
    role === "ADMINISTRATEUR";

  const estResponsableCommercial =
    role === "ResponsableCommercial" ||
    role === "RESPONSABLE_COMMERCIAL";

  const estVendeur =
    role === "Vendeur" ||
    role === "VENDEUR";

  /*
   * =========================================================
   * INFORMATIONS D'AFFICHAGE SELON LE RÔLE
   * =========================================================
   */

  const obtenirNomUtilisateur = () => {
    if (!utilisateur) {
      return "Utilisateur";
    }

    const nomComplet = `${utilisateur.prenom || ""} ${
      utilisateur.nom || ""
    }`.trim();

    return nomComplet || utilisateur.email || "Utilisateur";
  };

  const obtenirRoleAffichage = () => {
    if (estAdministrateur) {
      return "Administrateur";
    }

    if (estResponsableCommercial) {
      return "Responsable Commercial";
    }

    if (estVendeur) {
      return "Vendeur";
    }

    return utilisateur?.role || "Utilisateur";
  };

  const obtenirSousTitre = () => {
    if (estAdministrateur) {
      return "Consultez et supervisez l'ensemble des commandes de MediDispositif.";
    }

    if (estResponsableCommercial) {
      return "Supervisez les commandes des clients et gérez les annulations autorisées.";
    }

    if (estVendeur) {
      return "Consultez les commandes des clients et assurez leur suivi commercial.";
    }

    return "Consultez les commandes enregistrées sur MediDispositif.";
  };

  const obtenirTableauDeBord = () => {
    if (estAdministrateur) {
      return "/administration";
    }

    if (estResponsableCommercial) {
      return "/responsable-commercial";
    }

    if (estVendeur) {
      return "/vendeur";
    }

    return "/";
  };

  /*
   * =========================================================
   * CHARGER L'UTILISATEUR
   * =========================================================
   */

  useEffect(() => {
    const utilisateurStocke =
      localStorage.getItem("utilisateur");

    if (utilisateurStocke) {
      try {
        const utilisateurParse =
          JSON.parse(utilisateurStocke);

        setUtilisateur(utilisateurParse);

        console.log(
          "Utilisateur connecté :",
          utilisateurParse
        );
      } catch (error) {
        console.error(
          "Erreur lors de la récupération de l'utilisateur :",
          error
        );

        localStorage.removeItem("utilisateur");
      }
    }
  }, []);

  /*
   * =========================================================
   * HORLOGE
   * =========================================================
   */

  useEffect(() => {
    const intervalle = setInterval(() => {
      setDateActuelle(new Date());
    }, 1000);

    return () => clearInterval(intervalle);
  }, []);

  /*
   * =========================================================
   * CHARGER LES COMMANDES
   * =========================================================
   */

  const chargerCommandes = async () => {
    try {
      setChargement(true);
      setErreur("");

      const response = await api.get(
        "/ventes/commandes/"
      );

      console.log(
        "Commandes de gestion :",
        response.data
      );

      setCommandes(response.data);
    } catch (error) {
      console.error(
        "Erreur lors du chargement des commandes :",
        error
      );

      if (error.response) {
        console.error(
          "Réponse Django :",
          error.response.data
        );

        if (error.response.status === 401) {
          setErreur(
            "Votre session a expiré. Veuillez vous reconnecter."
          );
        } else if (error.response.status === 403) {
          setErreur(
            "Vous n'avez pas l'autorisation de gérer les commandes."
          );
        } else {
          setErreur(
            "Impossible de charger les commandes."
          );
        }
      } else {
        setErreur(
          "Impossible de contacter le serveur Django."
        );
      }
    } finally {
      setChargement(false);
    }
  };

  /*
   * =========================================================
   * CHARGER LES COMMANDES AU DÉMARRAGE
   * =========================================================
   */

  useEffect(() => {
    chargerCommandes();
  }, []);

  /*
   * =========================================================
   * STATUT
   * =========================================================
   */

  const afficherStatut = (statut) => {
    switch (statut) {
      case "EnCours":
        return {
          texte: "En cours",
          classe:
            "bg-orange-100 text-orange-700",
        };

      case "Validee":
        return {
          texte: "Validée",
          classe:
            "bg-green-100 text-green-700",
        };

      case "Annulee":
        return {
          texte: "Annulée",
          classe:
            "bg-red-100 text-red-700",
        };

      default:
        return {
          texte: statut || "Inconnu",
          classe:
            "bg-gray-100 text-gray-700",
        };
    }
  };

  /*
   * =========================================================
   * OUVRIR LA FENÊTRE D'ANNULATION
   * =========================================================
   */

  const ouvrirAnnulation = (commande) => {
    if (!estResponsableCommercial) {
      setErreur(
        "Seul le Responsable Commercial peut annuler une commande."
      );

      return;
    }

    setCommandeAAnnuler(commande);
    setMotifAnnulation("");
    setErreur("");
  };

  /*
   * =========================================================
   * FERMER LA FENÊTRE D'ANNULATION
   * =========================================================
   */

  const fermerAnnulation = () => {
    setCommandeAAnnuler(null);
    setMotifAnnulation("");
  };

  /*
   * =========================================================
   * ANNULER UNE COMMANDE
   * =========================================================
   */

  const annulerCommande = async () => {
    if (!commandeAAnnuler) {
      return;
    }

    if (!estResponsableCommercial) {
      setErreur(
        "Seul le Responsable Commercial peut annuler une commande."
      );

      fermerAnnulation();

      return;
    }

    if (!motifAnnulation.trim()) {
      setErreur(
        "Le motif d'annulation est obligatoire pour le Responsable Commercial."
      );

      return;
    }

    const idCommande =
      commandeAAnnuler.idCommande;

    try {
      setActionEnCours(idCommande);
      setErreur("");

      const response = await api.post(
        `/ventes/commandes/${idCommande}/annuler/`,
        {
          motif: motifAnnulation.trim(),
        }
      );

      console.log(
        "Commande annulée :",
        response.data
      );

      fermerAnnulation();

      await chargerCommandes();
    } catch (error) {
      console.error(
        "Erreur lors de l'annulation :",
        error
      );

      if (error.response) {
        console.error(
          "Réponse Django :",
          error.response.data
        );

        setErreur(
          error.response.data?.error ||
            error.response.data?.detail ||
            "Impossible d'annuler la commande."
        );
      } else {
        setErreur(
          "Impossible de contacter le serveur Django."
        );
      }
    } finally {
      setActionEnCours(null);
    }
  };

  /*
   * =========================================================
   * STATISTIQUES
   * =========================================================
   */

  const totalCommandes = commandes.length;

  const commandesEnCours = commandes.filter(
    (commande) =>
      commande.statut === "EnCours"
  ).length;

  const commandesValidees = commandes.filter(
    (commande) =>
      commande.statut === "Validee"
  ).length;

  const commandesAnnulees = commandes.filter(
    (commande) =>
      commande.statut === "Annulee"
  ).length;

  /*
   * =========================================================
   * CHIFFRE D'AFFAIRES
   *
   * On prend uniquement les commandes validées.
   * =========================================================
   */

  const chiffreAffaires = commandes
    .filter(
      (commande) =>
        commande.statut === "Validee"
    )
    .reduce(
      (total, commande) =>
        total +
        Number(commande.montant_total || 0),
      0
    );

  /*
   * =========================================================
   * FORMATAGE
   * =========================================================
   */

  const dateFormatee = dateActuelle.toLocaleDateString(
    "fr-FR",
    {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    }
  );

  const heureFormatee =
    dateActuelle.toLocaleTimeString(
      "fr-FR",
      {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }
    );

  /*
   * =========================================================
   * RETOUR
   * =========================================================
   */

  const retournerAuDashboard = () => {
    window.location.href =
      obtenirTableauDeBord();
  };

  /*
   * =========================================================
   * AFFICHAGE
   * =========================================================
   */

  return (
    <main className="min-h-screen bg-[#f4f8fc]">

      

      {/* =====================================================
          CONTENU PRINCIPAL
      ====================================================== */}

      <div className="ml-64 min-h-screen bg-[#f4f8fc]">

        {/* ===================================================
            EN-TÊTE
        ==================================================== */}

        <section
          className="
            relative
            overflow-hidden
            bg-gradient-to-r
            from-[#e8f1ff]
            via-[#e8f8fb]
            to-[#eefcff]
            border-b
            border-blue-100
          "
        >

          {/* Décoration */}

          <div
            className="
              absolute
              right-0
              top-0
              w-96
              h-72
              bg-gradient-to-br
              from-blue-100/60
              via-cyan-100/40
              to-transparent
              rounded-bl-full
              pointer-events-none
            "
          />

          <div className="max-w-7xl mx-auto px-6 py-8 relative z-10">

            <div
              className="
                flex
                flex-col
                lg:flex-row
                lg:items-center
                lg:justify-between
                gap-6
              "
            >

              {/* TEXTE */}

              <div>

                <p
                  className="
                    text-blue-700
                    text-sm
                    font-bold
                    uppercase
                    tracking-wide
                    mb-2
                  "
                >
                  Espace {obtenirRoleAffichage()}
                </p>

                <h1
                  className="
                    text-3xl
                    md:text-4xl
                    font-bold
                    text-gray-900
                  "
                >
                  Gestion des commandes
                </h1>

                <p
                  className="
                    text-gray-600
                    mt-2
                    max-w-2xl
                  "
                >
                  {obtenirSousTitre()}
                </p>

              </div>

              {/* DATE + HEURE */}

              <div
                className="
                  bg-white/90
                  backdrop-blur-sm
                  border
                  border-blue-100
                  rounded-2xl
                  px-6
                  py-4
                  shadow-sm
                  min-w-[290px]
                "
              >

                <div className="flex items-center gap-4">

                  <div
                    className="
                      w-12
                      h-12
                      rounded-xl
                      bg-blue-50
                      flex
                      items-center
                      justify-center
                      text-2xl
                    "
                  >
                    📅
                  </div>

                  <div>

                    <p
                      className="
                        text-xs
                        text-gray-500
                        uppercase
                        tracking-wide
                      "
                    >
                      Date
                    </p>

                    <p
                      className="
                        font-bold
                        text-gray-900
                        capitalize
                      "
                    >
                      {dateFormatee}
                    </p>

                  </div>

                </div>

                <div
                  className="
                    border-t
                    border-gray-100
                    mt-4
                    pt-4
                    flex
                    items-center
                    gap-4
                  "
                >

                  <div
                    className="
                      w-12
                      h-12
                      rounded-xl
                      bg-cyan-50
                      flex
                      items-center
                      justify-center
                      text-2xl
                    "
                  >
                    🕐
                  </div>

                  <div>

                    <p
                      className="
                        text-xs
                        text-gray-500
                        uppercase
                        tracking-wide
                      "
                    >
                      Heure
                    </p>

                    <p
                      className="
                        font-bold
                        text-gray-900
                      "
                    >
                      {heureFormatee}
                    </p>

                  </div>

                </div>

              </div>

            </div>

          </div>

        </section>

        {/* ===================================================
            CONTENU
        ==================================================== */}

        <section
          className="
            max-w-7xl
            mx-auto
            px-6
            py-8
          "
        >

          {/* =================================================
              RETOUR + UTILISATEUR
          ================================================== */}

          <div
            className="
              flex
              flex-col
              md:flex-row
              md:items-center
              md:justify-between
              gap-4
              mb-8
            "
          >

            <button
              type="button"
              onClick={retournerAuDashboard}
              className="
                text-blue-600
                hover:text-blue-800
                font-medium
                transition
                text-left
              "
            >
              ← Retour au tableau de bord
            </button>

            <div
              className="
                bg-white
                border
                border-gray-200
                rounded-xl
                px-5
                py-3
                shadow-sm
              "
            >

              <p
                className="
                  text-xs
                  text-gray-500
                  uppercase
                  tracking-wide
                "
              >
                Connecté en tant que
              </p>

              <p
                className="
                  font-bold
                  text-gray-900
                  mt-1
                "
              >
                {obtenirNomUtilisateur()}
              </p>

              <p
                className="
                  text-xs
                  text-blue-600
                  font-medium
                  mt-1
                "
              >
                {obtenirRoleAffichage()}
              </p>

            </div>

          </div>

          {/* =================================================
              ERREUR
          ================================================== */}

          {erreur && (
            <div
              className="
                mb-6
                bg-red-50
                border
                border-red-200
                text-red-700
                rounded-2xl
                p-5
              "
            >
              <p className="font-medium">
                ⚠️ {erreur}
              </p>
            </div>
          )}

          {/* =================================================
              STATISTIQUES
          ================================================== */}

          <section className="mb-10">

            <div className="mb-5">

              <h2
                className="
                  text-2xl
                  font-bold
                  text-gray-900
                "
              >
                Vue d'ensemble
              </h2>

              <p
                className="
                  text-gray-500
                  text-sm
                  mt-1
                "
              >
                Statistiques générales des commandes
              </p>

            </div>

            <div
              className="
                grid
                grid-cols-1
                sm:grid-cols-2
                lg:grid-cols-4
                gap-5
              "
            >

              {/* TOTAL */}

              <div
                className="
                  bg-white
                  rounded-2xl
                  border-t-4
                  border-blue-500
                  border-x
                  border-b
                  border-gray-200
                  p-6
                  shadow-sm
                  hover:shadow-lg
                  transition
                "
              >

                <div className="flex items-start justify-between">

                  <div>

                    <p className="text-sm text-gray-500">
                      Commandes
                    </p>

                    <p
                      className="
                        text-3xl
                        font-bold
                        text-gray-900
                        mt-2
                      "
                    >
                      {chargement
                        ? "..."
                        : totalCommandes}
                    </p>

                  </div>

                  <div
                    className="
                      w-12
                      h-12
                      rounded-xl
                      bg-blue-50
                      flex
                      items-center
                      justify-center
                      text-2xl
                    "
                  >
                    📦
                  </div>

                </div>

                <p
                  className="
                    text-sm
                    text-blue-600
                    font-semibold
                    mt-5
                  "
                >
                  Toutes les commandes
                </p>

              </div>

              {/* EN COURS */}

              <div
                className="
                  bg-white
                  rounded-2xl
                  border-t-4
                  border-orange-500
                  border-x
                  border-b
                  border-gray-200
                  p-6
                  shadow-sm
                  hover:shadow-lg
                  transition
                "
              >

                <div className="flex items-start justify-between">

                  <div>

                    <p className="text-sm text-gray-500">
                      Commandes en cours
                    </p>

                    <p
                      className="
                        text-3xl
                        font-bold
                        text-gray-900
                        mt-2
                      "
                    >
                      {chargement
                        ? "..."
                        : commandesEnCours}
                    </p>

                  </div>

                  <div
                    className="
                      w-12
                      h-12
                      rounded-xl
                      bg-orange-50
                      flex
                      items-center
                      justify-center
                      text-2xl
                    "
                  >
                    ⏳
                  </div>

                </div>

                <p
                  className="
                    text-sm
                    text-orange-600
                    font-semibold
                    mt-5
                  "
                >
                  À suivre
                </p>

              </div>

              {/* VALIDÉES */}

              <div
                className="
                  bg-white
                  rounded-2xl
                  border-t-4
                  border-green-500
                  border-x
                  border-b
                  border-gray-200
                  p-6
                  shadow-sm
                  hover:shadow-lg
                  transition
                "
              >

                <div className="flex items-start justify-between">

                  <div>

                    <p className="text-sm text-gray-500">
                      Commandes validées
                    </p>

                    <p
                      className="
                        text-3xl
                        font-bold
                        text-gray-900
                        mt-2
                      "
                    >
                      {chargement
                        ? "..."
                        : commandesValidees}
                    </p>

                  </div>

                  <div
                    className="
                      w-12
                      h-12
                      rounded-xl
                      bg-green-50
                      flex
                      items-center
                      justify-center
                      text-2xl
                    "
                  >
                    ✅
                  </div>

                </div>

                <p
                  className="
                    text-sm
                    text-green-600
                    font-semibold
                    mt-5
                  "
                >
                  Commandes terminées
                </p>

              </div>

              {/* ANNULÉES */}

              <div
                className="
                  bg-white
                  rounded-2xl
                  border-t-4
                  border-red-500
                  border-x
                  border-b
                  border-gray-200
                  p-6
                  shadow-sm
                  hover:shadow-lg
                  transition
                "
              >

                <div className="flex items-start justify-between">

                  <div>

                    <p className="text-sm text-gray-500">
                      Commandes annulées
                    </p>

                    <p
                      className="
                        text-3xl
                        font-bold
                        text-gray-900
                        mt-2
                      "
                    >
                      {chargement
                        ? "..."
                        : commandesAnnulees}
                    </p>

                  </div>

                  <div
                    className="
                      w-12
                      h-12
                      rounded-xl
                      bg-red-50
                      flex
                      items-center
                      justify-center
                      text-2xl
                    "
                  >
                    ❌
                  </div>

                </div>

                <p
                  className="
                    text-sm
                    text-red-600
                    font-semibold
                    mt-5
                  "
                >
                  Commandes annulées
                </p>

              </div>

            </div>

          </section>

          {/* =================================================
              CHIFFRE D'AFFAIRES
          ================================================== */}

          <section className="mb-10">

            <div
              className="
                bg-gradient-to-r
                from-blue-600
                via-indigo-600
                to-cyan-600
                rounded-2xl
                p-6
                md:p-7
                text-white
                shadow-lg
              "
            >

              <div
                className="
                  flex
                  flex-col
                  md:flex-row
                  md:items-center
                  md:justify-between
                  gap-5
                "
              >

                <div>

                  <p
                    className="
                      text-blue-100
                      text-sm
                      font-medium
                    "
                  >
                    Chiffre d'affaires
                  </p>

                  <h2
                    className="
                      text-3xl
                      md:text-4xl
                      font-bold
                      mt-2
                    "
                  >
                    {chargement
                      ? "..."
                      : chiffreAffaires.toLocaleString(
                          "fr-FR"
                        )}{" "}
                    FCFA
                  </h2>

                  <p
                    className="
                      text-blue-100
                      text-sm
                      mt-2
                    "
                  >
                    Basé sur les commandes validées
                  </p>

                </div>

                <div
                  className="
                    w-16
                    h-16
                    rounded-2xl
                    bg-white/15
                    border
                    border-white/20
                    flex
                    items-center
                    justify-center
                    text-3xl
                  "
                >
                  📈
                </div>

              </div>

            </div>

          </section>

          {/* =================================================
              CHARGEMENT
          ================================================== */}

          {chargement && (
            <div
              className="
                bg-white
                rounded-2xl
                border
                border-gray-200
                shadow-sm
                p-12
                text-center
              "
            >

              <div className="text-4xl mb-4">
                ⏳
              </div>

              <p className="text-gray-600">
                Chargement des commandes...
              </p>

            </div>
          )}

          {/* =================================================
              AUCUNE COMMANDE
          ================================================== */}

          {!chargement &&
            !erreur &&
            commandes.length === 0 && (
              <div
                className="
                  bg-white
                  rounded-2xl
                  border
                  border-gray-200
                  shadow-sm
                  p-12
                  text-center
                "
              >

                <div className="text-6xl mb-5">
                  📦
                </div>

                <h2
                  className="
                    text-2xl
                    font-bold
                    text-gray-900
                  "
                >
                  Aucune commande
                </h2>

                <p
                  className="
                    text-gray-500
                    mt-2
                  "
                >
                  Aucune commande n'est disponible
                  pour le moment.
                </p>

              </div>
            )}

          {/* =================================================
              LISTE DES COMMANDES
          ================================================== */}

          {!chargement &&
            commandes.length > 0 && (

              <section>

                <div
                  className="
                    flex
                    flex-col
                    md:flex-row
                    md:items-center
                    md:justify-between
                    gap-4
                    mb-5
                  "
                >

                  <div>

                    <h2
                      className="
                        text-2xl
                        font-bold
                        text-gray-900
                      "
                    >
                      Commandes
                    </h2>

                    <p
                      className="
                        text-gray-500
                        mt-1
                      "
                    >
                      {commandes.length} commande
                      {commandes.length > 1
                        ? "s"
                        : ""}{" "}
                      enregistrée
                      {commandes.length > 1
                        ? "s"
                        : ""}
                    </p>

                  </div>

                </div>

                <div className="space-y-5">

                  {commandes.map((commande) => {

                    const statut =
                      afficherStatut(
                        commande.statut
                      );

                    /*
                     * Une commande validée ou annulée
                     * ne peut plus être traitée.
                     */

                    const commandeTerminee =
                      commande.statut ===
                        "Validee" ||
                      commande.statut ===
                        "Annulee";

                    return (
                      <article
                        key={commande.idCommande}
                        className="
                          bg-white
                          rounded-2xl
                          border
                          border-gray-200
                          shadow-sm
                          hover:shadow-lg
                          transition
                          overflow-hidden
                        "
                      >

                        {/* BARRE SUPÉRIEURE */}

                        <div
                          className={`
                            h-1
                            ${
                              commande.statut ===
                              "Validee"
                                ? "bg-green-500"
                                : commande.statut ===
                                  "Annulee"
                                ? "bg-red-500"
                                : "bg-orange-500"
                            }
                          `}
                        />

                        <div className="p-6">

                          <div
                            className="
                              flex
                              flex-col
                              xl:flex-row
                              xl:items-center
                              gap-6
                            "
                          >

                            {/* INFORMATIONS */}

                            <div className="flex-1">

                              <div
                                className="
                                  flex
                                  flex-wrap
                                  items-center
                                  gap-3
                                "
                              >

                                <h3
                                  className="
                                    text-xl
                                    font-bold
                                    text-gray-900
                                  "
                                >
                                  Commande #
                                  {commande.idCommande}
                                </h3>

                                <span
                                  className={`
                                    px-3
                                    py-1
                                    rounded-full
                                    text-sm
                                    font-medium
                                    ${statut.classe}
                                  `}
                                >
                                  {statut.texte}
                                </span>

                              </div>

                              <div
                                className="
                                  mt-4
                                  grid
                                  grid-cols-1
                                  md:grid-cols-2
                                  gap-x-8
                                  gap-y-2
                                "
                              >

                                <p className="text-gray-700">

                                  <span
                                    className="
                                      font-medium
                                    "
                                  >
                                    Client :
                                  </span>{" "}

                                  {commande.nom_client ||
                                    "Client inconnu"}

                                </p>

                                <p
                                  className="
                                    text-gray-500
                                    text-sm
                                  "
                                >

                                  <span
                                    className="
                                      font-medium
                                    "
                                  >
                                    Email :
                                  </span>{" "}

                                  {commande.email_client ||
                                    "Non disponible"}

                                </p>

                                <p
                                  className="
                                    text-gray-500
                                    text-sm
                                  "
                                >

                                  <span
                                    className="
                                      font-medium
                                    "
                                  >
                                    Date :
                                  </span>{" "}

                                  {commande.date_commande
                                    ? new Date(
                                        commande.date_commande
                                      ).toLocaleDateString(
                                        "fr-FR"
                                      )
                                    : "Non disponible"}

                                </p>

                                <p
                                  className="
                                    text-gray-500
                                    text-sm
                                  "
                                >

                                  <span
                                    className="
                                      font-medium
                                    "
                                  >
                                    Articles :
                                  </span>{" "}

                                  {commande.nombre_lignes}

                                </p>

                              </div>

                            </div>

                            {/* TOTAL */}

                            <div
                              className="
                                min-w-[190px]
                                bg-blue-50
                                rounded-xl
                                p-5
                              "
                            >

                              <p
                                className="
                                  text-sm
                                  text-gray-500
                                "
                              >
                                Total
                              </p>

                              <p
                                className="
                                  text-2xl
                                  font-bold
                                  text-blue-700
                                  mt-1
                                "
                              >
                                {Number(
                                  commande.montant_total
                                ).toLocaleString(
                                  "fr-FR"
                                )}{" "}
                                FCFA
                              </p>

                            </div>

                            {/* ACTIONS */}

                            <div
                              className="
                                flex
                                flex-wrap
                                gap-3
                              "
                            >

                              <Link
                                href={`/commandes/${commande.idCommande}`}
                                className="
                                  px-5
                                  py-3
                                  bg-blue-600
                                  text-white
                                  rounded-xl
                                  font-medium
                                  hover:bg-blue-700
                                  transition
                                  text-center
                                "
                              >
                                Voir →
                              </Link>

                              {/* ANNULER
                                  RESPONSABLE COMMERCIAL UNIQUEMENT */}

                              {!commandeTerminee &&
                                estResponsableCommercial && (
                                  <button
                                    onClick={() =>
                                      ouvrirAnnulation(
                                        commande
                                      )
                                    }
                                    disabled={
                                      actionEnCours ===
                                      commande.idCommande
                                    }
                                    className="
                                      px-5
                                      py-3
                                      bg-red-600
                                      text-white
                                      rounded-xl
                                      font-medium
                                      hover:bg-red-700
                                      transition
                                      disabled:bg-gray-400
                                      disabled:cursor-not-allowed
                                    "
                                  >
                                    ✕ Annuler
                                  </button>
                                )}

                            </div>

                          </div>

                        </div>

                      </article>
                    );
                  })}

                </div>

              </section>
            )}

        </section>

        {/* ===================================================
            MODALE ANNULATION
        ==================================================== */}

        {commandeAAnnuler &&
          estResponsableCommercial && (
            <div
              className="
                fixed
                inset-0
                bg-black/50
                flex
                items-center
                justify-center
                p-4
                z-50
              "
            >

              <div
                className="
                  bg-white
                  rounded-2xl
                  shadow-2xl
                  w-full
                  max-w-lg
                  overflow-hidden
                "
              >

                {/* EN-TÊTE */}

                <div
                  className="
                    bg-gradient-to-r
                    from-red-500
                    to-red-600
                    p-6
                    text-white
                  "
                >

                  <h2
                    className="
                      text-xl
                      font-bold
                    "
                  >
                    Annuler la commande #
                    {commandeAAnnuler.idCommande}
                  </h2>

                  <p
                    className="
                      text-red-100
                      text-sm
                      mt-2
                    "
                  >
                    Veuillez indiquer le motif
                    de l'annulation.
                  </p>

                </div>

                {/* FORMULAIRE */}

                <div className="p-6">

                  <label
                    className="
                      block
                      text-sm
                      font-medium
                      text-gray-700
                      mb-2
                    "
                  >
                    Motif d'annulation
                  </label>

                  <textarea
                    value={motifAnnulation}
                    onChange={(e) =>
                      setMotifAnnulation(
                        e.target.value
                      )
                    }
                    rows={4}
                    placeholder="Ex : Stock insuffisant, demande du client..."
                    className="
                      w-full
                      border
                      border-gray-300
                      rounded-xl
                      px-4
                      py-3
                      outline-none
                      focus:ring-2
                      focus:ring-red-500
                      focus:border-red-500
                      resize-none
                    "
                  />

                </div>

                {/* BOUTONS */}

                <div
                  className="
                    p-6
                    border-t
                    flex
                    justify-end
                    gap-3
                    bg-gray-50
                  "
                >

                  <button
                    onClick={fermerAnnulation}
                    disabled={
                      actionEnCours !== null
                    }
                    className="
                      px-5
                      py-3
                      border
                      border-gray-300
                      text-gray-700
                      rounded-xl
                      font-medium
                      hover:bg-white
                      disabled:text-gray-400
                    "
                  >
                    Retour
                  </button>

                  <button
                    onClick={annulerCommande}
                    disabled={
                      actionEnCours !== null ||
                      !motifAnnulation.trim()
                    }
                    className="
                      px-5
                      py-3
                      bg-red-600
                      text-white
                      rounded-xl
                      font-medium
                      hover:bg-red-700
                      disabled:bg-gray-400
                      disabled:cursor-not-allowed
                    "
                  >
                    {actionEnCours !== null
                      ? "Annulation..."
                      : "Confirmer l'annulation"}
                  </button>

                </div>

              </div>

            </div>
          )}

        {/* ===================================================
            FOOTER
        ==================================================== */}

        <footer
          className="
            bg-[#0b1730]
            text-gray-300
            mt-12
          "
        >

          <div
            className="
              max-w-7xl
              mx-auto
              px-6
              py-8
              text-center
            "
          >

            <p
              className="
                font-semibold
                text-white
              "
            >
              MediDispositif
            </p>

            <p className="text-sm mt-2">
              Vente de dispositifs médicaux
              en ligne
            </p>

            <p
              className="
                text-xs
                text-gray-500
                mt-4
              "
            >
              © 2026 MediDispositif.
              Tous droits réservés.
            </p>

          </div>

        </footer>

      </div>

    </main>
  );
}