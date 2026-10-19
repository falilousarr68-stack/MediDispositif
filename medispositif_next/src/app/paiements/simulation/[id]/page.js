"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import Header from "../../../../components/Header";
import api from "../../../../services/api";

export default function SimulationPaiementPage() {
  const params = useParams();
  const router = useRouter();

  // Ici, id = ID DU PAIEMENT
  const id = params.id;

  const [paiement, setPaiement] = useState(null);
  const [commande, setCommande] = useState(null);

  const [chargement, setChargement] = useState(true);
  const [traitement, setTraitement] = useState(false);

  const [erreur, setErreur] = useState("");

  /*
   * ============================================================
   * CHARGER LE PAIEMENT PUIS LA COMMANDE
   * ============================================================
   */

  useEffect(() => {
    const chargerPaiement = async () => {
      try {
        setChargement(true);
        setErreur("");

        // 1. Récupérer le paiement
        const paiementResponse = await api.get(
          `/ventes/paiements/${id}/`
        );

        console.log(
          "Paiement pour simulation :",
          paiementResponse.data
        );

        const paiementData = paiementResponse.data;

        setPaiement(paiementData);

        // 2. Récupérer la commande liée au paiement
        const commandeResponse = await api.get(
          `/ventes/commandes/${paiementData.idCommande}/`
        );

        console.log(
          "Commande pour simulation :",
          commandeResponse.data
        );

        setCommande(commandeResponse.data);

      } catch (error) {
        console.error(
          "Erreur lors du chargement du paiement :",
          error
        );

        console.error(
          "Réponse Django :",
          error.response?.data
        );

        if (error.response?.status === 401) {
          setErreur(
            "Votre session a expiré. Veuillez vous reconnecter."
          );
        } else if (error.response?.status === 403) {
          setErreur(
            "Vous n'avez pas l'autorisation de consulter ce paiement."
          );
        } else if (error.response?.status === 404) {
          setErreur(
            "Ce paiement n'existe pas."
          );
        } else {
          setErreur(
            "Impossible de charger les informations du paiement."
          );
        }

      } finally {
        setChargement(false);
      }
    };

    if (id) {
      chargerPaiement();
    }
  }, [id]);

  /*
   * ============================================================
   * CONFIRMER LE PAIEMENT SIMULÉ
   * ============================================================
   */

  const confirmerPaiement = async () => {
    setErreur("");
    setTraitement(true);

    try {
      const response = await api.post(
        `/ventes/paiements/${id}/confirmer-simulation/`
      );

      console.log(
        "Confirmation paiement :",
        response.data
      );

      // Django nous renvoie l'ID de la commande
      const idCommande = response.data?.idCommande;

      if (!idCommande) {
        throw new Error(
          "L'identifiant de la commande n'a pas été retourné."
        );
      }

      // Retour vers la commande après paiement
      router.push(
        `/commandes/${idCommande}?paiement=success`
      );

    } catch (error) {
      console.error(
        "Erreur lors de la confirmation :",
        error
      );

      console.error(
        "Réponse Django :",
        error.response?.data
      );

      setErreur(
        error.response?.data?.error ||
        error.response?.data?.detail ||
        error.message ||
        "Impossible de confirmer le paiement."
      );

      setTraitement(false);
    }
  };

  /*
   * ============================================================
   * ANNULER
   * ============================================================
   */

  const annulerPaiement = () => {
    if (commande?.idCommande) {
      router.push(`/commandes/${commande.idCommande}`);
    } else {
      router.push("/commandes");
    }
  };

  /*
   * ============================================================
   * CHARGEMENT
   * ============================================================
   */

  if (chargement) {
    return (
      <main className="min-h-screen bg-gray-50">

        <Header />

        <div className="max-w-3xl mx-auto px-6 py-20 text-center">

          <p className="text-gray-600 text-lg">
            Chargement du paiement...
          </p>

        </div>

      </main>
    );
  }

  /*
   * ============================================================
   * ERREUR
   * ============================================================
   */

  if (erreur && (!paiement || !commande)) {
    return (
      <main className="min-h-screen bg-gray-50">

        <Header />

        <div className="max-w-3xl mx-auto px-6 py-20">

          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-6 text-center">

            <h2 className="text-xl font-bold mb-2">
              Impossible de charger le paiement
            </h2>

            <p>
              {erreur}
            </p>

            <button
              type="button"
              onClick={() => router.push("/commandes")}
              className="mt-6 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700"
            >
              Mes commandes
            </button>

          </div>

        </div>

      </main>
    );
  }

  /*
   * ============================================================
   * MONTANT
   * ============================================================
   */

  const montant = Number(
    paiement?.montant ??
    commande?.montant_total ??
    0
  );

  return (
    <main className="min-h-screen bg-gray-100">

      <Header />

      <div className="max-w-xl mx-auto px-6 py-12">

        <div className="bg-white rounded-2xl shadow-lg border overflow-hidden">

          {/* HEADER */}

          <div className="bg-blue-600 text-white p-7 text-center">

            <div className="w-16 h-16 mx-auto rounded-xl bg-white text-blue-600 flex items-center justify-center text-3xl font-bold">
              W
            </div>

            <h1 className="text-2xl font-bold mt-4">
              Paiement {paiement?.mode_paiement_display || paiement?.mode_paiement}
            </h1>

            <p className="text-blue-100 mt-2">
              MediDispositif
            </p>

          </div>

          {/* CONTENU */}

          <div className="p-7">

            {/* ERREUR */}

            {erreur && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-xl p-5">

                <p className="font-medium">
                  {erreur}
                </p>

              </div>
            )}

            {/* MONTANT */}

            <div className="text-center mb-8">

              <p className="text-gray-500">
                Montant à payer
              </p>

              <p className="text-4xl font-bold text-gray-900 mt-2">
                {montant.toLocaleString("fr-FR")} FCFA
              </p>

            </div>

            {/* INFORMATIONS */}

            <div className="border border-gray-200 rounded-xl p-5 space-y-4">

              <div className="flex justify-between">

                <span className="text-gray-500">
                  Commande
                </span>

                <span className="font-semibold">
                  #{commande?.idCommande}
                </span>

              </div>

              <div className="flex justify-between">

                <span className="text-gray-500">
                  Mode de paiement
                </span>

                <span className="font-semibold">
                  {paiement?.mode_paiement_display ||
                    paiement?.mode_paiement}
                </span>

              </div>

              <div className="flex justify-between">

                <span className="text-gray-500">
                  Référence
                </span>

                <span className="font-semibold">
                  {paiement?.reference || "—"}
                </span>

              </div>

              <div className="flex justify-between">

                <span className="text-gray-500">
                  Statut
                </span>

                <span className="font-semibold text-orange-600">
                  Simulation
                </span>

              </div>

            </div>

            {/* BOUTONS */}

            <div className="mt-8 space-y-3">

              <button
                type="button"
                onClick={confirmerPaiement}
                disabled={
                  traitement ||
                  montant <= 0 ||
                  paiement?.statut !== "EnAttente"
                }
                className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {traitement
                  ? "Traitement du paiement..."
                  : `Payer ${montant.toLocaleString(
                      "fr-FR"
                    )} FCFA`}
              </button>

              <button
                type="button"
                onClick={annulerPaiement}
                disabled={traitement}
                className="w-full border border-gray-300 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-50 disabled:bg-gray-100"
              >
                Annuler
              </button>

            </div>

            <p className="text-xs text-gray-400 text-center mt-6">
              Mode simulation — aucun argent réel
              n'est débité.
            </p>

          </div>

        </div>

      </div>

    </main>
  );
}