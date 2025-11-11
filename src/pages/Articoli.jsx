import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase.js";

export default function Articoli() {
  const [rows, setRows] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    nome: "",
    prezzo: "",
    stagione: "Estiva",
  });

  // 🔁 Carica tutti gli articoli
  async function load() {
    const { data, error } = await supabase
      .from("articoli")
      .select("*")
      .order("id", { ascending: true });
    if (error) {
      console.error(error);
      return;
    }
    setRows(data || []);
  }

  useEffect(() => {
    load();
  }, []);

  // 🔥 Realtime per aggiornamento automatico
  useEffect(() => {
    const ch = supabase
      .channel("public:articoli")
      .on("postgres_changes", { event: "*", schema: "public" }, load)
      .subscribe();

    return () => supabase.removeChannel(ch);
  }, []);

  // ➕ Aggiungi o modifica articolo
  async function onSubmit(e) {
    e.preventDefault();

    const payload = {
      nome: form.nome?.trim() || "",
      prezzo: form.prezzo || "",
      stagione: form.stagione,
    };

    if (editingId) {
      const { error } = await supabase.from("articoli").update(payload).eq("id", editingId);
      if (error) {
        alert(error.message);
        return;
      }
      setEditingId(null);
    } else {
      const { error } = await supabase.from("articoli").insert([payload]);
      if (error) {
        alert(error.message);
        return;
      }
    }

    setForm({ nome: "", prezzo: "", stagione: "Estiva" });
    await load();
  }

  // ✏️ Modifica
  function editRow(r) {
    setEditingId(r.id);
    setForm({
      nome: r.nome || "",
      prezzo: r.prezzo || "",
      stagione: r.stagione || "Estiva",
    });
  }

  // ❌ Elimina
  async function removeRow(id) {
    if (!confirm("Eliminare questo articolo?")) return;
    const { error } = await supabase.from("articoli").delete().eq("id", id);
    if (error) {
      alert(error.message);
      return;
    }
    await load();
  }

  return (
    <div className="container">
      <div className="card">
        <h3>Gestione articoli</h3>

        <form
          onSubmit={onSubmit}
          style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}
        >
          <input
            required
            placeholder="Nome articolo"
            value={form.nome}
            onChange={(e) => setForm({ ...form, nome: e.target.value })}
          />
          <input
            placeholder="Prezzo"
            type="number"
            value={form.prezzo}
            onChange={(e) => setForm({ ...form, prezzo: e.target.value })}
          />
          <select
            value={form.stagione}
            onChange={(e) => setForm({ ...form, stagione: e.target.value })}
          >
            <option value="Estiva">Estiva</option>
            <option value="Invernale">Invernale</option>
          </select>

          <div style={{ gridColumn: "1/-1", textAlign: "right" }}>
            <button className="btn">
              {editingId ? "💾 Salva modifiche" : "➕ Aggiungi"}
            </button>
          </div>
        </form>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h3>Elenco articoli</h3>
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nome</th>
              <th>Prezzo</th>
              <th>Stagione</th>
              <th>Azioni</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.id}</td>
                <td>{r.nome}</td>
                <td>{r.prezzo ? `${r.prezzo} €` : "-"}</td>
                <td>{r.stagione}</td>
                <td>
                  <button className="btn secondary" onClick={() => editRow(r)}>
                    ✏️ Modifica
                  </button>{" "}
                  <button className="btn secondary" onClick={() => removeRow(r.id)}>
                    ❌ Elimina
                  </button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan="5" style={{ textAlign: "center", padding: 12, color: "#6b7280" }}>
                  Nessun articolo presente
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
