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

  async function load() {
    const { data } = await supabase.from('articoli').select('*').order('id', { ascending: true });
    setRows(data || []);
  }

  useEffect(() => { load(); }, []);
  useEffect(() => {
    const ch = supabase
      .channel('rt_articoli')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'articoli' }, load)
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, []);

  async function add(e) {
    e.preventDefault();
    if (editingId) {
      const { error } = await supabase.from('articoli').update(form).eq('id', editingId);
      if (error) alert(error.message);
      else setEditingId(null);
    } else {
      const payload = {
        ...form,
        quantita: Number(form.quantita || 0),
        valore: Number(form.valore || 0)
      };
      const { error } = await supabase.from('articoli').insert(payload);
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

  function editRow(row) {
    setEditingId(row.id);
    setForm(row);
  }

  async function remove(id) {
    if (confirm('Eliminare articolo?')) {
      const { error } = await supabase.from('articoli').delete().eq('id', id);
      if (error) alert(error.message);
    }
  }

  return (
    <div className="container">
      <div className="card">
        <h3>Gestione articoli</h3>
        <form onSubmit={add} style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
          <input required placeholder="Nome capo" value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} />
          <select value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })}>
            <option>T-shirt/Polo</option>
            <option>Felpa</option>
            <option>Giaccone</option>
            <option>Pantaloni</option>
            <option>Scarpe</option>
          </select>
          <input placeholder="Taglia" value={form.taglia} onChange={e => setForm({ ...form, taglia: e.target.value })} />
          <input placeholder="Fornitore" value={form.fornitore} onChange={e => setForm({ ...form, fornitore: e.target.value })} />
          <input placeholder="Codice fornitore" value={form.codice_fornitore} onChange={e => setForm({ ...form, codice_fornitore: e.target.value })} />
          <input placeholder="Quantità" type="number" value={form.quantita} onChange={e => setForm({ ...form, quantita: e.target.value })} />
          <input placeholder="Valore unitario €" type="number" step="0.01" value={form.valore} onChange={e => setForm({ ...form, valore: e.target.value })} />
          <input placeholder="URL Foto (opzionale)" value={form.foto_url} onChange={e => setForm({ ...form, foto_url: e.target.value })} />
          <div style={{ gridColumn: '1/-1', textAlign: 'right' }}>
            <button className="btn">{editingId ? '💾 Salva modifiche' : '➕ Aggiungi'}</button>
          </div>
        </form>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h3>Articoli</h3>
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
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
              <tr key={r.id}>
                <td>{r.id}</td>
                <td>
                  {r.foto_url ? (
                    <img src={r.foto_url} alt="foto articolo" style={{ width: 50, borderRadius: 6 }} />
                  ) : (
                    '—'
                  )}
                </td>
                <td>{r.nome}</td>
                <td>{r.tipo}</td>
                <td>{r.taglia}</td>
                <td>{r.quantita}</td>
                <td>€ {(r.valore || 0).toLocaleString('it-IT')}</td>
                <td>
                  <button className="btn secondary" onClick={() => editRow(r)}>
                    ✏️
                  </button>{' '}
                  <button className="btn secondary" onClick={() => remove(r.id)}>
                    ❌
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
