import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase.js";

export default function Personale() {
  const [rows, setRows] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    nome: "",
    reparto: "",
    qualifica: "",
    taglia_tshirt: "",
    taglia_pantaloni: "",
    taglia_gilet: ""
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

  // 🔥 Realtime come MGX
  useEffect(() => {
    const ch = supabase
      .channel("public:personale")
      .on("postgres_changes", { event: "*", schema: "public" }, load)
      .subscribe();

    return () => supabase.removeChannel(ch);
  }, []);

  // ➕ Aggiungi / Salva modifiche
  async function onSubmit(e) {
    e.preventDefault();

    const payload = {
      nome: form.nome?.trim() || "",
      reparto: form.reparto?.trim() || "",
      qualifica: form.qualifica?.trim() || "",
      taglia_tshirt: form.taglia_tshirt?.trim() || "",
      taglia_pantaloni: form.taglia_pantaloni?.trim() || "",
      taglia_gilet: form.taglia_gilet?.trim() || ""
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

    // reset + reload
    setForm({
      nome: "",
      reparto: "",
      qualifica: "",
      taglia_tshirt: "",
      taglia_pantaloni: "",
      taglia_gilet: ""
    });
    await load();
  }

  // ✏️ Modifica riga
  function editRow(r) {
    setEditingId(r.id);
    setForm({
      nome: r.nome || "",
      reparto: r.reparto || "",
      qualifica: r.qualifica || "",
      taglia_tshirt: r.taglia_tshirt || "",
      taglia_pantaloni: r.taglia_pantaloni || "",
      taglia_gilet: r.taglia_gilet || ""
    });
  }

  // ❌ Elimina riga
  async function removeRow(id) {
    if (!confirm("Eliminare questo dipendente?")) return;
    const { error } = await supabase.from("personale").delete().eq("id", id);
    if (error) {
      alert(error.message);
      return;
    }
    await load();
    if (editingId === id) {
      setEditingId(null);
      setForm({
        nome: "",
        reparto: "",
        qualifica: "",
        taglia_tshirt: "",
        taglia_pantaloni: "",
        taglia_gilet: ""
      });
    }
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
            placeholder="Nome dipendente"
            value={form.nome}
            onChange={(e) => setForm({ ...form, nome: e.target.value })}
          />
          <input
            placeholder="Reparto"
            value={form.reparto}
            onChange={(e) => setForm({ ...form, reparto: e.target.value })}
          />
          <input
            placeholder="Qualifica"
            value={form.qualifica}
            onChange={(e) => setForm({ ...form, qualifica: e.target.value })}
          />
          <input
            placeholder="Taglia T-shirt/Polo"
            value={form.taglia_tshirt}
            onChange={(e) => setForm({ ...form, taglia_tshirt: e.target.value })}
          />
          <input
            placeholder="Taglia pantaloni"
            value={form.taglia_pantaloni}
            onChange={(e) => setForm({ ...form, taglia_pantaloni: e.target.value })}
          />
          <input
            placeholder="Taglia gilet/giubbotto"
            value={form.taglia_gilet}
            onChange={(e) => setForm({ ...form, taglia_gilet: e.target.value })}
          />
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
              <th>Reparto</th>
              <th>Qualifica</th>
              <th>T-shirt/Polo</th>
              <th>Pantaloni</th>
              <th>Gilet/Giubbotto</th>
              <th>Azioni</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.id}</td>
                <td>{r.nome}</td>
                <td>{r.reparto}</td>
                <td>{r.qualifica}</td>
                <td>{r.taglia_tshirt}</td>
                <td>{r.taglia_pantaloni}</td>
                <td>{r.taglia_gilet}</td>
                <td>
                  <button
                    type="button"
                    className="btn secondary"
                    onClick={() => editRow(r)}
                  >
                    ✏️ Modifica
                  </button>{" "}
                  <button
                    type="button"
                    className="btn secondary"
                    onClick={() => removeRow(r.id)}
                  >
                    ❌ Elimina
                  </button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan="8" style={{ textAlign: "center", padding: 12, color: "#6b7280" }}>
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
