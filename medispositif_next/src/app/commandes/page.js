"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "../../services/api";

export default function CommandesPage() {
  const [commandes, setCommandes] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");
  const [commandeAAnnuler, setCommandeAAnnuler] = useState(null);
  const [motifAnnulation, setMotifAnnulation] = useState("");
  const [annulationEnCours, setAnnulationEnCours] = useState(false);
  const [paiements, setPaiements] = useState([]);
  const [renvoiEnCours, setRenvoiEnCours] = useState(null);
  const [messageSucces, setMessageSucces] = useState("");
  const [utilisateur, setUtilisateur] = useState(null);

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
    const chargerCommandes = async () => {
      try {
        setChargement(true);
        setErreur("");

        const [commandesResponse, paiementsResponse] =
  await Promise.all([
    api.get("/ventes/commandes/"),
    api.get("/ventes/paiements/"),
  ]);

console.log(
  "Commandes récupérées :",
  commandesResponse.data
);

console.log(
  "Paiements récupérés :",
  paiementsResponse.data
);

const donneesCommandes = Array.isArray(
  commandesResponse.data
)
  ? commandesResponse.data
  : commandesResponse.data?.results || [];

const donneesPaiements = Array.isArray(
  paiementsResponse.data
)
  ? paiementsResponse.data
  : paiementsResponse.data?.results || [];

setCommandes(donneesCommandes);
setPaiements(donneesPaiements);

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
              "Vous n'avez pas l'autorisation de consulter les commandes."
            );
          } else {
            setErreur(
              "Impossible de charger vos commandes."
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

    chargerCommandes();
  }, []);

    const afficherStatut = (statut) => {
  switch (statut) {

    case "EnCours":
      return {
        texte: "En cours",
        classe:
          "bg-yellow-100 text-yellow-700",
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
 const ouvrirAnnulation = (commande) => {
  setCommandeAAnnuler(commande);
  setMotifAnnulation("");
  setErreur("");
};

const fermerAnnulation = () => {
  setCommandeAAnnuler(null);
  setMotifAnnulation("");
};

const annulerCommande = async () => {
  if (!commandeAAnnuler) {
    return;
  }

  if (!motifAnnulation.trim()) {
    setErreur("Veuillez indiquer le motif de l'annulation.");
    return;
  }

  try {
    setAnnulationEnCours(true);
    setErreur("");

    await api.post(
      `/ventes/commandes/${commandeAAnnuler.idCommande}/annuler/`,
      {
        motif: motifAnnulation.trim(),
      }
    );

    setCommandeAAnnuler(null);
    setMotifAnnulation("");

    // Recharger les commandes
    const response = await api.get("/ventes/commandes/");

    const donnees = Array.isArray(response.data)
      ? response.data
      : response.data?.results || [];

    setCommandes(donnees);

  } catch (error) {
    console.error("Erreur lors de l'annulation :", error);

    setErreur(
      error.response?.data?.error ||
      error.response?.data?.detail ||
      "Impossible d'annuler la commande."
    );
  } finally {
    setAnnulationEnCours(false);
  }
};

const renvoyerEmailConfirmation = async (commande) => {
  const paiement = paiements.find(
    (p) =>
      Number(p.idCommande) === Number(commande.idCommande) &&
      p.statut === "Reussi"
  );

  if (!paiement) {
    setErreur(
      "Aucun paiement réussi n'a été trouvé pour cette commande."
    );
    return;
  }

  try {
    setRenvoiEnCours(commande.idCommande);
    setErreur("");
    setMessageSucces("");

    const response = await api.post(
      `/ventes/paiements/${paiement.idPaiement}/renvoyer-confirmation/`
    );

    setMessageSucces(
      response.data?.message ||
      "L'email de confirmation a été renvoyé avec succès."
    );

  } catch (error) {
    console.error(
      "Erreur lors du renvoi de l'email :",
      error
    );

    setErreur(
      error.response?.data?.error ||
      error.response?.data?.detail ||
      "Impossible de renvoyer l'email de confirmation."
    );

  } finally {
    setRenvoiEnCours(null);
  }
};

  return (
  <main className="min-h-screen bg-[#f4f8fc]">

    

    <div
      className={
        utilisateur?.role === "Client"
          ? "ml-64 min-h-screen"
          : "min-h-screen"
      }
    >

      {/* TITRE */}
      <section className="bg-gradient-to-r from-[#0b1730] via-[#1649b8] to-[#087f8c] text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-12">

          <p className="text-blue-200 mb-2">
            MediDispositif
          </p>

          <h1 className="text-4xl font-bold">
            Mes commandes
          </h1>

          <p className="mt-3 text-blue-100">
            Consultez l'historique et l'état de vos commandes.
          </p>

        </div>
      </section>

      {/* CONTENU */}
      <section className="max-w-7xl mx-auto px-6 py-10">

        {messageSucces && (
  <div className="mb-6 bg-green-50 border border-green-200 text-green-700 rounded-xl p-4">
    <p className="font-medium">
      ✅ {messageSucces}
    </p>
  </div>
)}

        {/* CHARGEMENT */}
        {chargement && (
          <div className="bg-white rounded-xl border shadow-sm p-12 text-center">

            <p className="text-gray-600">
              Chargement de vos commandes...
            </p>

          </div>
        )}

        {/* ERREUR */}
        {!chargement && erreur && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-6">

            <p className="font-medium">
              {erreur}
            </p>

          </div>
        )}

        {/* AUCUNE COMMANDE */}
        {!chargement &&
          !erreur &&
          commandes.length === 0 && (
            <div className="bg-white rounded-2xl border shadow-sm p-16 text-center">

              <div className="text-7xl mb-6">
                📦
              </div>

              <h2 className="text-2xl font-bold text-gray-900">
                Aucune commande
              </h2>

              <p className="text-gray-500 mt-3">
                Vous n'avez pas encore passé de commande.
              </p>

              <Link
                href="/produits"
                  className="inline-block mt-7 bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-7 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-cyan-600 transition"              >
                Découvrir les produits
              </Link>

            </div>
          )}

        {/* COMMANDES */}
        {!chargement &&
          !erreur &&
          commandes.length > 0 && (

            <div className="space-y-5">

              {commandes.map((commande) => {

                const statut = afficherStatut(
                  commande.statut
                );

                return (
                  <article
                    key={commande.idCommande}
                    className="bg-white rounded-xl border border-gray-200 shadow-sm p-6"
                  >

                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">

                      {/* INFORMATIONS */}
                      <div>

                        <div className="flex flex-wrap items-center gap-3">

                          <h2 className="text-xl font-bold text-gray-900">
                            Commande #{commande.idCommande}
                          </h2>

                          <span
                            className={`px-3 py-1 rounded-full text-sm font-medium ${statut.classe}`}
                          >
                            {statut.texte}
                          </span>

                        </div>

                        <p className="text-gray-500 text-sm mt-2">
                          {commande.date_commande
                            ? new Date(
                                commande.date_commande
                              ).toLocaleDateString(
                                "fr-FR"
                              )
                            : "Date non disponible"}
                        </p>

                        <p className="text-gray-500 text-sm mt-1">
                          {commande.nombre_lignes} ligne
                          {commande.nombre_lignes > 1
                            ? "s"
                            : ""}
                        </p>

                      </div>

                      {/* TOTAL + BOUTON */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-5">

                        <div className="text-right">

                          <p className="text-sm text-gray-500">
                            Total
                          </p>

                          <p className="text-xl font-bold text-blue-700">
                            {Number(
                              commande.montant_total
                            ).toLocaleString(
                              "fr-FR"
                            )}{" "}
                            FCFA
                          </p>

                        </div>

                        <Link
                          href={`/commandes/${commande.idCommande}`}
                          className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-5 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-cyan-600 transition text-center"
                        >
                          Voir la commande
                        </Link>

                        {commande.statut === "EnCours" && (
  <Link
    href={`/paiements?commande=${commande.idCommande}`}
    className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-5 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-cyan-600 transition text-center"
  >
    💳 Payer
  </Link>
)}
                       {commande.statut === "EnCours" && (
  <button
    type="button"
    onClick={() => ouvrirAnnulation(commande)}
    className="bg-red-600 text-white px-5 py-3 rounded-lg font-medium hover:bg-red-700 transition text-center"
  >
    ❌ Annuler
  </button>
)}

{commande.statut === "Validee" &&
  paiements.some(
    (p) =>
      Number(p.idCommande) === Number(commande.idCommande) &&
      p.statut === "Reussi"
  ) && (
    <button
      type="button"
      onClick={() =>
        renvoyerEmailConfirmation(commande)
      }
      disabled={
        renvoiEnCours === commande.idCommande
      }
      className="
        bg-purple-600
        text-white
        px-5
        py-3
        rounded-lg
        font-medium
        hover:bg-purple-700
        transition
        text-center
        disabled:opacity-50
        disabled:cursor-not-allowed
      "
    >
      {renvoiEnCours === commande.idCommande
        ? "📧 Envoi..."
        : "📧 Renvoyer l'email"}
    </button>
)}

                      </div>

                    </div>

                  </article>
                );
              })}

            </div>
          )}

      </section>

      {/* FOOTER */}
      <footer className="bg-gray-900 text-gray-300 mt-10">

        <div className="max-w-7xl mx-auto px-6 py-8 text-center">

          <p className="font-semibold text-white">
            MediDispositif
          </p>

          <p className="text-sm mt-2">
            Vente de dispositifs médicaux en ligne
          </p>

          <p className="text-xs text-gray-500 mt-4">
            © 2026 MediDispositif. Tous droits réservés.
          </p>

        </div>

      </footer>

    {commandeAAnnuler && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">

      <h2 className="text-xl font-bold text-gray-900">
        Annuler la commande #{commandeAAnnuler.idCommande}
      </h2>

      <p className="mt-2 text-sm text-gray-600">
        Cette action annulera votre commande.
      </p>

      <label className="mt-5 block text-sm font-medium text-gray-700">
        Motif de l'annulation
      </label>

      <textarea
        value={motifAnnulation}
        onChange={(e) => setMotifAnnulation(e.target.value)}
        rows={4}
        placeholder="Ex. Je souhaite modifier ma commande."
        className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-blue-500"
      />

      <div className="mt-5 flex justify-end gap-3">

        <button
          type="button"
          onClick={fermerAnnulation}
          disabled={annulationEnCours}
          className="rounded-lg border border-gray-300 px-5 py-3 font-medium text-gray-700 hover:bg-gray-100"
        >
          Retour
        </button>

        <button
          type="button"
          onClick={annulerCommande}
          disabled={annulationEnCours}
          className="rounded-lg bg-red-600 px-5 py-3 font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {annulationEnCours
            ? "Annulation..."
            : "Confirmer l'annulation"}
        </button>

      </div>

    </div>
  </div>
)}
</div>
    </main>
  );
}