"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import Sidebar from "../../components/Sidebar";
import api from "../../services/api";

export default function PaiementPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const idCommande = searchParams.get("commande");

  const [commande, setCommande] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [paiementEnCours, setPaiementEnCours] = useState(false);

  const [modePaiement, setModePaiement] = useState("");
  const [erreur, setErreur] = useState("");
  const [message, setMessage] = useState("");
  const [utilisateur, setUtilisateur] = useState(null);
  const [dateHeure, setDateHeure] = useState(new Date());

  /*
   * ============================================================
   * CHARGER LA COMMANDE
   * ============================================================
   */

  useEffect(() => {
  const utilisateurStocke =
    localStorage.getItem("utilisateur");

   if (!utilisateurStocke) {
    router.push("/connexion");
    return;
  }

  try {
    const utilisateurConnecte =
      JSON.parse(utilisateurStocke);

    if (utilisateurConnecte.role !== "Client") {
      router.push("/");
      return;
    }

    setUtilisateur(utilisateurConnecte);
  } catch (error) {
    console.error(
      "Erreur lors de la récupération de l'utilisateur :",
      error
    );

    localStorage.removeItem("utilisateur");
    router.push("/connexion");
  }
}, [router]);

useEffect(() => {
  const interval = setInterval(() => {
    setDateHeure(new Date());
  }, 1000);

  return () => clearInterval(interval);
}, []);

  useEffect(() => {
    const chargerCommande = async () => {
      if (!idCommande) {
        setErreur("Aucune commande n'a été sélectionnée.");
        setChargement(false);
        return;
      }

      try {
        setChargement(true);
        setErreur("");

        const response = await api.get(
          `/ventes/commandes/${idCommande}/`
        );

        console.log(
          "Commande pour paiement :",
          response.data
        );

        setCommande(response.data);

      } catch (error) {
        console.error(
          "Erreur lors du chargement de la commande :",
          error
        );

        if (error.response?.status === 401) {
          setErreur(
            "Votre session a expiré. Veuillez vous reconnecter."
          );
        } else if (error.response?.status === 403) {
          setErreur(
            "Vous n'avez pas accès à cette commande."
          );
        } else if (error.response?.status === 404) {
          setErreur("Commande introuvable.");
        } else {
          setErreur(
            "Impossible de charger les informations de la commande."
          );
        }

      } finally {
        setChargement(false);
      }
    };

    chargerCommande();
  }, [idCommande]);

  /*
   * ============================================================
   * PAIEMENT
   * ============================================================
   */

  const effectuerPaiement = async () => {
  setErreur("");
  setMessage("");

  if (!commande) {
    setErreur("Commande introuvable.");
    return;
  }

  if (!modePaiement) {
    setErreur(
      "Veuillez sélectionner un mode de paiement."
    );
    return;
  }

  const montant = Number(commande.montant_total);

  if (!montant || montant <= 0) {
    setErreur(
      "Le montant de la commande est invalide."
    );
    return;
  }

  try {
    setPaiementEnCours(true);

    // ==========================================================
    // ÉTAPE 1 : INITIALISER LE PAIEMENT
    // ==========================================================

    const initiation = await api.post(
      "/ventes/paiements/initier/",
      {
        idCommande: Number(idCommande),
        mode_paiement: modePaiement,
      }
    );

    console.log(
      "Paiement initialisé :",
      initiation.data
    );

    const idPaiement =
      initiation.data.idPaiement;

    if (!idPaiement) {
      throw new Error(
        "L'identifiant du paiement n'a pas été retourné."
      );
    }

    // ==========================================================
    // ÉTAPE 2 : CONFIRMER LE PAIEMENT
    // ==========================================================

    const confirmation = await api.post(
      `/ventes/paiements/${idPaiement}/confirmer-simulation/`
    );

    console.log(
      "Paiement confirmé :",
      confirmation.data
    );

    setMessage(
      "Paiement effectué avec succès. Votre commande est validée."
    );

    setTimeout(() => {
      router.push(
        `/commandes/${idCommande}`
      );
    }, 1200);

  } catch (error) {
    console.error(
      "Erreur lors du paiement :",
      error
    );

    if (error.response) {
      console.error(
        "Réponse Django :",
        error.response.data
      );

      const data = error.response.data;

      if (error.response.status === 401) {
        setErreur(
          "Votre session a expiré. Veuillez vous reconnecter."
        );

      } else if (error.response.status === 403) {
        setErreur(
          "Vous n'avez pas l'autorisation d'effectuer ce paiement."
        );

      } else if (error.response.status === 400) {

        if (data.detail) {
          setErreur(data.detail);

        } else if (data.error) {
          setErreur(data.error);

        } else if (data.montant) {
          setErreur(
            Array.isArray(data.montant)
              ? data.montant.join(" ")
              : data.montant
          );

        } else if (data.idCommande) {
          setErreur(
            Array.isArray(data.idCommande)
              ? data.idCommande.join(" ")
              : data.idCommande
          );

        } else if (data.non_field_errors) {
          setErreur(
            Array.isArray(data.non_field_errors)
              ? data.non_field_errors.join(" ")
              : data.non_field_errors
          );

        } else {
          setErreur(
            "Les informations du paiement sont invalides."
          );
        }

      } else {
        setErreur(
          "Une erreur est survenue lors du paiement."
        );
      }

    } else {
      setErreur(
        error.message ||
        "Impossible de contacter le serveur Django."
      );
    }

  } finally {
    setPaiementEnCours(false);
  }
};

  /*
   * ============================================================
   * CHARGEMENT
   * ============================================================
   */

  if (chargement) {
  return (
    <main className="min-h-screen bg-[#f4f8fc]">
      <Sidebar utilisateur={utilisateur} />

      <div className="ml-64 min-h-screen">
        <section className="max-w-7xl mx-auto px-6 py-20 text-center">
          <p className="text-gray-600 text-lg">
            Chargement de votre commande...
          </p>
        </section>
      </div>
    </main>
  );
}

  /*
   * ============================================================
   * ERREUR
   * ============================================================
   */

  if (erreur && !commande) {
  return (
    <main className="min-h-screen bg-[#f4f8fc]">
      <Sidebar utilisateur={utilisateur} />

      <div className="ml-64 min-h-screen">
        <section className="max-w-7xl mx-auto px-6 py-20">

          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-6 text-center">

            <h2 className="text-xl font-bold">
              Impossible d'effectuer le paiement
            </h2>

            <p className="mt-2">
              {erreur}
            </p>

            <button
              onClick={() => router.push("/commandes")}
              className="mt-6 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700"
            >
              Mes commandes
            </button>

          </div>

        </section>
        </div>
      </main>
    );
  }

  /*
   * ============================================================
   * AFFICHAGE
   * ============================================================
   */

  return (
  <main className="min-h-screen bg-[#f4f8fc]">

    

    <div className="ml-64 min-h-screen">

      {/* HERO */}

      <section className="relative overflow-hidden bg-gradient-to-r from-[#eaf4ff] via-[#effaff] to-[#e9fbf7] border-b border-blue-100">

  <div className="absolute -right-20 -top-24 w-80 h-80 bg-blue-200/30 rounded-full blur-3xl" />

  <div className="absolute right-40 bottom-[-100px] w-72 h-72 bg-cyan-200/20 rounded-full blur-3xl" />

  <div className="relative max-w-7xl mx-auto px-6 py-9">

    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">

      <div>

        <div className="flex items-center gap-2 mb-3">
          <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wider">
            ESPACE CLIENT
          </span>
        </div>

        <h1 className="text-3xl md:text-4xl font-bold text-slate-900">
          Paiement de la commande
        </h1>

        <p className="mt-2 text-slate-600">
          Finalisez votre commande en toute sécurité.
        </p>

      </div>

      <div className="bg-white/80 backdrop-blur-sm border border-white rounded-2xl px-5 py-4 shadow-sm min-w-[230px]">

        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
          Aujourd'hui
        </p>

        <p className="text-sm font-medium text-slate-700 mt-1 capitalize">
          {new Intl.DateTimeFormat("fr-FR", {
            weekday: "long",
            day: "2-digit",
            month: "long",
            year: "numeric",
          }).format(dateHeure)}
        </p>

        <p className="text-2xl font-bold text-blue-700 mt-1">
          {dateHeure.toLocaleTimeString("fr-FR", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })}
        </p>

      </div>

    </div>

  </div>

</section>

      {/* CONTENU */}

      <section className="max-w-7xl mx-auto px-6 py-10">

        <div className="mb-6">
  <button
    type="button"
    onClick={() => router.push(`/commandes/${idCommande}`)}
    className="
      inline-flex items-center gap-2
      text-gray-600
      hover:text-blue-600
      font-medium
      transition
    "
  >
    ← Retour à la commande
  </button>
</div>

        {/* SUCCÈS */}

        {message && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 rounded-xl p-5">
            <p className="font-semibold">
              ✓ {message}
            </p>
          </div>
        )}

        {/* ERREUR */}

        {erreur && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-xl p-5">
            <p className="font-medium">
              {erreur}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* PAIEMENT */}

          <div className="lg:col-span-2">

            <div className="bg-white rounded-2xl border shadow-sm p-8">

              <div className="mb-8">

                <p className="text-sm text-gray-500">
                  Commande
                </p>

                <h2 className="text-2xl font-bold text-gray-900">
                  #{commande.idCommande}
                </h2>

              </div>

              {/* MODE DE PAIEMENT */}

              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Choisissez votre mode de paiement
              </h3>

              <div className="space-y-4">

                {/* WAVE */}

                <label
                  className={`block border rounded-xl p-5 cursor-pointer transition ${
                    modePaiement === "Wave"
                      ? "border-blue-600 bg-blue-50"
                      : "border-gray-200 hover:border-blue-300"
                  }`}
                >

                  <div className="flex items-center gap-4">

                    <input
                      type="radio"
                      name="modePaiement"
                      value="Wave"
                      checked={modePaiement === "Wave"}
                      onChange={(event) =>
                        setModePaiement(event.target.value)
                      }
                    />

                    <div>
                      <p className="font-semibold text-gray-900">
                        Wave
                      </p>

                      <p className="text-sm text-gray-500">
                        Paiement mobile
                      </p>
                    </div>

                  </div>

                </label>

                {/* ORANGE MONEY */}

                <label
                  className={`block border rounded-xl p-5 cursor-pointer transition ${
                    modePaiement === "OrangeMoney"
                      ? "border-blue-600 bg-blue-50"
                      : "border-gray-200 hover:border-blue-300"
                  }`}
                >

                  <div className="flex items-center gap-4">

                    <input
                      type="radio"
                      name="modePaiement"
                      value="OrangeMoney"
                      checked={
                        modePaiement === "OrangeMoney"
                      }
                      onChange={(event) =>
                        setModePaiement(event.target.value)
                      }
                    />

                    <div>
                      <p className="font-semibold text-gray-900">
                        Orange Money
                      </p>

                      <p className="text-sm text-gray-500">
                        Paiement mobile
                      </p>
                    </div>

                  </div>

                </label>

                {/* CARTE */}

                <label
                  className={`block border rounded-xl p-5 cursor-pointer transition ${
                    modePaiement === "Carte"
                      ? "border-blue-600 bg-blue-50"
                      : "border-gray-200 hover:border-blue-300"
                  }`}
                >

                  <div className="flex items-center gap-4">

                    <input
                      type="radio"
                      name="modePaiement"
                      value="Carte"
                      checked={modePaiement === "Carte"}
                      onChange={(event) =>
                        setModePaiement(event.target.value)
                      }
                    />

                    <div>
                      <p className="font-semibold text-gray-900">
                        Carte bancaire
                      </p>

                      <p className="text-sm text-gray-500">
                        Visa, Mastercard...
                      </p>
                    </div>

                  </div>

                </label>

              </div>

              {/* BOUTON */}

              <button
                onClick={effectuerPaiement}
                disabled={
                  paiementEnCours ||
                  !modePaiement
                }
                className="w-full mt-8 bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {paiementEnCours
                  ? "Traitement du paiement..."
                  : `Payer ${Number(
                      commande.montant_total
                    ).toLocaleString("fr-FR")} FCFA`}
              </button>

              <p className="text-xs text-gray-500 text-center mt-4">
                Le paiement sera associé à la commande #
                {commande.idCommande}.
              </p>

            </div>

          </div>

          {/* RÉSUMÉ */}

          <aside>

            <div className="bg-white rounded-2xl border shadow-sm p-6 sticky top-6">

              <h2 className="text-xl font-bold text-gray-900">
                Résumé
              </h2>

              <div className="border-t mt-5 pt-5">

                {commande.lignes?.map((ligne) => (
                  <div
                    key={ligne.id}
                    className="flex justify-between gap-4 mb-4"
                  >

                    <div>

                      <p className="font-medium text-gray-900">
                        {ligne.nom_produit}
                      </p>

                      <p className="text-sm text-gray-500">
                        x{ligne.quantite}
                      </p>

                    </div>

                    <p className="font-semibold text-gray-900">
                      {Number(
                        ligne.montant
                      ).toLocaleString("fr-FR")} FCFA
                    </p>

                  </div>
                ))}

              </div>

              <div className="border-t pt-5">

                <div className="flex justify-between items-center">

                  <span className="text-lg font-semibold text-slate-900">
                    Total
                  </span>

                  <span className="text-2xl font-bold text-blue-700">
                    {Number(
                      commande.montant_total
                    ).toLocaleString("fr-FR")} FCFA
                  </span>

                </div>

              </div>

            </div>

          </aside>

        </div>

      </section>

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

      </div>

    </main>
  );
}