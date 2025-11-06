import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'

export default function Assegna() {
  const [articoli, setArticoli] = useState([])
  const [persone, setPersone] = useState([])
  const [storico, setStorico] = useState([])
  const [form, setForm] = useState({ id_persona: '', id_articolo: '', prezzo_unitario: '', quantita: 1 })

  // Carica dati iniziali
  async function load() {
    const { data: a } = await supabase.from('articoli').select('*').order('nome')
    const { data: p } = await supabase.from('personale').select('*').order('nome')
    const { data: s } = await supabase.from('assegnazioni').select('*').order('id', { ascending: false })
    setArticoli(a || [])
    setPersone(p || [])
    setStorico(s || [])
  }

  useEffect(() => { load() }, [])

  // Realtime aggiornamenti automatici
  useEffect(() => {
    const ch = supabase
      .channel('rt_ass')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'assegnazioni' }, load)
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [])

  // Creazione assegnazione
  async function creaAssegnazione(e) {
    e.preventDefault()
    const art = articoli.find(a => String(a.id) === String(form.id_articolo))
    if (!art) {
      alert('⚠️ Seleziona articolo')
      return
    }
    if ((art.quantita || 0) < Number(form.quantita)) {
      alert('❌ Scorta insufficiente per questo articolo')
      return
    }

    const payload = {
      id_persona: Number(form.id_persona),
      id_articolo: Number(form.id_articolo),
      quantita: Number(form.quantita),
      prezzo_unitario: Number(form.prezzo_unitario || 0),
      data_consegna: new Date().toISOString().split('T')[0]
    }

    const { error } = await supabase.from('assegnazioni').insert(payload)
    if (error) {
      alert(error.message)
      return
    }

    // Riduci scorta automatica
    const { error: updErr } = await supabase.rpc('decrementa_scorta', { 
      p_articolo_id: Number(form.id_articolo), 
      p_qta: Number(form.quantita)
    })
    if (updErr) {
      await supabase
        .from('articoli')
        .update({ quantita: (art.quantita || 0) - Number(form.quantita) })
        .eq('id', art.id)
    }

    setForm({ id_persona: '', id_articolo: '', prezzo_unitario: '', quantita: 1 })
  }

  // Elimina assegnazione
  async function eliminaAssegnazione(row) {
    if (!confirm('Eliminare assegnazione?')) return
    const { error } = await supabase.from('assegnazioni').delete().eq('id', row.id)
    if (error) {
      alert(error.message)
      return
    }
    const art = articoli.find(a => a.id === row.id_articolo)
    if (art)
      await supabase
        .from('articoli')
        .update({ quantita: (art.quantita || 0) + (row.quantita || 1) })
        .eq('id', art.id)
  }

  return (
    <div className="container">
      <div className="card">
        <h3>Nuova assegnazione</h3>
        <form
          onSubmit={creaAssegnazione}
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr 0.5fr auto',
            gap: 8
          }}
        >
          <select
            required
            value={form.id_persona}
            onChange={e => setForm({ ...form, id_persona: e.target.value })}
          >
            <option value="">Seleziona persona…</option>
            {persone.map(p => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </select>

          <select
            required
            value={form.id_articolo}
            onChange={e => setForm({ ...form, id_articolo: e.target.value })}
          >
            <option value="">Seleziona articolo…</option>
            {articoli.map(a => (
              <option key={a.id} value={a.id}>
                {a.nome} (Q.tà {a.quantita})
              </option>
            ))}
          </select>

          <input
            type="number"
            min="1"
            placeholder="Quantità"
            value={form.quantita}
            onChange={e => setForm({ ...form, quantita: e.target.value })}
          />

          <input
            placeholder="Prezzo unitario (facoltativo)"
            type="number"
            step="0.01"
            value={form.prezzo_unitario}
            onChange={e => setForm({ ...form, prezzo_unitario: e.target.value })}
          />

          <button className="btn">Assegna</button>
        </form>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h3>Assegnazioni recenti</h3>
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Persona</th>
              <th>Articolo</th>
              <th>Quantità</th>
              <th>Data</th>
              <th>Prezzo</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {storico.map(r => {
              const p = persone.find(x => x.id === r.id_persona)
              const a = articoli.find(x => x.id === r.id_articolo)
              return (
                <tr key={r.id}>
                  <td>{r.id}</td>
                  <td>{p?.nome || r.id_persona}</td>
                  <td>{a?.nome || r.id_articolo}</td>
                  <td>{r.quantita}</td>
                  <td>{r.data_consegna}</td>
                  <td>
                    {r.prezzo_unitario
                      ? '€ ' + Number(r.prezzo_unitario).toLocaleString('it-IT')
                      : '-'}
                  </td>
                  <td>
                    <button
                      className="btn secondary"
                      onClick={() => eliminaAssegnazione(r)}
                    >
                      Elimina
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
