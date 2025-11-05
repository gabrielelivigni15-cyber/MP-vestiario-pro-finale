import React, { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid } from 'recharts'
import { saveAs } from 'file-saver'
import * as XLSX from 'xlsx'

export default function Dashboard(){
  const [articoli,setArticoli]=useState([])
  const [personale,setPersonale]=useState([])
  const [assegnazioni,setAssegnazioni]=useState([])

  async function fetchAll(){
    const {data:a}=await supabase.from('articoli').select('*')
    const {data:p}=await supabase.from('personale').select('*')
    const {data:s}=await supabase.from('assegnazioni').select('*')
    setArticoli(a||[]); setPersonale(p||[]); setAssegnazioni(s||[])
  }
  useEffect(()=>{ fetchAll() },[])

  useEffect(()=>{
    const channel = supabase.channel('realtime_vestiario')
    .on('postgres_changes',{event:'*',schema:'public',table:'articoli'},fetchAll)
    .on('postgres_changes',{event:'*',schema:'public',table:'personale'},fetchAll)
    .on('postgres_changes',{event:'*',schema:'public',table:'assegnazioni'},fetchAll)
    .subscribe()
    return ()=>{ supabase.removeChannel(channel) }
  },[])

  const articoliTotali = articoli.length
  const personaleTotale = personale.length
  const scorteCritiche = articoli.filter(a=> (a.quantita??0) <= 5).length
  const valoreTotale = articoli.reduce((acc,a)=>acc + (a.valore||0)*(a.quantita||0),0)

  const quantitaPerTipo = useMemo(()=>{
    const map={}
    articoli.forEach(a=> map[a.tipo] = (map[a.tipo]||0) + (a.quantita||0))
    return Object.entries(map).map(([tipo,quantita])=>({tipo,quantita}))
  },[articoli])

  const assegnazioniCount = useMemo(()=>{
    const map={}
    assegnazioni.forEach(x=> map[x.nome_capo || x.id_articolo] = (map[x.nome_capo || x.id_articolo]||0)+1)
    return Object.entries(map).map(([name,value])=>({name,value}))
  },[assegnazioni])

  const trendMensile = useMemo(()=>{
    const map={}
    assegnazioni.forEach(x=>{
      const d = x.data_consegna ? new Date(x.data_consegna) : new Date()
      const key = d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')
      map[key]=(map[key]||0)+1
    })
    return Object.entries(map).sort().map(([m,tot])=>({mese:m, tot}))
  },[assegnazioni])

  const COLORS = ['#b30e0e','#e83c3c','#8b8b8b','#ff6961','#9d0d0d']

  function downloadExcel(){
    const ws = XLSX.utils.json_to_sheet(articoli)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Inventario')
    const buf = XLSX.write(wb,{bookType:'xlsx', type:'array'})
    saveAs(new Blob([buf],{type:'application/octet-stream'}),'inventario_medipower.xlsx')
  }

  return (
    <div className="container">
      <div className="grid">
        <Stat title="Articoli totali" value={articoliTotali} desc="Tutte le tipologie presenti"/>
        <Stat title="Personale" value={personaleTotale} desc="Dipendenti censiti"/>
        <Stat title="Da riordinare" value={scorteCritiche} desc="Scorta ≤ 5"/>
      </div>

      <div className="grid" style={{marginTop:16}}>
        <div className="card">
          <h3>Quantità per tipo</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={quantitaPerTipo}>
              <XAxis dataKey="tipo"/><YAxis/><Tooltip/>
              <Bar dataKey="quantita" fill="#b30e0e" radius={[6,6,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <h3>Più assegnati</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={assegnazioniCount} dataKey="value" nameKey="name" outerRadius={90} label>
                {assegnazioniCount.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]} />)}
              </Pie>
              <Tooltip/>
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <h3>Trend consegne (mese)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={trendMensile}>
              <CartesianGrid strokeDasharray="3 3"/>
              <XAxis dataKey="mese"/><YAxis/><Tooltip/>
              <Line type="monotone" dataKey="tot" stroke="#b30e0e" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card" style={{marginTop:16,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div>
          <div style={{fontWeight:600}}>Valore totale magazzino:</div>
          <div className="danger" style={{fontSize:20, fontWeight:800}}>€ {valoreTotale.toLocaleString('it-IT')}</div>
        </div>
        <div>
          <button className="btn" onClick={downloadExcel}>Scarica inventario Excel</button>
        </div>
      </div>

      <div className="card" style={{marginTop:16}}>
        <h3>Suggerimenti automatici</h3>
        {scorteCritiche>0
          ? <div className="danger"><strong>⚠️ Attenzione:</strong> {scorteCritiche} articoli sotto scorta. Valuta un riordino.</div>
          : <div className="muted">✅ Tutto sotto controllo. Nessun articolo sotto scorta.</div>
        }
      </div>
    </div>
  )
}

function Stat({title,value,desc}){
  return (
    <div className="card">
      <div style={{fontWeight:700}}>{title}</div>
      <div style={{fontSize:34,color:'#b30e0e',fontWeight:800}}>{value}</div>
      <div className="muted">{desc}</div>
    </div>
  )
}
