import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase.js";
import { Pencil, Trash2, Plus } from "lucide-react";

export default function Articoli() {
  const [articoli, setArticoli] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    nome_capo: "",
    tipo: "",
    taglia: "",
    quantita: "",
    fornitore: "",
    valore: "",
    foto_url: ""
  });

  useEffect(() => {
    fetchArticoli();
  }, []);

  async function fetchArticoli() {
    const { data } = await supabase.from("articoli").select("*").order("id");
    setArticoli(data || []);
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (editing) {
      await supabase.from("articoli").update(form).eq("id", editing);
    } else {
      await supabase.from("articoli").insert([form]);
    }

    setEditing(null);
    setForm({
      nome_capo: "",
      tipo: "",
      taglia: "",
      quantita: "",
      fornitore: "",
      valore: "",
      foto_url: ""
    });
    fetchArticoli();
  }

  async function handleEdit(articolo) {
    setEditing(articolo.id);
    setForm(articolo);
  }

  async function handleDelete(id) {
    if (window.confirm("Sei sicuro di voler eliminare questo articolo?")) {
      await supabase.from("articoli").delete().eq("id", id);
      fetchArticoli();
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-[#b30e0e] mb-4">Gestione Articoli</h1>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-7 gap-2 bg-white shadow p-4 rounded-lg mb-6">
        <input className="border p-2 rounded" placeholder="Nome capo" value={form.nome_capo} onChange={(e) => setForm({ ...form, nome_capo: e.target.value })} />
        <input className="border p-2 rounded" placeholder="Tipo" value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })} />
        <input className="border p-2 rounded" placeholder="Taglia" value={form.taglia} onChange={(e) => setForm({ ...form, taglia: e.target.value })} />
        <input type="number" className="border p-2 rounded" placeholder="Quantità" value={form.quantita} onChange={(e) => setForm({ ...form, quantita: e.target.value })} />
        <input className="border p-2 rounded" placeholder="Fornitore" value={form.fornitore} onChange={(e) => setForm({ ...form, fornitore: e.target.value })} />
        <input type="number" className="border p-2 rounded" placeholder="Valore (€)" value={form.valore} onChange={(e) => setForm({ ...form, valore: e.target.value })} />
        <input className="border p-2 rounded" placeholder="URL foto" value={form.foto_url} onChange={(e) => setForm({ ...form, foto_url: e.target.value })} />
        <button type="submit" className="bg-[#b30e0e] text-white rounded p-2 hover:bg-[#8b0c0c] transition">
          {editing ? "💾 Salva" : "➕ Aggiungi"}
        </button>
      </form>

      <table className="w-full bg-white rounded-lg shadow overflow-hidden text-sm">
        <thead className="bg-[#b30e0e] text-white">
          <tr>
            <th className="p-2">ID</th>
            <th>Foto</th>
            <th>Nome</th>
            <th>Tipo</th>
            <th>Taglia</th>
            <th>Q.tà</th>
            <th>Valore</th>
            <th>Azioni</th>
          </tr>
        </thead>
        <tbody>
          {articoli.map((a) => (
            <tr key={a.id} className="border-t hover:bg-gray-50">
              <td className="p-2 text-center">{a.id}</td>
              <td className="p-2 text-center">
                {a.foto_url ? <img src={a.foto_url} alt="" className="h-12 mx-auto rounded" /> : "—"}
              </td>
              <td>{a.nome_capo}</td>
              <td>{a.tipo}</td>
              <td>{a.taglia}</td>
              <td className="text-center">{a.quantita}</td>
              <td className="text-center">€ {a.valore}</td>
              <td className="text-center space-x-2">
                <button onClick={() => handleEdit(a)} className="text-blue-600 hover:text-blue-800"><Pencil size={16} /></button>
                <button onClick={() => handleDelete(a.id)} className="text-red-600 hover:text-red-800"><Trash2 size={16} /></button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
