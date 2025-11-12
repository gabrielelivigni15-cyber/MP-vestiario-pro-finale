import React, { useEffect, useState } from "react";
import Dashboard from "./pages/Dashboard.jsx";
import Articoli from "./pages/Articoli.jsx";
import Personale from "./pages/Personale.jsx";
import Assegna from "./pages/Assegna.jsx";
import Storico from "./pages/Storico.jsx";
import Scanner from "./pages/Scanner.jsx";

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
            {routes.map((r) => (
              <a
                key={r}
                className={route === r ? "active" : ""}
                href={`#${r}`}
                onClick={(e) => {
                  e.preventDefault();
                  setRoute(r);
                }}
              >
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </a>
            ))}
          </div>
          <div className="muted" style={{ position: "sticky", bottom: 8, marginTop: 24 }}>
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
