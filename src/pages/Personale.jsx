import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'

export default function Personale(){
  const [rows,setRows]=useState([])
  const [form,setForm]=useState({nome:'',qualifica:'',taglia_tshirt:'',taglia_pantaloni:'',taglia_giubbotto:''})

  async function load(){ const {data}=await supabase.from('personale').select('*').order('id',{ascending:true}); setRows(data||[]) }
  useEffect(()=>{load()},[])
  useEffect(()=>{
    const ch = supabase.channel('rt_personale').on('postgres_changes',{event:'*',schema:'public',table:'personale'},load).subscribe()
    return ()=>supabase.removeChannel(ch)
  },[])

  async function add(e){
    e.preventDefault()
    const {error}=await supabase.from('personale').insert(form)
    if(error) alert(error.message); else setForm({nome:'',qualifica:'',taglia_tshirt:'',taglia_pantaloni:'',taglia_giubbotto:''})
  }
  async function remove(id){ if(confirm('Eliminare persona?')){ const {error}=await supabase.from('personale').delete().eq('id',id); if(error) alert(error.message)}}

  return (
    <div className="container">
      <div className="card">
        <h3>Nuovo personale</h3>
        <form onSubmit={add} style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:8}}>
          <input required placeholder="Nome" value={form.nome} onChange={e=>setForm({...form,nome:e.target.value})}/>
          <input placeholder="Qualifica" value={form.qualifica} onChange={e=>setForm({...form,qualifica:e.target.value})}/>
          <input placeholder="Taglia T-shirt" value={form.taglia_tshirt} onChange={e=>setForm({...form,taglia_tshirt:e.target.value})}/>
          <input placeholder="Taglia Pantaloni" value={form.taglia_pantaloni} onChange={e=>setForm({...form,taglia_pantaloni:e.target.value})}/>
          <input placeholder="Taglia Giubbotto" value={form.taglia_giubbotto} onChange={e=>setForm({...form,taglia_giubbotto:e.target.value})}/>
          <div style={{gridColumn:'1/-1',textAlign:'right'}}><button className="btn">Aggiungi</button></div>
        </form>
      </div>

      <div className="card" style={{marginTop:16}}>
        <h3>Personale</h3>
        <table className="table">
          <thead><tr><th>ID</th><th>Nome</th><th>Qualifica</th><th>Azioni</th></tr></thead>
          <tbody>
            {rows.map(r=> (
              <tr key={r.id}>
                <td>{r.id}</td><td>{r.nome}</td><td>{r.qualifica}</td>
                <td><button className="btn secondary" onClick={()=>remove(r.id)}>Elimina</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
