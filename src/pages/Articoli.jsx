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

  // 🔁 Carica tutti gli articoli
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

  // 🔥 Realtime identico a come funzionava su MGX
  useEffect(() => {
    const ch = supabase
      .channel('public:articoli')
      .on('postgres_changes', { event: '*', schema: 'public' }, load)
      .subscribe();

    return () => supabase.removeChannel(ch);
  }, []);

  // ➕ Inserisci o modifica articolo
  async function add(e) {
    e.preventDefault();

    const payload = {
      ...form,
      quantita: Number(form.quantita || 0),
      valore: Number(form.valore || 0)
    };

    if (editingId) {
      const { error } = await supabase.from('articoli').update(payload).eq('id', editingId);
      if (error) alert(error.message);
      setEditingId(null);
    } else {
      const { error } = await supabase.from('articoli').insert([payload]);
      if (error) alert(error.message);
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

  // ✏️ Modifica riga
  function editRow(row) {
    setEditingId(row.id);
    setForm(row);
  }

  // ❌ Elimina riga
  async function remove(id) {
    if (confirm('Eliminare articolo?')) {
      const { error } = await supabase.from('articoli').delete().eq('id', id);
      if (error) alert(error.message);
    }
  }

  return (
    <div className="container p-6">
      <div className="card bg-white p-4 shadow rounded">
        <h3 className="text-xl font-bold text-[#b30e0e] mb-3">Gestione articoli</h3>

        <form
          onSubmit={add}
          className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-6"
          style={{ alignItems: 'center' }}
        >
          <input
            required
            placeholder="Nome capo"
            value={form.nome}
            onChange={e => setForm({ ...form, nome: e.target.value })}
            className="border p-2 rounded"
          />
          <select
            value={form.tipo}
            onChange={e => setForm({ ...form, tipo: e.target.value })}
            className="border p-2 rounded"
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
            className="border p-2 rounded"
          />
          <input
            placeholder="Fornitore"
            value={form.fornitore}
            onChange={e => setForm({ ...form, fornitore: e.target.value })}
            className="border p-2 rounded"
          />
          <input
            placeholder="Codice fornitore"
            value={form.codice_fornitore}
            onChange={e => setForm({ ...form, codice_fornitore: e.target.value })}
            className="border p-2 rounded"
          />
          <input
            placeholder="Quantità"
            type="number"
            value={form.quantita}
            onChange={e => setForm({ ...form, quantita: e.target.value })}
            className="border p-2 rounded"
          />
          <input
            placeholder="Valore unitario €"
            type="number"
            step="0.01"
            value={form.valore}
            onChange={e => setForm({ ...form, valore: e.target.value })}
            className="border p-2 rounded"
          />
          <input
            placeholder="URL foto (opzionale)"
            value={form.foto_url}
            onChange={e => setForm({ ...form, foto_url: e.target.value })}
            className="border p-2 rounded"
          />
          <button
            className="bg-[#b30e0e] text-white rounded p-2 hover:bg-[#8b0c0c] transition"
            style={{ gridColumn: '1/-1' }}
          >
            {editingId ? '💾 Salva modifiche' : '➕ Aggiungi'}
          </button>
        </form>

        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead className="bg-[#b30e0e] text-white">
              <tr>
                <th className="p-2">ID</th>
                <th>Foto</th>
                <th>Nome</th>
                <th>Tipo</th>
                <th>Taglia</th>
                <th>Quantità</th>
                <th>Valore</th>
                <th>Azioni</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id} className="border-t hover:bg-gray-50">
                  <td className="p-2 text-center">{r.id}</td>
                  <td className="p-2 text-center">
                    {r.foto_url ? (
                      <img
                        src={r.foto_url}
                        alt="foto articolo"
                        style={{ width: 50, borderRadius: 6, margin: '0 auto' }}
                      />
                    ) : (
                      '—'
                    )}
                  </td>
                  <td>{r.nome}</td>
                  <td>{r.tipo}</td>
                  <td>{r.taglia}</td>
                  <td className="text-center">{r.quantita}</td>
                  <td className="text-center">€ {(r.valore || 0).toLocaleString('it-IT')}</td>
                  <td className="text-center space-x-2">
                    <button
                      onClick={() => editRow(r)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => remove(r.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      ❌
                    </button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan="8" className="text-center p-4 text-gray-500">
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
