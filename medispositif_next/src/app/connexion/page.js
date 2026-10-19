"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "../../services/api";

export default function ConnexionPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState("");

  const handleConnexion = async (e) => {
    e.preventDefault();

    setErreur("");
    setChargement(true);

    try {
      const response = await api.post("/auth/connexion/", {
        email: email.trim(),
        password,
      });

      console.log("Connexion réussie :", response.data);

      // Récupération des tokens JWT
      const { access, refresh, utilisateur } = response.data;

      // Stockage de la session
      localStorage.setItem("access_token", access);
      localStorage.setItem("refresh_token", refresh);
      localStorage.setItem(
        "utilisateur",
        JSON.stringify(utilisateur)
      );
      window.dispatchEvent(new Event("utilisateurMisAJour"));

      // Redirection selon le rôle
      switch (utilisateur.role) {
        case "Administrateur":
          router.push("/administration");
          break;

        case "ResponsableCommercial":
          router.push("/responsable-commercial");
          break;

        case "Vendeur":
          router.push("/vendeur");
          break;

        case "GestionnaireDeStock":
          router.push("/gestionnaire-stock");
          break;

        case "Client":
          router.push("/client");
          break;

        default:
          router.push("/");
      }
    } catch (error) {
      console.error("Erreur de connexion :", error);

      if (error.response?.data) {
        console.log(
          "Réponse Django :",
          error.response.data
        );
      }

      setErreur(
        "Email ou mot de passe incorrect."
      );
    } finally {
      setChargement(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-100">

      {/* =====================================================
          HEADER
          IMPORTANT : séparé de la carte de connexion
      ====================================================== */}

      <header className="bg-white border-b border-slate-200 shadow-sm">

        <div
          className="
            max-w-7xl
            mx-auto
            px-6
            lg:px-10
            py-4
          "
        >

          <div className="flex items-center justify-between">

            {/* LOGO */}

            <Link
              href="/"
              className="
                group
                flex
                items-center
                gap-3
              "
            >

              <div
                className="
                  w-11
                  h-11
                  rounded-xl
                  bg-blue-600
                  flex
                  items-center
                  justify-center
                  shadow-sm
                  group-hover:bg-blue-700
                  transition-colors
                "
              >
                <span
                  className="
                    text-white
                    text-2xl
                    font-bold
                  "
                >
                  ✚
                </span>
              </div>

              <div>

                <h1
                  className="
                    text-xl
                    sm:text-2xl
                    font-bold
                    text-blue-700
                    tracking-tight
                    group-hover:text-blue-800
                    transition-colors
                  "
                >
                  Dispositif médical
                </h1>

                <p
                  className="
                    text-xs
                    sm:text-sm
                    text-slate-500
                  "
                >
                  Vente de dispositifs médicaux
                </p>

              </div>

            </Link>


            {/* NAVIGATION */}

            <nav
              className="
                flex
                items-center
                gap-2
                sm:gap-5
              "
            >

              <Link
                href="/"
                className="
                  px-3
                  py-2
                  rounded-lg
                  text-sm
                  sm:text-base
                  font-medium
                  text-slate-600
                  hover:text-blue-600
                  hover:bg-blue-50
                  transition-all
                "
              >
                Accueil
              </Link>

              <Link
                href="/produits"
                className="
                  px-3
                  py-2
                  rounded-lg
                  text-sm
                  sm:text-base
                  font-medium
                  text-slate-600
                  hover:text-blue-600
                  hover:bg-blue-50
                  transition-all
                "
              >
                Produits
              </Link>

            </nav>

          </div>

        </div>

      </header>


      {/* =====================================================
          CONTENU PRINCIPAL

          Pas de hauteur fixe ici :
          la page peut grandir naturellement.
      ====================================================== */}

      <section
        className="
          px-4
          sm:px-6
          lg:px-8
          py-6
          sm:py-8
          lg:py-10
        "
      >

        <div
          className="
            max-w-7xl
            mx-auto
            w-full
            grid
            grid-cols-1
            lg:grid-cols-2
            rounded-[2rem]
            overflow-hidden
            shadow-2xl
            bg-white
          "
        >

          {/* =================================================
              PARTIE GAUCHE
          ================================================== */}

          <div
            className="
              relative
              overflow-hidden
              bg-gradient-to-br
              from-[#073b91]
              via-[#0878d7]
              to-[#13b7d8]
              text-white
              min-h-[760px]
              lg:min-h-[820px]
            "
          >

            {/* ------------------------------------------------
                FORMES DÉCORATIVES
            ------------------------------------------------- */}

            <div
              className="
                absolute
                -top-44
                -left-44
                w-[560px]
                h-[560px]
                rounded-full
                bg-blue-950/45
              "
            />

            <div
              className="
                absolute
                -bottom-64
                -left-36
                w-[650px]
                h-[650px]
                rounded-full
                bg-blue-950/35
              "
            />

            <div
              className="
                absolute
                -bottom-56
                right-[-120px]
                w-[600px]
                h-[600px]
                rounded-full
                bg-blue-900/30
              "
            />

            <div
              className="
                absolute
                top-0
                right-[-180px]
                w-[520px]
                h-[520px]
                rounded-full
                bg-cyan-200/15
                blur-2xl
              "
            />


            {/* ------------------------------------------------
                CONTENU GAUCHE
            ------------------------------------------------- */}

            <div
              className="
                relative
                z-10
                min-h-[760px]
                lg:min-h-[820px]
                flex
                flex-col
                px-7
                py-8
                sm:px-10
                lg:px-12
                xl:px-16
              "
            >

              {/* =================================================
                  LOGO
              ================================================== */}

              <Link
                href="/"
                className="
                  inline-flex
                  items-center
                  gap-3
                  w-fit
                  group
                "
              >

                <div
                  className="
                    w-12
                    h-12
                    rounded-2xl
                    bg-white
                    flex
                    items-center
                    justify-center
                    shadow-lg
                    group-hover:scale-105
                    transition-transform
                  "
                >

                  <span
                    className="
                      text-3xl
                      font-bold
                      text-blue-600
                    "
                  >
                    ✚
                  </span>

                </div>

                <div>

                  <h1
                    className="
                      text-xl
                      sm:text-2xl
                      font-bold
                      text-white
                      tracking-tight
                    "
                  >
                    Dispositif médical
                  </h1>

                  <p
                    className="
                      text-xs
                      sm:text-sm
                      text-blue-100
                    "
                  >
                    Vente de dispositifs médicaux
                  </p>

                </div>

              </Link>


              {/* =================================================
                  BADGE
              ================================================== */}

              <div
                className="
                  inline-flex
                  items-center
                  gap-2
                  w-fit
                  mt-14
                  lg:mt-16
                  px-4
                  py-2
                  rounded-full
                  bg-white/10
                  border
                  border-white/20
                  backdrop-blur-sm
                  text-sm
                  text-blue-50
                "
              >

                <span
                  className="
                    w-2
                    h-2
                    rounded-full
                    bg-emerald-300
                  "
                />

                Votre santé, notre priorité

              </div>


              {/* =================================================
                  TITRE
              ================================================== */}

              <div
                className="
                  mt-6
                  max-w-xl
                "
              >

                <h2
                  className="
                    text-4xl
                    sm:text-5xl
                    xl:text-6xl
                    font-bold
                    leading-[1.05]
                    tracking-tight
                  "
                >
                  Vos dispositifs
                  <br />
                  médicaux,

                  <span
                    className="
                      block
                      text-cyan-200
                    "
                  >
                    simplement.
                  </span>

                </h2>


                <p
                  className="
                    mt-6
                    text-base
                    sm:text-lg
                    text-blue-50
                    leading-relaxed
                    max-w-lg
                  "
                >
                  Retrouvez vos dispositifs médicaux,
                  consultez notre catalogue et passez
                  vos commandes directement en ligne.
                </p>

              </div>


              {/* =================================================
                  AVANTAGES
              ================================================== */}

              <div
                className="
                  mt-10
                  space-y-5
                  max-w-xl
                "
              >

                {/* 1 */}

                <div
                  className="
                    flex
                    items-center
                    gap-4
                  "
                >

                  <div
                    className="
                      w-12
                      h-12
                      shrink-0
                      rounded-full
                      bg-blue-500/40
                      border
                      border-white/20
                      flex
                      items-center
                      justify-center
                      text-xl
                      backdrop-blur-sm
                    "
                  >
                    🛒
                  </div>

                  <div>

                    <h3
                      className="
                        font-bold
                        text-white
                      "
                    >
                      Catalogue complet
                    </h3>

                    <p
                      className="
                        text-sm
                        text-blue-100
                        mt-1
                      "
                    >
                      Une large gamme de dispositifs médicaux
                    </p>

                  </div>

                </div>


                {/* 2 */}

                <div
                  className="
                    flex
                    items-center
                    gap-4
                  "
                >

                  <div
                    className="
                      w-12
                      h-12
                      shrink-0
                      rounded-full
                      bg-cyan-500/40
                      border
                      border-white/20
                      flex
                      items-center
                      justify-center
                      text-xl
                      backdrop-blur-sm
                    "
                  >
                    📦
                  </div>

                  <div>

                    <h3
                      className="
                        font-bold
                        text-white
                      "
                    >
                      Commande simple et rapide
                    </h3>

                    <p
                      className="
                        text-sm
                        text-blue-100
                        mt-1
                      "
                    >
                      En quelques clics seulement
                    </p>

                  </div>

                </div>


                {/* 3 */}

                <div
                  className="
                    flex
                    items-center
                    gap-4
                  "
                >

                  <div
                    className="
                      w-12
                      h-12
                      shrink-0
                      rounded-full
                      bg-violet-500/40
                      border
                      border-white/20
                      flex
                      items-center
                      justify-center
                      text-xl
                      backdrop-blur-sm
                    "
                  >
                    🛡️
                  </div>

                  <div>

                    <h3
                      className="
                        font-bold
                        text-white
                      "
                    >
                      Paiement en ligne sécurisé
                    </h3>

                    <p
                      className="
                        text-sm
                        text-blue-100
                        mt-1
                      "
                    >
                      Vos transactions sont protégées
                    </p>

                  </div>

                </div>

              </div>


              {/* =================================================
                  ILLUSTRATION DU BAS

                  Elle est maintenant dans un espace dédié
                  et ne sera plus coupée par une hauteur fixe.
              ================================================== */}

              <div
                className="
                  mt-auto
                  pt-12
                "
              >

                <div
                  className="
                    relative
                    mx-auto
                    w-full
                    max-w-[500px]
                    h-[190px]
                    sm:h-[210px]
                  "
                >

                  {/* Halo */}

                  <div
                    className="
                      absolute
                      left-1/2
                      bottom-0
                      -translate-x-1/2
                      w-[90%]
                      h-24
                      rounded-full
                      bg-white/10
                      blur-2xl
                    "
                  />


                  {/* Support principal */}

                  <div
                    className="
                      absolute
                      bottom-0
                      left-1/2
                      -translate-x-1/2
                      w-[90%]
                      h-[145px]
                      rounded-t-[4rem]
                      bg-white/10
                      border
                      border-white/15
                      backdrop-blur-sm
                    "
                  />


                  {/* Appareil gauche */}

                  <div
                    className="
                      absolute
                      left-[12%]
                      bottom-5
                      w-24
                      h-16
                      rounded-2xl
                      bg-white/20
                      border
                      border-white/25
                      backdrop-blur-sm
                      shadow-xl
                    "
                  >

                    <div
                      className="
                        absolute
                        left-3
                        top-3
                        w-12
                        h-8
                        rounded-md
                        bg-white/80
                      "
                    />

                    <div
                      className="
                        absolute
                        right-[-30px]
                        top-1/2
                        w-10
                        h-1
                        bg-white/50
                        rotate-12
                      "
                    />

                  </div>


                  {/* Moniteur central */}

                  <div
                    className="
                      absolute
                      left-1/2
                      bottom-0
                      -translate-x-1/2
                      w-36
                      h-28
                      rounded-t-3xl
                      bg-white/20
                      border
                      border-white/25
                      backdrop-blur-sm
                      shadow-xl
                      flex
                      items-center
                      justify-center
                    "
                  >

                    <div
                      className="
                        w-24
                        h-14
                        rounded-xl
                        bg-slate-900/70
                        border
                        border-white/20
                        flex
                        items-center
                        justify-center
                      "
                    >

                      <div
                        className="
                          w-16
                          h-6
                          border-b-2
                          border-cyan-300
                          rotate-[-8deg]
                        "
                      />

                    </div>

                  </div>


                  {/* Appareil droit */}

                  <div
                    className="
                      absolute
                      right-[10%]
                      bottom-4
                      w-24
                      h-20
                      rounded-2xl
                      bg-white/20
                      border
                      border-white/25
                      backdrop-blur-sm
                      shadow-xl
                    "
                  >

                    <div
                      className="
                        absolute
                        left-4
                        top-4
                        w-16
                        h-9
                        rounded-lg
                        bg-white/80
                      "
                    />

                    <div
                      className="
                        absolute
                        left-1/2
                        -bottom-5
                        -translate-x-1/2
                        w-14
                        h-6
                        rounded-b-full
                        border-b-4
                        border-white/40
                      "
                    />

                  </div>

                </div>

              </div>

            </div>

          </div>


          {/* =================================================
              PARTIE DROITE : FORMULAIRE
          ================================================== */}

          <div
            className="
              bg-white
              flex
              items-center
              justify-center
              px-6
              py-12
              sm:px-10
              lg:px-12
              xl:px-16
              min-h-[760px]
              lg:min-h-[820px]
            "
          >

            <div
              className="
                w-full
                max-w-[500px]
              "
            >

              {/* =================================================
                  LOGO MÉDICAL
              ================================================== */}

              <div className="text-center">

                <div
                  className="
                    w-20
                    h-20
                    mx-auto
                    rounded-3xl
                    bg-blue-50
                    flex
                    items-center
                    justify-center
                    mb-6
                  "
                >

                  <div
                    className="
                      relative
                      w-12
                      h-12
                    "
                  >

                    <div
                      className="
                        absolute
                        left-1/2
                        top-0
                        -translate-x-1/2
                        w-5
                        h-12
                        rounded-lg
                        bg-blue-600
                      "
                    />

                    <div
                      className="
                        absolute
                        left-0
                        top-1/2
                        -translate-y-1/2
                        w-12
                        h-5
                        rounded-lg
                        bg-blue-600
                      "
                    />

                    <div
                      className="
                        absolute
                        right-[-2px]
                        bottom-[-2px]
                        w-5
                        h-5
                        rounded-full
                        bg-cyan-400
                      "
                    />

                  </div>

                </div>


                <h2
                  className="
                    text-3xl
                    sm:text-4xl
                    font-bold
                    text-slate-900
                  "
                >
                  Connexion
                </h2>


                <p
                  className="
                    text-slate-500
                    mt-3
                    text-sm
                    sm:text-base
                    leading-relaxed
                  "
                >
                  Connectez-vous à votre compte
                  <br />
                  pour accéder à la plateforme
                </p>

              </div>


              {/* =================================================
                  ERREUR
              ================================================== */}

              {erreur && (
                <div
                  className="
                    mt-7
                    rounded-xl
                    border
                    border-red-200
                    bg-red-50
                    px-4
                    py-3
                    text-sm
                    text-red-700
                    flex
                    items-center
                    gap-3
                  "
                >

                  <div
                    className="
                      w-6
                      h-6
                      shrink-0
                      rounded-full
                      bg-red-100
                      flex
                      items-center
                      justify-center
                      font-bold
                    "
                  >
                    !
                  </div>

                  <span>
                    {erreur}
                  </span>

                </div>
              )}


              {/* =================================================
                  FORMULAIRE
              ================================================== */}

              <form
                onSubmit={handleConnexion}
                className="
                  mt-8
                  space-y-5
                "
              >

                {/* EMAIL */}

                <div>

                  <label
                    htmlFor="email"
                    className="
                      block
                      text-sm
                      font-semibold
                      text-slate-800
                      mb-2
                    "
                  >
                    Adresse email
                  </label>

                  <div className="relative">

                    <div
                      className="
                        absolute
                        left-4
                        top-1/2
                        -translate-y-1/2
                        text-slate-400
                        pointer-events-none
                      "
                    >

                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-5 h-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="1.8"
                      >

                        <rect
                          x="3"
                          y="5"
                          width="18"
                          height="14"
                          rx="2"
                        />

                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M3 7l9 6 9-6"
                        />

                      </svg>

                    </div>

                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) =>
                        setEmail(e.target.value)
                      }
                      placeholder="votre@email.com"
                      required
                      autoComplete="email"
                      className="
                        w-full
                        h-14
                        border
                        border-slate-200
                        rounded-xl
                        bg-slate-50
                        pl-12
                        pr-4
                        text-slate-900
                        placeholder:text-slate-400
                        outline-none
                        transition-all
                        focus:bg-white
                        focus:border-blue-500
                        focus:ring-4
                        focus:ring-blue-100
                      "
                    />

                  </div>

                </div>


                {/* MOT DE PASSE */}

                <div>

                  <label
                    htmlFor="password"
                    className="
                      block
                      text-sm
                      font-semibold
                      text-slate-800
                      mb-2
                    "
                  >
                    Mot de passe
                  </label>

                  <div className="relative">

                    <div
                      className="
                        absolute
                        left-4
                        top-1/2
                        -translate-y-1/2
                        text-slate-400
                        pointer-events-none
                      "
                    >

                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-5 h-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="1.8"
                      >

                        <rect
                          x="4"
                          y="10"
                          width="16"
                          height="11"
                          rx="2"
                        />

                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M8 10V7a4 4 0 018 0v3"
                        />

                      </svg>

                    </div>

                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) =>
                        setPassword(e.target.value)
                      }
                      placeholder="Votre mot de passe"
                      required
                      autoComplete="current-password"
                      className="
                        w-full
                        h-14
                        border
                        border-slate-200
                        rounded-xl
                        bg-slate-50
                        pl-12
                        pr-4
                        text-slate-900
                        placeholder:text-slate-400
                        outline-none
                        transition-all
                        focus:bg-white
                        focus:border-blue-500
                        focus:ring-4
                        focus:ring-blue-100
                      "
                    />

                  </div>

                </div>


                {/* MOT DE PASSE OUBLIÉ */}

                <div className="flex justify-end pt-1">

                  <Link
                    href="/mot-de-passe-oublie"
                    className="
                      text-sm
                      font-semibold
                      text-blue-600
                      hover:text-blue-700
                      hover:underline
                      transition-colors
                    "
                  >
                    Mot de passe oublié ?
                  </Link>

                </div>


                {/* BOUTON */}

                <button
                  type="submit"
                  disabled={chargement}
                  className="
                    w-full
                    h-14
                    rounded-xl
                    bg-gradient-to-r
                    from-blue-600
                    to-blue-500
                    text-white
                    font-bold
                    shadow-lg
                    shadow-blue-200
                    hover:from-blue-700
                    hover:to-blue-600
                    hover:shadow-xl
                    hover:shadow-blue-200
                    active:scale-[0.99]
                    transition-all
                    duration-200
                    disabled:from-blue-300
                    disabled:to-blue-300
                    disabled:shadow-none
                    disabled:cursor-not-allowed
                  "
                >

                  {chargement ? (

                    <span
                      className="
                        flex
                        items-center
                        justify-center
                        gap-3
                      "
                    >

                      <span
                        className="
                          w-5
                          h-5
                          rounded-full
                          border-2
                          border-white/40
                          border-t-white
                          animate-spin
                        "
                      />

                      Connexion en cours...

                    </span>

                  ) : (

                    <span
                      className="
                        flex
                        items-center
                        justify-center
                        gap-2
                      "
                    >

                      Se connecter

                      <span className="text-xl">
                        →
                      </span>

                    </span>

                  )}

                </button>

              </form>


              {/* =================================================
                  INSCRIPTION
              ================================================== */}

              <div
                className="
                  mt-8
                  pt-7
                  border-t
                  border-slate-200
                  text-center
                "
              >

                <p
                  className="
                    text-sm
                    text-slate-500
                  "
                >
                  Vous n'avez pas encore de compte ?
                </p>

                <Link
                  href="/inscription"
                  className="
                    inline-flex
                    items-center
                    gap-2
                    mt-2
                    text-blue-600
                    font-bold
                    hover:text-blue-700
                    hover:underline
                    transition-colors
                  "
                >
                  Créer un compte

                  <span className="text-lg">
                    →
                  </span>

                </Link>

              </div>


              {/* =================================================
                  SÉCURITÉ
              ================================================== */}

              <div
                className="
                  flex
                  items-center
                  justify-center
                  gap-2
                  mt-7
                  text-xs
                  text-slate-400
                "
              >

                <span>🔒</span>

                <span>
                  Vos informations sont protégées
                </span>

              </div>

            </div>

          </div>

        </div>

      </section>

    </main>
  );
}