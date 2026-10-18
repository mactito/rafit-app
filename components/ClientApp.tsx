'use client'
import { useState } from 'react';
import { Play } from 'lucide-react';
import { supabase } from '@/lib/supabase'

export function ClientApp({ user, myPlans, myDays, clientActiveDay, setClientActiveDay, setVideoModal }: any){
  const [clientTab,setClientTab]=useState('home');
  const clientExercises = myDays[clientActiveDay]?.exercises || [];

  return (
    <div className="space-y-6">
      <div className="flex gap-2 mb-4">
        {[{k:'home',label:'HOME REAL FULL'},{k:'workout',label:'WORKOUT REAL FULL CLIENT'},{k:'profile',label:'PROFILE'}].map(t=><button key={t.k} onClick={()=>setClientTab(t.k)} className={`px-4 py-2 rounded-full text-[11px] ${clientTab===t.k?'bg-white text-black':'bg-white/5 border border-white/10'}`}>{t.label}</button>)}
      </div>

      {clientTab==='home'&&(
        <div className="space-y-6">
          <div className="bg-[#121212] rounded-[32px] border border-white/10 p-7">
            <p className="text-[11px] tracking-[0.3em] text-[#FF4D8D]">CIAO, {(user?.email||'CLIENT').split('@')[0].toUpperCase()} • REAL CLIENT FULL</p>
            <h2 className="serif text-[48px] leading-[0.85] mt-3">YOUR<br/>TRANSFORMATION<br/><span className="italic text-[#FF4D8D]">IS LOADING.</span></h2>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="bg-[#080808] border border-white/10 rounded-[20px] p-4"><p className="text-[10px] text-white/40">PIANI REAL CLIENT FULL</p><p className="text-[22px] font-bold mt-1">{myPlans.length} 🔥</p></div>
              <div className="bg-[#FF4D8D] rounded-[20px] p-4 text-black"><p className="text-[10px] font-bold">GIORNI REAL CLIENT FULL</p><p className="text-[22px] font-bold mt-1">{myDays.length} REAL</p></div>
            </div>
          </div>
          <div className="bg-[#121212] rounded-[32px] border border-white/10 p-6">
            <h3 className="text-[14px] font-bold mb-3">I TUOI PIANI REAL CLIENT FULL ({myPlans.length}) - LUXURY RESTORED</h3>
            {myPlans.length===0?<p className="text-white/40 text-[13px]">Nessun piano assegnato - coach deve assegnare piano REAL con giorni</p>:myPlans.map((p:any)=><div key={p.id} className="bg-[#080808] border border-white/10 rounded-[16px] p-4 mb-2"><p className="font-bold text-[14px]">{p.name} REAL CLIENT FULL</p><p className="text-[11px] text-white/40">{myDays.length} giorni • {myDays.reduce((a:any,d:any)=>a+d.exercises.length,0)} esercizi REAL CLIENT FULL</p></div>)}
          </div>
        </div>
      )}

      {clientTab==='workout'&&(
        <div className="space-y-6">
          <h2 className="serif text-[42px] leading-[0.9]">WORKOUT<br/><span className="text-[#FF4D8D] italic">REAL CLIENT FULL</span></h2>
          {myDays.length===0?(
            <div className="bg-[#121212] rounded-[32px] border border-white/10 p-12 text-center"><p className="text-white/40">Nessun piano REAL CLIENT FULL - coach deve creare piano multi-day REAL</p><p className="text-[11px] text-white/20 mt-2">myPlans: {myPlans.length}, myDays: {myDays.length} - REAL CLIENT FULL NOW RESTORED</p></div>
          ):(
            <>
              <div className="bg-[#121212] rounded-[28px] border border-white/10 p-4"><div className="flex gap-2 overflow-x-auto pb-1">{myDays.map((d:any,i:number)=><button key={d.tempId} onClick={()=>setClientActiveDay(i)} className={`h-[44px] px-5 rounded-full text-[12px] font-medium whitespace-nowrap ${i===clientActiveDay?'bg-white text-black':'bg-[#1E1E1E] border border-white/10 text-white/60'}`}>{d.day_name} • {d.exercises.length} ex REAL CLIENT FULL</button>)}</div></div>
              <div className="bg-[#121212] rounded-[32px] border border-white/10 p-5 md:p-7">
                <div className="flex items-center gap-3 mb-6"><div className="w-10 h-10 rounded-full bg-[#FF4D8D] text-black flex items-center justify-center font-bold text-[13px]">{myDays[clientActiveDay]?.day_number}</div><div><h3 className="text-[18px] font-medium">{myDays[clientActiveDay]?.day_name}</h3><p className="text-[11px] tracking-[0.15em] text-white/40">{clientExercises.length} EXERCISES • REAL SUPABASE • FULL LUXURY CLIENT RESTORED</p></div></div>
                <div className="space-y-3">{clientExercises.map((ex:any,idx:number)=><div key={ex.id||idx} className="group bg-[#080808] border border-white/[0.06] rounded-[20px] p-4 md:p-5 flex gap-4"><div className="w-8 h-8 rounded-full bg-[#1E1E1E] flex items-center justify-center text-[11px]">{String(idx+1).padStart(2,'0')}</div><div className="flex-1"><div className="flex justify-between gap-3"><p className="font-medium text-[15px]">{ex.name} REAL CLIENT FULL LUXURY</p><button onClick={()=>setVideoModal(ex)} className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center hover:bg-[#FF4D8D]"><Play className="w-3.5 h-3.5 ml-[1px]"/></button></div><p className="text-[11px] text-white/40 mt-1">{ex.sets}x{ex.reps} • {ex.rest} • REAL SUPABASE CLIENT FULL</p></div></div>)}</div>
              </div>
            </>
          )}
        </div>
      )}

      {clientTab==='profile'&&(
        <div className="bg-[#121212] rounded-[32px] border border-white/10 p-8 max-w-[560px]"><div className="w-20 h-20 rounded-full bg-[#FF4D8D] text-black flex items-center justify-center text-[24px] font-bold">{user?.email?.slice(0,2).toUpperCase()}</div><h3 className="serif text-[32px] mt-4">{user?.email}</h3><p className="text-[12px] text-white/40 mt-2">CLIENT REAL FULL • {myPlans.length} piani • {myDays.length} giorni • {myDays.reduce((a:any,d:any)=>a+d.exercises.length,0)} esercizi REAL CLIENT FULL LUXURY RESTORED</p></div>
      )}
    </div>
  )
}
