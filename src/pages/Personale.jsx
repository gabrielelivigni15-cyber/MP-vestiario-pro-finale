import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase.js";

export default function Personale() {
  const [rows, setRows] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    nome: "",
    qualifica: "",
    tshirt: "",
    pantaloni: "",
    gilet: "",
    note: "",
    attivo: true,
    prezzo_unitari: ""
  });

  // 🔁 Carica tutti i dipendenti
  async function load() {
    const { data, error } = await supabase
      .from("personale")
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

  // 🔥 Realtime MGX
  useEffect(() => {
    const ch = supabase
      .channel("public:personale")
      .on("postgres_changes", { event: "*", schema: "public" }, load)
      .subscribe();

    return () => supabase.removeChannel(ch);
  }, []);

  // ➕ Aggiungi / Modifica
  async function onSubmit(e) {
    e.preventDefault();

    const payload = {
      nome: form.nome?.trim() || "",
      qualifica: form.qualifica?.trim() || "",
      tshirt: form.tshirt?.trim() || "",
      pantaloni: form.pantaloni?.trim() || "",
      gilet: form.gilet?.trim() || "",
      note: form.note?.trim() || "",
      attivo: form.attivo,
      prezzo_unitari: form.prezzo_unitari ? parseFloat(form.prezzo_unitari) : null
    };

    if (editingId) {
      const { error } = await supabase.from("personale").update(payload).eq("id", editingId);
      if (error) {
        alert(error.message);
        return;
      }
      setEditingId(null);
    } else {
      const { error } = await supabase.from("personale").insert([payload]);
      if (error) {
        alert(error.message);
        return;
      }
    }

    setForm({
      nome: "",
      qualifica: "",
      tshirt: "",
      pantaloni: "",
      gilet: "",
      note: "",
      attivo: true,
      prezzo_unitari: ""
    });
    await load();
  }

  // ✏️ Modifica
  function editRow(r) {
    setEditingId(r.id);
    setForm({
      nome: r.nome || "",
      qualifica: r.qualifica || "",
      tshirt: r.tshirt || "",
      pantaloni: r.pantaloni || "",
      gilet: r.gilet || "",
      note: r.note || "",
      attivo: r.attivo ?? true,
      prezzo_unitari: r.prezzo_unitari ?? ""
    });
  }

  // ❌ Elimina
  async function removeRow(id) {
    if (!confirm("Eliminare questo dipendente?")) return;
    const { error } = await supabase.from("personale").delete().eq("id", id);
    if (error) {
      alert(error.message);
      return;
    }
    await load();
  }

  return (
    <div className="container">
      <div className="card">
        <h3>Gestione personale</h3>

        <form
          onSubmit={onSubmit}
          style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}
        >
          <input
            required
            placeholder="Nome"
            value={form.nome}
            onChange={(e) => setForm({ ...form, nome: e.target.value })}
          />
          <input
            placeholder="Qualifica"
            value={form.qualifica}
            onChange={(e) => setForm({ ...form, qualifica: e.target.value })}
          />
          <input
            placeholder="Taglia T-shirt/Polo"
            value={form.tshirt}
            onChange={(e) => setForm({ ...form, tshirt: e.target.value })}
          />
          <input
            placeholder="Taglia pantaloni"
            value={form.pantaloni}
            onChange={(e) => setForm({ ...form, pantaloni: e.target.value })}
          />
          <input
            placeholder="Taglia gilet/giubbotto"
            value={form.gilet}
            onChange={(e) => setForm({ ...form, gilet: e.target.value })}
          />
          <input
            placeholder="Note"
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
          />
          <input
            type="number"
            placeholder="Prezzo unitario (€)"
            value={form.prezzo_unitari}
            onChange={(e) => setForm({ ...form, prezzo_unitari: e.target.value })}
          />
          <label style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <input
              type="checkbox"
              checked={form.attivo}
              onChange={(e) => setForm({ ...form, attivo: e.target.checked })}
            />
            Attivo
          </label>
          <div style={{ gridColumn: "1/-1", textAlign: "right" }}>
            <button className="btn">
              {editingId ? "💾 Salva modifiche" : "➕ Aggiungi"}
            </button>
          </div>
        </form>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h3>Elenco personale</h3>
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nome</th>
              <th>Qualifica</th>
              <th>T-shirt</th>
              <th>Pantaloni</th>
              <th>Gilet</th>
              <th>Note</th>
              <th>Attivo</th>
              <th>Prezzo (€)</th>
              <th>Azioni</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.id}</td>
                <td>{r.nome}</td>
                <td>{r.qualifica}</td>
                <td>{r.tshirt}</td>
                <td>{r.pantaloni}</td>
                <td>{r.gilet}</td>
                <td>{r.note}</td>
                <td>{r.attivo ? "✅" : "❌"}</td>
                <td>{r.prezzo_unitari ? `${r.prezzo_unitari} €` : "-"}</td>
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
                <td colSpan="10" style={{ textAlign: "center", padding: 12, color: "#6b7280" }}>
                  Nessun dipendente presente
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
