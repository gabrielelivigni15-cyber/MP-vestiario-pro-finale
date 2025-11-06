import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase.js";

export default function Assegna() {
  const [personale, setPersonale] = useState([]);
  const [articoli, setArticoli] = useState([]);
  const [assegnazioni, setAssegnazioni] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    id_persona: "",
    id_articolo: "",
    quantita: 1,
  });

  useEffect(() => {
    loadData();

    // 🔁 Realtime
    const ch = supabase
      .channel("public:assegnazioni")
      .on("postgres_changes", { event: "*", schema: "public" }, loadData)
      .subscribe();

    return () => supabase.removeChannel(ch);
  }, []);

  async function loadData() {
    const [pers, art, assegn] = await Promise.all([
      supabase.from("personale").select("*").eq("attivo", true).order("id"),
      supabase.from("articoli").select("*").order("id"),
      supabase
        .from("assegnazioni")
        .select("*, personale(nome), articoli(nome_capo)")
        .order("id", { ascending: false }),
    ]);

    if (!pers.error) setPersonale(pers.data || []);
    if (!art.error) setArticoli(art.data || []);
    if (!assegn.error) setAssegnazioni(assegn.data || []);
  }

  // ➕ CREA o ✏️ MODIFICA
  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.id_persona || !form.id_articolo) {
      alert("Seleziona sia persona che articolo.");
      return;
    }

    const articolo = articoli.find((a) => a.id === Number(form.id_articolo));

    if (!articolo) {
      alert("Articolo non trovato.");
      return;
    }

    if (!editingId && articolo.quantita < form.quantita) {
      alert("Quantità non disponibile!");
      return;
    }

    if (editingId) {
      // Trova la vecchia assegnazione
      const old = assegnazioni.find((a) => a.id === editingId);
      const diff = form.quantita - (old?.quantita || 0);
      const newQty = articolo.quantita - diff;

      if (newQty < 0) {
        alert("Quantità non sufficiente in magazzino!");
        return;
      }

      const { error: updateErr } = await supabase
        .from("assegnazioni")
        .update({
          id_persona: Number(form.id_persona),
          id_articolo: Number(form.id_articolo),
          quantita: form.quantita,
        })
        .eq("id", editingId);

      if (updateErr) {
        alert(updateErr.message);
        return;
      }

      // Aggiorna magazzino
      await supabase
        .from("articoli")
        .update({ quantita: newQty })
        .eq("id", articolo.id);

      setEditingId(null);
    } else {
      // Inserisci nuova assegnazione
      const { error: insertErr } = await supabase.from("assegnazioni").insert([
        {
          id_persona: Number(form.id_persona),
          id_articolo: Number(form.id_articolo),
          quantita: form.quantita,
          data_consegna: new Date().toISOString().split("T")[0],
        },
      ]);

      if (insertErr) {
        alert(insertErr.message);
        return;
      }

      // Scala quantità dal magazzino
      await supabase
        .from("articoli")
        .update({ quantita: articolo.quantita - form.quantita })
        .eq("id", articolo.id);
    }

    setForm({ id_persona: "", id_articolo: "", quantita: 1 });
    loadData();
  }

  // ✏️ MODIFICA
  function editRow(a) {
    setEditingId(a.id);
    setForm({
      id_persona: a.id_persona,
      id_articolo: a.id_articolo,
      quantita: a.quantita || 1,
    });
  }

  // ❌ ELIMINA
  async function removeRow(a) {
    if (!confirm("Eliminare questa assegnazione?")) return;

    const articolo = articoli.find((x) => x.id === a.id_articolo);
    if (articolo) {
      await supabase
        .from("articoli")
        .update({ quantita: articolo.quantita + (a.quantita || 1) })
        .eq("id", articolo.id);
    }

    await supabase.from("assegnazioni").delete().eq("id", a.id);
    loadData();
  }

  return (
    <div className="container">
      <div className="card">
        <h3>Gestione Assegnazioni</h3>

        <form
          onSubmit={handleSubmit}
          style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}
        >
          <select
            required
            value={form.id_persona}
            onChange={(e) => setForm({ ...form, id_persona: e.target.value })}
          >
            <option value="">Seleziona personale</option>
            {personale.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome} ({p.qualifica || "—"})
              </option>
            ))}
          </select>

          <select
            required
            value={form.id_articolo}
            onChange={(e) => setForm({ ...form, id_articolo: e.target.value })}
          >
            <option value="">Seleziona articolo</option>
            {articoli.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nome_capo} — {a.quantita} disponibili
              </option>
            ))}
          </select>

          <input
            type="number"
            min="1"
            placeholder="Quantità"
            value={form.quantita}
            onChange={(e) =>
              setForm({ ...form, quantita: Number(e.target.value) })
            }
          />

          <div style={{ textAlign: "right" }}>
            <button className="btn">
              {editingId ? "💾 Salva modifiche" : "➕ Assegna"}
            </button>
          </div>
        </form>
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <h3>Storico Assegnazioni</h3>

        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Dipendente</th>
              <th>Articolo</th>
              <th>Quantità</th>
              <th>Data consegna</th>
              <th>Azioni</th>
            </tr>
          </thead>
          <tbody>
            {assegnazioni.map((a) => (
              <tr key={a.id}>
                <td>{a.id}</td>
                <td>{a.personale?.nome || "-"}</td>
                <td>{a.articoli?.nome_capo || "-"}</td>
                <td>{a.quantita || 1}</td>
                <td>{a.data_consegna}</td>
                <td>
                  <button className="btn secondary" onClick={() => editRow(a)}>
                    ✏️
                  </button>{" "}
                  <button className="btn secondary" onClick={() => removeRow(a)}>
                    ❌
                  </button>
                </td>
              </tr>
            ))}
            {assegnazioni.length === 0 && (
              <tr>
                <td colSpan="6" style={{ textAlign: "center", padding: 12, color: "#6b7280" }}>
                  Nessuna assegnazione presente
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
