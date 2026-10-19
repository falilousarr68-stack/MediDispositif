"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";



import api from "../../services/api";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

export default function ProfilPage() {
  const router = useRouter();
  const fichierPhotoRef = useRef(null);

  const [profil, setProfil] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");
  const [utilisateur, setUtilisateur] = useState(null);

  const [modifier, setModifier] = useState(false);
  const [enregistrement, setEnregistrement] = useState(false);
  const [message, setMessage] = useState("");
  const [erreurModification, setErreurModification] = useState("");
  const [statistiques, setStatistiques] = useState(null);
  const [chargementStatistiques, setChargementStatistiques] = useState(true);
  const [graphiques, setGraphiques] = useState({});
const [activiteRecente, setActiviteRecente] = useState([]);
const [raccourcis, setRaccourcis] = useState([]);
  const [modifierMotDePasse, setModifierMotDePasse] = useState(false);
const [modificationMotDePasse, setModificationMotDePasse] = useState(false);
const [messageMotDePasse, setMessageMotDePasse] = useState("");
const [erreurMotDePasse, setErreurMotDePasse] = useState("");


const [formulaireMotDePasse, setFormulaireMotDePasse] = useState({
  ancien_mot_de_passe: "",
  nouveau_mot_de_passe: "",
  confirmation_mot_de_passe: "",
});

  const [formulaire, setFormulaire] = useState({
    nom: "",
    prenom: "",
    telephone: "",
    adresse: "",
  });

  const [photo, setPhoto] = useState(null);
  const [apercuPhoto, setApercuPhoto] = useState(null);

  /* =====================================================
     CHARGEMENT DU PROFIL
  ====================================================== */

  useEffect(() => {
  const utilisateurStocke =
    localStorage.getItem("utilisateur");

  if (utilisateurStocke) {
    try {
      setUtilisateur(JSON.parse(utilisateurStocke));
    } catch (error) {
      console.error(
        "Impossible de récupérer les informations utilisateur",
        error
      );
    }
  }

  chargerProfil();
}, []);

  useEffect(() => {
  chargerStatistiques();
}, []);

  const chargerProfil = async () => {
    try {
      setChargement(true);
      setErreur("");

      const response = await api.get("/auth/profil/");

console.log("Profil récupéré :", response.data);

setProfil(response.data);

// Mettre à jour les informations utilisées par le Sidebar
setUtilisateur(response.data);

// Mettre à jour le localStorage
localStorage.setItem(
  "utilisateur",
  JSON.stringify(response.data)
);
      setFormulaire({
        nom: response.data.nom || "",
        prenom: response.data.prenom || "",
        telephone: response.data.telephone || "",
        adresse: response.data.adresse || "",
      });
    } catch (error) {
      console.error("Erreur profil :", error);

      if (error.response?.status === 401) {
        router.push("/connexion");
        return;
      }

      setErreur(
        "Impossible de charger les informations du profil."
      );
    } finally {
      setChargement(false);
    }
  };

  const chargerStatistiques = async () => {
  try {
    setChargementStatistiques(true);

    const response = await api.get(
  "/auth/profil/statistiques/"
);

console.log(
  "Statistiques récupérées :",
  response.data
);

setStatistiques(response.data);

setGraphiques(
  response.data.graphiques || {}
);

setActiviteRecente(
  response.data.activite_recente || []
);

setRaccourcis(
  response.data.raccourcis || []
);

  } catch (error) {
    console.error(
      "Erreur statistiques :",
      error
    );

    if (error.response?.status === 401) {
      router.push("/connexion");
      return;
    }

    setStatistiques(null);

  } finally {
    setChargementStatistiques(false);
  }
};

  /* =====================================================
     OUVRIR MODIFICATION
  ====================================================== */

  const ouvrirModification = () => {
    setFormulaire({
      nom: profil?.nom || "",
      prenom: profil?.prenom || "",
      telephone: profil?.telephone || "",
      adresse: profil?.adresse || "",
    });

    setPhoto(null);
    setApercuPhoto(null);
    setMessage("");
    setErreurModification("");
    setModifier(true);
  };

  /* =====================================================
     FERMER MODIFICATION
  ====================================================== */

  const fermerModification = () => {
    setModifier(false);
    setPhoto(null);
    setApercuPhoto(null);
    setMessage("");
    setErreurModification("");
  };

  /* =====================================================
   OUVRIR MODIFICATION MOT DE PASSE
====================================================== */

const ouvrirModificationMotDePasse = () => {
  setFormulaireMotDePasse({
    ancien_mot_de_passe: "",
    nouveau_mot_de_passe: "",
    confirmation_mot_de_passe: "",
  });

  setMessageMotDePasse("");
  setErreurMotDePasse("");
  setModifierMotDePasse(true);
};


/* =====================================================
   FERMER MODIFICATION MOT DE PASSE
====================================================== */

const fermerModificationMotDePasse = () => {
  if (modificationMotDePasse) {
    return;
  }

  setModifierMotDePasse(false);

  setFormulaireMotDePasse({
    ancien_mot_de_passe: "",
    nouveau_mot_de_passe: "",
    confirmation_mot_de_passe: "",
  });

  setMessageMotDePasse("");
  setErreurMotDePasse("");
};


/* =====================================================
   MODIFICATION CHAMPS MOT DE PASSE
====================================================== */

const handleMotDePasseChange = (event) => {
  const { name, value } = event.target;

  setFormulaireMotDePasse((ancien) => ({
    ...ancien,
    [name]: value,
  }));
};


/* =====================================================
   ENREGISTRER NOUVEAU MOT DE PASSE
====================================================== */

const enregistrerMotDePasse = async (event) => {
  event.preventDefault();

  setModificationMotDePasse(true);
  setMessageMotDePasse("");
  setErreurMotDePasse("");

  try {

    const response = await api.post(
      "/auth/profil/mot-de-passe/",
      formulaireMotDePasse
    );

    console.log(
      "Mot de passe modifié :",
      response.data
    );

    setMessageMotDePasse(
      response.data?.message ||
      "Votre mot de passe a été modifié avec succès."
    );

    setFormulaireMotDePasse({
      ancien_mot_de_passe: "",
      nouveau_mot_de_passe: "",
      confirmation_mot_de_passe: "",
    });

    setTimeout(() => {
      setModifierMotDePasse(false);
      setMessageMotDePasse("");
    }, 1800);

  } catch (error) {

    console.error(
      "Erreur modification mot de passe :",
      error
    );

    console.error(
      "Réponse serveur :",
      error.response?.data
    );

    const donneesErreur = error.response?.data;

    if (donneesErreur) {

      if (typeof donneesErreur === "object") {

        const messages = Object.values(donneesErreur)
          .flat()
          .join(" ");

        setErreurMotDePasse(
          messages ||
          "Impossible de modifier le mot de passe."
        );

      } else {

        setErreurMotDePasse(
          String(donneesErreur)
        );

      }

    } else {

      setErreurMotDePasse(
        "Impossible de contacter le serveur."
      );
    }

  } finally {

    setModificationMotDePasse(false);

  }
};

  /* =====================================================
     MODIFICATION DES CHAMPS
  ====================================================== */

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormulaire((ancien) => ({
      ...ancien,
      [name]: value,
    }));
  };

  /* =====================================================
     SELECTION PHOTO
  ====================================================== */

  const handlePhotoChange = (event) => {
    const fichier = event.target.files?.[0];

    if (!fichier) {
      return;
    }

    // Vérification du type
    if (!fichier.type.startsWith("image/")) {
      setErreurModification(
        "Veuillez sélectionner une image valide."
      );
      return;
    }

    // Limite de 5 Mo
    if (fichier.size > 5 * 1024 * 1024) {
      setErreurModification(
        "La photo ne doit pas dépasser 5 Mo."
      );
      return;
    }

    setErreurModification("");
    setPhoto(fichier);

    const url = URL.createObjectURL(fichier);
    setApercuPhoto(url);
  };

  /* =====================================================
     ENREGISTRER LE PROFIL
  ====================================================== */

  const enregistrerProfil = async (event) => {
    event.preventDefault();

    try {
      setEnregistrement(true);
      setMessage("");
      setErreurModification("");

      const donnees = new FormData();

      donnees.append("nom", formulaire.nom);
      donnees.append("prenom", formulaire.prenom);
      donnees.append("telephone", formulaire.telephone);
      donnees.append("adresse", formulaire.adresse);

      if (photo) {
        donnees.append("photo_profil", photo);
      }

      const response = await api.patch(
        "/auth/profil/",
        donnees
      );

      console.log(
        "Profil modifié :",
        response.data
      );

      setProfil(response.data);

// Synchroniser le Sidebar
setUtilisateur(response.data);

// Mettre à jour le localStorage
localStorage.setItem(
  "utilisateur",
  JSON.stringify(response.data)
);

      setFormulaire({
        nom: response.data.nom || "",
        prenom: response.data.prenom || "",
        telephone: response.data.telephone || "",
        adresse: response.data.adresse || "",
      });

      setPhoto(null);
      setApercuPhoto(null);

      setMessage(
        "Votre profil a été modifié avec succès."
      );

      setTimeout(() => {
        setModifier(false);
        setMessage("");
      }, 1500);
    } catch (error) {
      console.error(
        "Erreur modification profil :",
        error
      );

      console.error(
        "Réponse serveur :",
        error.response?.data
      );

      const donneesErreur = error.response?.data;

      if (donneesErreur) {
        if (typeof donneesErreur === "object") {
          const premierMessage = Object.values(
            donneesErreur
          )
            .flat()
            .join(" ");

          setErreurModification(
            premierMessage ||
              "Impossible de modifier le profil."
          );
        } else {
          setErreurModification(
            String(donneesErreur)
          );
        }
      } else {
        setErreurModification(
          "Impossible de modifier le profil. Vérifiez que le serveur fonctionne."
        );
      }
    } finally {
      setEnregistrement(false);
    }
  };

  /* =====================================================
     NOM COMPLET
  ====================================================== */

  const nomComplet =
    `${profil?.prenom || ""} ${profil?.nom || ""}`.trim() ||
    "Utilisateur";

  /* =====================================================
     INITIALE
  ====================================================== */

  const initiale =
    nomComplet.charAt(0).toUpperCase() || "U";

  /* =====================================================
     URL PHOTO
  ====================================================== */

  const getPhotoUrl = (photoUrl) => {
    if (!photoUrl) {
      return null;
    }

    if (photoUrl.startsWith("http")) {
      return photoUrl;
    }

    return `http://127.0.0.1:8000${photoUrl}`;
  };

  /* =====================================================
     CHARGEMENT
  ====================================================== */

  if (chargement) {
    return (
      <main className="min-h-screen bg-gray-50">


        <div className="flex justify-center items-center min-h-[70vh]">

          <div className="text-center">

            <div
              className="
                animate-spin
                rounded-full
                h-12
                w-12
                border-b-2
                border-blue-600
                mx-auto
              "
            ></div>

            <p className="mt-4 text-gray-600">
              Chargement du profil...
            </p>

          </div>

        </div>

      </main>
    );
  }

  /* =====================================================
     ERREUR CHARGEMENT
  ====================================================== */

  if (erreur) {
    return (
      <main className="min-h-screen bg-gray-50">


        <div className="max-w-4xl mx-auto px-6 py-12">

          <div
            className="
              bg-red-50
              border
              border-red-200
              text-red-700
              rounded-xl
              p-6
            "
          >
            {erreur}
          </div>

        </div>

      </main>
    );
  }

  if (!profil) {
    return null;
  }
  const mouvementsStockGraphique = Object.values(
  (graphiques?.mouvements_par_mois || []).reduce((acc, mouvement) => {
    const mois = mouvement.mois;

    if (!acc[mois]) {
      acc[mois] = {
        mois,
        Approvisionnement: 0,
        Vente: 0,
        Annulation: 0,
      };
    }

    acc[mois][mouvement.type] = mouvement.quantite;

    return acc;
  }, {})
);

  return (
  <main className="min-h-screen bg-[#f4f8fc]">

    

    <div className="ml-64 min-h-screen">

      

      {/* =====================================================
          EN-TÊTE
      ====================================================== */}

      <section
        className="
          bg-gradient-to-r
          from-[#0b1730]
          via-[#1649b8]
          to-[#087f8c]
          text-white
        "
      >

        <div
          className="
            max-w-7xl
            mx-auto
            px-6
            py-10
          "
        >

          <p className="text-blue-100 text-sm mb-2">
            MediDispositif
          </p>

          <h1 className="text-4xl font-bold">
            Mon Profil
          </h1>

          <p className="mt-2 text-blue-100">
            Consultez et gérez vos informations personnelles.
          </p>

        </div>

      </section>

      {/* =====================================================
          CONTENU
      ====================================================== */}

      <section
        className="
          max-w-7xl
          mx-auto
          px-6
          py-8
        "
      >

        {/* =================================================
            PROFIL + INFORMATIONS
        ================================================== */}

        <div
          className="
            grid
            grid-cols-1
            lg:grid-cols-3
            gap-6
          "
        >

          {/* =================================================
              CARTE PROFIL
          ================================================== */}

          <div
            className="
              lg:col-span-1
              bg-white
              rounded-2xl
              shadow-sm
              border
              border-slate-200
              p-6
            "
          >

            {/* PHOTO */}

            <div className="flex justify-center mb-5">

              {getPhotoUrl(profil.photo_profil) ? (

                <img
                  src={getPhotoUrl(profil.photo_profil)}
                  alt="Photo de profil"
                  className="
                    w-32
                    h-32
                    rounded-full
                    object-cover
                    border-4
                    border-blue-100
                    shadow
                  "
                />

              ) : (

                <div
                  className="
                    w-32
                    h-32
                    rounded-full
                    bg-blue-100
                    text-blue-700
                    flex
                    items-center
                    justify-center
                    text-4xl
                    font-bold
                    border-4
                    border-blue-50
                    shadow-sm
                  "
                >
                  {initiale}
                </div>

              )}

            </div>

            {/* IDENTITÉ */}

            <div className="text-center">

              <h2
                className="
                  text-2xl
                  font-bold
                  text-gray-900
                "
              >
                {nomComplet}
              </h2>

              <p className="text-gray-500 mt-1">
                {profil.email || "Email non renseigné"}
              </p>

              <span
                className="
                  inline-flex
                  mt-4
                  px-4
                  py-2
                  rounded-full
                  bg-gradient-to-r from-blue-100 to-cyan-100
                  text-[#1649b8]
                  font-semibold
                  text-sm
                "
              >
                {profil.role_display ||
                  profil.role ||
                  "Utilisateur"}
              </span>

            </div>

            {/* BOUTON */}

            <button
              type="button"
              onClick={ouvrirModification}
              className="
  w-full
  bg-gradient-to-r from-blue-600 to-cyan-500
  hover:from-blue-700 hover:to-cyan-600
  text-white
  px-6 py-3
  rounded-xl
  font-semibold
  shadow-sm
  hover:shadow-md
  transition-all duration-200
"
            >
              ✏️ Modifier le profil
            </button>

          </div>

          {/* =================================================
              INFORMATIONS PERSONNELLES
          ================================================== */}

          <div
            className="
              lg:col-span-2
              bg-white
              rounded-2xl
              shadow-sm
              border
              border-slate-200
              p-6
            "
          >

            <div className="flex items-center justify-between mb-6">

              <div>

                <h2
                  className="
                    text-xl
                    font-bold
                    text-gray-900
                  "
                >
                  Informations personnelles
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  Informations associées à votre compte.
                </p>

              </div>

              <span className="text-2xl">
                👤
              </span>

            </div>

            <div
              className="
                grid
                grid-cols-1
                md:grid-cols-2
                gap-5
              "
            >

              {/* NOM */}

              <div
                className="
                  border
                  border-slate-200
                  hover:border-cyan-200
                  transition
                  rounded-xl
                  p-4
                "
              >

                <p className="text-sm text-gray-500">
                  Nom
                </p>

                <p className="font-semibold text-gray-900 mt-1">
                  {profil.nom || "Non renseigné"}
                </p>

              </div>

              {/* PRENOM */}

              <div
                className="
                  border
                  border-slate-200
                  hover:border-cyan-200
                  transition
                  rounded-xl
                  p-4
                "
              >

                <p className="text-sm text-gray-500">
                  Prénom
                </p>

                <p className="font-semibold text-gray-900 mt-1">
                  {profil.prenom || "Non renseigné"}
                </p>

              </div>

              {/* EMAIL */}

              <div
                className="
                  border
                  border-slate-200
                  hover:border-cyan-200
                  transition
                  rounded-xl
                  p-4
                "
              >

                <p className="text-sm text-gray-500">
                  Adresse email
                </p>

                <p
                  className="
                    font-semibold
                    text-gray-900
                    mt-1
                    break-words
                  "
                >
                  {profil.email || "Non renseigné"}
                </p>

              </div>

              {/* TELEPHONE */}

              <div
                className="
                  border
                  border-slate-200
                  hover:border-cyan-200
                  transition
                  rounded-xl
                  p-4
                "
              >

                <p className="text-sm text-gray-500">
                  Téléphone
                </p>

                <p className="font-semibold text-gray-900 mt-1">
                  {profil.telephone || "Non renseigné"}
                </p>

              </div>

              {/* ADRESSE */}

              <div
                className="
                  md:col-span-2
                  border
                  border-gray-200
                  rounded-xl
                  p-4
                "
              >

                <p className="text-sm text-gray-500">
                  Adresse
                </p>

                <p className="font-semibold text-gray-900 mt-1">
                  {profil.adresse || "Non renseignée"}
                </p>

              </div>

              {/* ROLE */}

              <div
                className="
                  md:col-span-2
                  border
                  border-gray-200
                  rounded-xl
                  p-4
                "
              >

                <p className="text-sm text-gray-500">
                  Rôle
                </p>

                <p className="font-semibold text-gray-900 mt-1">
                  {profil.role_display ||
                    profil.role ||
                    "Non renseigné"}
                </p>

              </div>

            </div>

          </div>

        </div>


        {/* =================================================
    STATISTIQUES
================================================== */}

<div className="mt-8">

  <div className="mb-5">

    <h2 className="text-2xl font-bold text-gray-900">
      Vue d'ensemble
    </h2>

    <p className="text-gray-500 mt-1">
      Quelques indicateurs de votre activité.
    </p>

  </div>

  {chargementStatistiques ? (

    <div
      className="
        bg-white
        rounded-2xl
        border
        border-gray-200
        shadow-sm
        p-8
        text-center
      "
    >

      <div
        className="
          animate-spin
          rounded-full
          h-8
          w-8
          border-b-2
          border-blue-600
          mx-auto
        "
      ></div>

      <p className="mt-3 text-gray-500">
        Chargement des statistiques...
      </p>

    </div>

  ) : (

    <div
      className="
        grid
        grid-cols-1
        sm:grid-cols-2
        lg:grid-cols-5
        gap-5
      "
    >

      {/* =================================================
          CLIENT
      ================================================== */}

      {profil.role === "Client" && (
        <>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:shadow-md hover:border-cyan-200 transition-all">

            <p className="text-sm text-gray-500">
              Commandes
            </p>

            <p className="text-3xl font-bold text-gray-900 mt-2">
              {statistiques?.statistiques?.commandes ?? 0}
            </p>

            <p className="text-xs text-gray-400 mt-3">
              Nombre total de commandes
            </p>

          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:shadow-md hover:border-cyan-200 transition-all">

            <p className="text-sm text-gray-500">
              Commandes validées
            </p>

            <p className="text-3xl font-bold text-gray-900 mt-2">
              {statistiques?.statistiques?.commandes_validees ?? 0}
            </p>

            <p className="text-xs text-gray-400 mt-3">
              Commandes confirmées après paiement
            </p>

          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:shadow-md hover:border-cyan-200 transition-all">

            <p className="text-sm text-gray-500">
              Commandes en cours
            </p>

            <p className="text-3xl font-bold text-gray-900 mt-2">
              {statistiques?.statistiques?.commandes_en_cours ?? 0}
            </p>

            <p className="text-xs text-gray-400 mt-3">
              Commandes en attente de paiement
            </p>

          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:shadow-md hover:border-cyan-200 transition-all">

            <p className="text-sm text-gray-500">
              Total dépensé
            </p>

            <p className="text-2xl font-bold text-gray-900 mt-2">
              {Number(
                statistiques?.statistiques?.montant_depense || 0
              ).toLocaleString("fr-FR")}

              <span className="text-sm font-semibold ml-1">
                FCFA
              </span>
            </p>

            <p className="text-xs text-gray-400 mt-3">
              Montant total des commandes validées
            </p>

          </div>
        </>
      )}

      {/* =================================================
          VENDEUR
      ================================================== */}

      {profil.role === "Vendeur" && (
        <>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:shadow-md hover:border-cyan-200 transition-all">

            <p className="text-sm text-gray-500">
              Commandes traitées
            </p>

            <p className="text-3xl font-bold text-gray-900 mt-2">
              {statistiques?.statistiques?.commandes_traitees ?? 0}
            </p>

            <p className="text-xs text-gray-400 mt-3">
              Nombre de commandes validées
            </p>

          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:shadow-md hover:border-cyan-200 transition-all">

            <p className="text-sm text-gray-500">
              Ventes
            </p>

            <p className="text-3xl font-bold text-gray-900 mt-2">
              {statistiques?.statistiques?.ventes ?? 0}
            </p>

            <p className="text-xs text-gray-400 mt-3">
              Nombre de paiements réussis
            </p>

          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:shadow-md hover:border-cyan-200 transition-all">

            <p className="text-sm text-gray-500">
              Commandes en cours
            </p>

            <p className="text-3xl font-bold text-gray-900 mt-2">
              {statistiques?.statistiques?.commandes_en_cours ?? 0}
            </p>

            <p className="text-xs text-gray-400 mt-3">
              Commandes actuellement en attente
            </p>

          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:shadow-md hover:border-cyan-200 transition-all">

            <p className="text-sm text-gray-500">
              Chiffre d'affaires
            </p>

            <p className="text-2xl font-bold text-gray-900 mt-2">
              {Number(
                statistiques?.statistiques?.chiffre_affaires || 0
              ).toLocaleString("fr-FR")}

              <span className="text-sm font-semibold ml-1">
                FCFA
              </span>
            </p>

            <p className="text-xs text-gray-400 mt-3">
              Montant total des commandes validées
            </p>

          </div>
        </>
      )}

      {/* =================================================
          RESPONSABLE COMMERCIAL
      ================================================== */}

      {profil.role === "ResponsableCommercial" && (
        <>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:shadow-md hover:border-cyan-200 transition-all">

            <p className="text-sm text-gray-500">
              Commandes
            </p>

            <p className="text-3xl font-bold text-gray-900 mt-2">
              {statistiques?.statistiques?.commandes ?? 0}
            </p>

            <p className="text-xs text-gray-400 mt-3">
              Nombre total de commandes
            </p>

          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:shadow-md hover:border-cyan-200 transition-all">

            <p className="text-sm text-gray-500">
              Commandes validées
            </p>

            <p className="text-3xl font-bold text-gray-900 mt-2">
              {statistiques?.statistiques?.commandes_validees ?? 0}
            </p>

            <p className="text-xs text-gray-400 mt-3">
              Commandes confirmées
            </p>

          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:shadow-md hover:border-cyan-200 transition-all">

            <p className="text-sm text-gray-500">
              Commandes en cours
            </p>

            <p className="text-3xl font-bold text-gray-900 mt-2">
              {statistiques?.statistiques?.commandes_en_cours ?? 0}
            </p>

            <p className="text-xs text-gray-400 mt-3">
              Commandes en attente
            </p>

          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:shadow-md hover:border-cyan-200 transition-all">

  <p className="text-sm text-gray-500">
    Commandes annulées
  </p>

  <p className="text-3xl font-bold text-gray-900 mt-2">
    {statistiques?.statistiques?.commandes_annulees ?? 0}
  </p>

  <p className="text-xs text-gray-400 mt-3">
    Nombre de commandes annulées
  </p>

</div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:shadow-md hover:border-cyan-200 transition-all">

            <p className="text-sm text-gray-500">
              Chiffre d'affaires
            </p>

            <p className="text-2xl font-bold text-gray-900 mt-2">
              {Number(
                statistiques?.statistiques?.chiffre_affaires || 0
              ).toLocaleString("fr-FR")}

              <span className="text-sm font-semibold ml-1">
                FCFA
              </span>
            </p>

            <p className="text-xs text-gray-400 mt-3">
              Montant des commandes validées
            </p>

          </div>
        </>
      )}

      {/* =================================================
          GESTIONNAIRE DE STOCK
      ================================================== */}

      {profil.role === "GestionnaireDeStock" && (
        <>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:shadow-md hover:border-cyan-200 transition-all">

            <p className="text-sm text-gray-500">
              Produits
            </p>

            <p className="text-3xl font-bold text-gray-900 mt-2">
              {statistiques?.statistiques?.produits ?? 0}
            </p>

            <p className="text-xs text-gray-400 mt-3">
              Nombre de produits
            </p>

          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:shadow-md hover:border-cyan-200 transition-all">

            <p className="text-sm text-gray-500">
              Stock total
            </p>

            <p className="text-3xl font-bold text-gray-900 mt-2">
              {statistiques?.statistiques?.stock_total ?? 0}
            </p>

            <p className="text-xs text-gray-400 mt-3">
              Quantité totale en stock
            </p>

          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:shadow-md hover:border-cyan-200 transition-all">

            <p className="text-sm text-gray-500">
              Stock faible
            </p>

            <p className="text-3xl font-bold text-gray-900 mt-2">
              {statistiques?.statistiques?.stock_faible ?? 0}
            </p>

            <p className="text-xs text-gray-400 mt-3">
              Produits nécessitant une attention
            </p>

          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:shadow-md hover:border-cyan-200 transition-all">

            <p className="text-sm text-gray-500">
              Mouvements
            </p>

            <p className="text-3xl font-bold text-gray-900 mt-2">
              {statistiques?.statistiques?.mouvements ?? 0}
            </p>

            <p className="text-xs text-gray-400 mt-3">
              Mouvements de stock enregistrés
            </p>

          </div>
        </>
      )}

      {/* =================================================
          ADMINISTRATEUR
      ================================================== */}

      {profil.role === "Administrateur" && (
        <>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:shadow-md hover:border-cyan-200 transition-all">

            <p className="text-sm text-slate-500">
              Utilisateurs
            </p>

            <p className="text-3xl font-bold text-gray-900 mt-2">
              {statistiques?.statistiques?.utilisateurs ?? 0}
            </p>

            <p className="text-xs text-gray-400 mt-3">
              Utilisateurs enregistrés
            </p>

          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:shadow-md hover:border-cyan-200 transition-all">

            <p className="text-sm text-slate-500">
              Produits
            </p>

            <p className="text-3xl font-bold text-gray-900 mt-2">
              {statistiques?.statistiques?.produits ?? 0}
            </p>

            <p className="text-xs text-gray-400 mt-3">
              Produits du catalogue
            </p>

          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:shadow-md hover:border-cyan-200 transition-all">

            <p className="text-sm text-slate-500">
              Commandes
            </p>

            <p className="text-3xl font-bold text-gray-900 mt-2">
              {statistiques?.statistiques?.commandes ?? 0}
            </p>

            <p className="text-xs text-gray-400 mt-3">
              Nombre total de commandes
            </p>

          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:shadow-md hover:border-cyan-200 transition-all">

            <p className="text-sm text-slate-500">
              Chiffre d'affaires
            </p>

            <p className="text-2xl font-bold text-gray-900 mt-2">
              {Number(
                statistiques?.statistiques?.chiffre_affaires || 0
              ).toLocaleString("fr-FR")}

              <span className="text-sm font-semibold ml-1">
                FCFA
              </span>
            </p>

            <p className="text-xs text-gray-400 mt-3">
              Montant des commandes validées
            </p>

          </div>
        </>
      )}

    </div>

  )}

</div>
 
        {/* =================================================
    GRAPHIQUES
================================================== */}

<div className="mt-8">

  <div className="mb-5">

    <h2 className="text-2xl font-bold text-gray-900">
      Évolution de votre activité
    </h2>

    <p className="text-slate-500 mt-1">
      Suivez l'évolution de vos commandes et de vos dépenses.
    </p>

  </div>

  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

    {/* =================================================
        COMMANDES PAR MOIS
    ================================================== */}

    <div
      className="
        bg-white
        rounded-2xl
        border
        border-gray-200
        shadow-sm
        p-6
      "
    >

      <div className="mb-5">

        <h3 className="text-lg font-semibold text-gray-900">
  {profil.role === "Vendeur"
  ? "Ventes par mois"
  : profil.role === "GestionnaireDeStock"
  ? "Mouvements de stock par mois"
  : profil.role === "Administrateur"
  ? "Commandes par mois"
  : "Commandes par mois"}
</h3>

<p className="text-sm text-slate-500 mt-2">
  {profil.role === "Vendeur"
    ? "Nombre de ventes réalisées chaque mois."
    : profil.role === "GestionnaireDeStock"
    ? "Quantité de produits entrés et sortis du stock."
    : "Nombre de commandes effectuées."}
</p>

      </div>

      <div className="h-72">

        {/* GRAPHIQUE DU CLIENT */}
{profil.role === "Client" && (
  <ResponsiveContainer width="100%" height="100%">

    <LineChart
      data={graphiques?.commandes_par_mois || []}
      margin={{
        top: 10,
        right: 10,
        left: 0,
        bottom: 5,
      }}
    >

      <CartesianGrid strokeDasharray="3 3" />

      <XAxis
        dataKey="mois"
        tick={{ fontSize: 12 }}
      />

      <YAxis
        allowDecimals={false}
        tick={{ fontSize: 12 }}
      />

      <Tooltip
  contentStyle={{
    backgroundColor: "#ffffff",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
  }}
  labelStyle={{
    color: "#111827",
    fontWeight: "600",
  }}
  itemStyle={{
    color: "#111827",
  }}
/>

<Line
  type="monotone"
  dataKey="total"
  stroke="#2563eb"
  strokeWidth={3}
  dot={{ r: 4 }}
  activeDot={{ r: 6 }}
/>

    </LineChart>

  </ResponsiveContainer>
)}

{/* GRAPHIQUE DU VENDEUR */}
{profil.role === "Vendeur" && (
  <ResponsiveContainer width="100%" height="100%">

    <LineChart
      data={graphiques?.ventes_par_mois || []}
      margin={{
        top: 10,
        right: 10,
        left: 0,
        bottom: 5,
      }}
    >

      <CartesianGrid strokeDasharray="3 3" />

      <XAxis
        dataKey="mois"
        tick={{ fontSize: 12 }}
      />

      <YAxis
        allowDecimals={false}
        tick={{ fontSize: 12 }}
      />

      <Tooltip
  contentStyle={{
    backgroundColor: "#ffffff",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
  }}
  labelStyle={{
    color: "#111827",
    fontWeight: "600",
  }}
  itemStyle={{
    color: "#111827",
  }}
/>
 <Line
  type="monotone"
  dataKey="total"
  stroke="#2563eb"
  strokeWidth={3}
  dot={{ r: 4 }}
  activeDot={{ r: 6 }}
 />

    </LineChart>

  </ResponsiveContainer>
)}

{/* GRAPHIQUE DU RESPONSABLE COMMERCIAL */}
{profil.role === "ResponsableCommercial" && (
  <ResponsiveContainer width="100%" height="100%">

    <LineChart
      data={graphiques?.commandes_par_mois || []}
      margin={{
        top: 10,
        right: 10,
        left: 0,
        bottom: 5,
      }}
    >

      <CartesianGrid strokeDasharray="3 3" />

      <XAxis
        dataKey="mois"
        tick={{ fontSize: 12 }}
      />

      <YAxis
        allowDecimals={false}
        tick={{ fontSize: 12 }}
      />

      <Tooltip
        contentStyle={{
          backgroundColor: "#ffffff",
          border: "1px solid #d1d5db",
          borderRadius: "8px",
        }}
        labelStyle={{
          color: "#111827",
          fontWeight: "600",
        }}
        itemStyle={{
          color: "#111827",
        }}
      />

      <Line
        type="monotone"
        dataKey="total"
        stroke="#2563eb"
        strokeWidth={3}
        dot={{ r: 4 }}
        activeDot={{ r: 6 }}
      />

    </LineChart>

  </ResponsiveContainer>
)}

{/* GRAPHIQUE DU GESTIONNAIRE DE STOCK */}
{profil.role === "GestionnaireDeStock" && (
  <ResponsiveContainer width="100%" height="100%">

    <LineChart
      data={mouvementsStockGraphique}
      margin={{
        top: 10,
        right: 20,
        left: 0,
        bottom: 5,
      }}
    >

      <CartesianGrid strokeDasharray="3 3" />

      <XAxis
        dataKey="mois"
        tick={{ fontSize: 12 }}
      />

      <YAxis
        allowDecimals={false}
        tick={{ fontSize: 12 }}
      />

      <Tooltip
        formatter={(value, name) => [
          `${Number(value).toLocaleString("fr-FR")} unités`,
          name,
        ]}
        labelFormatter={(label) => `Mois : ${label}`}
        contentStyle={{
          backgroundColor: "#ffffff",
          border: "1px solid #d1d5db",
          borderRadius: "8px",
        }}
        labelStyle={{
          color: "#111827",
          fontWeight: "600",
        }}
        itemStyle={{
          color: "#111827",
        }}
      />

      <Legend />

      <Line
        type="monotone"
        dataKey="Approvisionnement"
        name="Approvisionnement"
        stroke="#2563eb"
        strokeWidth={3}
        dot={{ r: 4 }}
        activeDot={{ r: 6 }}
      />

      <Line
        type="monotone"
        dataKey="Vente"
        name="Vente"
        stroke="#dc2626"
        strokeWidth={3}
        dot={{ r: 4 }}
        activeDot={{ r: 6 }}
      />

      <Line
        type="monotone"
        dataKey="Annulation"
        name="Annulation"
        stroke="#f59e0b"
        strokeWidth={3}
        dot={{ r: 4 }}
        activeDot={{ r: 6 }}
      />

    </LineChart>

  </ResponsiveContainer>
)}

{/* GRAPHIQUE ADMINISTRATEUR */}
{profil.role === "Administrateur" && (
  <ResponsiveContainer width="100%" height="100%">

    <LineChart
      data={graphiques?.activite_commerciale || []}
      margin={{
        top: 10,
        right: 10,
        left: 0,
        bottom: 5,
      }}
    >

      <CartesianGrid strokeDasharray="3 3" />

      <XAxis
        dataKey="mois"
        tick={{ fontSize: 12 }}
      />

      <YAxis
        allowDecimals={false}
        tick={{ fontSize: 12 }}
      />

      <Tooltip
        formatter={(value) => [
          `${Number(value).toLocaleString("fr-FR")} commandes`,
          "Commandes",
        ]}
        labelFormatter={(label) => `Mois : ${label}`}
        contentStyle={{
          backgroundColor: "#ffffff",
          border: "1px solid #d1d5db",
          borderRadius: "8px",
        }}
        labelStyle={{
          color: "#111827",
          fontWeight: "600",
        }}
        itemStyle={{
          color: "#111827",
        }}
      />

      <Line
        type="monotone"
        dataKey="commandes"
        name="Commandes"
        stroke="#2563eb"
        strokeWidth={3}
        dot={{ r: 4 }}
        activeDot={{ r: 6 }}
      />

    </LineChart>

  </ResponsiveContainer>
)}

      </div>

    </div>


    {/* =================================================
        DÉPENSES PAR MOIS
    ================================================== */}

    <div
      className="
        bg-white
        rounded-2xl
        border
        border-gray-200
        shadow-sm
        p-6
      "
    >

      <div className="mb-5">

  <h3 className="text-lg font-semibold text-gray-900">
    {profil.role === "Vendeur" ||
profil.role === "ResponsableCommercial" ||
profil.role === "Administrateur"
  ? "Chiffre d'affaires par mois"
  : profil.role === "GestionnaireDeStock"
  ? "Stock disponible par produit"
  : "Dépenses par mois"}
  </h3>

    <p className="text-sm text-gray-500 mt-2">
        {profil.role === "Vendeur" ||
profil.role === "ResponsableCommercial" ||
profil.role === "Administrateur"
  ? "Montant total des ventes réalisées chaque mois."
  : profil.role === "GestionnaireDeStock"
  ? "Quantité disponible pour chaque produit."
  : "Montant total dépensé chaque mois."}
    </p>

</div>

      <div className="h-72">

        {/* GRAPHIQUE CLIENT */}
{profil.role === "Client" && (
  <ResponsiveContainer width="100%" height="100%">

    <LineChart
      data={graphiques?.depenses_par_mois || []}
      margin={{
        top: 10,
        right: 10,
        left: 10,
        bottom: 5,
      }}
    >

      <CartesianGrid strokeDasharray="3 3" />

      <XAxis
        dataKey="mois"
        tick={{ fontSize: 12 }}
      />

      <YAxis
        tick={{ fontSize: 12 }}
      />

      <Tooltip
  formatter={(value) =>
    `${Number(value).toLocaleString("fr-FR")} FCFA`
  }
  contentStyle={{
    backgroundColor: "#ffffff",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
  }}
  labelStyle={{
    color: "#111827",
    fontWeight: "600",
  }}
  itemStyle={{
    color: "#111827",
  }}
/>

      <Line
        type="monotone"
        dataKey="total"
        stroke="#16a34a"
        strokeWidth={3}
        dot={{ r: 4 }}
        activeDot={{ r: 6 }}
      />

    </LineChart>

  </ResponsiveContainer>
)}

{/* GRAPHIQUE VENDEUR */}
{profil.role === "Vendeur" && (
  <ResponsiveContainer width="100%" height="100%">

    <LineChart
      data={graphiques?.ventes_par_mois || []}
      margin={{
        top: 10,
        right: 10,
        left: 10,
        bottom: 5,
      }}
    >

      <CartesianGrid strokeDasharray="3 3" />

      <XAxis
        dataKey="mois"
        tick={{ fontSize: 12 }}
      />

      <YAxis
        tick={{ fontSize: 12 }}
      />

      <Tooltip
  formatter={(value) =>
    `${Number(value).toLocaleString("fr-FR")} FCFA`
  }
  contentStyle={{
    backgroundColor: "#ffffff",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
  }}
  labelStyle={{
    color: "#111827",
    fontWeight: "600",
  }}
  itemStyle={{
    color: "#111827",
  }}
/>

      <Line
        type="monotone"
        dataKey="chiffre_affaires"
        stroke="#16a34a"
        strokeWidth={3}
        dot={{ r: 4 }}
        activeDot={{ r: 6 }}
      />

    </LineChart>

  </ResponsiveContainer>
)}

{/* GRAPHIQUE RESPONSABLE COMMERCIAL */}
{profil.role === "ResponsableCommercial" && (
  <ResponsiveContainer width="100%" height="100%">

    <LineChart
      data={graphiques?.commandes_par_mois || []}
      margin={{
        top: 10,
        right: 10,
        left: 10,
        bottom: 5,
      }}
    >

      <CartesianGrid strokeDasharray="3 3" />

      <XAxis
        dataKey="mois"
        tick={{ fontSize: 12 }}
      />

      <YAxis
        tick={{ fontSize: 12 }}
      />

      <Tooltip
        formatter={(value) =>
          `${Number(value).toLocaleString("fr-FR")} FCFA`
        }
        contentStyle={{
          backgroundColor: "#ffffff",
          border: "1px solid #d1d5db",
          borderRadius: "8px",
        }}
        labelStyle={{
          color: "#111827",
          fontWeight: "600",
        }}
        itemStyle={{
          color: "#111827",
        }}
      />

      <Line
        type="monotone"
        dataKey="chiffre_affaires"
        stroke="#16a34a"
        strokeWidth={3}
        dot={{ r: 4 }}
        activeDot={{ r: 6 }}
      />

    </LineChart>

  </ResponsiveContainer>
)}

{/* GRAPHIQUE ADMINISTRATEUR */}
{profil.role === "Administrateur" && (
  <ResponsiveContainer width="100%" height="100%">

    <LineChart
      data={graphiques?.activite_commerciale || []}
      margin={{
        top: 10,
        right: 10,
        left: 10,
        bottom: 5,
      }}
    >

      <CartesianGrid strokeDasharray="3 3" />

      <XAxis
        dataKey="mois"
        tick={{ fontSize: 12 }}
      />

      <YAxis
        tick={{ fontSize: 12 }}
      />

      <Tooltip
        formatter={(value) =>
          `${Number(value).toLocaleString("fr-FR")} FCFA`
        }
        labelFormatter={(label) => `Mois : ${label}`}
        contentStyle={{
          backgroundColor: "#ffffff",
          border: "1px solid #d1d5db",
          borderRadius: "8px",
        }}
        labelStyle={{
          color: "#111827",
          fontWeight: "600",
        }}
        itemStyle={{
          color: "#111827",
        }}
      />

      <Line
        type="monotone"
        dataKey="chiffre_affaires"
        name="Chiffre d'affaires"
        stroke="#16a34a"
        strokeWidth={3}
        dot={{ r: 4 }}
        activeDot={{ r: 6 }}
      />

    </LineChart>

  </ResponsiveContainer>
)}

{/* GRAPHIQUE STOCK PAR PRODUIT */}
{profil.role === "GestionnaireDeStock" && (
  <div className="h-72 overflow-y-auto pr-2">

    <div
      style={{
        height: Math.max(
          288,
          (graphiques?.stock_par_produit?.length || 0) * 45
        ),
      }}
    >

      <ResponsiveContainer width="100%" height="100%">

        <BarChart
          data={graphiques?.stock_par_produit || []}
          layout="vertical"
          margin={{
            top: 10,
            right: 20,
            left: 20,
            bottom: 10,
          }}
        >

          <CartesianGrid strokeDasharray="3 3" />

          <XAxis
            type="number"
            allowDecimals={false}
            tick={{ fontSize: 12 }}
          />

          <YAxis
            type="category"
            dataKey="produit"
            width={120}
            tick={{ fontSize: 11 }}
          />

          <Tooltip
            formatter={(value) => [
              `${Number(value).toLocaleString("fr-FR")} unités`,
              "Stock",
            ]}
            labelFormatter={(label) => `Produit : ${label}`}
            contentStyle={{
              backgroundColor: "#ffffff",
              border: "1px solid #d1d5db",
              borderRadius: "8px",
            }}
            labelStyle={{
              color: "#111827",
              fontWeight: "600",
            }}
            itemStyle={{
              color: "#111827",
            }}
          />

          <Bar
            dataKey="stock"
            name="Stock disponible"
            fill="#087f8c"
            barSize={24}
          />

        </BarChart>

      </ResponsiveContainer>

    </div>

  </div>
)}

      </div>

    </div>

  </div>

</div>

       {/* =================================================
    ACTIVITÉ RÉCENTE
================================================== */}

<div className="mt-8">

  <div className="mb-5">

    <h2 className="text-2xl font-bold text-gray-900">
      Activité récente
    </h2>

    <p className="text-gray-500 mt-1">
      Retrouvez les dernières actions effectuées sur votre compte.
    </p>

  </div>

  <div
    className="
      bg-white
      rounded-2xl
      border
      border-gray-200
      shadow-sm
      overflow-hidden
    "
  >

    {activiteRecente.length === 0 ? (

      <div className="p-8 text-center">

        <div className="text-4xl mb-3">
          📋
        </div>

        <p className="font-semibold text-gray-700">
          Aucune activité récente
        </p>

        <p className="text-sm text-gray-500 mt-1">
          Les dernières actions apparaîtront ici.
        </p>

      </div>

    ) : (

      <div className="divide-y divide-gray-100">

        {activiteRecente.map((activite, index) => (

          <div
            key={`${activite.type}-${activite.date}-${index}`}
            className="
              flex
              items-center
              gap-4
              p-5
              hover:bg-gray-50
              transition
            "
          >

            {/* ICÔNE */}

            <div
              className="
                w-11
                h-11
                rounded-xl
                bg-blue-100
                text-blue-700
                flex
                items-center
                justify-center
                text-xl
                flex-shrink-0
              "
            >
              {activite.icone || "📋"}
            </div>


            {/* INFORMATIONS */}

            <div className="flex-1 min-w-0">

              <p className="font-semibold text-gray-900">
                {activite.titre || "Activité"}
              </p>

              <p className="text-sm text-gray-500 mt-1 truncate">
                {activite.description || "Aucune description"}
              </p>

            </div>


            {/* DATE */}

            <div className="text-right flex-shrink-0">

              <p className="text-xs text-gray-400">
                {activite.date
                  ? new Date(activite.date).toLocaleDateString(
                      "fr-FR",
                      {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      }
                    )
                  : ""}
              </p>

              <p className="text-xs text-gray-400 mt-1">
                {activite.date
                  ? new Date(activite.date).toLocaleTimeString(
                      "fr-FR",
                      {
                        hour: "2-digit",
                        minute: "2-digit",
                      }
                    )
                  : ""}
              </p>

            </div>

          </div>

        ))}

      </div>

    )}

  </div>

</div>

       {/* =================================================
    RACCOURCIS
================================================== */}

<div className="mt-8">

  <div className="mb-5">

    <h2 className="text-2xl font-bold text-gray-900">
      Accès rapides
    </h2>

    <p className="text-gray-500 mt-1">
      Accédez rapidement aux principales fonctionnalités de votre compte.
    </p>

  </div>

  <div
    className="
      grid
      grid-cols-1
      sm:grid-cols-2
      lg:grid-cols-3
      gap-5
    "
  >

    {raccourcis.map((raccourci, index) => (

      <button
        key={`${raccourci.lien}-${index}`}
        type="button"
        onClick={() => router.push(raccourci.lien)}
        className="
          bg-white
          rounded-2xl
          border
          border-gray-200
          shadow-sm
          p-5
          text-left
          hover:shadow-md
          hover:border-blue-200
          hover:-translate-y-0.5
          transition
          group
        "
      >

        <div className="flex items-center gap-4">

          {/* ICÔNE */}

          <div
            className="
              w-12
              h-12
              rounded-xl
              bg-blue-100
              text-blue-700
              flex
              items-center
              justify-center
              text-2xl
              flex-shrink-0
              group-hover:bg-blue-600
              group-hover:text-white
              transition
            "
          >
            {raccourci.icone || "📌"}
          </div>


          {/* TEXTE */}

          <div className="flex-1">

            <h3 className="font-bold text-gray-900">
              {raccourci.titre}
            </h3>

            <p className="text-sm text-gray-500 mt-1">
              {raccourci.description}
            </p>

          </div>


          {/* FLÈCHE */}

          <div
            className="
              text-gray-400
              text-xl
              group-hover:text-blue-600
              transition
            "
          >
            →
          </div>

        </div>

      </button>

    ))}

  </div>

</div>


        {/* =================================================
            SÉCURITÉ
        ================================================== */}

        <div
          className="
            mt-8
            bg-white
            rounded-2xl
            border
            border-gray-200
            shadow-sm
            p-6
          "
        >

          <div className="flex items-center gap-3 mb-5">

            <div
              className="
                w-11
                h-11
                rounded-xl
                bg-gradient-to-br from-blue-100 to-cyan-100
                text-[#1649b8]
                flex
                items-center
                justify-center
                text-xl
              "
            >
              🔐
            </div>

            <div>

              <h2 className="text-xl font-bold text-gray-900">
                Sécurité du compte
              </h2>                                                                                                                                       

              <p className="text-sm text-gray-500">
                Gérez les paramètres de sécurité de votre compte.
              </p>

            </div>

          </div>

          <div
            className="
              flex
              flex-col
              md:flex-row
              md:items-center
              md:justify-between
              gap-4
              border
              border-slate-200
              rounded-xl
              p-4
            "
          >

            <div>

              <p className="font-semibold text-gray-900">
                Mot de passe
              </p>

              <p className="text-sm text-gray-500 mt-1">
                Protégez votre compte avec un mot de passe sécurisé.
              </p>

            </div>

            <button
  type="button"
  onClick={ouvrirModificationMotDePasse}
  className="
  border border-blue-600
  text-blue-600
  hover:bg-blue-50
  px-6 py-3
  rounded-xl
  font-semibold
  transition
"
>
  Modifier le mot de passe
</button>

          </div>

        </div>

      </section>


      {/* =====================================================
          MODALE MODIFICATION PROFIL
      ====================================================== */}

      {modifier && (

        <div
          className="
            fixed
            inset-0
            z-50
            bg-black/50
            flex
            items-center
            justify-center
            p-4
            overflow-y-auto
          "
        >

          <div
            className="
              bg-white
              rounded-2xl
              shadow-2xl
              w-full
              max-w-2xl
              my-8
            "
          >

            {/* EN-TÊTE MODALE */}

            <div
              className="
                flex
                items-center
                justify-between
                px-6
                py-5
                border-b
                border-gray-200
              "
            >

              <div className="flex items-center gap-3">
  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-white text-xl shadow-sm">
    👤
  </div>

  <div>
    <h2 className="text-xl font-bold text-gray-900">
      Modifier mon profil
    </h2>

    <p className="text-sm text-gray-500 mt-1">
      Mettez à jour vos informations personnelles.
    </p>
  </div>
</div>

              <button
                type="button"
                onClick={fermerModification}
                className="
                  w-9
                  h-9
                  rounded-full
                  bg-gray-100
                  text-gray-600
                  hover:bg-gray-200
                  text-xl
                "
              >
                ×
              </button>

            </div>


            {/* FORMULAIRE */}

            <form
              onSubmit={enregistrerProfil}
              className="p-6"
            >

              {/* PHOTO */}

              <div className="mb-6">

                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Photo de profil
                </label>

                <div className="flex flex-col sm:flex-row items-center gap-5">

                  {/* APERÇU */}

                  <div>

                    {apercuPhoto ? (

                      <img
                        src={apercuPhoto}
                        alt="Aperçu"
                        className="
                          w-24
                          h-24
                          rounded-full
                          object-cover
                          border-4
                          border-cyan-100
                        "
                      />

                    ) : getPhotoUrl(profil.photo_profil) ? (

                      <img
                        src={getPhotoUrl(profil.photo_profil)}
                        alt="Photo actuelle"
                        className="
                          w-24
                          h-24
                          rounded-full
                          object-cover
                          border-4
                          border-blue-100
                        "
                      />

                    ) : (

                      <div
                        className="
                          w-24
                          h-24
                          rounded-full
                          bg-gradient-to-br from-blue-100 to-cyan-100
                          text-[#1649b8]
                          border-cyan-50
                          flex
                          items-center
                          justify-center
                          text-3xl
                          font-bold
                        "
                      >
                        {initiale}
                      </div>

                    )}

                  </div>


                  <div>

                    <input
                      ref={fichierPhotoRef}
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="hidden"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        fichierPhotoRef.current?.click()
                      }
                      className="
  px-5
  py-2.5
  bg-gradient-to-r
  from-blue-600
  to-cyan-500
  hover:from-blue-700
  hover:to-cyan-600
  text-white
  rounded-xl
  font-semibold
  shadow-sm
  hover:shadow-md
  transition-all
  duration-200
"
                    >
                      🖼️ Choisir une photo
                    </button>

                    <p className="text-xs text-gray-500 mt-2">
                      JPG, PNG ou WEBP — 5 Mo maximum
                    </p>

                  </div>

                </div>

              </div>


              {/* CHAMPS */}

              <div
                className="
                  grid
                  grid-cols-1
                  md:grid-cols-2
                  gap-5
                "
              >

                {/* PRENOM */}

                <div>

                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Prénom
                  </label>

                  <input
                    type="text"
                    name="prenom"
                    value={formulaire.prenom}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />

                </div>


                {/* NOM */}

                <div>

                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Nom
                  </label>

                  <input
                    type="text"
                    name="nom"
                    value={formulaire.nom}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />

                </div>


                {/* TELEPHONE */}

                <div>

                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Téléphone
                  </label>

                  <input
                    type="tel"
                    name="telephone"
                    value={formulaire.telephone}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />

                </div>


                {/* EMAIL NON MODIFIABLE */}

                <div>

                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Adresse email
                  </label>

                  <input
                    type="email"
                    value={profil.email || ""}
                    disabled
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />

                  <p className="text-xs text-gray-400 mt-1">
                    L'adresse email sert à la connexion.
                  </p>

                </div>


                {/* ADRESSE */}

                <div className="md:col-span-2">

                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Adresse
                  </label>

                  <textarea
                    name="adresse"
                    value={formulaire.adresse}
                    onChange={handleChange}
                    rows="3"
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    placeholder="Votre adresse de livraison..."
                  />

                </div>

              </div>


              {/* MESSAGE ERREUR */}

              {erreurModification && (

                <div
                  className="
                    mt-5
                    bg-red-50
                    border
                    border-red-200
                    text-red-700
                    rounded-xl
                    px-4
                    py-3
                    text-sm
                  "
                >
                  {erreurModification}
                </div>

              )}


              {/* MESSAGE SUCCÈS */}

              {message && (

                <div
                  className="
                    mt-5
                    bg-green-50
                    border
                    border-green-200
                    text-green-700
                    rounded-xl
                    px-4
                    py-3
                    text-sm
                  "
                >
                  ✅ {message}
                </div>

              )}


              {/* BOUTONS */}

              <div
                className="
                  flex
                  flex-col-reverse
                  sm:flex-row
                  justify-end
                  gap-3
                  mt-7
                "
              >

                <button
                  type="button"
                  onClick={fermerModification}
                  disabled={enregistrement}
                  className="
                    px-5
                    py-3
                    border
                    border-gray-300
                    text-gray-700
                    rounded-xl
                    font-semibold
                    hover:bg-gray-50
                    transition
                    disabled:opacity-50
                  "
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  disabled={enregistrement}
                  className="
                    px-5
                    py-3
                    bg-blue-600
                    bg-gradient-to-r from-blue-600 to-cyan-500
                    hover:from-blue-700 hover:to-cyan-600
                    text-white
                    rounded-xl
                    font-semibold
                    hover:bg-blue-700
                    transition
                    disabled:opacity-50
                  "
                >
                  {enregistrement
                    ? "Enregistrement..."
                    : "💾 Enregistrer"}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

      {/* =====================================================
    MODALE MODIFICATION MOT DE PASSE
====================================================== */}

{modifierMotDePasse && (

  <div
    className="
      fixed
      inset-0
      z-[60]
      bg-black/50
      flex
      items-center
      justify-center
      p-4
    "
  >

    <div
      className="
        bg-white
        rounded-2xl
        shadow-2xl
        w-full
        max-w-md
      "
    >

      {/* =================================================
          EN-TÊTE
      ================================================== */}

      <div
        className="
          flex
          items-center
          justify-between
          px-6
          py-5
          border-b
          border-gray-200
        "
      >

        <div className="flex items-center gap-3">
  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-white text-xl shadow-sm">
    🔐
  </div>

  <div>
    <h2 className="text-xl font-bold text-gray-900">
      Modifier le mot de passe
    </h2>

    <p className="text-sm text-gray-500 mt-1">
      Sécurisez votre compte avec un nouveau mot de passe.
    </p>
  </div>
</div>

        <button
          type="button"
          onClick={fermerModificationMotDePasse}
          disabled={modificationMotDePasse}
          className="
            w-9
            h-9
            rounded-full
            bg-gray-100
            text-gray-600
            hover:bg-gray-200
            text-xl
            disabled:opacity-50
          "
        >
          ×
        </button>

      </div>


      {/* =================================================
          FORMULAIRE
      ================================================== */}

      <form
        onSubmit={enregistrerMotDePasse}
        className="p-6"
      >

        {/* ANCIEN MOT DE PASSE */}

        <div className="mb-5">

          <label
            className="
              block
              text-sm
              font-semibold
              text-gray-700
              mb-2
            "
          >
            Ancien mot de passe
          </label>

          <input
            type="password"
            name="ancien_mot_de_passe"
            value={
              formulaireMotDePasse.ancien_mot_de_passe
            }
            onChange={handleMotDePasseChange}
            required
            autoComplete="current-password"
            className="
              w-full
              rounded-xl
              border
              border-gray-300
              bg-white
              px-4
              py-3
              text-gray-900
              outline-none
              focus:border-blue-500
              focus:ring-2
              focus:ring-blue-100
            "
            placeholder="Votre ancien mot de passe"
          />

        </div>


        {/* NOUVEAU MOT DE PASSE */}

        <div className="mb-5">

          <label
            className="
              block
              text-sm
              font-semibold
              text-gray-700
              mb-2
            "
          >
            Nouveau mot de passe
          </label>

          <input
            type="password"
            name="nouveau_mot_de_passe"
            value={
              formulaireMotDePasse.nouveau_mot_de_passe
            }
            onChange={handleMotDePasseChange}
            required
            minLength={8}
            autoComplete="new-password"
            className="
              w-full
              rounded-xl
              border
              border-gray-300
              bg-white
              px-4
              py-3
              text-gray-900
              outline-none
              focus:border-blue-500
              focus:ring-2
              focus:ring-blue-100
            "
            placeholder="Minimum 8 caractères"
          />

          <p className="text-xs text-gray-400 mt-2">
            Le mot de passe doit respecter les règles de sécurité.
          </p>

        </div>


        {/* CONFIRMATION */}

        <div className="mb-5">

          <label
            className="
              block
              text-sm
              font-semibold
              text-gray-700
              mb-2
            "
          >
            Confirmer le nouveau mot de passe
          </label>

          <input
            type="password"
            name="confirmation_mot_de_passe"
            value={
              formulaireMotDePasse.confirmation_mot_de_passe
            }
            onChange={handleMotDePasseChange}
            required
            minLength={8}
            autoComplete="new-password"
            className="
              w-full
              rounded-xl
              border
              border-gray-300
              bg-white
              px-4
              py-3
              text-gray-900
              outline-none
              focus:border-blue-500
              focus:ring-2
              focus:ring-blue-100
            "
            placeholder="Répétez le nouveau mot de passe"
          />

        </div>


        {/* ERREUR */}

        {erreurMotDePasse && (

          <div
            className="
              mb-5
              bg-red-50
              border
              border-red-200
              text-red-700
              rounded-xl
              px-4
              py-3
              text-sm
            "
          >
            {erreurMotDePasse}
          </div>

        )}


        {/* SUCCÈS */}

        {messageMotDePasse && (

          <div
            className="
              mb-5
              bg-green-50
              border
              border-green-200
              text-green-700
              rounded-xl
              px-4
              py-3
              text-sm
            "
          >
            ✅ {messageMotDePasse}
          </div>

        )}


        {/* BOUTONS */}

        <div
          className="
            flex
            flex-col-reverse
            sm:flex-row
            justify-end
            gap-3
          "
        >

          <button
            type="button"
            onClick={fermerModificationMotDePasse}
            disabled={modificationMotDePasse}
            className="
              px-5
              py-3
              border
              border-gray-300
              text-gray-700
              rounded-xl
              font-semibold
              hover:bg-gray-50
              transition
              disabled:opacity-50
            "
          >
            Annuler
          </button>

          <button
            type="submit"
            disabled={modificationMotDePasse}
            className="
              px-5
              py-3
              bg-gradient-to-r
from-blue-600
to-cyan-500
hover:from-blue-700
hover:to-cyan-600
text-white
rounded-xl
font-semibold
shadow-sm
hover:shadow-md
transition-all
duration-200
              transition
              disabled:opacity-50
            "
          >
            {modificationMotDePasse
              ? "Modification..."
              : "🔐 Modifier le mot de passe"}
          </button>

        </div>

      </form>

    </div>

  </div>

)}
</div>

    </main>
  );
}