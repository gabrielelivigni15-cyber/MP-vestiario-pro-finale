import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase.js";

function Assegna() {
  const [gruppi, setGruppi] = useState([]);
  const [articoli, setArticoli] = useState([]);
  const [persone, setPersone] = useState([]);
  const [storico, setStorico] = useState([]);
  const [log, setLog] = useState([]);
  const [stagione, setStagione] = useState("");

  const [form, setForm] = useState({
    id_persona: "",
    gruppo: "",
    id_articolo: "",
    quantita: 1,
  });

  // 🔁 Carica dati principali
  async function load() {
    const { data: a } = await supabase.from("articoli").select("*").order("nome");
    const { data: p } = await supabase.from("personale").select("*").order("nome");
    const { data: s } = await supabase
      .from("assegnazioni")
      .select("*")
      .order("id", { ascending: false });

    // 🔹 Filtra stagionale
    let articoliFiltrati = a || [];
    if (stagione) articoliFiltrati = articoliFiltrati.filter((x) => x.stagione === stagione);

    // 🔹 Gruppi unici
    const gruppiUnici = [...new Set(articoliFiltrati.map((x) => x.gruppo).filter(Boolean))];

    setArticoli(articoliFiltrati);
    setGruppi(gruppiUnici);
    setPersone(p || []);
    setStorico(s || []);
  }

  useEffect(() => {
    load();
  }, [stagione]);

  // 🧮 Assegna articolo
  async function assegna(e) {
    e.preventDefault();

    if (!form.id_persona || !form.id_articolo)
      return alert("Seleziona persona e variante");
    if (form.quantita <= 0) return alert("Quantità non valida");

    const articolo = articoli.find((a) => a.id === parseInt(form.id_articolo));
    if (!articolo) return alert("Variante non trovata");
    if (articolo.quantita < form.quantita)
      return alert(`Quantità insufficiente. Disponibili: ${articolo.quantita}`);

    const nuovaQuantita = articolo.quantita - form.quantita;

    const payload = {
      id_persona: parseInt(form.id_persona),
      id_articolo: parseInt(form.id_articolo),
      prezzo_unitario: articolo.prezzo_unitario || 0,
      quantita: parseInt(form.quantita),
      data_consegna: new Date().toISOString().split("T")[0],
    };

    const { error: insertError } = await supabase.from("assegnazioni").insert([payload]);
    if (insertError) return alert(insertError.message);

    const { error: updateError } = await supabase
      .from("articoli")
      .update({ quantita: nuovaQuantita })
      .eq("id", articolo.id);
    if (updateError) return alert(updateError.message);

    // 🧾 Log azione
    const persona = persone.find((p) => p.id == form.id_persona);
    aggiungiLog(
      "ASSEGNAZIONE",
      persona?.nome || "-",
      articolo.nome,
      form.quantita
    );

    setForm({ id_persona: "", gruppo: "", id_articolo: "", quantita: 1 });
    await load();
  }

  // ❌ Annulla assegnazione (fix quantità + log)
  async function annullaAssegnazione(assegnazione) {
    if (
      !confirm(
        `Vuoi annullare l’assegnazione #${assegnazione.id}? Verrà ripristinata la quantità.`
      )
    )
      return;

    // 🔹 Recupera quantità aggiornata direttamente dal DB
    const { data: articoloData, error: readErr } = await supabase
      .from("articoli")
      .select("id, nome, quantita")
      .eq("id", assegnazione.id_articolo)
      .single();

    if (readErr || !articoloData)
      return alert("Errore nel recupero quantità attuale dell'articolo.");

    const nuovaQuantita =
      (articoloData.quantita || 0) + (assegnazione.quantita || 0);

    const { error: updateError } = await supabase
      .from("articoli")
      .update({ quantita: nuovaQuantita })
      .eq("id", assegnazione.id_articolo);
    if (updateError) return alert(updateError.message);

    const { error: deleteError } = await supabase
      .from("assegnazioni")
      .delete()
      .eq("id", assegnazione.id);
    if (deleteError) return alert(deleteError.message);

    // 🧾 Log azione
    const persona = persone.find((p) => p.id === assegnazione.id_persona);
    aggiungiLog(
      "ANNULLAMENTO",
      persona?.nome || "-",
      articoloData.nome,
      assegnazione.quantita
    );

    await load();
    alert("Assegnazione annullata ✅");
  }

  // 🪵 Funzione log interno
  function aggiungiLog(tipo, persona, articolo, quantita) {
    const entry = {
      id: Date.now(),
      tipo,
      persona,
      articolo,
      quantita,
      data: new Date().toLocaleString("it-IT"),
    };
    setLog((prev) => [entry, ...prev].slice(0, 10)); // tieni solo le ultime 10
  }

  // 🔽 Varianti del gruppo selezionato
  const varianti = articoli.filter((a) => a.gruppo === form.gruppo);
  const articoloSelezionato = articoli.find(
    (a) => a.id === parseInt(form.id_articolo)
  );

  return (
    <div className="container">
      {/* --- CARD ASSEGNAZIONE --- */}
      <div className="card">
        <h3>Gestione Assegnazioni Vestiario</h3>

        {/* FILTRO STAGIONE */}
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontWeight: "500", marginRight: 8 }}>
            Filtra per stagione:
          </label>
          <select
            value={stagione}
            onChange={(e) => setStagione(e.target.value)}
            style={{ padding: 6, borderRadius: 6, border: "1px solid #ccc" }}
          >
            <option value="">Tutte</option>
            <option value="Estiva">Estiva</option>
            <option value="Invernale">Invernale</option>
          </select>
        </div>

        {/* FORM ASSEGNA */}
        <form
          onSubmit={assegna}
          style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}
        >
          <select
            required
            value={form.id_persona}
            onChange={(e) => setForm({ ...form, id_persona: e.target.value })}
          >
            <option value="">Seleziona persona</option>
            {persone.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </select>

          {/* SELEZIONE GRUPPO */}
          <select
            required
            value={form.gruppo}
            onChange={(e) =>
              setForm({ ...form, gruppo: e.target.value, id_articolo: "" })
            }
          >
            <option value="">Seleziona gruppo</option>
            {gruppi.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>

          {/* SELEZIONE VARIANTE */}
          <select
            required
            value={form.id_articolo}
            onChange={(e) => setForm({ ...form, id_articolo: e.target.value })}
            disabled={!form.gruppo}
          >
            <option value="">Seleziona variante (taglia)</option>
            {varianti.map((v) => (
              <option key={v.id} value={v.id}>
                {v.nome} – {v.taglia || "-"} ({v.quantita} disp.)
              </option>
            ))}
          </select>

          <input
            type="number"
            placeholder="Quantità"
            min="1"
            value={form.quantita}
            onChange={(e) => setForm({ ...form, quantita: e.target.value })}
          />

          <div style={{ gridColumn: "1/-1", textAlign: "right" }}>
            <button className="btn">➕ Assegna</button>
          </div>
        </form>

        {/* MOSTRA INFO VARIANTE SELEZIONATA */}
        {articoloSelezionato && (
          <div
            style={{
              marginTop: 12,
              display: "flex",
              alignItems: "center",
              gap: 12,
              background: "#f9fafb",
              borderRadius: 8,
              padding: 10,
              border: "1px solid #ddd",
            }}
          >
            {articoloSelezionato.foto_url && (
              <img
                src={articoloSelezionato.foto_url}
                alt="foto"
                style={{
                  width: 70,
                  height: 70,
                  objectFit: "cover",
                  borderRadius: 6,
                  border: "1px solid #ccc",
                }}
              />
            )}
            <div>
              <b>{articoloSelezionato.nome}</b> ({articoloSelezionato.taglia})
              <div>Disponibili: {articoloSelezionato.quantita}</div>
              <div>Prezzo: {articoloSelezionato.prezzo_unitario} €</div>
            </div>
          </div>
        )}
      </div>

      {/* --- CARD STORICO --- */}
      <div className="card" style={{ marginTop: 16 }}>
        <h3>Storico Assegnazioni</h3>
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Data</th>
              <th>Persona</th>
              <th>Articolo</th>
              <th>Taglia</th>
              <th>Gruppo</th>
              <th>Quantità</th>
              <th>Prezzo</th>
              <th>Totale</th>
              <th>Azioni</th>
            </tr>
          </thead>
          <tbody>
            {storico.map((r) => {
              const persona = persone.find((p) => p.id === r.id_persona);
              const articolo = articoli.find((a) => a.id === r.id_articolo);
              return (
                <tr key={r.id}>
                  <td>{r.id}</td>
                  <td>{r.data_consegna || "-"}</td>
                  <td>{persona?.nome || "-"}</td>
                  <td>{articolo?.nome || "-"}</td>
                  <td>{articolo?.taglia || "-"}</td>
                  <td>{articolo?.gruppo || "-"}</td>
                  <td>{r.quantita}</td>
                  <td>
                    {r.prezzo_unitario
                      ? `${parseFloat(r.prezzo_unitario).toFixed(2)} €`
                      : "-"}
                  </td>
                  <td>
                    {r.prezzo_unitario && r.quantita
                      ? `${(parseFloat(r.prezzo_unitario) * r.quantita).toFixed(2)} €`
                      : "-"}
                  </td>
                  <td>
                    <button
                      className="btn secondary"
                      onClick={() => annullaAssegnazione(r)}
                    >
                      ❌ Annulla
                    </button>
                  </td>
                </tr>
              );
            })}
            {storico.length === 0 && (
              <tr>
                <td colSpan="10" style={{ textAlign: "center", padding: 12, color: "#6b7280" }}>
                  Nessuna assegnazione registrata
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* --- MINI LOG --- */}
      <div className="card" style={{ marginTop: 16 }}>
        <h3>Log movimentazioni (ultime 10)</h3>
        <table className="table">
          <thead>
            <tr>
              <th>Data</th>
              <th>Tipo</th>
              <th>Persona</th>
              <th>Articolo</th>
              <th>Quantità</th>
            </tr>
          </thead>
          <tbody>
            {log.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: "center", color: "#6b7280" }}>
                  Nessuna movimentazione recente
                </td>
              </tr>
            ) : (
              log.map((l) => (
                <tr key={l.id}>
                  <td>{l.data}</td>
                  <td
                    style={{
                      color: l.tipo === "ASSEGNAZIONE" ? "green" : "red",
                      fontWeight: "bold",
                    }}
                  >
                    {l.tipo}
                  </td>
                  <td>{l.persona}</td>
                  <td>{l.articolo}</td>
                  <td>{l.quantita}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Assegna;
