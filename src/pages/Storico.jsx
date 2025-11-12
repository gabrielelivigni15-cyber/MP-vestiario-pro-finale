import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase.js";

export default function Storico() {
  const [storico, setStorico] = useState([]);

  useEffect(() => {
    fetchStorico();

    // 🔁 Realtime aggiornamento automatico
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

  // 📦 Caricamento storico con relazioni complete
  async function fetchStorico() {
    const { data, error } = await supabase
      .from("assegnazioni")
      .select(`
        id,
        quantita,
        data_consegna,
        personale ( nome ),
        articoli ( nome, gruppo, taglia, prezzo_unitario, foto_url )
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
              <th>Foto</th>
              <th>Quantità</th>
              <th>Data consegna</th>
              <th>Valore totale</th>
            </tr>
          </thead>
          <tbody>
            {storico.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ textAlign: "center", padding: 12 }}>
                  Nessuna assegnazione registrata
                </td>
              </tr>
            ) : (
              storico.map((s) => {
                const prezzo = parseFloat(s.articoli?.prezzo_unitario) || 0;
                const qty = parseInt(s.quantita) || 0;
                const totale = (prezzo * qty).toFixed(2);

                return (
                  <tr key={s.id}>
                    <td>{s.id}</td>
                    <td>{s.personale?.nome || "-"}</td>
                    <td>{s.articoli?.nome || "-"}</td>
                    <td>{s.articoli?.gruppo || "-"}</td>
                    <td>{s.articoli?.taglia || "-"}</td>
                    <td style={{ textAlign: "center" }}>
                      {s.articoli?.foto_url ? (
                        <img
                          src={s.articoli.foto_url}
                          alt={s.articoli.nome}
                          style={{
                            width: 45,
                            height: 45,
                            objectFit: "cover",
                            borderRadius: 6,
                            border: "1px solid #ccc",
                          }}
                          onClick={() =>
                            window.open(s.articoli.foto_url, "_blank")
                          }
                        />
                      ) : (
                        "-"
                      )}
                    </td>
                    <td>{qty}</td>
                    <td>
                      {s.data_consegna
                        ? new Date(s.data_consegna).toLocaleDateString("it-IT")
                        : "-"}
                    </td>
                    <td>€ {totale}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
