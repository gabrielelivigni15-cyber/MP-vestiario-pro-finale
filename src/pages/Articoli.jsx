import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { Pencil, X, Plus } from 'lucide-react'

export default function Articoli() {
  const [articoli, setArticoli] = useState([])
  const [form, setForm] = useState({ nome: '', prezzo: '', stagione: 'Estiva' })
  const [editing, setEditing] = useState(null)
  const [filtroStagione, setFiltroStagione] = useState('')
  const [ordinamento, setOrdinamento] = useState('nome')

  async function load() {
    let query = supabase.from('articoli').select('*')
    if (filtroStagione) query = query.eq('stagione', filtroStagione)
    query = query.order(ordinamento, { ascending: true })
    const { data, error } = await query
    if (error) console.error(error)
    else setArticoli(data || [])
  }

  useEffect(() => {
    load()
  }, [filtroStagione, ordinamento])

  async function salvaArticolo() {
    if (!form.nome) return alert('Inserisci il nome del capo')
    if (editing) {
      await supabase.from('articoli').update(form).eq('id', editing)
      setEditing(null)
    } else {
      await supabase.from('articoli').insert([form])
    }
    setForm({ nome: '', prezzo: '', stagione: 'Estiva' })
    load()
  }

  async function elimina(id) {
    if (!window.confirm('Sei sicuro di voler eliminare questo articolo?')) return
    await supabase.from('articoli').delete().eq('id', id)
    load()
  }

  async function modifica(articolo) {
    setEditing(articolo.id)
    setForm({
      nome: articolo.nome,
      prezzo: articolo.prezzo || '',
      stagione: articolo.stagione || 'Estiva',
    })
  }

  return (
    <div className="p-6 space-y-6">
      {/* --- CARD GESTIONE ARTICOLI --- */}
      <div className="bg-white border rounded-xl p-5 shadow-sm">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">Gestione articoli</h3>

        {/* --- FORM --- */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <input
            type="text"
            placeholder="Nome articolo"
            className="border rounded-lg px-3 py-2 flex-1 min-w-[150px]"
            value={form.nome}
            onChange={(e) => setForm({ ...form, nome: e.target.value })}
          />

          <input
            type="number"
            placeholder="Prezzo"
            className="border rounded-lg px-3 py-2 w-40"
            value={form.prezzo}
            onChange={(e) => setForm({ ...form, prezzo: e.target.value })}
          />

          <select
            value={form.stagione}
            onChange={(e) => setForm({ ...form, stagione: e.target.value })}
            className="border rounded-lg px-3 py-2"
          >
            <option value="Estiva">Estiva</option>
            <option value="Invernale">Invernale</option>
          </select>

          <button
            onClick={salvaArticolo}
            className="flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white font-medium px-4 py-2 rounded-lg shadow-sm"
          >
            <Plus size={16} />
            {editing ? 'Aggiorna' : 'Aggiungi'}
          </button>

          {editing && (
            <button
              onClick={() => {
                setEditing(null)
                setForm({ nome: '', prezzo: '', stagione: 'Estiva' })
              }}
              className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded-lg shadow-sm"
            >
              Annulla
            </button>
          )}
        </div>

        {/* --- FILTRI --- */}
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <label className="font-semibold text-sm">Filtra per stagione:</label>
            <select
              value={filtroStagione}
              onChange={(e) => setFiltroStagione(e.target.value)}
              className="border rounded-lg px-3 py-1.5"
            >
              <option value="">Tutte</option>
              <option value="Estiva">Estiva</option>
              <option value="Invernale">Invernale</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="font-semibold text-sm">Ordina per:</label>
            <select
              value={ordinamento}
              onChange={(e) => setOrdinamento(e.target.value)}
              className="border rounded-lg px-3 py-1.5"
            >
              <option value="nome">Nome</option>
              <option value="stagione">Stagione</option>
              <option value="prezzo">Prezzo</option>
              <option value="id">ID</option>
            </select>
          </div>
        </div>
      </div>

      {/* --- CARD ELENCO ARTICOLI --- */}
      <div className="bg-white border rounded-xl p-5 shadow-sm">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">Elenco articoli</h3>

        <div className="overflow-x-auto">
          <table className="min-w-full border text-sm text-gray-800">
            <thead className="bg-gray-100">
              <tr>
                <th className="border px-3 py-2">ID</th>
                <th className="border px-3 py-2 text-left">Nome</th>
                <th className="border px-3 py-2">Prezzo</th>
                <th className="border px-3 py-2">Stagione</th>
                <th className="border px-3 py-2 text-center">Azioni</th>
              </tr>
            </thead>
            <tbody>
              {articoli.map((a) => (
                <tr key={a.id}>
                  <td className="border px-3 py-2 text-center">{a.id}</td>
                  <td className="border px-3 py-2">{a.nome}</td>
                  <td className="border px-3 py-2 text-right">
                    {a.prezzo ? `${a.prezzo} €` : '-'}
                  </td>
                  <td className="border px-3 py-2 text-center">{a.stagione}</td>
                  <td className="border px-3 py-2 text-center">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => modifica(a)}
                        className="flex items-center gap-1 bg-yellow-400 hover:bg-yellow-500 text-white px-3 py-1 rounded-md text-sm font-medium"
                      >
                        <Pencil size={15} />
                        Modifica
                      </button>
                      <button
                        onClick={() => elimina(a.id)}
                        className="flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md text-sm font-medium"
                      >
                        <X size={15} />
                        Elimina
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {articoli.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center text-gray-500 py-4">
                    Nessun articolo disponibile
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {articoli.length > 0 && (
          <div className="mt-4 text-sm text-gray-600">
            Totale articoli: <strong>{articoli.length}</strong> (
            {articoli.filter((a) => a.stagione === 'Estiva').length} estivi /{' '}
            {articoli.filter((a) => a.stagione === 'Invernale').length} invernali)
          </div>
        )}
      </div>
    </div>
  )
}
