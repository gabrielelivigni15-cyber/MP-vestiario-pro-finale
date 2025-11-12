import React, { useEffect, useState } from "react";
import Dashboard from "./pages/Dashboard.jsx";
import Articoli from "./pages/Articoli.jsx";
import Personale from "./pages/Personale.jsx";
import Assegna from "./pages/Assegna.jsx";
import Storico from "./pages/Storico.jsx";
import Scanner from "./pages/Scanner.jsx"; // ✅ Ripristinato

const routes = ["dashboard", "articoli", "personale", "assegna", "storico", "scanner"];

export default function App() {
  const [route, setRoute] = useState("dashboard");

  useEffect(() => {
    const stored = localStorage.getItem("mpv_route");
    if (stored && routes.includes(stored)) setRoute(stored);
  }, []);

  useEffect(() => {
    localStorage.setItem("mpv_route", route);
  }, [route]);

  return (
    <div>
      <div className="topbar">
        <div className="brand">
          <img src="/medipower-logo.png" alt="Medipower" />
          <div>
            <div style={{ fontWeight: 700 }}>MP Vestiario Pro</div>
            <div className="muted" style={{ fontSize: 12 }}>
              Our energy, Your Power
            </div>
          </div>
        </div>
        <span className="badge">Live dashboard</span>
      </div>

      <div className="layout">
        <aside className="sidebar">
          <div className="nav">
            <a className={route === "dashboard" ? "active" : ""} href="#dashboard" onClick={(e) => {e.preventDefault();setRoute("dashboard")}}>Dashboard</a>
            <a className={route === "articoli" ? "active" : ""} href="#articoli" onClick={(e) => {e.preventDefault();setRoute("articoli")}}>Articoli</a>
            <a className={route === "personale" ? "active" : ""} href="#personale" onClick={(e) => {e.preventDefault();setRoute("personale")}}>Personale</a>
            <a className={route === "assegna" ? "active" : ""} href="#assegna" onClick={(e) => {e.preventDefault();setRoute("assegna")}}>Assegna</a>
            <a className={route === "storico" ? "active" : ""} href="#storico" onClick={(e) => {e.preventDefault();setRoute("storico")}}>Storico</a>
            <a className={route === "scanner" ? "active" : ""} href="#scanner" onClick={(e) => {e.preventDefault();setRoute("scanner")}}>Scanner</a>
          </div>
          <div className="muted" style={{ position: "sticky", bottom: 8, display: "block", marginTop: 24 }}>
            MP Vestiario © Medipower
          </div>
        </aside>

        <main className="content">
          {route === "dashboard" && <Dashboard />}
          {route === "articoli" && <Articoli />}
          {route === "personale" && <Personale />}
          {route === "assegna" && <Assegna />}
          {route === "storico" && <Storico />}
          {route === "scanner" && <Scanner />}
        </main>
      </div>
    </div>
  );
}
