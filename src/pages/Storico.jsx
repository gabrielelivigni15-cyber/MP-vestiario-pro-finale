import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'

export default function Storico(){
  const [rows,setRows]=useState([])

  async function load(){ const {data}=await supabase.from('assegnazioni').select('*').order('id',{ascending:false}); setRows(data||[]) }
  useEffect(()=>{load()},[])
  useEffect(()=>{
    const ch = supabase.channel('rt_storico').on('postgres_changes',{event:'*',schema:'public',table:'assegnazioni'},load).subscribe()
    return ()=>supabase.removeChannel(ch)
  },[])

  return (
    <div className="container">
      <div className="card">
        <h3>Storico assegnazioni</h3>
        <table className="table">
          <thead><tr><th>ID</th><th>Persona</th><th>Articolo</th><th>Data</th><th>Prezzo</th></tr></thead>
          <tbody>
            {rows.map(r=> (
              <tr key={r.id}>
                <td>{r.id}</td><td>{r.id_persona}</td><td>{r.id_articolo}</td>
                <td>{r.data_consegna}</td><td>{r.prezzo_unitario? '€ '+Number(r.prezzo_unitario).toLocaleString('it-IT'):'-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
