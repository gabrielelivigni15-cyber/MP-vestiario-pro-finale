import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase.js";

export default function Storico() {
  const [storico, setStorico] = useState([]);

  useEffect(() => {
    fetchStorico();

    // 🔁 Realtime su assegnazioni
    const ch = supabase
      .channel("storico-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "assegnazioni" },
        () => fetchStorico()
      )
      .subscribe();

    return () => supabase.removeChannel(ch);
  }, []);

  // 📦 Carica storico con relazioni
  async function fetchStorico() {
    const { data, error } = await supabase
      .from("assegnazioni")
      .select(`
        id,
        quantita,
        data_consegna,
        personale ( nome ),
        articoli ( nome, taglia, gruppo, prezzo_unitario )
      `)
      .order("id", { ascending: false });

    if (error) {
      console.error("Errore nel caricamento dello storico:", error.message);
      return;
    }

    setStorico(data || []);
  }

  return (
    <div className="container">
      <div className="card">
        <h3>Storico Assegnazioni</h3>

        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Dipendente</th>
              <th>Articolo</th>
              <th>Gruppo</th>
              <th>Taglia</th>
              <th>Quantità</th>
              <th>Data consegna</th>
              <th>Valore totale</th>
            </tr>
          </thead>
          <tbody>
            {storico.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: "center", padding: 12 }}>
                  Nessuna assegnazione registrata
                </td>
              </tr>
            ) : (
              storico.map((s) => (
                <tr key={s.id}>
                  <td>{s.id}</td>
                  <td>{s.personale?.nome || "-"}</td>
                  <td>{s.articoli?.nome || "-"}</td>
                  <td>{s.articoli?.gruppo || "-"}</td>
                  <td>{s.articoli?.taglia || "-"}</td>
                  <td>{s.quantita || 0}</td>
                  <td>
                    {s.data_consegna
                      ? new Date(s.data_consegna).toLocaleDateString("it-IT")
                      : "-"}
                  </td>
                  <td>
                    €
                    {s.articoli?.prezzo_unitario && s.quantita
                      ? (s.articoli.prezzo_unitario * s.quantita).toFixed(2)
                      : "0.00"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
