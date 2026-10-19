"use client";

import Sidebar from "./Sidebar";

export default function GestionnaireStockLayout({
  utilisateur,
  children,
}) {
  return (
    <main className="min-h-screen bg-[#f4f8fc]">

      {/* SIDEBAR PERMANENT */}
      <Sidebar utilisateur={utilisateur} />

      {/* CONTENU PRINCIPAL */}
      <div className="ml-64 min-h-screen">
        {children}
      </div>

    </main>
  );
}