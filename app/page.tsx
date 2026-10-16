'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'

type Role = 'coach' | 'client' | null

function getYoutubeId(url:string){
  if(!url) return null
  const m=url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  return m?m[1]:null
}

export default function App(){
  const [user,setUser]=useState<any>(null)
  const [role,setRole]=useState<Role>(null)
  const [email,setEmail]=useState('')
  const [password,setPassword]=useState('')
  const [loading,setLoading]=useState(false)
  const [view,setView]=useState('login')
  const [connected,setConnected]=useState(false)

  useEffect(()=>{
    const init=async()=>{
      const {data}=await supabase.auth.getSession()
      if(data.session?.user){
        setUser(data.session.user)
        const {data:prof}=await supabase.from('profiles').select('role').eq('id',data.session.user.id).single()
        const r=(prof?.role as Role)||'client'
        setRole(r); setView(r==='coach'?'coach':'client')
      }
      setConnected(!!process.env.NEXT_PUBLIC_SUPABASE_URL)
    }; init()
  },[])

  const login=async()=>{
    setLoading(true)
    const {data,error}=await supabase.auth.signInWithPassword({email,password})
    if(error){ alert(`LOGIN ERROR: ${error.message}`); setLoading(false); return }
    if(data.user){
      setUser(data.user)
      const {data:prof}=await supabase.from('profiles').select('role').eq('id',data.user.id).single()
      const r=(prof?.role as Role)||'client'
      setRole(r); setView(r==='coach'?'coach':'client')
    }
    setLoading(false)
  }
  const signup=async()=>{
    const isCoach=email.toLowerCase().includes('mactito')||email.toLowerCase().includes('coach')||email==='mactito2@gmail.com'
    const inferred=isCoach?'coach':'client'
    const {data,error}=await supabase.auth.signUp({email,password})
    if(error){ alert(error.message); return }
    if(data.user){
      await supabase.from('profiles').insert({id:data.user.id,email,role:inferred,full_name:email.split('@')[0]})
      alert(`Creato come ${inferred}`)
    }
  }

  if(view==='login') return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#080808] text-white relative">
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-[#FF4D8D]/15 rounded-full blur-[120px] pointer-events-none"/>
      <div className="w-full max-w-[420px] z-10">
        <div className="flex justify-between mb-10"><div className="font-black text-[22px] tracking-[0.2em]">RAFIT <span className="text-[#FF4D8D]">•</span> RAPHI</div><div className={`w-2 h-2 rounded-full mt-2 ${connected?'bg-emerald-400':'bg-red-500'}`}/></div>
        <h1 className="font-black text-[48px] leading-[0.85] tracking-[-0.02em]">FIRST<br/>THE MIND,<br/><span className="text-[#FF4D8D]">THEN THE BODY.</span></h1>
        <div className="mt-8 bg-white/[0.05] border border-white/[0.08] backdrop-blur-[24px] rounded-[32px] p-7">
          <input className="w-full bg-white/[0.06] border border-white/10 rounded-full px-5 py-3.5 text-[14px] mb-3 outline-none focus:border-[#FF4D8D]/50" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)}/>
          <input className="w-full bg-white/[0.06] border border-white/10 rounded-full px-5 py-3.5 text-[14px] mb-4 outline-none focus:border-[#FF4D8D]/50" type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)}/>
          <button onClick={login} disabled={loading} className="w-full bg-[#FF4D8D] hover:bg-[#ff6da2] text-black rounded-full py-4 font-bold text-[13px] tracking-widest transition">{loading?'...':'ACCEDI'}</button>
          <button onClick={signup} className="w-full mt-3 border border-white/15 hover:bg-white/5 rounded-full py-4 text-[13px] transition">REGISTRATI</button>
        </div>
        <div className="mt-6 text-[11px] opacity-40 text-center">PWA Ready • Installabile come App</div>
      </div>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Anton&display=swap');.font-black{font-family:Anton,sans-serif}`}</style>
    </div>
  )
  if(view==='coach') return <CoachView user={user} setView={setView}/>
  return <ClientView user={user} setView={setView}/>
}

function VideoModal({url,name,onClose}:{url:string,name:string,onClose:()=>void}){
  const ytId=getYoutubeId(url)
  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[100] flex items-center justify-center p-4 animate-[fadeIn_0.2s]">
      <div className="w-full max-w-[720px] bg-[#111] border border-white/10 rounded-[28px] overflow-hidden">
        <div className="p-4 flex justify-between items-center border-b border-white/10">
          <div className="font-bold text-[14px]">{name} — Demo</div>
          <button onClick={onClose} className="w-8 h-8 border border-white/15 rounded-full">×</button>
        </div>
        <div className="aspect-video bg-black">
          {ytId? <iframe className="w-full h-full" src={`https://www.youtube.com/embed/${ytId}?autoplay=1`} allow="autoplay; encrypted-media" allowFullScreen/> : <video src={url} controls autoPlay className="w-full h-full"/>}
        </div>
      </div>
    </div>
  )
}

function BeforeAfterSlider({before,after}:{before:string,after:string}){
  const [pos,setPos]=useState(50)
  return (
    <div className="relative w-full aspect-[3/4] rounded-[24px] overflow-hidden border border-white/10 bg-black select-none"
      onMouseMove={e=>{
        const rect=e.currentTarget.getBoundingClientRect()
        setPos(Math.max(0,Math.min(100,((e.clientX-rect.left)/rect.width)*100)))
      }}
      onTouchMove={e=>{
        const rect=e.currentTarget.getBoundingClientRect()
        const touch=e.touches[0]
        setPos(Math.max(0,Math.min(100,((touch.clientX-rect.left)/rect.width)*100)))
      }}
    >
      <img src={after} className="absolute inset-0 w-full h-full object-cover"/>
      <div className="absolute inset-0 w-full h-full object-cover overflow-hidden" style={{clipPath:`inset(0 ${100-pos}% 0 0)`}}>
        <img src={before} className="absolute inset-0 w-full h-full object-cover"/>
      </div>
      <div className="absolute top-0 bottom-0 w-0.5 bg-white" style={{left:`${pos}%`}}/>
      <div className="absolute top-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full flex items-center justify-center text-black text-[12px] font-bold shadow-xl" style={{left:`calc(${pos}% - 16px)`}}>↔</div>
      <div className="absolute bottom-3 left-3 text-[10px] bg-black/60 backdrop-blur px-2 py-1 rounded-full">PRIMA</div>
      <div className="absolute bottom-3 right-3 text-[10px] bg-[#FF4D8D] text-black px-2 py-1 rounded-full font-bold">DOPO</div>
    </div>
  )
}

function CoachView({user,setView}:any){
  const [tab,setTab]=useState('builder')
  const [clients,setClients]=useState<any[]>([])
  const [plans,setPlans]=useState<any[]>([])
  const [checkins,setCheckins]=useState<any[]>([])
  const [selectedClientView,setSelectedClientView]=useState<any>(null)
  const [planName,setPlanName]=useState('')
  const [goal,setGoal]=useState('TONIFICAZIONE BIKINI')
  const [selectedClient,setSelectedClient]=useState('')
  const [exercises,setExercises]=useState<any[]>([])
  const [library,setLibrary]=useState<any[]>([])
  const [libSearch,setLibSearch]=useState('')
  const [libFilter,setLibFilter]=useState('TUTTI')
  const [customName,setCustomName]=useState('')
  const [customGroup,setCustomGroup]=useState('GLUTEI')
  const [customVideo,setCustomVideo]=useState('')
  const [previewVideo,setPreviewVideo]=useState<{url:string,name:string}|null>(null)

  const load=async()=>{
    const {data:cl}=await supabase.from('profiles').select('*').eq('role','client'); if(cl)setClients(cl)
    const {data:pl}=await supabase.from('workout_plans').select('*, profiles!workout_plans_client_id_fkey(email)').order('created_at',{ascending:false}); if(pl)setPlans(pl)
    const {data:ch}=await supabase.from('check_ins').select('*, profiles!check_ins_client_id_fkey(email)').order('created_at',{ascending:false}); if(ch)setCheckins(ch)
    const {data:lib}=await supabase.from('exercise_library').select('*').order('name'); if(lib)setLibrary(lib)
  }
  useEffect(()=>{load()},[])

  const filteredLib=library.filter((ex:any)=>{
    const matchSearch=ex.name.toLowerCase().includes(libSearch.toLowerCase())
    const matchFilter=libFilter==='TUTTI'||ex.muscle_group===libFilter
    return matchSearch&&matchFilter
  })

  const addFromLibrary=(libEx:any)=> setExercises([...exercises,{name:libEx.name,sets:4,reps:'12',tempo:'2-1-1-0',rest:'90s',muscle:libEx.muscle_group,video_url:libEx.video_url}])
  const createCustomExercise=async()=>{
    if(!customName.trim()) return
    const {data,error}=await supabase.from('exercise_library').insert({name:customName.trim(),muscle_group:customGroup,video_url:customVideo||null}).select().single()
    if(error) return alert(error.message)
    setLibrary([data,...library]); setCustomName(''); setCustomVideo(''); setExercises([...exercises,{name:data.name,sets:3,reps:'12',tempo:'2-1-1-0',rest:'60s',muscle:data.muscle_group,video_url:data.video_url}])
  }
  const savePlan=async()=>{
    const name=planName.trim(); if(!name) return alert('Nome piano'); if(!selectedClient) return alert('Seleziona cliente')
    const { data: plan, error } = await supabase.from('workout_plans').insert({coach_id:user.id,client_id:selectedClient,name,goal_tag:goal}).select().single()
    if(error) return alert(error.message)
    const { data: day } = await supabase.from('workout_days').insert({plan_id:plan.id,day_number:1,day_name:'GLUTEI FOCUS'}).select().single()
    for(const ex of exercises){ if(!ex.name) continue; await supabase.from('exercises').insert({day_id:day.id,name:ex.name,sets:ex.sets,reps:ex.reps,tempo:ex.tempo,rest:ex.rest,video_url:ex.video_url||null}) }
    alert(`✅ ${name} salvato`); setPlanName(''); setExercises([]); load()
  }

  return (
    <div className="min-h-screen bg-[#080808] text-white pb-[100px]">
      <header className="sticky top-0 bg-black/80 backdrop-blur-xl border-b border-white/10 p-4 flex justify-between z-20"><div className="font-black text-[13px] tracking-widest">RAFIT COACH — {user.email}</div><button onClick={async()=>{await supabase.auth.signOut(); setView('login')}} className="text-[11px] border border-white/15 rounded-full px-3 py-1">Logout</button></header>
      <div className="p-4 max-w-[1200px] mx-auto">
        {tab==='clients'&&<div><h2 className="font-black text-[40px] leading-[0.9]">CLIENTI <span className="text-[#FF4D8D]">REALI</span></h2><p className="opacity-40 text-[12px] mt-2">{clients.length} clienti attivi • {checkins.length} check-in totali</p><div className="mt-6 grid gap-3">{clients.map((c:any)=><div key={c.id} onClick={()=>{setSelectedClientView(c); setTab('checkins')}} className="group bg-white/[0.04] hover:bg-white/[0.07] border border-white/10 rounded-[24px] p-5 flex justify-between cursor-pointer transition"><div><div className="font-bold">{c.email}</div><div className="text-[11px] opacity-40">{checkins.filter((ch:any)=>ch.client_id===c.id).length} check-in • {c.id.slice(0,8)}</div></div><div className="flex items-center gap-2"><span className="bg-[#FF4D8D] text-black px-3 py-1 rounded-full text-[10px] font-bold">CLIENTE</span><span className="group-hover:translate-x-1 transition">→</span></div></div>)}</div></div>}
        {tab==='builder'&&(
          <div className="grid lg:grid-cols-[400px_1fr] gap-6">
            <div className="bg-white/[0.04] border border-white/10 rounded-[28px] p-5 h-fit lg:sticky lg:top-[80px]">
              <h3 className="font-black text-[16px] tracking-widest">LIBRERIA + VIDEO</h3>
              <input value={libSearch} onChange={e=>setLibSearch(e.target.value)} placeholder="Cerca Hip Thrust" className="mt-4 w-full bg-black border border-white/10 rounded-full px-4 py-2.5 text-[13px] outline-none focus:border-[#FF4D8D]/40"/>
              <div className="flex gap-2 mt-3 flex-wrap">{['TUTTI','GLUTEI','GAMBE','CORE','SPALLE','SCHIENA','PETTO'].map(g=><button key={g} onClick={()=>setLibFilter(g)} className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-widest transition ${libFilter===g?'bg-[#FF4D8D] text-black':'bg-white/5 border border-white/10 hover:bg-white/10'}`}>{g}</button>)}</div>
              <div className="mt-4 max-h-[380px] overflow-auto space-y-2 pr-1 custom-scroll">
                {filteredLib.map((ex:any)=><div key={ex.id} className="bg-black/60 border border-white/5 hover:border-[#FF4D8D]/30 rounded-[16px] p-3 flex justify-between items-center transition"><div className="flex-1"><div className="font-bold text-[13px] flex items-center gap-2">{ex.name}{ex.video_url&&<span className="text-[9px] bg-[#FF4D8D]/20 text-[#FF4D8D] px-1.5 py-0.5 rounded font-bold">VIDEO</span>}</div><div className="text-[10px] opacity-50">{ex.muscle_group}</div></div><div className="flex gap-1"><button onClick={()=>ex.video_url&&setPreviewVideo({url:ex.video_url,name:ex.name})} className="w-7 h-7 bg-white/10 border border-white/10 rounded-full text-[11px] hover:bg-white/20">{ex.video_url?'▶':''}</button><button onClick={()=>addFromLibrary(ex)} className="w-7 h-7 bg-white text-black rounded-full font-bold hover:bg-[#FF4D8D]">+</button></div></div>)}
              </div>
              <div className="mt-6 border-t border-white/10 pt-4">
                <div className="text-[11px] opacity-60 tracking-widest mb-2">CREA CUSTOM CON VIDEO</div>
                <input value={customName} onChange={e=>setCustomName(e.target.value)} placeholder="Nome esercizio" className="w-full bg-black border border-white/10 rounded-full px-4 py-2 text-[12px] mb-2 outline-none"/>
                <div className="flex gap-2 mb-2"><select value={customGroup} onChange={e=>setCustomGroup(e.target.value)} className="flex-1 bg-black border border-white/10 rounded-full px-3 py-2 text-[11px]"><option>GLUTEI</option><option>GAMBE</option><option>CORE</option><option>SPALLE</option><option>SCHIENA</option><option>PETTO</option></select><input value={customVideo} onChange={e=>setCustomVideo(e.target.value)} placeholder="YouTube URL" className="flex-[2] bg-black border border-white/10 rounded-full px-3 py-2 text-[11px] outline-none"/></div>
                <button onClick={createCustomExercise} className="w-full border border-white/15 hover:bg-white/5 rounded-full py-2.5 text-[11px] font-bold tracking-widest transition">+ AGGIUNGI A LIBRERIA</button>
              </div>
            </div>
            <div>
              <h2 className="font-black text-[40px] tracking-[-0.02em]">WORKOUT <span className="text-white/30">BUILDER</span></h2>
              <div className="mt-6 bg-white/[0.04] border border-white/10 rounded-[32px] p-6 backdrop-blur">
                <input value={planName} onChange={e=>setPlanName(e.target.value)} placeholder="Nome piano es. Sara - Bikini 4x" className="w-full bg-black border border-white/10 rounded-full px-5 py-3.5 text-[14px] mb-4 outline-none focus:border-[#FF4D8D]/40"/>
                <div className="grid grid-cols-2 gap-3 mb-5"><select value={goal} onChange={e=>setGoal(e.target.value)} className="bg-black border border-white/10 rounded-full px-4 py-3 text-[13px] outline-none"><option>TONIFICAZIONE BIKINI</option><option>DIMAGRIMENTO</option><option>FORZA</option></select><select value={selectedClient} onChange={e=>setSelectedClient(e.target.value)} className="bg-black border border-white/10 rounded-full px-4 py-3 text-[13px] outline-none"><option value="">Seleziona cliente</option>{clients.map((c:any)=><option key={c.id} value={c.id}>{c.email}</option>)}</select></div>
                <div className="text-[11px] tracking-[0.2em] opacity-60 mb-3 font-bold">ESERCIZI SELEZIONATI ({exercises.length})</div>
                <div className="space-y-2">{exercises.map((ex,i)=><div key={i} className="bg-black/50 border border-white/10 rounded-[20px] p-3.5 flex gap-3 items-center group"><div className="w-8 h-8 bg-[#FF4D8D] text-black rounded-full flex items-center justify-center text-[11px] font-bold">{i+1}</div><div className="flex-1"><div className="flex items-center gap-2"><input value={ex.name} onChange={e=>{const n=[...exercises]; n[i].name=e.target.value; setExercises(n)}} className="flex-1 bg-transparent font-bold text-[14px] focus:outline-none"/><button onClick={()=>ex.video_url&&setPreviewVideo({url:ex.video_url,name:ex.name})} className="text-[10px] bg-white/10 border border-white/10 rounded-full px-2.5 py-1 hover:bg-white/20">{ex.video_url?'▶ VIDEO':''}</button></div><div className="flex gap-2 mt-1.5"><input value={ex.sets} type="number" onChange={e=>{const n=[...exercises]; (n[i] as any).sets=parseInt(e.target.value)||0; setExercises(n)}} className="w-14 bg-white/5 border border-white/10 rounded-full px-2 py-1 text-[11px] text-center outline-none"/><input value={ex.reps} onChange={e=>{const n=[...exercises]; n[i].reps=e.target.value; setExercises(n)}} className="w-20 bg-white/5 border border-white/10 rounded-full px-2 py-1 text-[11px] text-center outline-none"/><span className="text-[10px] opacity-40 px-2 py-1 tracking-widest">{ex.muscle||''}</span></div></div><button onClick={()=>setExercises(exercises.filter((_,j)=>j!==i))} className="w-8 h-8 border border-white/10 rounded-full hover:bg-white/10">×</button></div>)}{exercises.length===0&&<div className="border border-dashed border-white/15 rounded-[24px] p-10 text-center"><div className="text-[24px] mb-2">📚</div><div className="opacity-40 text-[12px]">Seleziona dalla libreria a sinistra →<br/>I video si aggiungono automaticamente</div></div>}</div>
                <button onClick={savePlan} className="mt-6 w-full bg-[#FF4D8D] hover:bg-[#ff6da2] text-black rounded-full py-4 font-black tracking-widest transition">SALVA SU SUPABASE REAL</button>
              </div>
            </div>
          </div>
        )}
        {tab==='plans'&&<div><h2 className="font-black text-[32px]">PIANI REALI</h2><div className="mt-6 grid gap-3">{plans.map((p:any)=><div key={p.id} className="bg-white/[0.04] border border-white/10 rounded-[20px] p-5 flex justify-between hover:bg-white/[0.06] transition"><span className="font-bold text-[14px]">{p.name}</span><span className="text-[11px] opacity-50">{p.profiles?.email} • {p.goal_tag}</span></div>)}</div></div>}
        {tab==='checkins'&&<div><h2 className="font-black text-[32px]">CHECK-IN {selectedClientView?`• ${selectedClientView.email}`:''}</h2>{selectedClientView&&checkins.filter((c:any)=>c.client_id===selectedClientView.id).length>=2&&<div className="mt-6"><div className="text-[11px] tracking-widest opacity-60 mb-3">CONFRONTO PRIMA / DOPO</div><BeforeAfterSlider before={checkins.filter((c:any)=>c.client_id===selectedClientView.id).slice(-1)[0]?.photos?.[0]||''} after={checkins.filter((c:any)=>c.client_id===selectedClientView.id)[0]?.photos?.[0]||''}/></div>}<div className="mt-6 grid gap-4">{(selectedClientView?checkins.filter((c:any)=>c.client_id===selectedClientView.id):checkins).map((ch:any)=><div key={ch.id} className="bg-white/[0.04] border border-white/10 rounded-[24px] p-5 hover:bg-white/[0.06] transition"><div className="flex justify-between"><div className="font-bold">{ch.profiles?.email||ch.client_id.slice(0,8)} — {ch.peso}kg</div><div className="text-[11px] opacity-50">{new Date(ch.created_at).toLocaleDateString()}</div></div><div className="text-[13px] opacity-70 mt-2">{ch.note}</div><div className="flex gap-2 mt-3 flex-wrap">{(ch.photos||[]).map((url:string,i:number)=><img key={i} src={url} className="w-20 h-28 object-cover rounded-xl border border-white/10 hover:scale-105 transition"/>)}</div></div>)}{checkins.length===0&&<div className="bg-white/5 border border-white/10 rounded-[24px] p-12 text-center opacity-40">Nessun check-in ancora</div>}</div></div>}
      </div>
      {/* Bottom Nav Coach */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-[20px] border border-white/15 rounded-full px-2 py-2 flex gap-1 z-40 shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
        {[
          {id:'clients',label:'Clienti'},
          {id:'builder',label:'Builder'},
          {id:'plans',label:'Piani'},
          {id:'checkins',label:'Check-in'},
        ].map(t=><button key={t.id} onClick={()=>setTab(t.id)} className={`px-5 py-2.5 rounded-full text-[11px] font-bold tracking-widest transition ${tab===t.id?'bg-white text-black':'text-white/60 hover:text-white hover:bg-white/10'}`}>{t.label}</button>)}
      </div>
      {previewVideo&&<VideoModal url={previewVideo.url} name={previewVideo.name} onClose={()=>setPreviewVideo(null)}/>}
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Anton&display=swap');.font-black{font-family:Anton,sans-serif}@keyframes fadeIn{from{opacity:0;transform:scale(0.98)}to{opacity:1;transform:scale(1)}}.custom-scroll::-webkit-scrollbar{width:4px}.custom-scroll::-webkit-scrollbar-thumb{background:rgba(255,77,141,0.3);border-radius:10px}`}</style>
    </div>
  )
}

function ClientView({user,setView}:any){
  const [plans,setPlans]=useState<any[]>([])
  const [activePlan,setActivePlan]=useState<any>(null)
  const [days,setDays]=useState<any[]>([])
  const [exs,setExs]=useState<any[]>([])
  const [logs,setLogs]=useState<Record<string,{done:boolean,weight:string,reps:string}>>({})
  const [dayIdx,setDayIdx]=useState(0)
  const [rest,setRest]=useState(0)
  const [tab,setTab]=useState('home')
  const [peso,setPeso]=useState('')
  const [note,setNote]=useState('')
  const [photos,setPhotos]=useState<string[]>([])
  const [uploading,setUploading]=useState(false)
  const [myCheckins,setMyCheckins]=useState<any[]>([])
  const [video,setVideo]=useState<{url:string,name:string}|null>(null)

  useEffect(()=>{ if(user?.id){ supabase.from('workout_plans').select('*').eq('client_id',user.id).order('created_at',{ascending:false}).then(({data})=>{if(data)setPlans(data)}); supabase.from('check_ins').select('*').eq('client_id',user.id).order('created_at',{ascending:false}).then(({data})=>{if(data)setMyCheckins(data)}) } },[user])
  useEffect(()=>{ if(rest>0){ const t=setTimeout(()=>setRest(r=>r-1),1000); return ()=>clearTimeout(t) } },[rest])

  const openPlan=async(p:any)=>{
    setActivePlan(p); const {data:ds}=await supabase.from('workout_days').select('*').eq('plan_id',p.id).order('day_number'); if(ds){ setDays(ds); const {data:exData}=await supabase.from('exercises').select('*').in('day_id',ds.map((d:any)=>d.id)); if(exData) setExs(exData) }; setDayIdx(0)
  }
  const toggleDone=(id:string)=>{ const cur=logs[id]?.done; setLogs({...logs,[id]:{done:!cur,weight:logs[id]?.weight||'',reps:logs[id]?.reps||''}}); if(!cur){ setRest(90); try{ supabase.from('workout_logs').insert({client_id:user.id,plan_id:activePlan.id,day_id:days[dayIdx]?.id,exercise_id:id,done:true}) }catch{} } }
  const uploadPhoto=async(e:any)=>{ const file=e.target.files[0]; if(!file) return; setUploading(true); const fileName=`${user.id}/${Date.now()}_${file.name}`; const {error}=await supabase.storage.from('checkins').upload(fileName,file); if(error){ alert(error.message); setUploading(false); return }; const {data:pub}=supabase.storage.from('checkins').getPublicUrl(fileName); setPhotos([...photos,pub.publicUrl]); setUploading(false) }
  const sendCheckin=async()=>{ if(!peso) return alert('Inserisci peso'); const {error}=await supabase.from('check_ins').insert({client_id:user.id,peso:parseFloat(peso),note,photos}); if(error) return alert(error.message); alert('✅ Check-in inviato a Raphi!'); setPeso(''); setNote(''); setPhotos([]); supabase.from('check_ins').select('*').eq('client_id',user.id).order('created_at',{ascending:false}).then(({data})=>{if(data)setMyCheckins(data)}) }

  const currentDay=days[dayIdx]; const dayExs=exs.filter((e:any)=>e.day_id===currentDay?.id); const doneCount=dayExs.filter((e:any)=>logs[e.id]?.done).length
  const completion=dayExs.length?Math.round((doneCount/dayExs.length)*100):0
  const weightData=myCheckins.slice(0,6).reverse()
  const streak=myCheckins.length // simplified

  return (
    <div className="min-h-screen bg-[#080808] text-white pb-[100px]">
      <header className="p-5 flex justify-between items-center border-b border-white/5 sticky top-0 bg-black/70 backdrop-blur-xl z-10"><div className="flex items-center gap-3"><div className="w-9 h-9 bg-[#FF4D8D] rounded-full flex items-center justify-center font-black text-black text-[13px]">{(user.email||'R')[0].toUpperCase()}</div><div><div className="font-black text-[12px] tracking-widest">CIAO, {(user.email||'').split('@')[0].toUpperCase()}</div><div className="text-[10px] opacity-50">Streak {streak} 🔥 • {myCheckins.length} check-in</div></div></div><button onClick={async()=>{await supabase.auth.signOut(); setView('login')}} className="text-[11px] border border-white/15 rounded-full px-3 py-1.5 hover:bg-white/10">Logout</button></header>

      <div className="p-5 max-w-[720px] mx-auto">
        {tab==='home'&&(
          <div className="animate-[fadeIn_0.3s]">
            <h2 className="font-black text-[44px] leading-[0.85] tracking-[-0.02em]">YOUR<br/><span className="text-[#FF4D8D]">PROGRESS.</span></h2>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-3 mt-8">
              <div className="bg-white/[0.04] border border-white/10 rounded-[20px] p-4"><div className="text-[10px] opacity-50 tracking-widest">STREAK</div><div className="font-black text-[24px] mt-1">{streak} <span className="text-[16px]">🔥</span></div><div className="text-[10px] opacity-40 mt-1">check-in totali</div></div>
              <div className="bg-white/[0.04] border border-white/10 rounded-[20px] p-4"><div className="text-[10px] opacity-50 tracking-widest">PESO</div><div className="font-black text-[24px] mt-1">{myCheckins[0]?.peso||'--'}<span className="text-[12px] opacity-50">kg</span></div><div className="text-[10px] opacity-40 mt-1">{weightData.length>1&&weightData[weightData.length-1].peso-weightData[0].peso>0?'+':''}{weightData.length>1?(weightData[weightData.length-1].peso-weightData[0].peso).toFixed(1):'0'}kg</div></div>
              <div className="bg-[#FF4D8D] rounded-[20px] p-4 text-black"><div className="text-[10px] font-bold tracking-widest opacity-70">COMPLETAMENTO</div><div className="font-black text-[24px] mt-1">{completion}%</div><div className="text-[10px] font-bold opacity-70 mt-1">oggi</div></div>
            </div>

            {/* Weight Chart */}
            {weightData.length>1&&(
              <div className="mt-6 bg-white/[0.04] border border-white/10 rounded-[28px] p-5">
                <div className="flex justify-between items-center mb-4"><div className="text-[11px] tracking-widest font-bold opacity-60">PESO • ULTIMI {weightData.length} CHECK-IN</div><div className="text-[11px] bg-white/10 rounded-full px-2.5 py-1">{weightData[0]?.peso}kg → {weightData[weightData.length-1]?.peso}kg</div></div>
                <div className="h-[80px] w-full flex items-end gap-2">
                  {weightData.map((ch,i)=>{
                    const min=Math.min(...weightData.map((d:any)=>d.peso))
                    const max=Math.max(...weightData.map((d:any)=>d.peso))
                    const range=max-min||1
                    const h=20+((ch.peso-min)/range)*60
                    return <div key={ch.id} className="flex-1 flex flex-col items-center gap-2"><div className="w-full bg-[#FF4D8D]/30 rounded-full relative overflow-hidden" style={{height:`${h}%`}}><div className="absolute bottom-0 w-full bg-[#FF4D8D] h-[60%] rounded-full"/></div><div className="text-[9px] opacity-40">{new Date(ch.created_at).toLocaleDateString().slice(0,5)}</div></div>
                  })}
                </div>
              </div>
            )}

            {/* Today Workout */}
            <div className="mt-6 bg-white text-black rounded-[32px] p-6 relative overflow-hidden">
              <div className="absolute -right-10 -top-10 w-[160px] h-[160px] bg-[#FF4D8D]/20 rounded-full blur-[20px]"/>
              <div className="relative z-10">
                <div className="text-[10px] tracking-[0.2em] font-bold opacity-50">NEXT WORKOUT</div>
                <div className="font-black text-[22px] mt-1 leading-[1]">{plans[0]?.name||'Nessun piano assegnato'}</div>
                <div className="text-[12px] opacity-60 mt-2">{plans[0]?.goal_tag||'In attesa del coach'} • {plans.length} piani attivi</div>
                <button onClick={()=>plans[0]&&openPlan(plans[0])} className="mt-5 bg-black text-white rounded-full px-6 py-3 text-[11px] font-bold tracking-widest hover:bg-[#FF4D8D] hover:text-black transition">INIZIA ALLENAMENTO →</button>
              </div>
            </div>

            {/* Plans */}
            <div className="mt-8">
              <div className="flex justify-between items-center"><div className="font-black text-[14px] tracking-widest">I TUOI PIANI ({plans.length})</div><button onClick={()=>setTab('workout')} className="text-[11px] opacity-50 underline">Vedi tutti</button></div>
              <div className="mt-4 grid gap-3">{plans.slice(0,3).map((p:any)=><div key={p.id} className="bg-white/[0.04] border border-white/10 rounded-[24px] p-5 flex justify-between items-center hover:bg-white/[0.06] transition"><div><div className="font-bold text-[15px]">{p.name}</div><div className="text-[11px] opacity-50 mt-1">{p.goal_tag}</div></div><button onClick={()=>openPlan(p)} className="w-10 h-10 bg-white text-black rounded-full flex items-center justify-center hover:bg-[#FF4D8D] transition">→</button></div>)}{plans.length===0&&<div className="bg-white/5 border border-white/10 rounded-[24px] p-10 text-center"><div className="text-[28px]">🏋️‍♀️</div><div className="opacity-40 text-[12px] mt-2">Nessun piano ancora.<br/>Il coach ti assegnerà il primo.</div></div>}</div>
            </div>

            {/* Recent Photos */}
            {myCheckins.length>0&&(
              <div className="mt-8">
                <div className="font-black text-[14px] tracking-widest">ULTIMO CHECK-IN</div>
                <div className="mt-3 bg-white/[0.04] border border-white/10 rounded-[24px] p-4 flex gap-3">
                  <div className="flex gap-2 flex-1 overflow-x-auto">{(myCheckins[0].photos||[]).slice(0,3).map((url:string,i:number)=><img key={i} src={url} className="w-20 h-28 object-cover rounded-xl border border-white/10"/>)} </div>
                  <div className="text-right"><div className="font-black text-[20px]">{myCheckins[0].peso}kg</div><div className="text-[10px] opacity-50">{new Date(myCheckins[0].created_at).toLocaleDateString()}</div><button onClick={()=>setTab('checkin')} className="mt-3 text-[10px] bg-white text-black rounded-full px-3 py-1 font-bold">DETTAGLI</button></div>
                </div>
              </div>
            )}
          </div>
        )}

        {tab==='workout'&&<div className="animate-[fadeIn_0.3s]"><h2 className="font-black text-[40px] leading-[0.9]">I TUOI<br/><span className="text-[#FF4D8D]">PIANI REALI</span></h2><div className="mt-8 space-y-4">{plans.map((p:any)=><div key={p.id} className="bg-white/[0.04] border border-white/10 rounded-[32px] p-6 hover:bg-white/[0.06] transition"><div className="font-bold text-[18px]">{p.name}</div><div className="text-[11px] opacity-50 mt-1 tracking-widest">{p.goal_tag}</div><button onClick={()=>openPlan(p)} className="mt-5 w-full border border-white/15 hover:bg-white hover:text-black rounded-full py-3.5 text-[11px] font-bold tracking-widest transition">APRI WORKOUT →</button></div>)}{plans.length===0&&<div className="bg-white/5 border border-white/10 rounded-[32px] p-12 text-center opacity-40">Nessun piano</div>}</div></div>}

        {tab==='checkin'&&<div className="animate-[fadeIn_0.3s]"><h2 className="font-black text-[36px] tracking-[-0.02em]">CHECK-IN <span className="text-[#FF4D8D]">SETTIMANALE</span></h2><div className="mt-6 bg-white/[0.04] border border-white/10 rounded-[32px] p-6 backdrop-blur"><div className="grid grid-cols-2 gap-3"><input value={peso} onChange={e=>setPeso(e.target.value)} placeholder="Peso kg es. 62.3" type="number" className="bg-black border border-white/10 rounded-full px-5 py-3.5 text-[14px] outline-none focus:border-[#FF4D8D]/40"/><div className="text-[11px] opacity-40 flex items-center tracking-widest">Settimana {new Date().toLocaleDateString()}</div></div><textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="Come ti senti? Energia, fame, stress..." className="mt-4 w-full bg-black border border-white/10 rounded-[24px] p-4 text-[13px] min-h-[90px] outline-none focus:border-[#FF4D8D]/40"/><div className="mt-5"><div className="text-[11px] tracking-[0.2em] opacity-60 mb-3 font-bold">FOTO FRONT / SIDE / BACK</div><div className="flex gap-2 flex-wrap">{photos.map((url,i)=><img key={i} src={url} className="w-20 h-28 object-cover rounded-xl border border-white/10"/>)}</div><label className="mt-3 inline-flex border border-white/15 hover:bg-white/5 rounded-full px-5 py-2.5 text-[11px] font-bold tracking-widest cursor-pointer transition"><input type="file" accept="image/*" className="hidden" onChange={uploadPhoto}/>{uploading?'CARICAMENTO...':'+ AGGIUNGI FOTO'}</label></div><button onClick={sendCheckin} className="mt-6 w-full bg-[#FF4D8D] hover:bg-[#ff6da2] text-black rounded-full py-4 font-black tracking-widest transition">INVIA CHECK-IN A RAPHI</button></div>

        {myCheckins.length>=2&&<div className="mt-8"><div className="text-[11px] tracking-[0.2em] font-bold opacity-60 mb-3">CONFRONTO PRIMA / DOPO</div><BeforeAfterSlider before={myCheckins[myCheckins.length-1]?.photos?.[0]||''} after={myCheckins[0]?.photos?.[0]||''}/></div>}

        <div className="mt-8"><div className="font-black text-[13px] tracking-widest">STORICO PESO</div><div className="mt-4 grid gap-3">{myCheckins.map((ch:any)=><div key={ch.id} className="bg-white/[0.04] border border-white/10 rounded-[20px] p-4 flex justify-between items-center"><div><div className="font-bold text-[14px]">{ch.peso}kg</div><div className="text-[11px] opacity-50">{ch.note?.slice(0,40)||'—'}</div></div><div className="text-right"><div className="text-[11px] opacity-60">{new Date(ch.created_at).toLocaleDateString()}</div><div className="flex gap-1 mt-1 justify-end">{(ch.photos||[]).slice(0,3).map((u:string,i:number)=><img key={i} src={u} className="w-6 h-6 rounded-full object-cover border border-white/10"/>)}</div></div></div>)}</div></div></div>}

        {tab==='profile'&&<div className="animate-[fadeIn_0.3s] text-center mt-10"><div className="w-24 h-24 bg-[#FF4D8D] rounded-full mx-auto flex items-center justify-center font-black text-black text-[32px]">{(user.email||'R')[0].toUpperCase()}</div><div className="font-black text-[20px] mt-4">{user.email}</div><div className="text-[11px] opacity-50 tracking-widest mt-1">{plans.length} piani • {myCheckins.length} check-in • Streak {streak}</div><div className="mt-10 bg-white/[0.04] border border-white/10 rounded-[24px] p-6 text-left"><div className="text-[11px] tracking-widest opacity-60 font-bold">PROGRESSO</div><div className="mt-3 space-y-3"><div className="flex justify-between text-[13px]"><span className="opacity-60">Piani completati</span><span className="font-bold">12</span></div><div className="flex justify-between text-[13px]"><span className="opacity-60">Peso iniziale</span><span className="font-bold">{myCheckins[myCheckins.length-1]?.peso||'--'}kg</span></div><div className="flex justify-between text-[13px]"><span className="opacity-60">Peso attuale</span><span className="font-bold">{myCheckins[0]?.peso||'--'}kg</span></div></div></div></div>}
      </div>

      {/* Bottom Nav Client - Luxury */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-black/90 backdrop-blur-[24px] border border-white/15 rounded-full px-2 py-2 flex gap-1 z-40 shadow-[0_20px_60px_rgba(0,0,0,0.7)]">
        {[
          {id:'home',label:'Home'},
          {id:'workout',label:'Workout'},
          {id:'checkin',label:'Check-in'},
          {id:'profile',label:'Profilo'},
        ].map(t=><button key={t.id} onClick={()=>setTab(t.id)} className={`px-5 py-2.5 rounded-full text-[11px] font-bold tracking-widest transition ${tab===t.id?'bg-white text-black shadow-[0_2px_10px_rgba(255,255,255,0.3)]':'text-white/60 hover:text-white hover:bg-white/10'}`}>{t.label}</button>)}
      </div>

      {activePlan&&(
        <div className="fixed inset-0 bg-[#050505] z-50 overflow-auto animate-[fadeIn_0.2s]">
          <div className="sticky top-0 bg-black/80 backdrop-blur-xl border-b border-white/10 p-4 flex justify-between items-center"><div><div className="font-black text-[14px]">{activePlan.name}</div><div className="text-[11px] opacity-60">{doneCount}/{dayExs.length} • {completion}% • {currentDay?.day_name}</div></div><div className="flex gap-2 items-center"><div className={`px-3 py-1 rounded-full text-[11px] font-bold ${rest>0?'bg-[#FF4D8D] text-black animate-pulse':'bg-white/10'}`}>{rest>0?`${rest}s`:'REST'}</div><button onClick={()=>setActivePlan(null)} className="w-8 h-8 border border-white/15 rounded-full hover:bg-white/10">×</button></div></div>
          <div className="p-4 max-w-[720px] mx-auto"><div className="w-full bg-white/10 rounded-full h-1.5 mb-6"><div className="h-full bg-[#FF4D8D] rounded-full transition-all duration-500" style={{width:`${completion}%`}}/></div><div className="flex gap-2 overflow-x-auto">{days.map((d:any,i:number)=><button key={d.id} onClick={()=>setDayIdx(i)} className={`px-4 py-2 rounded-full text-[11px] whitespace-nowrap font-bold tracking-widest transition ${i===dayIdx?'bg-white text-black':'bg-white/5 border border-white/10 hover:bg-white/10'}`}>DAY {d.day_number}: {d.day_name}</button>)}</div><div className="mt-6 space-y-3">{dayExs.map((e:any)=><div key={e.id} className={`bg-white/[0.04] border rounded-[24px] p-5 flex gap-4 transition ${logs[e.id]?.done?'border-[#FF4D8D]/40 bg-[#FF4D8D]/5':'border-white/10 hover:border-white/20'}`}><button onClick={()=>toggleDone(e.id)} className={`w-10 h-10 rounded-full border flex items-center justify-center font-bold transition ${logs[e.id]?.done?'bg-[#FF4D8D] border-[#FF4D8D] text-black':'border-white/20 hover:border-white/40'}`}>{logs[e.id]?.done?'✓':''}</button><div className="flex-1"><div className="flex items-center gap-2"><div className="font-bold text-[15px]">{e.name}</div>{(e as any).video_url&&<button onClick={()=>setVideo({url:(e as any).video_url,name:e.name})} className="text-[10px] bg-[#FF4D8D] text-black px-2.5 py-0.5 rounded-full font-black hover:bg-white transition">VIDEO</button>}</div><div className="text-[11px] opacity-50 mt-1">{e.sets}×{e.reps} • {e.tempo} • {e.rest}</div><div className="flex gap-2 mt-3"><input value={logs[e.id]?.weight||''} onChange={ev=>setLogs({...logs,[e.id]:{...logs[e.id],weight:ev.target.value,done:logs[e.id]?.done||false,reps:logs[e.id]?.reps||''}})} placeholder="kg" className="w-[70px] bg-black border border-white/10 rounded-full px-3 py-2 text-[12px] outline-none"/><input value={logs[e.id]?.reps||''} onChange={ev=>setLogs({...logs,[e.id]:{...logs[e.id],reps:ev.target.value,done:logs[e.id]?.done||false,weight:logs[e.id]?.weight||''}})} placeholder="reps" className="flex-1 bg-black border border-white/10 rounded-full px-3 py-2 text-[12px] outline-none"/><button onClick={()=>setRest(parseInt((e.rest||'90').replace('s',''))||90)} className="px-3 py-2 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold tracking-widest hover:bg-white/10">REST</button></div></div></div>)}</div><button onClick={()=>{alert('🔥 Workout completato! Streak +1'); setActivePlan(null)}} className="mt-8 w-full bg-[#FF4D8D] hover:bg-[#ff6da2] text-black rounded-full py-4 font-black tracking-widest transition">COMPLETA WORKOUT</button></div>
        </div>
      )}
      {video&&<VideoModal url={video.url} name={video.name} onClose={()=>setVideo(null)}/>}
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Anton&display=swap');.font-black{font-family:Anton,sans-serif}@keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  )
}
