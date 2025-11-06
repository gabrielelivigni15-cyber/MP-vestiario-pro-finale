import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase.js';

export default function Articoli() {
  const [rows, setRows] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    nome: '',
    tipo: 'T-shirt/Polo',
    taglia: '',
    fornitore: '',
    codice_fornitore: '',
    quantita: 0,
    valore: 0,
    foto_url: ''
  });

  // Carica i dati
  async function load() {
    const { data, error } = await supabase
      .from('articoli')
      .select('*')
      .order('id', { ascending: true });
    if (error) console.error(error);
    setRows(data || []);
  }

  useEffect(() => {
    load();
  }, []);

  // Realtime MGX-style
  useEffect(() => {
    const ch = supabase
      .channel('public:articoli')
      .on('postgres_changes', { event: '*', schema: 'public' }, load)
      .subscribe();

    return () => supabase.removeChannel(ch);
  }, []);

  // Aggiungi o modifica
  async function add(e) {
    e.preventDefault();

    const payload = {
      ...form,
      quantita: Number(form.quantita || 0),
      valore: Number(form.valore || 0)
    };

    if (editingId) {
      await supabase.from('articoli').update(payload).eq('id', editingId);
      setEditingId(null);
    } else {
      await supabase.from('articoli').insert([payload]);
    }

    setForm({
      nome: '',
      tipo: 'T-shirt/Polo',
      taglia: '',
      fornitore: '',
      codice_fornitore: '',
      quantita: 0,
      valore: 0,
      foto_url: ''
    });
  }

  // Modifica / Elimina
  function editRow(row) {
    setEditingId(row.id);
    setForm(row);
  }

  async function remove(id) {
    if (confirm('Vuoi eliminare questo articolo?')) {
      await supabase.from('articoli').delete().eq('id', id);
    }
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-[#333] p-6">
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
        <h1 className="text-2xl font-bold text-[#B30E0E] mb-6">
          👕 Gestione articoli
        </h1>

        {/* FORM */}
        <form
          onSubmit={add}
          className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-8"
        >
          <input
            required
            placeholder="Nome capo"
            value={form.nome}
            onChange={e => setForm({ ...form, nome: e.target.value })}
            className="border p-2 rounded-lg shadow-sm focus:ring-2 focus:ring-[#B30E0E] outline-none"
          />
          <select
            value={form.tipo}
            onChange={e => setForm({ ...form, tipo: e.target.value })}
            className="border p-2 rounded-lg shadow-sm focus:ring-2 focus:ring-[#B30E0E] outline-none"
          >
            <option>T-shirt/Polo</option>
            <option>Felpa</option>
            <option>Giaccone</option>
            <option>Pantaloni</option>
            <option>Scarpe</option>
            <option>Gilet</option>
          </select>
          <input
            placeholder="Taglia"
            value={form.taglia}
            onChange={e => setForm({ ...form, taglia: e.target.value })}
            className="border p-2 rounded-lg shadow-sm focus:ring-2 focus:ring-[#B30E0E] outline-none"
          />
          <input
            placeholder="Fornitore"
            value={form.fornitore}
            onChange={e => setForm({ ...form, fornitore: e.target.value })}
            className="border p-2 rounded-lg shadow-sm focus:ring-2 focus:ring-[#B30E0E] outline-none"
          />
          <input
            placeholder="Codice fornitore"
            value={form.codice_fornitore}
            onChange={e => setForm({ ...form, codice_fornitore: e.target.value })}
            className="border p-2 rounded-lg shadow-sm focus:ring-2 focus:ring-[#B30E0E] outline-none"
          />
          <input
            placeholder="Quantità"
            type="number"
            value={form.quantita}
            onChange={e => setForm({ ...form, quantita: e.target.value })}
            className="border p-2 rounded-lg shadow-sm focus:ring-2 focus:ring-[#B30E0E] outline-none"
          />
          <input
            placeholder="Valore €"
            type="number"
            step="0.01"
            value={form.valore}
            onChange={e => setForm({ ...form, valore: e.target.value })}
            className="border p-2 rounded-lg shadow-sm focus:ring-2 focus:ring-[#B30E0E] outline-none"
          />
          <input
            placeholder="URL foto"
            value={form.foto_url}
            onChange={e => setForm({ ...form, foto_url: e.target.value })}
            className="border p-2 rounded-lg shadow-sm focus:ring-2 focus:ring-[#B30E0E] outline-none"
          />

          <button
            className="col-span-full bg-[#B30E0E] hover:bg-[#8b0c0c] text-white font-semibold py-2 px-4 rounded-lg shadow transition"
          >
            {editingId ? '💾 Salva modifiche' : '➕ Aggiungi articolo'}
          </button>
        </form>

        {/* TABELLA */}
        <div className="overflow-x-auto bg-white rounded-xl border border-gray-200 shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-[#B30E0E] text-white text-center">
              <tr>
                <th className="p-3">ID</th>
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
              {rows.map(r => (
                <tr key={r.id} className="border-t hover:bg-[#f9f9f9] text-center">
                  <td className="p-2">{r.id}</td>
                  <td className="p-2">
                    {r.foto_url ? (
                      <img
                        src={r.foto_url}
                        alt="foto"
                        className="h-12 w-auto mx-auto rounded-md shadow-sm"
                      />
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td>{r.nome}</td>
                  <td>{r.tipo}</td>
                  <td>{r.taglia}</td>
                  <td>{r.quantita}</td>
                  <td>€ {(r.valore || 0).toLocaleString('it-IT')}</td>
                  <td>
                    <button
                      onClick={() => editRow(r)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded mr-2"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => remove(r.id)}
                      className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded"
                    >
                      ❌
                    </button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan="8" className="text-center p-6 text-gray-500">
                    Nessun articolo presente
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
