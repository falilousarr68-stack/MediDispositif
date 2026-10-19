"use client";

import { useEffect, useState } from "react";
import api from "../../../services/api";


export default function UtilisateursPage() {
  const [utilisateurs, setUtilisateurs] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");

  const [recherche, setRecherche] = useState("");
  const [role, setRole] = useState("");

  const [utilisateurSelectionne, setUtilisateurSelectionne] = useState(null);
  const [modification, setModification] = useState(false);

  const [creation, setCreation] = useState(false);
  const [utilisateurConnecte, setUtilisateurConnecte] = useState(null);

const [nouvelUtilisateur, setNouvelUtilisateur] = useState({
  prenom: "",
  nom: "",
  email: "",
  role: "Vendeur",
  telephone: "",
  adresse: "",
  password: "",
  is_active: true,
});

  const roles = [
    {
      value: "",
      label: "Tous les rôles",
    },
    {
      value: "Administrateur",
      label: "Administrateur",
    },
    {
      value: "ResponsableCommercial",
      label: "Responsable Commercial",
    },
    {
      value: "Vendeur",
      label: "Vendeur",
    },
    {
      value: "Client",
      label: "Client",
    },
    {
      value: "GestionnaireDeStock",
      label: "Gestionnaire de Stock",
    },
  ];

  useEffect(() => {
    verifierAdministrateur();
  }, []);

  const verifierAdministrateur = () => {
    const utilisateurStocke = localStorage.getItem("utilisateur");

    if (!utilisateurStocke) {
      window.location.href = "/connexion";
      return;
    }

    try {
      const utilisateur = JSON.parse(utilisateurStocke);
      setUtilisateurConnecte(utilisateur);

      if (utilisateur.role !== "Administrateur") {
        window.location.href = "/";
        return;
      }

      chargerUtilisateurs();
    } catch (error) {
      console.error(error);
      window.location.href = "/connexion";
    }
  };

  const chargerUtilisateurs = async () => {
    try {
      setChargement(true);
      setErreur("");

      const params = {};

      if (recherche.trim()) {
        params.recherche = recherche.trim();
      }

      if (role) {
        params.role = role;
      }

      const response = await api.get(
        "/auth/utilisateurs/",
        { params }
      );

      const data = response.data;

      if (Array.isArray(data)) {
        setUtilisateurs(data);
      } else if (Array.isArray(data.results)) {
        setUtilisateurs(data.results);
      } else {
        setUtilisateurs([]);
      }
    } catch (error) {
      console.error(
        "Erreur lors du chargement des utilisateurs :",
        error
      );

      setErreur(
        error.response?.data?.detail ||
        "Impossible de charger les utilisateurs."
      );
    } finally {
      setChargement(false);
    }
  };

  const rechercher = (event) => {
    event.preventDefault();
    chargerUtilisateurs();
  };

  const reinitialiserFiltres = () => {
    setRecherche("");
    setRole("");

    setTimeout(() => {
      chargerUtilisateurs();
    }, 0);
  };

  const ouvrirModification = (utilisateur) => {
    setUtilisateurSelectionne({
      ...utilisateur,
    });

    setModification(true);
  };

  const fermerModification = () => {
    setUtilisateurSelectionne(null);
    setModification(false);
  };

  const modifierUtilisateur = async (event) => {
    event.preventDefault();

    if (!utilisateurSelectionne) {
      return;
    }

    try {
      await api.patch(
        `/auth/utilisateurs/${utilisateurSelectionne.idUser}/`,
        {
          nom: utilisateurSelectionne.nom,
          prenom: utilisateurSelectionne.prenom,
          email: utilisateurSelectionne.email,
          role: utilisateurSelectionne.role,
          telephone: utilisateurSelectionne.telephone,
          adresse: utilisateurSelectionne.adresse,
          is_active: utilisateurSelectionne.is_active,
        }
      );

      fermerModification();
      chargerUtilisateurs();
    } catch (error) {
      console.error(
        "Erreur lors de la modification :",
        error
      );

      alert(
        error.response?.data?.detail ||
        "Impossible de modifier cet utilisateur."
      );
    }
  };

  const changerStatut = async (utilisateur) => {
    const nouveauStatut = !utilisateur.is_active;

    const confirmation = window.confirm(
      nouveauStatut
        ? `Voulez-vous réactiver le compte de ${utilisateur.prenom} ${utilisateur.nom} ?`
        : `Voulez-vous désactiver le compte de ${utilisateur.prenom} ${utilisateur.nom} ?`
    );

    if (!confirmation) {
      return;
    }

    try {
      await api.patch(
        `/auth/utilisateurs/${utilisateur.idUser}/`,
        {
          is_active: nouveauStatut,
        }
      );

      chargerUtilisateurs();
    } catch (error) {
      console.error(
        "Erreur lors du changement de statut :",
        error
      );

      alert(
        error.response?.data?.detail ||
        "Impossible de modifier le statut du compte."
      );
    }
  };

  const supprimerUtilisateur = async (utilisateur) => {
    const confirmation = window.confirm(
      `Voulez-vous vraiment supprimer le compte de ${utilisateur.prenom} ${utilisateur.nom} ?\n\nCette action est irréversible.`
    );

    if (!confirmation) {
      return;
    }

    try {
      await api.delete(
        `/auth/utilisateurs/${utilisateur.idUser}/`
      );

      chargerUtilisateurs();
    } catch (error) {
      console.error(
        "Erreur lors de la suppression :",
        error
      );

      alert(
        error.response?.data?.detail ||
        "Impossible de supprimer cet utilisateur."
      );
    }
  };

  const obtenirInitiales = (utilisateur) => {
    const prenom = utilisateur.prenom?.charAt(0) || "";
    const nom = utilisateur.nom?.charAt(0) || "";

    return `${prenom}${nom}`.toUpperCase();
  };

  const obtenirCouleurRole = (role) => {
    switch (role) {
      case "Administrateur":
        return "bg-red-100 text-red-700";

      case "ResponsableCommercial":
        return "bg-purple-100 text-purple-700";

      case "Vendeur":
        return "bg-blue-100 text-blue-700";

      case "GestionnaireDeStock":
        return "bg-green-100 text-green-700";

      case "Client":
        return "bg-gray-100 text-gray-700";

      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const creerUtilisateur = async (event) => {
  event.preventDefault();

  try {
    await api.post(
      "/auth/utilisateurs/",
      nouvelUtilisateur
    );

    setCreation(false);

    setNouvelUtilisateur({
      prenom: "",
      nom: "",
      email: "",
      role: "Vendeur",
      telephone: "",
      adresse: "",
      password: "",
      is_active: true,
    });

    chargerUtilisateurs();

  } catch (error) {
    console.error(
      "Erreur lors de la création de l'utilisateur :",
      error
    );

    const donneesErreur = error.response?.data;

    if (donneesErreur) {
      const messages = Object.entries(donneesErreur)
        .map(([champ, message]) => {
          if (Array.isArray(message)) {
            return `${champ} : ${message.join(" ")}`;
          }

          return `${champ} : ${message}`;
        })
        .join("\n");

      alert(
        messages ||
        "Impossible de créer l'utilisateur."
      );
    } else {
      alert("Impossible de créer l'utilisateur.");
    }
  }
};

  return (
  <main className="min-h-screen bg-[#f4f8fc]">

    {/* SIDEBAR */}
    

    {/* CONTENU PRINCIPAL */}
    <div className="ml-64 min-h-screen bg-[#f4f8fc]">

      {/* =====================================================
          EN-TÊTE
      ====================================================== */}
      <section className="px-6 pt-6">

        <div
          className="
            relative overflow-hidden
            rounded-2xl
            bg-gradient-to-r from-[#e8f3ff] via-[#eef9ff] to-[#e4f8f8]
            border border-blue-100
            shadow-sm
          "
        >

          {/* décoration */}
          <div
            className="
              absolute right-0 top-0
              w-72 h-72
              bg-blue-300/10
              rounded-full
              blur-3xl
              translate-x-1/3
              -translate-y-1/3
            "
          />

          <div className="relative px-8 py-8">

            <p className="text-blue-700 text-sm font-semibold mb-2">
              ESPACE ADMINISTRATION
            </p>

            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">

              <div>

                <h1 className="text-3xl md:text-4xl font-bold text-slate-900">
                  Gestion des utilisateurs
                </h1>

                <p className="text-slate-600 mt-2">
                  Gérez les comptes, les rôles et les accès des utilisateurs
                  de MediDispositif.
                </p>

              </div>

              <div
                className="
                  bg-white/80
                  backdrop-blur-sm
                  border border-blue-100
                  rounded-2xl
                  px-6 py-4
                  shadow-sm
                  min-w-[230px]
                "
              >

                <p className="text-xs uppercase tracking-wider text-slate-500">
                  Connecté en tant que
                </p>

                <p className="font-bold text-lg text-slate-900 mt-1">
                  {utilisateurConnecte
                    ? `${utilisateurConnecte.prenom} ${utilisateurConnecte.nom}`
                    : "Administrateur"}
                </p>

                <p className="text-sm text-blue-600 mt-1">
                  Administrateur
                </p>

              </div>

            </div>

          </div>

        </div>

      </section>


      {/* =====================================================
          CONTENU
      ====================================================== */}
      <div className="px-6 py-8 max-w-[1400px] mx-auto">

        {/* RETOUR */}
        <button
          onClick={() => window.history.back()}
          className="
            mb-6
            text-blue-600
            hover:text-cyan-600
            text-sm
            font-semibold
            transition
          "
        >
          ← Retour à l'administration
        </button>


        {/* =================================================
            PETITES CARTES STATISTIQUES
        ================================================== */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">

          {/* TOTAL */}
          <div
            className="
              bg-white
              border-t-4 border-blue-500
              border-x border-b border-slate-200
              rounded-2xl
              p-5
              shadow-sm
              hover:shadow-md
              transition
            "
          >

            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm text-slate-500">
                  Total utilisateurs
                </p>

                <p className="text-3xl font-bold text-slate-900 mt-1">
                  {chargement ? "..." : utilisateurs.length}
                </p>
              </div>

              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-2xl">
                👥
              </div>

            </div>

          </div>


          {/* ACTIFS */}
          <div
            className="
              bg-white
              border-t-4 border-emerald-500
              border-x border-b border-slate-200
              rounded-2xl
              p-5
              shadow-sm
              hover:shadow-md
              transition
            "
          >

            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm text-slate-500">
                  Comptes actifs
                </p>

                <p className="text-3xl font-bold text-slate-900 mt-1">
                  {chargement
                    ? "..."
                    : utilisateurs.filter(
                        (utilisateur) => utilisateur.is_active
                      ).length}
                </p>
              </div>

              <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-2xl">
                ✅
              </div>

            </div>

          </div>


          {/* INACTIFS */}
          <div
            className="
              bg-white
              border-t-4 border-orange-500
              border-x border-b border-slate-200
              rounded-2xl
              p-5
              shadow-sm
              hover:shadow-md
              transition
            "
          >

            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm text-slate-500">
                  Comptes inactifs
                </p>

                <p className="text-3xl font-bold text-slate-900 mt-1">
                  {chargement
                    ? "..."
                    : utilisateurs.filter(
                        (utilisateur) => !utilisateur.is_active
                      ).length}
                </p>
              </div>

              <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-2xl">
                🔒
              </div>

            </div>

          </div>

        </section>


        {/* =================================================
            FILTRES
        ================================================== */}
        <section
          className="
            bg-white
            border border-slate-200
            rounded-2xl
            shadow-sm
            p-6
            mb-8
          "
        >

          <div className="mb-5">

            <h2 className="text-xl font-bold text-slate-900">
              Rechercher un utilisateur
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              Filtrez les comptes selon le nom, l'adresse email ou le rôle.
            </p>

          </div>


          <form
            onSubmit={rechercher}
            className="flex flex-col lg:flex-row gap-4"
          >

            <div className="flex-1">

              <label className="block text-sm font-medium text-slate-700 mb-2">
                Rechercher
              </label>

              <input
                type="text"
                value={recherche}
                onChange={(event) =>
                  setRecherche(event.target.value)
                }
                placeholder="Nom, prénom ou adresse email..."
                className="
                  w-full
                  border border-slate-200
                  rounded-xl
                  px-4 py-3
                  text-slate-900
                  bg-slate-50
                  outline-none
                  focus:bg-white
                  focus:ring-2
                  focus:ring-blue-500/20
                  focus:border-blue-500
                  transition
                "
              />

            </div>


            <div className="lg:w-64">

              <label className="block text-sm font-medium text-slate-700 mb-2">
                Rôle
              </label>

              <select
                value={role}
                onChange={(event) =>
                  setRole(event.target.value)
                }
                className="
                  w-full
                  border border-slate-200
                  rounded-xl
                  px-4 py-3
                  text-slate-900
                  bg-slate-50
                  outline-none
                  focus:bg-white
                  focus:ring-2
                  focus:ring-blue-500/20
                  focus:border-blue-500
                "
              >

                {roles.map((element) => (
                  <option
                    key={element.value}
                    value={element.value}
                  >
                    {element.label}
                  </option>
                ))}

              </select>

            </div>


            <div className="flex items-end gap-2">

              <button
                type="submit"
                className="
                  px-5 py-3
                  bg-gradient-to-r
                  from-blue-600
                  to-cyan-500
                  text-white
                  rounded-xl
                  font-semibold
                  shadow-sm
                  hover:shadow-md
                  hover:-translate-y-0.5
                  transition
                "
              >
                🔍 Rechercher
              </button>


              <button
                type="button"
                onClick={reinitialiserFiltres}
                className="
                  px-5 py-3
                  bg-slate-100
                  text-slate-700
                  rounded-xl
                  font-semibold
                  hover:bg-slate-200
                  transition
                "
              >
                Réinitialiser
              </button>

            </div>

          </form>

        </section>


        {/* ERREUR */}
        {erreur && (
          <div
            className="
              mb-6
              bg-red-50
              border border-red-200
              text-red-700
              px-4 py-3
              rounded-xl
            "
          >
            ⚠️ {erreur}
          </div>
        )}


        {/* =================================================
            LISTE DES UTILISATEURS
        ================================================== */}
        <section
          className="
            bg-white
            border border-slate-200
            rounded-2xl
            shadow-sm
            overflow-hidden
          "
        >

          <div
            className="
              px-6 py-5
              border-b border-slate-200
              flex flex-col md:flex-row
              md:items-center
              md:justify-between
              gap-4
            "
          >

            <div>

              <h2 className="text-xl font-bold text-slate-900">
                Utilisateurs
              </h2>

              <p className="text-sm text-slate-500 mt-1">
                {chargement
                  ? "Chargement..."
                  : `${utilisateurs.length} utilisateur(s)`}
              </p>

            </div>


            <div className="flex items-center gap-2">

              <button
                onClick={() => setCreation(true)}
                className="
                  px-4 py-2.5
                  bg-gradient-to-r
                  from-blue-600
                  to-cyan-500
                  text-white
                  rounded-xl
                  text-sm
                  font-semibold
                  shadow-sm
                  hover:shadow-md
                  transition
                "
              >
                + Ajouter un utilisateur
              </button>


              <button
                onClick={chargerUtilisateurs}
                className="
                  px-4 py-2.5
                  bg-slate-50
                  border border-slate-200
                  rounded-xl
                  text-sm
                  font-semibold
                  text-slate-700
                  hover:bg-slate-100
                  transition
                "
              >
                🔄 Actualiser
              </button>

            </div>

          </div>


          {chargement ? (

            <div className="py-16 text-center text-slate-500">
              Chargement des utilisateurs...
            </div>

          ) : utilisateurs.length === 0 ? (

            <div className="py-16 text-center">

              <div className="text-5xl mb-4">
                👥
              </div>

              <h3 className="text-lg font-semibold text-slate-900">
                Aucun utilisateur trouvé
              </h3>

              <p className="text-slate-500 mt-2">
                Aucun compte ne correspond aux critères de recherche.
              </p>

            </div>

          ) : (

            <div className="overflow-x-auto">

              <table className="w-full">

                <thead className="bg-[#f4f8fc] border-b border-slate-200">

                  <tr>

                    <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wide">
                      Utilisateur
                    </th>

                    <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wide">
                      Email
                    </th>

                    <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wide">
                      Rôle
                    </th>

                    <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wide">
                      Statut
                    </th>

                    <th className="text-right px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wide">
                      Actions
                    </th>

                  </tr>

                </thead>


                <tbody className="divide-y divide-slate-100">

                  {utilisateurs.map((utilisateur) => (

                    <tr
                      key={utilisateur.idUser}
                      className="
                        hover:bg-blue-50/40
                        transition
                      "
                    >

                      {/* UTILISATEUR */}
                      <td className="px-6 py-4">

                        <div className="flex items-center gap-3">

                          <div
                            className="
                              w-11 h-11
                              rounded-xl
                              bg-gradient-to-br
                              from-blue-500
                              to-cyan-500
                              text-white
                              flex items-center justify-center
                              font-bold
                              text-sm
                              shadow-sm
                            "
                          >
                            {obtenirInitiales(utilisateur)}
                          </div>

                          <div>

                            <p className="font-semibold text-slate-900">
                              {utilisateur.prenom} {utilisateur.nom}
                            </p>

                            <p className="text-xs text-slate-500">
                              ID #{utilisateur.idUser}
                            </p>

                          </div>

                        </div>

                      </td>


                      {/* EMAIL */}
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {utilisateur.email}
                      </td>


                      {/* ROLE */}
                      <td className="px-6 py-4">

                        <span
                          className={`
                            inline-flex
                            px-3 py-1.5
                            rounded-full
                            text-xs
                            font-semibold
                            ${obtenirCouleurRole(utilisateur.role)}
                          `}
                        >
                          {utilisateur.role_display ||
                            utilisateur.role}
                        </span>

                      </td>


                      {/* STATUT */}
                      <td className="px-6 py-4">

                        {utilisateur.is_active ? (

                          <span className="inline-flex items-center gap-2 text-emerald-600 text-sm font-semibold">

                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>

                            Actif

                          </span>

                        ) : (

                          <span className="inline-flex items-center gap-2 text-red-600 text-sm font-semibold">

                            <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>

                            Inactif

                          </span>

                        )}

                      </td>


                      {/* ACTIONS */}
                      <td className="px-6 py-4">

                        <div className="flex justify-end gap-2">

                          <button
                            onClick={() =>
                              ouvrirModification(utilisateur)
                            }
                            className="
                              px-3 py-2
                              rounded-lg
                              text-sm
                              text-blue-600
                              bg-blue-50
                              hover:bg-blue-100
                              transition
                            "
                          >
                            ✏️ Modifier
                          </button>


                          <button
                            onClick={() =>
                              changerStatut(utilisateur)
                            }
                            className={`
                              px-3 py-2
                              rounded-lg
                              text-sm
                              transition
                              ${
                                utilisateur.is_active
                                  ? "text-orange-600 bg-orange-50 hover:bg-orange-100"
                                  : "text-emerald-600 bg-emerald-50 hover:bg-emerald-100"
                              }
                            `}
                          >
                            {utilisateur.is_active
                              ? "🔒 Désactiver"
                              : "🔓 Activer"}
                          </button>


                          <button
                            onClick={() =>
                              supprimerUtilisateur(utilisateur)
                            }
                            className="
                              px-3 py-2
                              rounded-lg
                              text-sm
                              text-red-600
                              bg-red-50
                              hover:bg-red-100
                              transition
                            "
                          >
                            🗑️
                          </button>

                        </div>

                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

          )}

        </section>

      </div>

      {/* =====================================================
          MODALE MODIFICATION
      ====================================================== */}
      {modification && utilisateurSelectionne && (

        <div className="fixed inset-0 bg-black/50 z-50
          flex items-center justify-center p-4">

          <div className="bg-white rounded-2xl shadow-xl
            w-full max-w-2xl max-h-[90vh] overflow-y-auto">

            {/* EN-TÊTE MODALE */}
            <div className="px-6 py-5 border-b border-gray-200
              flex items-center justify-between">

              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Modifier l'utilisateur
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  Modifier les informations et le rôle
                </p>
              </div>

              <button
                onClick={fermerModification}
                className="text-gray-400 hover:text-gray-700
                text-2xl"
              >
                ×
              </button>

            </div>

            {/* FORMULAIRE */}
            <form
              onSubmit={modifierUtilisateur}
              className="p-6 space-y-5"
            >

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <div>
                  <label className="block text-sm font-medium
                    text-gray-700 mb-2">
                    Prénom
                  </label>

                  <input
                    type="text"
                    value={utilisateurSelectionne.prenom || ""}
                    onChange={(event) =>
                      setUtilisateurSelectionne({
                        ...utilisateurSelectionne,
                        prenom: event.target.value,
                      })
                    }
                    required
                    className="w-full border border-gray-300
                    rounded-lg px-4 py-2.5 text-gray-900
                    outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium
                    text-gray-700 mb-2">
                    Nom
                  </label>

                  <input
                    type="text"
                    value={utilisateurSelectionne.nom || ""}
                    onChange={(event) =>
                      setUtilisateurSelectionne({
                        ...utilisateurSelectionne,
                        nom: event.target.value,
                      })
                    }
                    required
                    className="w-full border border-gray-300
                    rounded-lg px-4 py-2.5 text-gray-900
                    outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

              </div>

              <div>
                <label className="block text-sm font-medium
                  text-gray-700 mb-2">
                  Adresse email
                </label>

                <input
                  type="email"
                  value={utilisateurSelectionne.email || ""}
                  onChange={(event) =>
                    setUtilisateurSelectionne({
                      ...utilisateurSelectionne,
                      email: event.target.value,
                    })
                  }
                  required
                  className="w-full border border-gray-300
                  rounded-lg px-4 py-2.5 text-gray-900
                  outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium
                  text-gray-700 mb-2">
                  Rôle
                </label>

                <select
                  value={utilisateurSelectionne.role || ""}
                  onChange={(event) =>
                    setUtilisateurSelectionne({
                      ...utilisateurSelectionne,
                      role: event.target.value,
                    })
                  }
                  className="w-full border border-gray-300
                  rounded-lg px-4 py-2.5 text-gray-900 bg-white
                  outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {roles
                    .filter((element) => element.value !== "")
                    .map((element) => (
                      <option
                        key={element.value}
                        value={element.value}
                      >
                        {element.label}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium
                  text-gray-700 mb-2">
                  Téléphone
                </label>

                <input
                  type="text"
                  value={utilisateurSelectionne.telephone || ""}
                  onChange={(event) =>
                    setUtilisateurSelectionne({
                      ...utilisateurSelectionne,
                      telephone: event.target.value,
                    })
                  }
                  className="w-full border border-gray-300
                  rounded-lg px-4 py-2.5 text-gray-900
                  outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium
                  text-gray-700 mb-2">
                  Adresse
                </label>

                <textarea
                  value={utilisateurSelectionne.adresse || ""}
                  onChange={(event) =>
                    setUtilisateurSelectionne({
                      ...utilisateurSelectionne,
                      adresse: event.target.value,
                    })
                  }
                  rows={3}
                  className="w-full border border-gray-300
                  rounded-lg px-4 py-2.5 text-gray-900
                  outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-between
                bg-gray-50 rounded-lg p-4">

                <div>
                  <p className="font-medium text-gray-900">
                    Compte actif
                  </p>

                  <p className="text-sm text-gray-500">
                    Autoriser cet utilisateur à se connecter
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setUtilisateurSelectionne({
                      ...utilisateurSelectionne,
                      is_active:
                        !utilisateurSelectionne.is_active,
                    })
                  }
                  className={`relative w-12 h-6 rounded-full
                  transition ${
                    utilisateurSelectionne.is_active
                      ? "bg-blue-600"
                      : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`absolute top-1 w-4 h-4
                    bg-white rounded-full transition ${
                      utilisateurSelectionne.is_active
                        ? "left-7"
                        : "left-1"
                    }`}
                  />
                </button>

              </div>

              {/* BOUTONS */}
              <div className="flex justify-end gap-3 pt-3">

                <button
                  type="button"
                  onClick={fermerModification}
                  className="px-5 py-2.5 bg-gray-100
                  text-gray-700 rounded-lg font-medium
                  hover:bg-gray-200 transition"
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600
                  text-white rounded-lg font-medium
                  hover:bg-blue-700 transition"
                >
                  Enregistrer les modifications
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

      {/* =====================================================
    MODALE CRÉATION UTILISATEUR
====================================================== */}
{creation && (

  <div className="fixed inset-0 bg-black/50 z-50
    flex items-center justify-center p-4">

    <div className="bg-white rounded-2xl shadow-xl
      w-full max-w-2xl max-h-[90vh] overflow-y-auto">

      {/* EN-TÊTE */}
      <div className="px-6 py-5 border-b border-gray-200
        flex items-center justify-between">

        <div>
          <h2 className="text-xl font-bold text-gray-900">
            Ajouter un utilisateur
          </h2>

          <p className="text-sm text-gray-500 mt-1">
            Créer un nouveau compte utilisateur
          </p>
        </div>

        <button
          type="button"
          onClick={() => setCreation(false)}
          className="text-gray-400 hover:text-gray-700
          text-2xl"
        >
          ×
        </button>

      </div>

      {/* FORMULAIRE */}
      <form
        onSubmit={creerUtilisateur}
        className="p-6 space-y-5"
      >

        {/* PRÉNOM + NOM */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          <div>
            <label className="block text-sm font-medium
              text-gray-700 mb-2">
              Prénom
            </label>

            <input
              type="text"
              value={nouvelUtilisateur.prenom}
              onChange={(event) =>
                setNouvelUtilisateur({
                  ...nouvelUtilisateur,
                  prenom: event.target.value,
                })
              }
              required
              className="w-full border border-gray-300
              rounded-lg px-4 py-2.5 text-gray-900
              outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium
              text-gray-700 mb-2">
              Nom
            </label>

            <input
              type="text"
              value={nouvelUtilisateur.nom}
              onChange={(event) =>
                setNouvelUtilisateur({
                  ...nouvelUtilisateur,
                  nom: event.target.value,
                })
              }
              required
              className="w-full border border-gray-300
              rounded-lg px-4 py-2.5 text-gray-900
              outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

        </div>

        {/* EMAIL */}
        <div>

          <label className="block text-sm font-medium
            text-gray-700 mb-2">
            Adresse email
          </label>

          <input
            type="email"
            value={nouvelUtilisateur.email}
            onChange={(event) =>
              setNouvelUtilisateur({
                ...nouvelUtilisateur,
                email: event.target.value,
              })
            }
            required
            className="w-full border border-gray-300
            rounded-lg px-4 py-2.5 text-gray-900
            outline-none focus:ring-2 focus:ring-blue-500"
          />

        </div>

        {/* MOT DE PASSE */}
        <div>

          <label className="block text-sm font-medium
            text-gray-700 mb-2">
            Mot de passe
          </label>

          <input
            type="password"
            value={nouvelUtilisateur.password}
            onChange={(event) =>
              setNouvelUtilisateur({
                ...nouvelUtilisateur,
                password: event.target.value,
              })
            }
            required
            minLength={8}
            placeholder="Minimum 8 caractères"
            className="w-full border border-gray-300
            rounded-lg px-4 py-2.5 text-gray-900
            outline-none focus:ring-2 focus:ring-blue-500"
          />

          <p className="text-xs text-gray-500 mt-1">
            Le mot de passe sera sécurisé automatiquement par Django.
          </p>

        </div>

        {/* ROLE */}
        <div>

          <label className="block text-sm font-medium
            text-gray-700 mb-2">
            Rôle
          </label>

          <select
            value={nouvelUtilisateur.role}
            onChange={(event) =>
              setNouvelUtilisateur({
                ...nouvelUtilisateur,
                role: event.target.value,
              })
            }
            className="w-full border border-gray-300
            rounded-lg px-4 py-2.5 text-gray-900
            bg-white outline-none focus:ring-2
            focus:ring-blue-500"
          >

            <option value="Vendeur">
              Vendeur
            </option>

            <option value="ResponsableCommercial">
              Responsable Commercial
            </option>

            <option value="GestionnaireDeStock">
              Gestionnaire de Stock
            </option>

            <option value="Administrateur">
              Administrateur
            </option>

          </select>

        </div>

        {/* TÉLÉPHONE */}
        <div>

          <label className="block text-sm font-medium
            text-gray-700 mb-2">
            Téléphone
          </label>

          <input
            type="text"
            value={nouvelUtilisateur.telephone}
            onChange={(event) =>
              setNouvelUtilisateur({
                ...nouvelUtilisateur,
                telephone: event.target.value,
              })
            }
            className="w-full border border-gray-300
            rounded-lg px-4 py-2.5 text-gray-900
            outline-none focus:ring-2 focus:ring-blue-500"
          />

        </div>

        {/* ADRESSE */}
        <div>

          <label className="block text-sm font-medium
            text-gray-700 mb-2">
            Adresse
          </label>

          <textarea
            value={nouvelUtilisateur.adresse}
            onChange={(event) =>
              setNouvelUtilisateur({
                ...nouvelUtilisateur,
                adresse: event.target.value,
              })
            }
            rows={3}
            className="w-full border border-gray-300
            rounded-lg px-4 py-2.5 text-gray-900
            outline-none focus:ring-2 focus:ring-blue-500"
          />

        </div>

        {/* COMPTE ACTIF */}
        <div className="flex items-center justify-between
          bg-gray-50 rounded-lg p-4">

          <div>

            <p className="font-medium text-gray-900">
              Compte actif
            </p>

            <p className="text-sm text-gray-500">
              Autoriser l'utilisateur à se connecter
            </p>

          </div>

          <button
            type="button"
            onClick={() =>
              setNouvelUtilisateur({
                ...nouvelUtilisateur,
                is_active: !nouvelUtilisateur.is_active,
              })
            }
            className={`relative w-12 h-6 rounded-full
            transition ${
              nouvelUtilisateur.is_active
                ? "bg-blue-600"
                : "bg-gray-300"
            }`}
          >

            <span
              className={`absolute top-1 w-4 h-4
              bg-white rounded-full transition ${
                nouvelUtilisateur.is_active
                  ? "left-7"
                  : "left-1"
              }`}
            />

          </button>

        </div>

        {/* BOUTONS */}
        <div className="flex justify-end gap-3 pt-3">

          <button
            type="button"
            onClick={() => setCreation(false)}
            className="px-5 py-2.5 bg-gray-100
            text-gray-700 rounded-lg font-medium
            hover:bg-gray-200 transition"
          >
            Annuler
          </button>

          <button
            type="submit"
            className="px-5 py-2.5 bg-blue-600
            text-white rounded-lg font-medium
            hover:bg-blue-700 transition"
          >
            Créer l'utilisateur
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