'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect } from 'react';
import { LogOut, Dumbbell, ClipboardList, Users, Home, User } from 'lucide-react';
import { supabase } from '@/lib/supabase'
import { CoachBuilder } from '@/components/CoachBuilder'
import { ClientApp } from '@/components/ClientApp'
import { VideoModal } from '@/components/VideoModal'
import { BeforeAfterSlider } from '@/components/BeforeAfterSlider'
import { WeightChart } from '@/components/WeightChart'

export default function Page(){
  const [isLoggedIn,setIsLoggedIn]=useState(false)
  const [role,setRole]=useState('coach')
  const [user,setUser]=useState<any>(null)
  const [email,setEmail]=useState('')
  const [password,setPassword]=useState('')
  const [clients,setClients]=useState<any[]>([])
  const [plans,setPlans]=useState<any[]>([])
  const [myPlans,setMyPlans]=useState<any[]>([])
  const [myDays,setMyDays]=useState<any[]>([])
  const [library,setLibrary]=useState<any[]>([])
  const [days,setDays]=useState<any[]>([
    {tempId:'d1',day_number:1,day_name:'DAY 1 - GLUTEI FOCUS',exercises:[]},
    {tempId:'d2',day_number:2,day_name:'DAY 2 - UPPER',exercises:[]}
  ])
  const [activeDayIdx,setActiveDayIdx]=useState(0)
  const [clientActiveDay,setClientActiveDay]=useState(0)
  const [planName,setPlanName]=useState('')
  const [selectedClient,setSelectedClient]=useState('')
  const [goal,setGoal]=useState('TONIFICAZIONE BIKINI')
  const [coachTab,setCoachTab]=useState('builder')
  const [toast,setToast]=useState<string|null>(null)
  const [videoModal,setVideoModal]=useState<any>(null)
  const [sliderPos,setSliderPos]=useState(50)
  const [isDragging,setIsDragging]=useState(false)

  useEffect(()=>{(async()=>{
    const {data}=await supabase.auth.getSession();
    if(data.session?.user){
      setUser(data.session.user);
      const {data:prof}=await supabase.from('profiles').select('role').eq('id',data.session.user.id).single();
      if(prof){ setRole(prof.role as any); setIsLoggedIn(true); }
    }
  })()},[])

  const loadData=async()=>{
    const {data:cl}=await supabase.from('profiles').select('*').eq('role','client');
    if(cl) setClients(cl);
    const {data:pl}=await supabase.from('workout_plans').select('*');
    if(pl) setPlans(pl);
    const {data:lib}=await supabase.from('exercise_library').select('*');
    if(lib) setLibrary(lib);
    if(user){
      const {data:myP}=await supabase.from('workout_plans').select('*').eq('client_id',user.id).order('created_at',{ascending:false});
      if(myP && myP.length>0){
        setMyPlans(myP);
        const {data:ds}=await supabase.from('workout_days').select('*').eq('plan_id',myP[0].id).order('day_number');
        if(ds){
          const {data:exs}=await supabase.from('exercises').select('*').in('day_id',ds.map((d:any)=>d.id));
          if(exs){
            const merged=ds.map((d:any)=>({tempId:d.id,day_number:d.day_number,day_name:d.day_name,exercises:exs.filter((e:any)=>e.day_id===d.id)}));
            setMyDays(merged);
          }
        }
      }
    }
  }
  useEffect(()=>{ if(isLoggedIn) loadData(); },[isLoggedIn,user]);

  const login=async()=>{
    const {data,error}=await supabase.auth.signInWithPassword({email,password});
    if(error){ alert(error.message); return }
    if(data.user){ setUser(data.user); const {data:prof}=await supabase.from('profiles').select('role').eq('id',data.user.id).single(); if(prof){ setRole(prof.role as any); setIsLoggedIn(true); } }
  }

  const WEIGHT_DATA=[{date:'W1',weight:68},{date:'W2',weight:67.5}];

  if(!isLoggedIn) return <div className="min-h-screen bg-[#080808] text-white flex items-center justify-center p-6"><div className="w-full max-w-[400px]"><h1 className="text-[48px] font-black">RAFIT</h1><p className="text-[11px] text-white/50">V12 MODULAR - FULL CLIENT + COACH REAL - NO TIMEOUT</p><div className="mt-6 bg-[#121212] rounded-[32px] p-6 border border-white/10"><input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email REAL" className="w-full h-[48px] rounded-full bg-black border border-white/10 px-5 mb-3"/><input value={password} onChange={e=>setPassword(e.target.value)} type="password" placeholder="Password" className="w-full h-[48px] rounded-full bg-black border border-white/10 px-5 mb-4"/><button onClick={login} className="w-full bg-white text-black rounded-full py-3">ACCEDI REAL MODULAR</button></div></div></div>

  return (
    <div className="min-h-screen bg-[#080808] text-white pb-[120px]">
      <header className="sticky top-0 bg-black/80 backdrop-blur border-b border-white/10 p-4 flex justify-between"><span className="font-black">RAFIT {role.toUpperCase()} MODULAR REAL - NO TIMEOUT</span><span className="text-[10px] text-white/40">{role==='client'?myDays.length+' DAYS CLIENT REAL':'BUILDER REAL'} • FULL LUXURY SPLIT FILES</span><button onClick={async()=>{await supabase.auth.signOut(); setIsLoggedIn(false)}} className="w-8 h-8 border border-white/10 rounded-full"><LogOut className="w-4 h-4"/></button></header>
      <div className="p-4 max-w-[1200px] mx-auto">
        {role==='coach'?(
          <div>
            <div className="flex gap-2 mb-4">{[{k:'builder',label:'BUILDER REAL FULL'},{k:'clients',label:'CLIENTS REAL'},{k:'plans',label:'PLANS REAL'}].map(t=><button key={t.k} onClick={()=>setCoachTab(t.k)} className={`px-4 py-2 rounded-full text-[11px] ${coachTab===t.k?'bg-white text-black':'bg-white/5 border border-white/10'}`}>{t.label}</button>)}</div>
            {coachTab==='builder'&&<CoachBuilder user={user} clients={clients} library={library} days={days} setDays={setDays} activeDayIdx={activeDayIdx} setActiveDayIdx={setActiveDayIdx} planName={planName} setPlanName={setPlanName} selectedClient={selectedClient} setSelectedClient={setSelectedClient} goal={goal} setGoal={setGoal} setToast={setToast} setVideoModal={setVideoModal} loadData={loadData} />}
            {coachTab==='clients'&&<div><h2 className="text-[28px] font-black">CLIENTS REAL ({clients.length}) - MODULAR FULL</h2><div className="grid md:grid-cols-3 gap-4 mt-4">{clients.map((c:any)=><div key={c.id} className="bg-[#121212] rounded-[24px] border border-white/10 p-4"><p className="font-bold">{c.email}</p></div>)}</div><div className="mt-8 grid lg:grid-cols-2 gap-6"><BeforeAfterSlider pos={sliderPos} setPos={setSliderPos} isDragging={isDragging} setIsDragging={setIsDragging} /><WeightChart data={WEIGHT_DATA} /></div></div>}
            {coachTab==='plans'&&<div><h2 className="text-[28px] font-black">PLANS REAL ({plans.length}) MODULAR</h2>{plans.map((p:any)=><div key={p.id} className="bg-[#121212] border border-white/10 rounded-[16px] p-3 mt-2">{p.name} REAL</div>)}</div>}
          </div>
        ):(
          <ClientApp user={user} myPlans={myPlans} myDays={myDays} clientActiveDay={clientActiveDay} setClientActiveDay={setClientActiveDay} setVideoModal={setVideoModal} />
        )}
      </div>
      {videoModal&&<VideoModal exercise={videoModal} onClose={()=>setVideoModal(null)} />}
      {toast&&<div className="fixed top-20 left-1/2 -translate-x-1/2 bg-white text-black rounded-full px-5 py-3 text-[12px]">{toast}</div>}
    </div>
  )
}
