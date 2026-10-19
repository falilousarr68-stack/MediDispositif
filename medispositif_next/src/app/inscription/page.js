"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api from "../../services/api";

export default function InscriptionPage() {
  const router = useRouter();

  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [email, setEmail] = useState("");
  const [telephone, setTelephone] = useState("");
  const [adresse, setAdresse] = useState("");
  const [motdepasse, setMotdepasse] = useState("");
  const [confirmationMotdepasse, setConfirmationMotdepasse] = useState("");

  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState("");
  const [succes, setSucces] = useState("");

  const inscrire = async (e) => {
    e.preventDefault();

    setErreur("");
    setSucces("");

    // Vérification côté frontend
    if (motdepasse !== confirmationMotdepasse) {
      setErreur("Les mots de passe ne correspondent pas.");
      return;
    }

    if (motdepasse.length < 8) {
      setErreur(
        "Le mot de passe doit contenir au moins 8 caractères."
      );
      return;
    }

    try {
      setChargement(true);

      /*
       * IMPORTANT :
       * Les noms des champs correspondent exactement
       * à ceux attendus par InscriptionClientSerializer
       */
      const response = await api.post(
        "/auth/inscription/",
        {
          nom: nom.trim(),
          prenom: prenom.trim(),
          email: email.trim(),
          telephone: telephone.trim(),
          adresse: adresse.trim(),
          motdepasse: motdepasse,
          confirmation_motdepasse: confirmationMotdepasse,
        }
      );

      console.log("Inscription réussie :", response.data);

      setSucces(
        "Compte client créé avec succès ! Vous allez être redirigé vers la connexion."
      );

      // Redirection vers la connexion
      setTimeout(() => {
        router.push("/connexion");
      }, 1500);

    } catch (error) {
      console.error(
        "Erreur lors de l'inscription :",
        error
      );

      if (error.response) {
        console.error(
          "Réponse Django :",
          error.response.data
        );

        const data = error.response.data;

        /*
         * Django peut retourner différentes structures
         * d'erreur selon le champ concerné.
         */

        if (data.detail) {
          setErreur(
            Array.isArray(data.detail)
              ? data.detail[0]
              : data.detail
          );
        } else if (data.email) {
          setErreur(
            Array.isArray(data.email)
              ? data.email[0]
              : data.email
          );
        } else if (data.nom) {
          setErreur(
            Array.isArray(data.nom)
              ? data.nom[0]
              : data.nom
          );
        } else if (data.prenom) {
          setErreur(
            Array.isArray(data.prenom)
              ? data.prenom[0]
              : data.prenom
          );
        } else if (data.telephone) {
          setErreur(
            Array.isArray(data.telephone)
              ? data.telephone[0]
              : data.telephone
          );
        } else if (data.adresse) {
          setErreur(
            Array.isArray(data.adresse)
            ? data.adresse[0]
            : data.adresse
          );
        }
        
        else if (data.motdepasse) {
          setErreur(
            Array.isArray(data.motdepasse)
              ? data.motdepasse[0]
              : data.motdepasse
          );
        } else if (data.confirmation_motdepasse) {
          setErreur(
            Array.isArray(data.confirmation_motdepasse)
              ? data.confirmation_motdepasse[0]
              : data.confirmation_motdepasse
          );
        } else if (typeof data === "object" && Object.keys(data).length > 0) {
          const premierChamp = Object.keys(data)[0];
          const message = data[premierChamp];

          setErreur(
            Array.isArray(message)
              ? message[0]
              : String(message)
          );
        } else {
          setErreur(
            "Impossible de créer le compte. Vérifiez les informations saisies."
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

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-6">

      <div className="w-full max-w-lg">

        {/* LOGO */}
        <div className="text-center mb-8">

          <Link href="/" className="inline-block">
            <h1 className="text-3xl font-bold text-blue-700">
              MediDispositif
            </h1>
          </Link>

          <p className="text-gray-500 mt-2">
            Vente de dispositifs médicaux
          </p>

        </div>

        {/* FORMULAIRE */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">

          {/* TITRE */}
          <div className="text-center mb-8">

            <div className="w-16 h-16 bg-blue-100 rounded-full mx-auto flex items-center justify-center text-3xl">
              👤
            </div>

            <h2 className="text-3xl font-bold text-gray-900 mt-5">
              Créer un compte
            </h2>

            <p className="text-gray-500 mt-2">
              Inscrivez-vous pour commander vos dispositifs médicaux.
            </p>

          </div>

          {/* ERREUR */}
          {erreur && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
              {erreur}
            </div>
          )}

          {/* SUCCÈS */}
          {succes && (
            <div className="mb-6 bg-green-50 border border-green-200 text-green-700 rounded-lg p-4">
              {succes}
            </div>
          )}

          <form onSubmit={inscrire} className="space-y-5">

            {/* PRÉNOM + NOM */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prénom
                </label>

                <input
                  type="text"
                  value={prenom}
                  onChange={(e) => setPrenom(e.target.value)}
                  required
                  placeholder="Ex : Aliou"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom
                </label>

                <input
                  type="text"
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  required
                  placeholder="Ex : Fall"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

            </div>

            {/* EMAIL */}
            <div>

              <label className="block text-sm font-medium text-gray-700 mb-2">
                Adresse email
              </label>

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Ex : client@gmail.com"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />

            </div>

            {/* TELEPHONE */}
            <div>

              <label className="block text-sm font-medium text-gray-700 mb-2">
                Téléphone
              </label>

              <input
                type="tel"
                value={telephone}
                onChange={(e) => setTelephone(e.target.value)}
                placeholder="Ex : 77 123 45 67"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />

            </div>

            {/* ADRESSE */}
            <div>

              <label className="block text-sm font-medium text-gray-700 mb-2">
                Adresse de livraison
              </label>

              <textarea
                value={adresse}
                onChange={(e) => setAdresse(e.target.value)}
                required
                rows={3}
                placeholder="Ex : Parcelles Assainies, Unité 15, Dakar"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              />

              <p className="text-xs text-gray-500 mt-1">
                Cette adresse sera utilisée pour la livraison de vos commandes.
              </p>

            </div>

            {/* MOT DE PASSE */}
            <div>

              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mot de passe
              </label>

              <input
                type="password"
                value={motdepasse}
                onChange={(e) => setMotdepasse(e.target.value)}
                required
                minLength={8}
                placeholder="Minimum 8 caractères"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />

            </div>

            {/* CONFIRMATION */}
            <div>

              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirmer le mot de passe
              </label>

              <input
                type="password"
                value={confirmationMotdepasse}
                onChange={(e) =>
                  setConfirmationMotdepasse(e.target.value)
                }
                required
                minLength={8}
                placeholder="Répétez votre mot de passe"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />

            </div>

            {/* BOUTON */}
            <button
              type="submit"
              disabled={chargement}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {chargement
                ? "Création du compte..."
                : "Créer mon compte"}
            </button>

          </form>

          {/* CONNEXION */}
          <div className="border-t border-gray-200 mt-7 pt-6 text-center">

            <p className="text-gray-500 text-sm">
              Vous avez déjà un compte ?
            </p>

            <Link
              href="/connexion"
              className="inline-block mt-2 text-blue-600 font-semibold hover:text-blue-800"
            >
              Se connecter
            </Link>

          </div>

        </div>

        {/* RETOUR */}
        <div className="text-center mt-6">

          <Link
            href="/"
            className="text-gray-500 hover:text-blue-600 text-sm"
          >
            ← Retour à l'accueil
          </Link>

        </div>

      </div>

    </main>
  );
}