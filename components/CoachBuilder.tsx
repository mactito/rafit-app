'use client'
import { useState } from 'react';
import { X, Plus, Play, Trash2, Check, GripVertical, Dumbbell } from 'lucide-react';
import { supabase } from '@/lib/supabase'

export function CoachBuilder({ user, clients, library, days, setDays, activeDayIdx, setActiveDayIdx, planName, setPlanName, selectedClient, setSelectedClient, goal, setGoal, setToast, setVideoModal, loadData }: any){
  const exercises = days[activeDayIdx]?.exercises ?? [];
  const setExercises=(updater:any)=>{ setDays((prev:any)=>{ const nd=[...prev]; const cur=nd[activeDayIdx]; if(!cur) return prev; const next=typeof updater==='function'?updater(cur.exercises):updater; nd[activeDayIdx]={...cur,exercises:next}; return nd; }); }
  const addDay=()=>{ const n=days.length+1; setDays([...days,{tempId:'d'+Date.now(),day_number:n,day_name:'DAY '+n+' - EXTRA',focus:'GLUTEI FOCUS',exercises:[]}]); setActiveDayIdx(days.length); }
  const deleteDay=(idx:number)=>{ if(days.length<=1) return; setDays((prev:any)=>prev.filter((_:any,i:number)=>i!==idx).map((d:any,i:number)=>({...d,day_number:i+1}))); setActiveDayIdx(Math.max(0,idx-1)); }
  const addFromLibrary=(lib:any)=>{ const ne={id:'ex_'+Date.now(),name:lib.name,sets:'4',reps:'12',rest:'90s',notes:'',video_url:lib.video_url||''}; setExercises((p:any)=>[...p,ne]); }
  const savePlan=async()=>{
    if(!planName.trim()||!selectedClient) return alert('Nome e cliente REAL');
    const { data: plan, error } = await supabase.from('workout_plans').insert({coach_id:user.id,client_id:selectedClient,name:planName,goal_tag:goal}).select().single();
    if(error){ alert(error.message); return; }
    for(const d of days){
      const { data: day } = await supabase.from('workout_days').insert({plan_id:plan.id,day_number:d.day_number,day_name:d.day_name}).select().single();
      if(!day) continue;
      for(const ex of d.exercises){ await supabase.from('exercises').insert({day_id:day.id,name:ex.name,sets:ex.sets,reps:ex.reps,rest:ex.rest,video_url:ex.video_url}); }
    }
    setToast('REAL Saved '+days.length+' days'); setTimeout(()=>setToast(null),3000); loadData();
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between"><h2 className="serif text-[42px] leading-[0.9]">COACH<br/><span className="text-[#FF4D8D] italic">BUILDER REAL</span></h2><button onClick={savePlan} className="h-[52px] px-7 rounded-full bg-[#FF4D8D] text-black font-bold">SAVE {days.length} DAYS REAL</button></div>
      <div className="bg-[#121212] rounded-[28px] border border-white/10 p-4">
        <div className="flex gap-2 overflow-x-auto pb-2">{days.map((d:any,i:number)=><div key={d.tempId} className="flex gap-1"><button onClick={()=>setActiveDayIdx(i)} className={`h-[44px] px-5 rounded-full text-[12px] ${i===activeDayIdx?'bg-[#FF4D8D] text-black':'bg-[#1E1E1E] border border-white/10'}`}>{d.day_name}</button><button onClick={()=>deleteDay(i)} className="w-7 h-7 rounded-full bg-white/10"><X className="w-3 h-3"/></button></div>)}<button onClick={addDay} className="h-[44px] px-5 rounded-full bg-white text-black"><Plus className="w-4 h-4"/> DAY</button></div>
        <div className="mt-4 grid grid-cols-2 gap-3"><input value={planName} onChange={e=>setPlanName(e.target.value)} placeholder="Nome piano REAL" className="h-[48px] rounded-[16px] bg-[#080808] border border-white/10 px-5"/><select value={selectedClient} onChange={e=>setSelectedClient(e.target.value)} className="h-[48px] rounded-[16px] bg-[#080808] border border-white/10 px-5"><option value="">Cliente REAL Supabase</option>{clients.map((c:any)=><option key={c.id} value={c.id}>{c.email}</option>)}</select></div>
      </div>
      <div className="grid lg:grid-cols-[340px_1fr] gap-6">
        <div className="bg-[#121212] rounded-[32px] border border-white/10 p-5 max-h-[600px] overflow-auto"><h3 className="text-[11px] text-white/40 mb-3">LIBRERIA REAL ({library.length}) - FULL</h3>{library.map((lib:any)=><div key={lib.id} className="flex justify-between items-center bg-[#080808] border border-white/10 rounded-[16px] p-3 mb-2"><span className="text-[13px]">{lib.name}</span><button onClick={()=>addFromLibrary(lib)} className="w-8 h-8 rounded-full bg-white text-black"><Plus className="w-4 h-4"/></button></div>)}</div>
        <div className="bg-[#121212] rounded-[32px] border border-white/10 p-5"><h3 className="text-[14px] font-bold">{days[activeDayIdx]?.day_name} - {exercises.length} ex REAL</h3><div className="mt-4 space-y-3">{exercises.map((ex:any)=><div key={ex.id} className="bg-[#080808] border border-white/10 rounded-[20px] p-4 flex gap-3"><div className="flex-1"><input value={ex.name} onChange={e=>{const nd=[...days]; nd[activeDayIdx].exercises=nd[activeDayIdx].exercises.map((ee:any)=>ee.id===ex.id?{...ee,name:e.target.value}:ee); setDays(nd)}} className="bg-transparent text-[14px] w-full"/><p className="text-[11px] text-white/40">{ex.sets}x{ex.reps} REAL</p></div><button onClick={()=>setVideoModal(ex)} className="w-8 h-8 rounded-full bg-[#1E1E1E] border border-white/10"><Play className="w-3 h-3"/></button><button onClick={()=>{const nd=[...days]; nd[activeDayIdx].exercises=nd[activeDayIdx].exercises.filter((ee:any)=>ee.id!==ex.id); setDays(nd)}} className="w-8 h-8 rounded-full bg-[#1E1E1E] border border-white/10"><Trash2 className="w-3 h-3"/></button></div>)}</div></div>
      </div>
    </div>
  )
}
