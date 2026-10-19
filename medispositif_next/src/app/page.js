"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "../services/api";
import Header from "../components/Header";

/* =========================================================
   ANIMATION AU SCROLL
========================================================= */

function Reveal({ children, className = "", delay = 0 }) {
  const [visible, setVisible] = useState(false);
  const [element, setElement] = useState(null);

  useEffect(() => {
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.15,
      }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [element]);

  return (
    <div
      ref={setElement}
      style={{
        transitionDelay: `${delay}ms`,
      }}
      className={`
        transition-all duration-700 ease-out
        ${
          visible
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-8"
        }
        ${className}
      `}
    >
      {children}
    </div>
  );
}

/* =========================================================
   PETITE ICÔNE
========================================================= */

function FeatureIcon({ children }) {
  return (
    <div
      className="
        w-12 h-12
        rounded-2xl
        bg-blue-50
        text-2xl
        flex
        items-center
        justify-center
        shrink-0
      "
    >
      {children}
    </div>
  );
}

/* =========================================================
   PAGE PRINCIPALE
========================================================= */

export default function Home() {
  const [produits, setProduits] = useState([]);
  const [produitsOriginaux, setProduitsOriginaux] = useState([]);

  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");

  /* =====================================================
     FILTRES
  ===================================================== */

  const [recherche, setRecherche] = useState("");
  const [catalogue, setCatalogue] = useState("");
  const [prixMin, setPrixMin] = useState("");
  const [prixMax, setPrixMax] = useState("");

  /* =====================================================
     CHARGER LES PRODUITS
  ===================================================== */

  useEffect(() => {
    const chargerProduits = async () => {
      try {
        setChargement(true);
        setErreur("");

        const response = await api.get("/catalogue/produits/");

        console.log("Produits récupérés :", response.data);

        const donnees =
          response.data.results || response.data;

        setProduits(donnees);
        setProduitsOriginaux(donnees);
      } catch (error) {
        console.error(
          "Erreur lors du chargement des produits :",
          error
        );

        setErreur(
          "Impossible de charger les produits."
        );
      } finally {
        setChargement(false);
      }
    };

    chargerProduits();
  }, []);

  /* =====================================================
     CATALOGUES
  ===================================================== */

  const catalogues = [
    ...new Set(
      produitsOriginaux
        .map((produit) => produit.nom_catalogue)
        .filter(Boolean)
    ),
  ];

  /* =====================================================
     PRODUITS MIS EN AVANT
  ===================================================== */

  const produitsMisEnAvant =
    produitsOriginaux.slice(0, 3);

  /* =====================================================
     STATISTIQUES
  ===================================================== */

  const nombreProduits =
    produitsOriginaux.length;

  const nombreDisponibles =
    produitsOriginaux.filter(
      (produit) => Number(produit.stock) > 0
    ).length;

  const stockTotal =
    produitsOriginaux.reduce(
      (total, produit) =>
        total + Number(produit.stock || 0),
      0
    );

  /* =====================================================
     PRODUIT HERO
  ===================================================== */

  const produitHero =
    produitsOriginaux.find(
      (produit) =>
        produit.image &&
        Number(produit.stock) > 0
    ) || produitsOriginaux[0];

  /* =====================================================
     RECHERCHE
  ===================================================== */

  const rechercherProduits = () => {
    let resultats = [...produitsOriginaux];

    if (recherche.trim()) {
      const texte = recherche
        .trim()
        .toLowerCase();

      resultats = resultats.filter(
        (produit) =>
          produit.nom
            ?.toLowerCase()
            .includes(texte)
      );
    }

    if (catalogue) {
      resultats = resultats.filter(
        (produit) =>
          produit.nom_catalogue === catalogue
      );
    }

    if (prixMin) {
      resultats = resultats.filter(
        (produit) =>
          Number(produit.prix) >=
          Number(prixMin)
      );
    }

    if (prixMax) {
      resultats = resultats.filter(
        (produit) =>
          Number(produit.prix) <=
          Number(prixMax)
      );
    }

    setProduits(resultats);
  };

  /* =====================================================
     RÉINITIALISER
  ===================================================== */

  const reinitialiserFiltres = () => {
    setRecherche("");
    setCatalogue("");
    setPrixMin("");
    setPrixMax("");

    setProduits(produitsOriginaux);
  };

  /* =====================================================
     SCROLL VERS CATALOGUE
  ===================================================== */

  const allerAuCatalogue = () => {
    setTimeout(() => {
      document
        .getElementById("catalogue")
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
    }, 50);
  };

  /* =====================================================
     ICÔNES DES CATÉGORIES
  ===================================================== */

  const getIconeCatalogue = (nom) => {
    const texte =
      nom?.toLowerCase() || "";

    if (texte.includes("diagnostic"))
      return "🌡️";

    if (texte.includes("surveillance"))
      return "🩺";

    if (texte.includes("soin"))
      return "❤️";

    if (texte.includes("mesure"))
      return "📏";

    return "🏥";
  };

  /* =====================================================
     RENDU
  ===================================================== */

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">

      {/* =====================================================
          HEADER
      ====================================================== */}

      <Header />

      {/* =====================================================
          HERO
      ====================================================== */}

      <section
        id="accueil"
        className="
          relative
          overflow-hidden
          bg-gradient-to-br
          from-[#071a3d]
          via-[#0b3b91]
          to-[#1264d9]
          text-white
        "
      >

        {/* Décorations */}

        <div
          className="
            absolute
            -top-32
            -right-32
            w-96
            h-96
            rounded-full
            bg-cyan-400/20
            blur-3xl
          "
        />

        <div
          className="
            absolute
            bottom-0
            -left-32
            w-96
            h-96
            rounded-full
            bg-blue-400/20
            blur-3xl
          "
        />

        <div
          className="
            absolute
            top-1/2
            left-1/2
            w-72
            h-72
            rounded-full
            bg-white/5
            blur-3xl
          "
        />

        <div
          className="
            relative
            max-w-7xl
            mx-auto
            px-6
            py-16
            md:py-20
            lg:py-24
          "
        >

          <div
            className="
              grid
              grid-cols-1
              lg:grid-cols-2
              gap-12
              lg:gap-16
              items-center
            "
          >

            {/* -------------------------------------------------
                GAUCHE
            -------------------------------------------------- */}

            <div>

              <Reveal delay={100}>

                <div
                  className="
                    inline-flex
                    items-center
                    gap-2
                    px-4
                    py-2
                    rounded-full
                    bg-white/10
                    border
                    border-white/15
                    backdrop-blur-sm
                    text-blue-100
                    text-sm
                    font-medium
                    mb-6
                  "
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  Votre santé, notre priorité
                </div>

              </Reveal>

              <Reveal delay={200}>

                <h1
                  className="
                    text-4xl
                    sm:text-5xl
                    lg:text-6xl
                    font-bold
                    leading-[1.08]
                    tracking-tight
                  "
                >
                  Des dispositifs
                  <span className="block text-cyan-300">
                    médicaux fiables.
                  </span>
                </h1>

              </Reveal>

              <Reveal delay={300}>

                <p
                  className="
                    mt-6
                    text-base
                    md:text-lg
                    text-blue-100
                    leading-relaxed
                    max-w-xl
                  "
                >
                  Découvrez notre catalogue de
                  dispositifs médicaux, consultez
                  leurs informations et commandez
                  facilement en ligne depuis chez vous.
                </p>

              </Reveal>

              <Reveal delay={400}>

                <div
                  className="
                    flex
                    flex-wrap
                    gap-4
                    mt-8
                  "
                >

                  <Link
                    href="#catalogue"
                    className="
                      group
                      inline-flex
                      items-center
                      justify-center
                      gap-2
                      bg-white
                      text-blue-700
                      font-semibold
                      px-6
                      py-3.5
                      rounded-xl
                      shadow-lg
                      shadow-blue-950/20
                      hover:bg-blue-50
                      hover:-translate-y-0.5
                      transition-all
                    "
                  >
                    Découvrir les produits

                    <span
                      className="
                        transition-transform
                        group-hover:translate-x-1
                      "
                    >
                      →
                    </span>
                  </Link>

                  <Link
                    href="#fonctionnement"
                    className="
                      inline-flex
                      items-center
                      justify-center
                      gap-2
                      border
                      border-white/30
                      bg-white/5
                      backdrop-blur-sm
                      text-white
                      font-semibold
                      px-6
                      py-3.5
                      rounded-xl
                      hover:bg-white/10
                      transition-all
                    "
                  >
                    Comment ça marche ?
                  </Link>

                </div>

              </Reveal>

              {/* Mini avantages */}

              <Reveal delay={500}>

                <div
                  className="
                    flex
                    flex-wrap
                    gap-x-6
                    gap-y-3
                    mt-8
                    text-sm
                    text-blue-100
                  "
                >

                  <span className="flex items-center gap-2">
                    <span className="text-emerald-300">
                      ✓
                    </span>
                    Catalogue accessible en ligne
                  </span>

                  <span className="flex items-center gap-2">
                    <span className="text-emerald-300">
                      ✓
                    </span>
                    Informations détaillées
                  </span>

                  <span className="flex items-center gap-2">
                    <span className="text-emerald-300">
                      ✓
                    </span>
                    Commande simplifiée
                  </span>

                </div>

              </Reveal>

            </div>

            {/* -------------------------------------------------
                DROITE : VISUEL PRODUIT
            -------------------------------------------------- */}

            <Reveal
              delay={250}
              className="relative"
            >

              <div
                className="
                  relative
                  mx-auto
                  max-w-lg
                "
              >

                {/* Cercle arrière */}

                <div
                  className="
                    absolute
                    inset-8
                    rounded-full
                    bg-white/10
                    blur-2xl
                  "
                />

                {/* Carte principale */}

                <div
                  className="
                    relative
                    rounded-[2rem]
                    border
                    border-white/15
                    bg-white/10
                    backdrop-blur-xl
                    p-5
                    shadow-2xl
                    shadow-blue-950/30
                  "
                >

                  <div
                    className="
                      rounded-[1.5rem]
                      bg-white
                      p-5
                      overflow-hidden
                    "
                  >

                    <div
                      className="
                        flex
                        items-center
                        justify-between
                        mb-5
                      "
                    >

                      <div>

                        <p
                          className="
                            text-xs
                            font-semibold
                            uppercase
                            tracking-wider
                            text-blue-600
                          "
                        >
                          Produit disponible
                        </p>

                        <h2
                          className="
                            text-lg
                            font-bold
                            text-slate-900
                            mt-1
                          "
                        >
                          {produitHero?.nom ||
                            "Dispositifs médicaux"}
                        </h2>

                      </div>

                      <span
                        className="
                          w-10
                          h-10
                          rounded-xl
                          bg-blue-50
                          flex
                          items-center
                          justify-center
                          text-xl
                        "
                      >
                        🩺
                      </span>

                    </div>

                    <div
                      className="
                        h-64
                        rounded-2xl
                        bg-slate-50
                        flex
                        items-center
                        justify-center
                        overflow-hidden
                      "
                    >

                      {produitHero?.image ? (

                        <img
                          src={produitHero.image}
                          alt={produitHero.nom}
                          className="
                            w-full
                            h-full
                            object-contain
                            p-6
                          "
                        />

                      ) : (

                        <div
                          className="
                            text-center
                            text-slate-400
                          "
                        >

                          <div className="text-7xl mb-3">
                            🩺
                          </div>

                          <p className="text-sm">
                            Dispositif médical
                          </p>

                        </div>

                      )}

                    </div>

                    <div
                      className="
                        flex
                        items-end
                        justify-between
                        gap-4
                        mt-5
                      "
                    >

                      <div>

                        <p
                          className="
                            text-xs
                            text-slate-500
                          "
                        >
                          À partir de
                        </p>

                        <p
                          className="
                            text-2xl
                            font-bold
                            text-blue-700
                          "
                        >
                          {produitHero?.prix
                            ? Number(
                                produitHero.prix
                              ).toLocaleString(
                                "fr-FR"
                              )
                            : "—"}{" "}
                          <span className="text-sm">
                            FCFA
                          </span>
                        </p>

                      </div>

                      <div
                        className="
                          px-3
                          py-1.5
                          rounded-full
                          bg-emerald-50
                          text-emerald-700
                          text-xs
                          font-semibold
                        "
                      >
                        ● Disponible
                      </div>

                    </div>

                  </div>

                </div>

                {/* Carte flottante */}

                <div
                  className="
                    absolute
                    -left-5
                    bottom-8
                    hidden
                    sm:flex
                    items-center
                    gap-3
                    bg-white
                    text-slate-900
                    rounded-2xl
                    px-4
                    py-3
                    shadow-xl
                    border
                    border-slate-100
                  "
                >

                  <div
                    className="
                      w-10
                      h-10
                      rounded-xl
                      bg-emerald-50
                      flex
                      items-center
                      justify-center
                      text-lg
                    "
                  >
                    ✓
                  </div>

                  <div>

                    <p
                      className="
                        text-xs
                        text-slate-500
                      "
                    >
                      Produits disponibles
                    </p>

                    <p
                      className="
                        font-bold
                        text-slate-900
                      "
                    >
                      {nombreDisponibles} produit
                      {nombreDisponibles > 1
                        ? "s"
                        : ""}
                    </p>

                  </div>

                </div>

                {/* Deuxième carte flottante */}

                <div
                  className="
                    absolute
                    -right-4
                    top-8
                    hidden
                    md:flex
                    items-center
                    gap-3
                    bg-white
                    text-slate-900
                    rounded-2xl
                    px-4
                    py-3
                    shadow-xl
                    border
                    border-slate-100
                  "
                >

                  <div
                    className="
                      w-10
                      h-10
                      rounded-xl
                      bg-blue-50
                      flex
                      items-center
                      justify-center
                      text-lg
                    "
                  >
                    📦
                  </div>

                  <div>

                    <p
                      className="
                        text-xs
                        text-slate-500
                      "
                    >
                      Notre catalogue
                    </p>

                    <p
                      className="
                        font-bold
                        text-slate-900
                      "
                    >
                      {nombreProduits} produit
                      {nombreProduits > 1
                        ? "s"
                        : ""}
                    </p>

                  </div>

                </div>

              </div>

            </Reveal>

          </div>

        </div>

      </section>

      {/* =====================================================
          BARRE DE CONFIANCE
      ====================================================== */}

      <section
        className="
          relative
          bg-white
          border-b
          border-slate-200
        "
      >

        <div
          className="
            max-w-7xl
            mx-auto
            px-6
            py-5
          "
        >

          <div
            className="
              grid
              grid-cols-2
              md:grid-cols-4
              gap-5
            "
          >

            <div
              className="
                flex
                items-center
                gap-3
                justify-center
                md:justify-start
              "
            >

              <FeatureIcon>
                🛡️
              </FeatureIcon>

              <div>
                <p className="font-semibold text-slate-900">
                  Produits médicaux
                </p>

                <p className="text-xs text-slate-500">
                  Catalogue en ligne
                </p>
              </div>

            </div>

            <div
              className="
                flex
                items-center
                gap-3
                justify-center
                md:justify-start
              "
            >

              <FeatureIcon>
                🔎
              </FeatureIcon>

              <div>
                <p className="font-semibold text-slate-900">
                  Informations claires
                </p>

                <p className="text-xs text-slate-500">
                  Détails des produits
                </p>
              </div>

            </div>

            <div
              className="
                flex
                items-center
                gap-3
                justify-center
                md:justify-start
              "
            >

              <FeatureIcon>
                🛒
              </FeatureIcon>

              <div>
                <p className="font-semibold text-slate-900">
                  Commande simple
                </p>

                <p className="text-xs text-slate-500">
                  Depuis chez vous
                </p>
              </div>

            </div>

            <div
              className="
                flex
                items-center
                gap-3
                justify-center
                md:justify-start
              "
            >

              <FeatureIcon>
                💳
              </FeatureIcon>

              <div>
                <p className="font-semibold text-slate-900">
                  Paiement en ligne
                </p>

                <p className="text-xs text-slate-500">
                  Plusieurs modes disponibles
                </p>
              </div>

            </div>

          </div>

        </div>

      </section>

      {/* =====================================================
          STATISTIQUES
      ====================================================== */}

      <section className="max-w-7xl mx-auto px-6 pt-12">

        <Reveal>

          <div
            className="
              grid
              grid-cols-2
              md:grid-cols-4
              gap-4
            "
          >

            <div
              className="
                bg-white
                border
                border-slate-200
                rounded-2xl
                p-5
                shadow-sm
              "
            >

              <p className="text-sm text-slate-500">
                Produits au catalogue
              </p>

              <p
                className="
                  text-3xl
                  font-bold
                  text-blue-700
                  mt-1
                "
              >
                {nombreProduits}
              </p>

            </div>

            <div
              className="
                bg-white
                border
                border-slate-200
                rounded-2xl
                p-5
                shadow-sm
              "
            >

              <p className="text-sm text-slate-500">
                Produits disponibles
              </p>

              <p
                className="
                  text-3xl
                  font-bold
                  text-emerald-600
                  mt-1
                "
              >
                {nombreDisponibles}
              </p>

            </div>

            <div
              className="
                bg-white
                border
                border-slate-200
                rounded-2xl
                p-5
                shadow-sm
              "
            >

              <p className="text-sm text-slate-500">
                Catégories
              </p>

              <p
                className="
                  text-3xl
                  font-bold
                  text-slate-900
                  mt-1
                "
              >
                {catalogues.length}
              </p>

            </div>

            <div
              className="
                bg-white
                border
                border-slate-200
                rounded-2xl
                p-5
                shadow-sm
              "
            >

              <p className="text-sm text-slate-500">
                Articles en stock
              </p>

              <p
                className="
                  text-3xl
                  font-bold
                  text-cyan-600
                  mt-1
                "
              >
                {stockTotal}
              </p>

            </div>

          </div>

        </Reveal>

      </section>

      {/* =====================================================
          CATÉGORIES
      ====================================================== */}

      {!chargement &&
        !erreur &&
        catalogues.length > 0 && (

          <section
            className="
              max-w-7xl
              mx-auto
              px-6
              py-20
            "
          >

            <Reveal>

              <div
                className="
                  flex
                  flex-col
                  md:flex-row
                  md:items-end
                  md:justify-between
                  gap-5
                  mb-10
                "
              >

                <div>

                  <p
                    className="
                      text-blue-600
                      font-semibold
                      mb-2
                    "
                  >
                    Explorez notre offre
                  </p>

                  <h2
                    className="
                      text-3xl
                      md:text-4xl
                      font-bold
                      text-slate-900
                    "
                  >
                    Trouvez rapidement
                    votre dispositif
                  </h2>

                  <p
                    className="
                      text-slate-600
                      mt-3
                      max-w-2xl
                    "
                  >
                    Parcourez les différentes
                    catégories de dispositifs
                    médicaux disponibles sur
                    MediDispositif.
                  </p>

                </div>

                <button
                  type="button"
                  onClick={allerAuCatalogue}
                  className="
                    text-blue-600
                    font-semibold
                    hover:text-blue-700
                    transition
                  "
                >
                  Voir le catalogue →
                </button>

              </div>

            </Reveal>

            <div
              className="
                grid
                grid-cols-1
                sm:grid-cols-2
                lg:grid-cols-4
                gap-5
              "
            >

              {catalogues.map(
                (nomCatalogue, index) => (

                  <Reveal
                    key={nomCatalogue}
                    delay={index * 80}
                  >

                    <button
                      type="button"
                      onClick={() => {
                        setCatalogue(
                          nomCatalogue
                        );

                        setTimeout(() => {
                          document
                            .getElementById(
                              "catalogue"
                            )
                            ?.scrollIntoView({
                              behavior:
                                "smooth",
                              block: "start",
                            });
                        }, 50);
                      }}
                      className="
                        group
                        w-full
                        min-h-[190px]
                        bg-white
                        border
                        border-slate-200
                        rounded-3xl
                        p-6
                        text-left
                        shadow-sm
                        hover:shadow-xl
                        hover:-translate-y-1
                        hover:border-blue-200
                        transition-all
                      "
                    >

                      <div
                        className="
                          w-14
                          h-14
                          rounded-2xl
                          bg-blue-50
                          flex
                          items-center
                          justify-center
                          text-3xl
                          mb-6
                          group-hover:scale-110
                          transition-transform
                        "
                      >
                        {getIconeCatalogue(
                          nomCatalogue
                        )}
                      </div>

                      <h3
                        className="
                          font-bold
                          text-lg
                          text-slate-900
                        "
                      >
                        {nomCatalogue}
                      </h3>

                      <p
                        className="
                          text-sm
                          text-slate-500
                          mt-3
                        "
                      >
                        Explorer cette catégorie
                      </p>

                      <span
                        className="
                          inline-block
                          text-blue-600
                          mt-4
                          font-semibold
                          group-hover:translate-x-1
                          transition-transform
                        "
                      >
                        Découvrir →
                      </span>

                    </button>

                  </Reveal>

                )
              )}

            </div>

          </section>

        )}

      {/* =====================================================
          PRODUITS MIS EN AVANT
      ====================================================== */}

      {!chargement &&
        !erreur &&
        produitsMisEnAvant.length > 0 && (

          <section
            className="
              bg-white
              border-y
              border-slate-100
            "
          >

            <div
              className="
                max-w-7xl
                mx-auto
                px-6
                py-20
              "
            >

              <Reveal>

                <div
                  className="
                    flex
                    flex-col
                    md:flex-row
                    md:items-end
                    md:justify-between
                    gap-5
                    mb-10
                  "
                >

                  <div>

                    <div
                      className="
                        inline-flex
                        items-center
                        gap-2
                        text-blue-600
                        font-semibold
                        mb-2
                      "
                    >
                      <span>✦</span>
                      Notre sélection
                    </div>

                    <h2
                      className="
                        text-3xl
                        md:text-4xl
                        font-bold
                        text-slate-900
                      "
                    >
                      Quelques dispositifs
                    </h2>

                    <p
                      className="
                        text-slate-600
                        mt-3
                      "
                    >
                      Découvrez quelques produits
                      actuellement disponibles
                      dans notre catalogue.
                    </p>

                  </div>

                  <button
                    type="button"
                    onClick={allerAuCatalogue}
                    className="
                      text-blue-600
                      font-semibold
                      hover:text-blue-700
                      transition
                    "
                  >
                    Voir tout le catalogue →
                  </button>

                </div>

              </Reveal>

              <div
                className="
                  grid
                  grid-cols-1
                  md:grid-cols-2
                  lg:grid-cols-3
                  gap-6
                "
              >

                {produitsMisEnAvant.map(
                  (produit, index) => (

                    <Reveal
                      key={produit.idProduit}
                      delay={index * 100}
                    >

                      <article
                        className="
                          h-full
                          bg-white
                          rounded-3xl
                          border
                          border-slate-200
                          overflow-hidden
                          shadow-sm
                          hover:shadow-xl
                          hover:-translate-y-1
                          transition-all
                        "
                      >

                        {/* IMAGE */}

                        <div
                          className="
                            relative
                            h-56
                            bg-slate-50
                            flex
                            items-center
                            justify-center
                            overflow-hidden
                          "
                        >

                          {produit.image ? (

                            <img
                              src={produit.image}
                              alt={produit.nom}
                              className="
                                w-full
                                h-full
                                object-contain
                                p-6
                                transition-transform
                                duration-500
                                hover:scale-105
                              "
                            />

                          ) : (

                            <span className="text-7xl">
                              🩺
                            </span>

                          )}

                          <span
                            className="
                              absolute
                              top-4
                              left-4
                              px-3
                              py-1.5
                              rounded-full
                              bg-white
                              text-blue-600
                              text-xs
                              font-semibold
                              shadow-sm
                            "
                          >
                            {produit.nom_catalogue}
                          </span>

                        </div>

                        <div className="p-6">

                          <h3
                            className="
                              text-xl
                              font-bold
                              text-slate-900
                            "
                          >
                            {produit.nom}
                          </h3>

                          <p
                            className="
                              text-slate-600
                              text-sm
                              mt-2
                              mb-5
                              min-h-[42px]
                            "
                          >
                            {produit.description}
                          </p>

                          <div
                            className="
                              flex
                              items-end
                              justify-between
                              gap-4
                              mb-5
                            "
                          >

                            <div>

                              <p
                                className="
                                  text-xs
                                  text-slate-500
                                "
                              >
                                Prix
                              </p>

                              <span
                                className="
                                  text-xl
                                  font-bold
                                  text-blue-700
                                "
                              >
                                {Number(
                                  produit.prix
                                ).toLocaleString(
                                  "fr-FR"
                                )}{" "}
                                FCFA
                              </span>

                            </div>

                            <span
                              className={`
                                text-xs
                                font-semibold
                                px-3
                                py-1.5
                                rounded-full
                                ${
                                  produit.stock > 0
                                    ? "bg-emerald-50 text-emerald-700"
                                    : "bg-red-50 text-red-700"
                                }
                              `}
                            >
                              {produit.stock > 0
                                ? `${produit.stock} en stock`
                                : "Rupture"}
                            </span>

                          </div>

                          <Link
                            href={`/produits/${produit.idProduit}`}
                            className="
                              group
                              flex
                              items-center
                              justify-center
                              gap-2
                              w-full
                              bg-blue-600
                              text-white
                              py-3
                              rounded-xl
                              font-semibold
                              hover:bg-blue-700
                              transition
                            "
                          >
                            Voir les détails

                            <span
                              className="
                                transition-transform
                                group-hover:translate-x-1
                              "
                            >
                              →
                            </span>

                          </Link>

                        </div>

                      </article>

                    </Reveal>

                  )
                )}

              </div>

            </div>

          </section>

        )}

      {/* =====================================================
          POURQUOI MEDIDISPOSITIF
      ====================================================== */}

      <section
        className="
          max-w-7xl
          mx-auto
          px-6
          py-20
        "
      >

        <Reveal>

          <div
            className="
              text-center
              max-w-3xl
              mx-auto
              mb-12
            "
          >

            <p
              className="
                text-blue-600
                font-semibold
                mb-2
              "
            >
              Une expérience pensée pour vous
            </p>

            <h2
              className="
                text-3xl
                md:text-4xl
                font-bold
                text-slate-900
              "
            >
              Pourquoi MediDispositif ?
            </h2>

            <p
              className="
                text-slate-600
                mt-4
                leading-relaxed
              "
            >
              Une plateforme conçue pour rendre
              la recherche, le choix et la commande
              de dispositifs médicaux plus simples.
            </p>

          </div>

        </Reveal>

        <div
          className="
            grid
            grid-cols-1
            sm:grid-cols-2
            lg:grid-cols-4
            gap-6
          "
        >

          {[
            {
              icon: "📦",
              title: "Produits disponibles",
              description:
                "Consultez les dispositifs actuellement disponibles dans notre catalogue.",
            },
            {
              icon: "🔎",
              title: "Informations détaillées",
              description:
                "Accédez aux informations essentielles avant de choisir votre produit.",
            },
            {
              icon: "🛒",
              title: "Commande simplifiée",
              description:
                "Ajoutez vos produits au panier et passez votre commande facilement.",
            },
            {
              icon: "🧾",
              title: "Facturation",
              description:
                "Retrouvez vos informations de paiement et vos factures après votre achat.",
            },
          ].map((element, index) => (

            <Reveal
              key={element.title}
              delay={index * 100}
            >

              <div
                className="
                  h-full
                  bg-white
                  rounded-3xl
                  border
                  border-slate-200
                  p-7
                  shadow-sm
                  hover:shadow-xl
                  hover:-translate-y-1
                  transition-all
                "
              >

                <FeatureIcon>
                  {element.icon}
                </FeatureIcon>

                <h3
                  className="
                    text-lg
                    font-bold
                    text-slate-900
                    mt-5
                  "
                >
                  {element.title}
                </h3>

                <p
                  className="
                    text-slate-600
                    text-sm
                    leading-relaxed
                    mt-3
                  "
                >
                  {element.description}
                </p>

              </div>

            </Reveal>

          ))}

        </div>

      </section>

      {/* =====================================================
          COMMENT ÇA MARCHE
      ====================================================== */}

      <section
        id="fonctionnement"
        className="
          bg-[#eef6ff]
          border-y
          border-blue-100
        "
      >

        <div
          className="
            max-w-7xl
            mx-auto
            px-6
            py-20
          "
        >

          <Reveal>

            <div
              className="
                text-center
                max-w-3xl
                mx-auto
                mb-14
              "
            >

              <p
                className="
                  text-blue-600
                  font-semibold
                  mb-2
                "
              >
                Simple et rapide
              </p>

              <h2
                className="
                  text-3xl
                  md:text-4xl
                  font-bold
                  text-slate-900
                "
              >
                Comment ça marche ?
              </h2>

              <p
                className="
                  text-slate-600
                  mt-4
                "
              >
                Quelques étapes suffisent pour
                trouver et commander votre dispositif.
              </p>

            </div>

          </Reveal>

          <div
            className="
              grid
              grid-cols-1
              md:grid-cols-2
              lg:grid-cols-4
              gap-8
            "
          >

            {[
              {
                numero: "01",
                icon: "🔎",
                title: "Découvrez",
                description:
                  "Parcourez notre catalogue de dispositifs médicaux.",
              },
              {
                numero: "02",
                icon: "📋",
                title: "Choisissez",
                description:
                  "Consultez les détails du produit et sélectionnez celui qui vous convient.",
              },
              {
                numero: "03",
                icon: "🛒",
                title: "Commandez",
                description:
                  "Ajoutez vos produits au panier et validez votre commande.",
              },
              {
                numero: "04",
                icon: "💳",
                title: "Payez",
                description:
                  "Effectuez votre paiement selon le mode disponible.",
              },
            ].map((etape, index) => (

              <Reveal
                key={etape.numero}
                delay={index * 120}
              >

                <div
                  className="
                    relative
                    text-center
                  "
                >

                  <div
                    className="
                      mx-auto
                      w-20
                      h-20
                      rounded-full
                      bg-blue-600
                      text-white
                      flex
                      items-center
                      justify-center
                      text-3xl
                      shadow-xl
                      shadow-blue-600/20
                    "
                  >
                    {etape.icon}
                  </div>

                  <span
                    className="
                      inline-flex
                      mt-5
                      text-xs
                      font-bold
                      text-blue-600
                      bg-blue-100
                      px-3
                      py-1
                      rounded-full
                    "
                  >
                    ÉTAPE {etape.numero}
                  </span>

                  <h3
                    className="
                      text-xl
                      font-bold
                      text-slate-900
                      mt-3
                    "
                  >
                    {etape.title}
                  </h3>

                  <p
                    className="
                      text-slate-600
                      text-sm
                      mt-3
                      leading-relaxed
                    "
                  >
                    {etape.description}
                  </p>

                </div>

              </Reveal>

            ))}

          </div>

        </div>

      </section>

      {/* =====================================================
          MOYENS DE PAIEMENT
      ====================================================== */}

      <section className="max-w-7xl mx-auto px-6 py-16">

        <Reveal>

          <div
            className="
              rounded-3xl
              bg-white
              border
              border-slate-200
              p-8
              md:p-10
              shadow-sm
            "
          >

            <div
              className="
                grid
                grid-cols-1
                md:grid-cols-2
                gap-8
                items-center
              "
            >

              <div>

                <p
                  className="
                    text-blue-600
                    font-semibold
                    mb-2
                  "
                >
                  Paiement
                </p>

                <h2
                  className="
                    text-2xl
                    md:text-3xl
                    font-bold
                    text-slate-900
                  "
                >
                  Des moyens de paiement
                  adaptés à vos besoins
                </h2>

                <p
                  className="
                    text-slate-600
                    mt-4
                    leading-relaxed
                  "
                >
                  Une fois votre commande validée,
                  vous pouvez effectuer votre paiement
                  selon le mode disponible.
                </p>

              </div>

              <div
                className="
                  grid
                  grid-cols-1
                  sm:grid-cols-3
                  gap-4
                "
              >

                <div
                  className="
                    rounded-2xl
                    bg-slate-50
                    border
                    border-slate-200
                    p-5
                    text-center
                  "
                >

                  <div className="text-3xl mb-2">
                    📱
                  </div>

                  <p className="font-bold text-slate-900">
                    Wave
                  </p>

                  <p className="text-xs text-slate-500 mt-1">
                    Paiement mobile
                  </p>

                </div>

                <div
                  className="
                    rounded-2xl
                    bg-slate-50
                    border
                    border-slate-200
                    p-5
                    text-center
                  "
                >

                  <div className="text-3xl mb-2">
                    📲
                  </div>

                  <p className="font-bold text-slate-900">
                    Orange Money
                  </p>

                  <p className="text-xs text-slate-500 mt-1">
                    Paiement mobile
                  </p>

                </div>

                <div
                  className="
                    rounded-2xl
                    bg-slate-50
                    border
                    border-slate-200
                    p-5
                    text-center
                  "
                >

                  <div className="text-3xl mb-2">
                    💳
                  </div>

                  <p className="font-bold text-slate-900">
                    Carte bancaire
                  </p>

                  <p className="text-xs text-slate-500 mt-1">
                    Paiement en ligne
                  </p>

                </div>

              </div>

            </div>

          </div>

        </Reveal>

      </section>

      {/* =====================================================
          CATALOGUE COMPLET + RECHERCHE
      ====================================================== */}

      <section
        id="catalogue"
        className="
          max-w-7xl
          mx-auto
          px-6
          py-20
          scroll-mt-8
        "
      >

        <Reveal>

          <div className="mb-10">

            <p
              className="
                text-blue-600
                font-semibold
                mb-2
              "
            >
              Catalogue
            </p>

            <div
              className="
                flex
                flex-col
                md:flex-row
                md:items-end
                md:justify-between
                gap-4
              "
            >

              <div>

                <h2
                  className="
                    text-3xl
                    md:text-4xl
                    font-bold
                    text-slate-900
                  "
                >
                  Nos dispositifs médicaux
                </h2>

                <p
                  className="
                    text-slate-600
                    mt-3
                  "
                >
                  Recherchez le produit qui
                  correspond à vos besoins.
                </p>

              </div>

              {!chargement &&
                !erreur && (

                  <div
                    className="
                      inline-flex
                      items-center
                      gap-2
                      px-4
                      py-2
                      bg-blue-50
                      text-blue-700
                      rounded-full
                      text-sm
                      font-semibold
                    "
                  >
                    📦 {produits.length} produit
                    {produits.length > 1
                      ? "s"
                      : ""}
                  </div>

                )}

            </div>

          </div>

        </Reveal>

        {/* -------------------------------------------------
            RECHERCHE
        -------------------------------------------------- */}

        <Reveal>

          <div
            className="
              bg-white
              rounded-3xl
              border
              border-slate-200
              shadow-sm
              p-6
              md:p-8
              mb-10
            "
          >

            <div
              className="
                flex
                items-center
                gap-3
                mb-6
              "
            >

              <div
                className="
                  w-11
                  h-11
                  rounded-xl
                  bg-blue-50
                  flex
                  items-center
                  justify-center
                  text-xl
                "
              >
                🔎
              </div>

              <div>

                <h3
                  className="
                    text-xl
                    font-bold
                    text-slate-900
                  "
                >
                  Rechercher un produit
                </h3>

                <p
                  className="
                    text-sm
                    text-slate-500
                    mt-1
                  "
                >
                  Utilisez les filtres pour
                  affiner votre recherche.
                </p>

              </div>

            </div>

            <div
              className="
                grid
                grid-cols-1
                md:grid-cols-2
                lg:grid-cols-4
                gap-4
              "
            >

              {/* NOM */}

              <div>

                <label
                  className="
                    block
                    text-sm
                    font-semibold
                    text-slate-700
                    mb-2
                  "
                >
                  Nom du produit
                </label>

                <input
                  type="text"
                  value={recherche}
                  onChange={(e) =>
                    setRecherche(e.target.value)
                  }
                  placeholder="Ex : thermomètre"
                  className="
                    w-full
                    border
                    border-slate-300
                    rounded-xl
                    px-4
                    py-3
                    text-slate-900
                    placeholder-slate-400
                    outline-none
                    focus:ring-2
                    focus:ring-blue-500/20
                    focus:border-blue-500
                    transition
                  "
                />

              </div>

              {/* CATALOGUE */}

              <div>

                <label
                  className="
                    block
                    text-sm
                    font-semibold
                    text-slate-700
                    mb-2
                  "
                >
                  Catalogue
                </label>

                <select
                  value={catalogue}
                  onChange={(e) =>
                    setCatalogue(e.target.value)
                  }
                  className="
                    w-full
                    border
                    border-slate-300
                    rounded-xl
                    px-4
                    py-3
                    text-slate-900
                    bg-white
                    outline-none
                    focus:ring-2
                    focus:ring-blue-500/20
                    focus:border-blue-500
                    transition
                  "
                >

                  <option value="">
                    Tous les catalogues
                  </option>

                  {catalogues.map(
                    (nomCatalogue) => (

                      <option
                        key={nomCatalogue}
                        value={nomCatalogue}
                      >
                        {nomCatalogue}
                      </option>

                    )
                  )}

                </select>

              </div>

              {/* PRIX MINIMUM */}

              <div>

                <label
                  className="
                    block
                    text-sm
                    font-semibold
                    text-slate-700
                    mb-2
                  "
                >
                  Prix minimum
                </label>

                <input
                  type="number"
                  value={prixMin}
                  onChange={(e) =>
                    setPrixMin(e.target.value)
                  }
                  placeholder="Ex : 5000"
                  min="0"
                  className="
                    w-full
                    border
                    border-slate-300
                    rounded-xl
                    px-4
                    py-3
                    text-slate-900
                    placeholder-slate-400
                    outline-none
                    focus:ring-2
                    focus:ring-blue-500/20
                    focus:border-blue-500
                    transition
                  "
                />

              </div>

              {/* PRIX MAXIMUM */}

              <div>

                <label
                  className="
                    block
                    text-sm
                    font-semibold
                    text-slate-700
                    mb-2
                  "
                >
                  Prix maximum
                </label>

                <input
                  type="number"
                  value={prixMax}
                  onChange={(e) =>
                    setPrixMax(e.target.value)
                  }
                  placeholder="Ex : 50000"
                  min="0"
                  className="
                    w-full
                    border
                    border-slate-300
                    rounded-xl
                    px-4
                    py-3
                    text-slate-900
                    placeholder-slate-400
                    outline-none
                    focus:ring-2
                    focus:ring-blue-500/20
                    focus:border-blue-500
                    transition
                  "
                />

              </div>

            </div>

            <div
              className="
                flex
                flex-wrap
                gap-3
                mt-6
              "
            >

              <button
                type="button"
                onClick={rechercherProduits}
                className="
                  inline-flex
                  items-center
                  justify-center
                  gap-2
                  bg-blue-600
                  text-white
                  px-6
                  py-3
                  rounded-xl
                  font-semibold
                  hover:bg-blue-700
                  hover:-translate-y-0.5
                  transition-all
                "
              >
                🔎 Rechercher
              </button>

              <button
                type="button"
                onClick={reinitialiserFiltres}
                className="
                  inline-flex
                  items-center
                  justify-center
                  gap-2
                  border
                  border-slate-300
                  text-slate-700
                  px-6
                  py-3
                  rounded-xl
                  font-semibold
                  hover:bg-slate-50
                  transition
                "
              >
                Réinitialiser
              </button>

            </div>

          </div>

        </Reveal>

        {/* -------------------------------------------------
            RÉSULTATS
        -------------------------------------------------- */}

        <div className="mb-6">

          <h3
            className="
              text-2xl
              font-bold
              text-slate-900
            "
          >
            Produits disponibles
          </h3>

          {!chargement && (

            <p
              className="
                text-slate-500
                mt-1
              "
            >
              {produits.length} produit
              {produits.length > 1
                ? "s"
                : ""}{" "}
              trouvé
              {produits.length > 1
                ? "s"
                : ""}
            </p>

          )}

        </div>

        {/* CHARGEMENT */}

        {chargement && (

          <div
            className="
              bg-white
              border
              border-slate-200
              rounded-3xl
              py-16
              text-center
            "
          >

            <div
              className="
                w-12
                h-12
                mx-auto
                rounded-full
                border-4
                border-blue-100
                border-t-blue-600
                animate-spin
                mb-5
              "
            />

            <p
              className="
                text-slate-600
                font-medium
              "
            >
              Chargement des produits...
            </p>

          </div>

        )}

        {/* ERREUR */}

        {erreur && (

          <div
            className="
              bg-red-50
              border
              border-red-200
              text-red-700
              p-5
              rounded-2xl
            "
          >
            {erreur}
          </div>

        )}

        {/* PRODUITS */}

        {!chargement &&
          !erreur &&
          produits.length > 0 && (

            <div
              className="
                grid
                grid-cols-1
                md:grid-cols-2
                lg:grid-cols-3
                gap-6
              "
            >

              {produits.map(
                (produit, index) => (

                  <Reveal
                    key={produit.idProduit}
                    delay={(index % 3) * 80}
                  >

                    <article
                      className="
                        h-full
                        bg-white
                        rounded-3xl
                        shadow-sm
                        border
                        border-slate-200
                        overflow-hidden
                        hover:shadow-xl
                        hover:-translate-y-1
                        transition-all
                      "
                    >

                      <div
                        className="
                          relative
                          h-52
                          bg-slate-50
                          flex
                          items-center
                          justify-center
                          overflow-hidden
                        "
                      >

                        {produit.image ? (

                          <img
                            src={produit.image}
                            alt={produit.nom}
                            className="
                              w-full
                              h-full
                              object-contain
                              p-5
                              transition-transform
                              duration-500
                              hover:scale-105
                            "
                          />

                        ) : (

                          <span className="text-6xl">
                            🩺
                          </span>

                        )}

                        <span
                          className="
                            absolute
                            top-4
                            left-4
                            px-3
                            py-1.5
                            rounded-full
                            bg-white
                            text-blue-600
                            text-xs
                            font-semibold
                            shadow-sm
                          "
                        >
                          {produit.nom_catalogue}
                        </span>

                      </div>

                      <div className="p-6">

                        <h3
                          className="
                            text-xl
                            font-bold
                            text-slate-900
                            mb-2
                          "
                        >
                          {produit.nom}
                        </h3>

                        <p
                          className="
                            text-slate-600
                            text-sm
                            mb-5
                            min-h-[40px]
                            leading-relaxed
                          "
                        >
                          {produit.description}
                        </p>

                        <div
                          className="
                            flex
                            items-center
                            justify-between
                            gap-4
                            mb-5
                          "
                        >

                          <span
                            className="
                              text-xl
                              font-bold
                              text-blue-700
                            "
                          >
                            {Number(
                              produit.prix
                            ).toLocaleString(
                              "fr-FR"
                            )}{" "}
                            FCFA
                          </span>

                          <span
                            className={`
                              text-xs
                              font-semibold
                              px-3
                              py-1.5
                              rounded-full
                              ${
                                produit.stock > 0
                                  ? "text-emerald-700 bg-emerald-50"
                                  : "text-red-700 bg-red-50"
                              }
                            `}
                          >
                            {produit.stock > 0
                              ? `${produit.stock} en stock`
                              : "Rupture de stock"}
                          </span>

                        </div>

                        <Link
                          href={`/produits/${produit.idProduit}`}
                          className="
                            group
                            flex
                            items-center
                            justify-center
                            gap-2
                            w-full
                            bg-blue-600
                            text-white
                            py-3
                            rounded-xl
                            font-semibold
                            hover:bg-blue-700
                            transition
                          "
                        >
                          Voir les détails

                          <span
                            className="
                              transition-transform
                              group-hover:translate-x-1
                            "
                          >
                            →
                          </span>

                        </Link>

                      </div>

                    </article>

                  </Reveal>

                )
              )}

            </div>

          )}

        {/* AUCUN RÉSULTAT */}

        {!chargement &&
          !erreur &&
          produits.length === 0 && (

            <div
              className="
                bg-white
                border
                border-slate-200
                rounded-3xl
                text-center
                py-16
                px-6
              "
            >

              <div className="text-6xl mb-5">
                🔎
              </div>

              <h3
                className="
                  text-xl
                  font-bold
                  text-slate-900
                "
              >
                Aucun produit trouvé
              </h3>

              <p
                className="
                  text-slate-500
                  mt-2
                "
              >
                Essayez de modifier vos critères
                de recherche.
              </p>

              <button
                type="button"
                onClick={reinitialiserFiltres}
                className="
                  mt-6
                  bg-blue-600
                  text-white
                  px-5
                  py-2.5
                  rounded-xl
                  font-semibold
                  hover:bg-blue-700
                  transition
                "
              >
                Réinitialiser les filtres
              </button>

            </div>

          )}

      </section>

      {/* =====================================================
          CTA FINAL
      ====================================================== */}

      <Reveal>

        <section
          className="
            max-w-7xl
            mx-auto
            px-6
            pb-20
          "
        >

          <div
            className="
              relative
              overflow-hidden
              bg-gradient-to-br
              from-blue-700
              via-blue-600
              to-cyan-600
              rounded-[2rem]
              px-8
              py-14
              md:px-12
              md:py-16
              text-center
              text-white
              shadow-2xl
              shadow-blue-900/20
            "
          >

            <div
              className="
                absolute
                -right-20
                -top-20
                w-64
                h-64
                rounded-full
                bg-white/10
                blur-2xl
              "
            />

            <div
              className="
                absolute
                -left-20
                -bottom-20
                w-64
                h-64
                rounded-full
                bg-cyan-300/10
                blur-2xl
              "
            />

            <div className="relative">

              <div
                className="
                  inline-flex
                  items-center
                  gap-2
                  px-4
                  py-2
                  rounded-full
                  bg-white/10
                  border
                  border-white/15
                  text-blue-100
                  text-sm
                  font-medium
                  mb-5
                "
              >
                🩺 MediDispositif
              </div>

              <h2
                className="
                  text-3xl
                  md:text-4xl
                  font-bold
                "
              >
                Trouvez le dispositif
                dont vous avez besoin
              </h2>

              <p
                className="
                  text-blue-100
                  mt-4
                  max-w-2xl
                  mx-auto
                  leading-relaxed
                "
              >
                Consultez notre catalogue,
                comparez les produits disponibles
                et découvrez une manière simple
                de commander vos dispositifs
                médicaux en ligne.
              </p>

              <Link
                href="#catalogue"
                className="
                  inline-flex
                  items-center
                  gap-2
                  mt-8
                  bg-white
                  text-blue-700
                  font-bold
                  px-7
                  py-3.5
                  rounded-xl
                  hover:bg-blue-50
                  hover:-translate-y-0.5
                  transition-all
                  shadow-lg
                "
              >
                Explorer le catalogue
                <span>→</span>
              </Link>

            </div>

          </div>

        </section>

      </Reveal>

      {/* =====================================================
          FOOTER
      ====================================================== */}

      <footer
        className="
          bg-[#071426]
          text-slate-300
        "
      >

        <div
          className="
            max-w-7xl
            mx-auto
            px-6
            py-14
          "
        >

          <div
            className="
              grid
              grid-cols-1
              md:grid-cols-2
              lg:grid-cols-4
              gap-10
            "
          >

            {/* IDENTITÉ */}

            <div>

              <div
                className="
                  flex
                  items-center
                  gap-3
                  mb-4
                "
              >

                <div
                  className="
                    w-11
                    h-11
                    rounded-xl
                    bg-gradient-to-br
                    from-blue-500
                    to-cyan-400
                    flex
                    items-center
                    justify-center
                    text-xl
                  "
                >
                  ⚕
                </div>

                <div>

                  <p
                    className="
                      text-lg
                      font-bold
                      text-white
                    "
                  >
                    MediDispositif
                  </p>

                  <p
                    className="
                      text-xs
                      text-slate-400
                    "
                  >
                    Vente de dispositifs médicaux
                  </p>

                </div>

              </div>

              <p
                className="
                  text-sm
                  text-slate-400
                  leading-relaxed
                  max-w-sm
                "
              >
                Une plateforme dédiée à la
                consultation et à la commande
                de dispositifs médicaux en ligne.
              </p>

            </div>

            {/* NAVIGATION */}

            <div>

              <h3
                className="
                  text-white
                  font-semibold
                  mb-4
                "
              >
                Navigation
              </h3>

              <div
                className="
                  flex
                  flex-col
                  gap-3
                  text-sm
                "
              >

                <Link
                  href="#accueil"
                  className="hover:text-white transition"
                >
                  Accueil
                </Link>

                <Link
                  href="#catalogue"
                  className="hover:text-white transition"
                >
                  Produits
                </Link>

                <Link
                  href="#fonctionnement"
                  className="hover:text-white transition"
                >
                  Comment ça marche ?
                </Link>

              </div>

            </div>

            {/* SERVICES */}

            <div>

              <h3
                className="
                  text-white
                  font-semibold
                  mb-4
                "
              >
                MediDispositif
              </h3>

              <div
                className="
                  flex
                  flex-col
                  gap-3
                  text-sm
                  text-slate-400
                "
              >

                <span>
                  Catalogue de produits
                </span>

                <span>
                  Recherche de dispositifs
                </span>

                <span>
                  Commande en ligne
                </span>

                <span>
                  Paiement en ligne
                </span>

              </div>

            </div>

            {/* INFORMATIONS */}

            <div>

              <h3
                className="
                  text-white
                  font-semibold
                  mb-4
                "
              >
                Informations
              </h3>

              <div
                className="
                  flex
                  flex-col
                  gap-3
                  text-sm
                  text-slate-400
                "
              >

                <span>
                  Produits disponibles
                </span>

                <span>
                  Informations détaillées
                </span>

                <span>
                  Facturation
                </span>

                <span>
                  Assistance
                </span>

              </div>

            </div>

          </div>

          <div
            className="
              border-t
              border-white/10
              mt-12
              pt-6
              flex
              flex-col
              md:flex-row
              md:items-center
              md:justify-between
              gap-3
            "
          >

            <p
              className="
                text-xs
                text-slate-500
              "
            >
              © 2026 MediDispositif.
              Tous droits réservés.
            </p>

            <p
              className="
                text-xs
                text-slate-500
              "
            >
              Plateforme de vente de dispositifs médicaux
            </p>

          </div>

        </div>

      </footer>

    </main>
  );
}