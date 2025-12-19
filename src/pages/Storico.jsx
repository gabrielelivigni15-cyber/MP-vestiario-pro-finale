import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase.js";

export default function Storico() {
  const [storico, setStorico] = useState([]);
  const [persone, setPersone] = useState([]);
  const [selectedPersonaId, setSelectedPersonaId] = useState("");

  useEffect(() => {
    fetchStorico();
    fetchPersone();

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

  async function fetchPersone() {
    const { data, error } = await supabase
      .from("personale")
      .select("id,nome")
      .order("nome", { ascending: true });
    if (error) {
      console.error("Errore nel caricamento personale:", error.message);
      return;
    }
    setPersone(data || []);
  }

  // 📦 Caricamento storico con relazioni complete
  async function fetchStorico() {
    const { data, error } = await supabase
      .from("assegnazioni")
      .select(`
        id,
        quantita,
        data_consegna,
        personale ( id, nome ),
        articoli ( nome, gruppo, taglia, prezzo_unitario, foto_url )
      `)
      .order("id", { ascending: false });

    if (error) {
      console.error("Errore nel caricamento dello storico:", error.message);
      return;
    }

    setStorico(data || []);
  }

  const storicoFiltrato = selectedPersonaId
    ? storico.filter((s) => String(s.personale?.id) === String(selectedPersonaId))
    : storico;

  // Resoconto per persona: aggrega quantità per articolo
  const riepilogoPerPersona = React.useMemo(() => {
    if (!selectedPersonaId) return [];
    const map = new Map();
    for (const r of storicoFiltrato) {
      const nome = r.articoli?.nome || "-";
      const gruppo = r.articoli?.gruppo || "-";
      const key = `${nome}__${gruppo}`;
      const prev = map.get(key) || { nome, gruppo, quantita: 0 };
      prev.quantita += parseInt(r.quantita) || 0;
      map.set(key, prev);
    }
    return Array.from(map.values()).sort((a, b) => b.quantita - a.quantita);
  }, [selectedPersonaId, storicoFiltrato]);

  return (
    <div className="container">
      <div className="card">
        <h3>Resoconto vestiario per persona</h3>

        <div className="row" style={{ marginTop: 10 }}>
          <label style={{ fontWeight: 600, whiteSpace: "nowrap" }}>Seleziona persona:</label>
          <select
            value={selectedPersonaId}
            onChange={(e) => setSelectedPersonaId(e.target.value)}
            style={{ minWidth: 260, flex: 1 }}
          >
            <option value="">Tutte (nessun filtro)</option>
            {persone.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </select>

          {selectedPersonaId && (
            <button className="btn secondary" onClick={() => setSelectedPersonaId("")}
              title="Rimuovi filtro">
              ✖️ Reset
            </button>
          )}
        </div>

        {selectedPersonaId ? (
          <div style={{ marginTop: 12 }}>
            <div className="muted" style={{ marginBottom: 8 }}>
              Riepilogo articoli prelevati (somma quantità su tutto lo storico)
            </div>

            {riepilogoPerPersona.length === 0 ? (
              <div className="muted">Nessun prelievo registrato per questa persona.</div>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Articolo</th>
                    <th>Gruppo</th>
                    <th>Quantità totale</th>
                  </tr>
                </thead>
                <tbody>
                  {riepilogoPerPersona.map((r) => (
                    <tr key={`${r.nome}-${r.gruppo}`}>
                      <td style={{ fontWeight: 600 }}>{r.nome}</td>
                      <td>{r.gruppo}</td>
                      <td>{r.quantita}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ) : (
          <div className="muted" style={{ marginTop: 10 }}>
            Seleziona una persona per vedere il riepilogo (es: "Gabriele Li Vigni preso giubotto n, maglietta n").
          </div>
        )}
      </div>

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
              storicoFiltrato.map((s) => {
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
