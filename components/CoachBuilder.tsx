'use client'
import { useState } from 'react';
import { X, Plus, Play, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase'

export function CoachBuilder({ user, clients, library, days, setDays, activeDayIdx, setActiveDayIdx, planName, setPlanName, selectedClient, setSelectedClient, goal, setGoal, setToast, setVideoModal, loadData }: any){
  const [search, setSearch] = useState('')
  const exercises = days[activeDayIdx]?.exercises ?? [];
  const setExercises=(updater:any)=>{ setDays((prev:any)=>{ const nd=[...prev]; const cur=nd[activeDayIdx]; if(!cur) return prev; const next=typeof updater==='function'?updater(cur.exercises):updater; nd[activeDayIdx]={...cur,exercises:next}; return nd; }); }
  const addDay=()=>{ const n=days.length+1; setDays([...days,{tempId:'d'+Date.now(),day_number:n,day_name:'DAY '+n,focus:'GLUTEI FOCUS',exercises:[]}]); setActiveDayIdx(days.length); }
  const deleteDay=(idx:number)=>{ if(days.length<=1) return; setDays((prev:any)=>prev.filter((_:any,i:number)=>i!==idx).map((d:any,i:number)=>({...d,day_number:i+1}))); setActiveDayIdx(Math.max(0,idx-1)); }
  const addFromLibrary=(lib:any)=>{ const ne={id:'ex_'+Date.now(),name:lib.name,sets:'4',reps:'12',rest:'90s',notes:'',video_url:lib.video_url||lib.video||''}; setExercises((p:any)=>[...p,ne]); }
  
  const savePlan=async()=>{
    if(!planName.trim()||!selectedClient) return alert('Nome e cliente REAL');
    const { data: plan, error } = await supabase.from('workout_plans').insert({coach_id:user.id,client_id:selectedClient,name:planName,goal_tag:goal}).select().single();
    if(error){ alert(error.message); return; }
    for(const d of days){
      const { data: day } = await supabase.from('workout_days').insert({plan_id:plan.id,day_number:d.day_number,day_name:d.day_name,focus:d.focus}).select().single();
      if(!day) continue;
      for(const ex of d.exercises){ await supabase.from('exercises').insert({day_id:day.id,name:ex.name,sets:ex.sets,reps:ex.reps,rest:ex.rest,video_url:ex.video_url}); }
    }
    setToast('REAL Saved '+days.length+' days'); setTimeout(()=>setToast(null),3000); loadData();
  }

  const filteredLibrary = library.filter((l:any) => l.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="w-full space-y-5 pb-20">
      {/* HEADER - fixed mobile */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <h2 className="serif text- md:text- leading-[0.9] tracking-tight">COACH<br/><span className="text-[#FF4D8D] italic">BUILDER REAL</span></h2>
        <button onClick={savePlan} className="h- px-6 rounded-full bg-[#FF4D8D] text-black font-bold text- tracking-wide shrink-0">SAVE {days.length} DAYS REAL</button>
      </div>

      {/* PLAN META */}
      <div className="bg-[#121212] rounded- border border-white/[0.08] p-4 md:p-5">
        {/* Days - mobile scroll fixed */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-2 -mx-1 px-1">
          {days.map((d:any,i:number)=>(
            <div key={d.tempId || i} className="flex items-center gap-1.5 shrink-0">
              <button onClick={()=>setActiveDayIdx(i)} className={`h- px-4 rounded-full text- font-medium tracking-wide whitespace-nowrap transition ${i===activeDayIdx?'bg-[#FF4D8D] text-black':'bg-[#1E1E1E] border border-white/10 text-white/80 hover:bg-white/10'}`}>{d.day_name}</button>
              <button onClick={()=>deleteDay(i)} className="w-6 h-6 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center shrink-0"><X className="w-3 h-3 text-white/60"/></button>
            </div>
          ))}
          <button onClick={addDay} className="h- px-4 rounded-full bg-white text-black text- font-bold flex items-center gap-1 shrink-0"><Plus className="w-3.5 h-3.5"/> DAY</button>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          <input value={planName} onChange={e=>setPlanName(e.target.value)} placeholder="Nome piano REAL (es. Glutei 4x)" className="h- rounded- bg-[#080808] border border-white/10 px-4 text- focus:outline-none focus:border-white/20 placeholder:text-white/30"/>
          <select value={selectedClient} onChange={e=>setSelectedClient(e.target.value)} className="h- rounded- bg-[#080808] border border-white/10 px-4 text- focus:outline-none focus:border-white/20">
            <option value="">Cliente REAL Supabase</option>
            {clients.map((c:any)=><option key={c.id} value={c.id}>{c.full_name || c.email}</option>)}
          </select>
          <select value={goal} onChange={e=>setGoal(e.target.value)} className="h- rounded- bg-[#080808] border border-white/10 px-4 text- focus:outline-none">
            <option value="glutei">GLUTEI FOCUS</option>
            <option value="gambe">GAMBE</option>
            <option value="spalle">SPALLE</option>
            <option value="full">FULL BODY</option>
          </select>
        </div>
      </div>

      {/* MAIN GRID - mobile stacked */}
      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-5">
        {/* LIBRARY */}
        <div className="bg-[#121212] rounded- border border-white/[0.08] p-4 flex flex-col h- lg:h-">
          <div className="flex items-center justify-between mb-3 shrink-0">
            <h3 className="text- tracking-widest text-white/40 font-medium">LIBRERIA REAL • {library.length}</h3>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Cerca" className="bg-[#080808] border border-white/10 rounded-full px-3 py-1 text- w-20 focus:outline-none"/>
          </div>
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 -mr-1">
            {filteredLibrary.map((lib:any)=>(
              <div key={lib.id} className="flex items-center justify-between bg-[#080808] border border-white/[0.06] hover:border-white/15 rounded- p-3 transition">
                <div className="min-w-0 pr-2">
                  <div className="text- font-medium truncate">{lib.name}</div>
                  <div className="text- text-white/40 uppercase mt-0.5">{lib.muscle_group || lib.category || '—'}</div>
                </div>
                <button onClick={()=>addFromLibrary(lib)} className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center shrink-0 hover:bg-zinc-200 transition"><Plus className="w-4 h-4"/></button>
              </div>
            ))}
          </div>
        </div>

        {/* ACTIVE DAY */}
        <div className="bg-[#121212] rounded- border border-white/[0.08] p-4 md:p-5 min-h-">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text- font-bold tracking-wide">{days[activeDayIdx]?.day_name || 'DAY'} • {exercises.length} ex REAL</h3>
            <span className="text- bg-white text-black px-2.5 py-1 rounded-full font-bold">{exercises.length}</span>
          </div>

          <div className="space-y-3 max-h- overflow-y-auto pr-1">
            {exercises.length===0 && (
              <div className="py-16 text-center border border-dashed border-white/10 rounded-">
                <p className="text- text-white/40">Nessun esercizio</p>
                <p className="text- text-white/20 mt-1">Aggiungi dalla libreria a sinistra</p>
              </div>
            )}
            {exercises.map((ex:any)=>(
              <div key={ex.id} className="bg-[#080808] border border-white/[0.06] rounded- p-3.5 flex gap-3 items-center">
                <div className="flex-1 min-w-0">
                  <input value={ex.name} onChange={e=>{const nd=[...days]; nd[activeDayIdx].exercises=nd[activeDayIdx].exercises.map((ee:any)=>ee.id===ex.id?{...ee,name:e.target.value}:ee); setDays(nd)}} className="bg-transparent text- font-medium w-full focus:outline-none truncate"/>
                  <div className="flex items-center gap-2 mt-2">
                    <input value={ex.sets} onChange={e=>{const nd=[...days]; nd[activeDayIdx].exercises=nd[activeDayIdx].exercises.map((ee:any)=>ee.id===ex.id?{...ee,sets:e.target.value}:ee); setDays(nd)}} className="w-10 h-6 bg-[#1E1E1E] rounded-full text- text-center focus:outline-none"/> 
                    <span className="text- text-white/30">x</span>
                    <input value={ex.reps} onChange={e=>{const nd=[...days]; nd[activeDayIdx].exercises=nd[activeDayIdx].exercises.map((ee:any)=>ee.id===ex.id?{...ee,reps:e.target.value}:ee); setDays(nd)}} className="w-10 h-6 bg-[#1E1E1E] rounded-full text- text-center focus:outline-none"/>
                    <input value={ex.rest} onChange={e=>{const nd=[...days]; nd[activeDayIdx].exercises=nd[activeDayIdx].exercises.map((ee:any)=>ee.id===ex.id?{...ee,rest:e.target.value}:ee); setDays(nd)}} className="w-12 h-6 bg-[#1E1E1E] rounded-full text- text-center focus:outline-none text-white/60" placeholder="90s"/>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button onClick={()=>setVideoModal(ex)} className="w-8 h-8 rounded-full bg-[#1E1E1E] border border-white/10 flex items-center justify-center hover:bg-white/10"><Play className="w-3 h-3"/></button>
                  <button onClick={()=>{const nd=[...days]; nd[activeDayIdx].exercises=nd[activeDayIdx].exercises.filter((ee:any)=>ee.id!==ex.id); setDays(nd)}} className="w-8 h-8 rounded-full bg-[#1E1E1E] border border-white/10 flex items-center justify-center hover:bg-red-500/20 hover:text-red-400"><Trash2 className="w-3 h-3"/></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}