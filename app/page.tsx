'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
type Role = 'coach' | 'client' | null

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
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w- h- bg-[#FF4D8D]/15 rounded-full blur- pointer-events-none"/>
      <div className="w-full max-w- z-10">
        <div className="flex justify-between mb-10"><div className="font-black text- tracking-[0.2em]">RAFIT <span className="text-[#FF4D8D]">•</span> RAPHI</div><div className={`w-2 h-2 rounded-full mt-2 ${connected?'bg-emerald-400':'bg-red-500'}`}/></div>
        <h1 className="font-black text- leading-[0.85]">FIRST<br/>THE MIND,<br/><span className="text-[#FF4D8D]">THEN THE BODY.</span></h1>
        <div className="mt-8 bg-white/[0.05] border border-white/[0.08] backdrop-blur- rounded- p-7">
          <input className="w-full bg-white/[0.06] border border-white/10 rounded-full px-5 py-3.5 text- mb-3" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)}/>
          <input className="w-full bg-white/[0.06] border border-white/10 rounded-full px-5 py-3.5 text- mb-4" type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)}/>
          <button onClick={login} disabled={loading} className="w-full bg-[#FF4D8D] text-black rounded-full py-4 font-bold text-">{loading?'...':'ACCEDI'}</button>
          <button onClick={signup} className="w-full mt-3 border border-white/15 rounded-full py-4 text-">REGISTRATI</button>
        </div>
      </div>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Anton&display=swap');.font-black{font-family:Anton,sans-serif}`}</style>
    </div>
  )
  if(view==='coach') return <CoachView user={user} setView={setView}/>
  return <ClientView user={user} setView={setView}/>
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

  const addFromLibrary=(libEx:any)=>{
    setExercises([...exercises,{name:libEx.name,sets:4,reps:'12',tempo:'2-1-1-0',rest:'90s',muscle:libEx.muscle_group}])
  }
  const createCustomExercise=async()=>{
    if(!customName.trim()) return
    const {data,error}=await supabase.from('exercise_library').insert({name:customName.trim(),muscle_group:customGroup}).select().single()
    if(error) return alert(error.message)
    setLibrary([data,...library]); setCustomName(''); setExercises([...exercises,{name:data.name,sets:3,reps:'12',tempo:'2-1-1-0',rest:'60s',muscle:data.muscle_group}])
  }

  const savePlan=async()=>{
    const name=planName.trim(); if(!name) return alert('Nome piano'); if(!selectedClient) return alert('Seleziona cliente')
    const { data: plan, error } = await supabase.from('workout_plans').insert({coach_id:user.id,client_id:selectedClient,name,goal_tag:goal}).select().single()
    if(error) return alert(error.message)
    const { data: day } = await supabase.from('workout_days').insert({plan_id:plan.id,day_number:1,day_name:'GLUTEI FOCUS'}).select().single()
    for(const ex of exercises){ if(!ex.name) continue; await supabase.from('exercises').insert({day_id:day.id,name:ex.name,sets:ex.sets,reps:ex.reps,tempo:ex.tempo,rest:ex.rest}) }
    alert(`✅ ${name} salvato`); setPlanName(''); setExercises([]); load()
  }

  return (
    <div className="min-h-screen bg-[#080808] text-white pb-20">
      <header className="sticky top-0 bg-black/80 backdrop-blur-xl border-b border-white/10 p-4 flex justify-between z-20"><div className="font-black text-">RAFIT COACH — {user.email}</div><button onClick={async()=>{await supabase.auth.signOut(); setView('login')}} className="text- border border-white/15 rounded-full px-3 py-1">Logout</button></header>
      <nav className="flex gap-2 p-4 overflow-x-auto">{['clients','builder','plans','checkins'].map(t=><button key={t} onClick={()=>setTab(t)} className={`px-5 py-2.5 rounded-full text- font-bold uppercase ${tab===t?'bg-white text-black':'bg-white/5 border border-white/10'}`}>{t}</button>)}</nav>
      <div className="p-4 max-w- mx-auto">
        {tab==='clients'&&<div><h2 className="font-black text-">CLIENTI <span className="text-[#FF4D8D]">REALI</span></h2><div className="mt-6 grid gap-3">{clients.map((c:any)=><div key={c.id} onClick={()=>{setSelectedClientView(c); setTab('checkins')}} className="bg-white/5 border border-white/10 rounded- p-5 flex justify-between cursor-pointer"><div><div className="font-bold">{c.email}</div><div className="text- opacity-40">{checkins.filter((ch:any)=>ch.client_id===c.id).length} check-in</div></div><span className="bg-[#FF4D8D] text-black px-3 py-1 rounded-full text- font-bold h-fit">{c.role}</span></div>)}</div></div>}

        {tab==='builder'&&(
          <div className="grid lg:grid-cols-[380px_1fr] gap-6">
            {/* LIBRARY LEFT */}
            <div className="bg-white/[0.04] border border-white/10 rounded- p-5 h-fit lg:sticky lg:top-">
              <h3 className="font-black text- tracking-widest">LIBRERIA ESERCIZI</h3>
              <input value={libSearch} onChange={e=>setLibSearch(e.target.value)} placeholder="Cerca es. Hip Thrust" className="mt-4 w-full bg-black border border-white/10 rounded-full px-4 py-2.5 text-"/>
              <div className="flex gap-2 mt-3 flex-wrap">
                {['TUTTI','GLUTEI','GAMBE','CORE','SPALLE','SCHIENA','PETTO'].map(g=>(
                  <button key={g} onClick={()=>setLibFilter(g)} className={`px-3 py-1 rounded-full text- font-bold tracking-widest ${libFilter===g?'bg-[#FF4D8D] text-black':'bg-white/5 border border-white/10'}`}>{g}</button>
                ))}
              </div>
              <div className="mt-4 max-h- overflow-auto space-y-2 pr-1">
                {filteredLib.map((ex:any)=><div key={ex.id} className="bg-black/50 border border-white/5 rounded- p-3 flex justify-between items-center hover:border-[#FF4D8D]/30 transition"><div><div className="font-bold text-">{ex.name}</div><div className="text- opacity-50">{ex.muscle_group} • {ex.equipment||'—'}</div></div><button onClick={()=>addFromLibrary(ex)} className="w-7 h-7 bg-white text-black rounded-full text- font-bold">+</button></div>)}
              </div>
              <div className="mt-6 border-t border-white/10 pt-4">
                <div className="text- opacity-60 tracking-widest mb-2">CREA CUSTOM</div>
                <div className="flex gap-2">
                  <input value={customName} onChange={e=>setCustomName(e.target.value)} placeholder="Nuovo esercizio" className="flex-1 bg-black border border-white/10 rounded-full px-4 py-2 text-"/>
                  <select value={customGroup} onChange={e=>setCustomGroup(e.target.value)} className="bg-black border border-white/10 rounded-full px-3 py-2 text-"><option>GLUTEI</option><option>GAMBE</option><option>CORE</option><option>SPALLE</option><option>SCHIENA</option><option>PETTO</option></select>
                </div>
                <button onClick={createCustomExercise} className="mt-2 w-full border border-white/15 rounded-full py-2 text-">+ AGGIUNGI A LIBRERIA</button>
              </div>
            </div>

            {/* BUILDER RIGHT */}
            <div>
              <h2 className="font-black text-">WORKOUT <span className="text-white/40">BUILDER</span></h2>
              <div className="mt-6 bg-white/5 border border-white/10 rounded- p-6">
                <input value={planName} onChange={e=>setPlanName(e.target.value)} placeholder="Nome piano es. Sara - Bikini 4x" className="w-full bg-black border border-white/10 rounded-full px-5 py-3 text- mb-4"/>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <select value={goal} onChange={e=>setGoal(e.target.value)} className="bg-black border border-white/10 rounded-full px-4 py-3 text-"><option>TONIFICAZIONE BIKINI</option><option>DIMAGRIMENTO</option><option>FORZA</option></select>
                  <select value={selectedClient} onChange={e=>setSelectedClient(e.target.value)} className="bg-black border border-white/10 rounded-full px-4 py-3 text-"><option value="">Seleziona cliente</option>{clients.map((c:any)=><option key={c.id} value={c.id}>{c.email}</option>)}</select>
                </div>

                <div className="text- tracking-widest opacity-60 mb-3">ESERCIZI SELEZIONATI ({exercises.length})</div>
                <div className="space-y-2">
                  {exercises.map((ex,i)=><div key={i} className="bg-black/50 border border-white/10 rounded- p-3 flex gap-3 items-center"><div className="w-8 h-8 bg-[#FF4D8D] text-black rounded-full flex items-center justify-center text- font-bold">{i+1}</div><div className="flex-1"><input value={ex.name} onChange={e=>{const n=[...exercises]; n[i].name=e.target.value; setExercises(n)}} className="w-full bg-transparent font-bold text- focus:outline-none"/><div className="flex gap-2 mt-1"><input value={ex.sets} type="number" onChange={e=>{const n=[...exercises]; (n[i] as any).sets=parseInt(e.target.value)||0; setExercises(n)}} className="w-14 bg-white/5 border border-white/10 rounded-full px-2 py-1 text- text-center" placeholder="sets"/><input value={ex.reps} onChange={e=>{const n=[...exercises]; n[i].reps=e.target.value; setExercises(n)}} className="w-20 bg-white/5 border border-white/10 rounded-full px-2 py-1 text- text-center" placeholder="reps"/><span className="text- opacity-40 px-2 py-1">{ex.muscle||ex.muscle_group||''}</span></div></div><button onClick={()=>setExercises(exercises.filter((_,j)=>j!==i))} className="w-8 h-8 border border-white/10 rounded-full">×</button></div>)}
                  {exercises.length===0&&<div className="border border-dashed border-white/15 rounded- p-8 text-center opacity-40 text-">Seleziona dalla libreria a sinistra →</div>}
                </div>

                <button onClick={savePlan} className="mt-6 w-full bg-[#FF4D8D] hover:bg-[#ff6da2] text-black rounded-full py-4 font-bold tracking-widest">SALVA SU SUPABASE REAL</button>
              </div>
            </div>
          </div>
        )}

        {tab==='plans'&&<div className="grid gap-2">{plans.map((p:any)=><div key={p.id} className="bg-white/5 border border-white/10 rounded- p-4 flex justify-between"><span className="font-bold text-">{p.name}</span><span className="text- opacity-50">{p.profiles?.email}</span></div>)}</div>}
        {tab==='checkins'&&<div><h2 className="font-black text-">CHECK-IN {selectedClientView?`• ${selectedClientView.email}`:''}</h2><div className="mt-6 grid gap-4">{(selectedClientView?checkins.filter((c:any)=>c.client_id===selectedClientView.id):checkins).map((ch:any)=><div key={ch.id} className="bg-white/5 border border-white/10 rounded- p-5"><div className="flex justify-between"><div className="font-bold">{ch.profiles?.email||ch.client_id.slice(0,8)} — {ch.peso}kg</div><div className="text- opacity-50">{new Date(ch.created_at).toLocaleDateString()}</div></div><div className="text- opacity-70 mt-2">{ch.note}</div><div className="flex gap-2 mt-3 flex-wrap">{(ch.photos||[]).map((url:string,i:number)=><img key={i} src={url} className="w-20 h-28 object-cover rounded-xl border border-white/10"/>)}</div></div>)}</div></div>}
      </div>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Anton&display=swap');.font-black{font-family:Anton,sans-serif}`}</style>
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
  const [tab,setTab]=useState('plans')
  const [peso,setPeso]=useState('')
  const [note,setNote]=useState('')
  const [photos,setPhotos]=useState<string[]>([])
  const [uploading,setUploading]=useState(false)
  const [myCheckins,setMyCheckins]=useState<any[]>([])

  useEffect(()=>{ if(user?.id){ supabase.from('workout_plans').select('*').eq('client_id',user.id).order('created_at',{ascending:false}).then(({data})=>{if(data)setPlans(data)}); supabase.from('check_ins').select('*').eq('client_id',user.id).order('created_at',{ascending:false}).then(({data})=>{if(data)setMyCheckins(data)}) } },[user])
  useEffect(()=>{ if(rest>0){ const t=setTimeout(()=>setRest(r=>r-1),1000); return ()=>clearTimeout(t) } },[rest])

  const openPlan=async(p:any)=>{
    setActivePlan(p); const {data:ds}=await supabase.from('workout_days').select('*').eq('plan_id',p.id).order('day_number'); if(ds){ setDays(ds); const {data:exData}=await supabase.from('exercises').select('*').in('day_id',ds.map((d:any)=>d.id)); if(exData) setExs(exData) }; setDayIdx(0)
  }
  const toggleDone=(id:string)=>{ const cur=logs[id]?.done; setLogs({...logs,[id]:{done:!cur,weight:logs[id]?.weight||'',reps:logs[id]?.reps||''}}); if(!cur){ setRest(90); try{ supabase.from('workout_logs').insert({client_id:user.id,plan_id:activePlan.id,day_id:days[dayIdx]?.id,exercise_id:id,done:true}) }catch{} } }
  const uploadPhoto=async(e:any)=>{ const file=e.target.files[0]; if(!file) return; setUploading(true); const fileName=`${user.id}/${Date.now()}_${file.name}`; const {error}=await supabase.storage.from('checkins').upload(fileName,file); if(error){ alert(error.message); setUploading(false); return }; const {data:pub}=supabase.storage.from('checkins').getPublicUrl(fileName); setPhotos([...photos,pub.publicUrl]); setUploading(false) }
  const sendCheckin=async()=>{ if(!peso) return alert('Inserisci peso'); const {error}=await supabase.from('check_ins').insert({client_id:user.id,peso:parseFloat(peso),note,photos}); if(error) return alert(error.message); alert('✅ Check-in inviato'); setPeso(''); setNote(''); setPhotos([]); supabase.from('check_ins').select('*').eq('client_id',user.id).order('created_at',{ascending:false}).then(({data})=>{if(data)setMyCheckins(data)}) }

  const currentDay=days[dayIdx]; const dayExs=exs.filter((e:any)=>e.day_id===currentDay?.id); const doneCount=dayExs.filter((e:any)=>logs[e.id]?.done).length

  return (
    <div className="min-h-screen bg-[#080808] text-white">
      <header className="p-5 flex justify-between border-b border-white/10 sticky top-0 bg-black/70 backdrop-blur-xl z-10"><div className="font-black">CIAO, {(user.email||'').split('@')[0].toUpperCase()}</div><button onClick={async()=>{await supabase.auth.signOut(); setView('login')}} className="text- border border-white/15 rounded-full px-3 py-1">Logout</button></header>
      <nav className="flex gap-2 p-4"><button onClick={()=>setTab('plans')} className={`px-5 py-2 rounded-full text- font-bold ${tab==='plans'?'bg-white text-black':'bg-white/5 border border-white/10'}`}>PIANI</button><button onClick={()=>setTab('checkin')} className={`px-5 py-2 rounded-full text- font-bold ${tab==='checkin'?'bg-white text-black':'bg-white/5 border border-white/10'}`}>CHECK-IN</button></nav>
      <div className="p-6 max-w- mx-auto">
        {tab==='plans'&&<><h2 className="font-black text- leading-[0.9]">I TUOI<br/><span className="text-[#FF4D8D]">PIANI REALI</span></h2><div className="mt-8 space-y-4">{plans.map((p:any)=><div key={p.id} className="bg-white/5 border border-white/10 rounded- p-7"><div className="font-bold text-">{p.name}</div><button onClick={()=>openPlan(p)} className="mt-5 w-full border border-white/15 rounded-full py-3 text-">APRI WORKOUT</button></div>)}{plans.length===0&&<div className="bg-white/5 border border-white/10 rounded- p-12 text-center opacity-40">Nessun piano</div>}</div></>}
        {tab==='checkin'&&<div><h2 className="font-black text-">CHECK-IN <span className="text-[#FF4D8D]">SETTIMANALE</span></h2><div className="mt-6 bg-white/5 border border-white/10 rounded- p-6"><div className="grid grid-cols-2 gap-3"><input value={peso} onChange={e=>setPeso(e.target.value)} placeholder="Peso kg" type="number" className="bg-black border border-white/10 rounded-full px-5 py-3 text-"/><div className="text- opacity-40 flex items-center">{new Date().toLocaleDateString()}</div></div><textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="Come ti senti?" className="mt-4 w-full bg-black border border-white/10 rounded- p-4 text- min-h-"/><div className="mt-4"><div className="text- opacity-60 mb-2">FOTO</div><div className="flex gap-2 flex-wrap">{photos.map((url,i)=><img key={i} src={url} className="w-20 h-28 object-cover rounded-xl border border-white/10"/>)}</div><label className="mt-3 inline-flex border border-white/15 rounded-full px-4 py-2 text- cursor-pointer"><input type="file" accept="image/*" className="hidden" onChange={uploadPhoto}/>{uploading?'CARICAMENTO...':'+ FOTO'}</label></div><button onClick={sendCheckin} className="mt-6 w-full bg-[#FF4D8D] text-black rounded-full py-4 font-bold">INVIA CHECK-IN</button></div></div>}
      </div>
      {activePlan&&(
        <div className="fixed inset-0 bg-[#050505] z-50 overflow-auto">
          <div className="sticky top-0 bg-black/80 backdrop-blur-xl border-b border-white/10 p-4 flex justify-between items-center"><div><div className="font-black text-">{activePlan.name}</div><div className="text- opacity-60">{doneCount}/{dayExs.length} • {currentDay?.day_name}</div></div><div className="flex gap-2"><div className={`px-3 py-1 rounded-full text- font-bold ${rest>0?'bg-[#FF4D8D] text-black':'bg-white/10'}`}>{rest>0?`${rest}s`:'REST'}</div><button onClick={()=>setActivePlan(null)} className="w-8 h-8 border border-white/15 rounded-full">×</button></div></div>
          <div className="p-4 max-w- mx-auto"><div className="flex gap-2 overflow-x-auto">{days.map((d:any,i:number)=><button key={d.id} onClick={()=>setDayIdx(i)} className={`px-4 py-2 rounded-full text- whitespace-nowrap ${i===dayIdx?'bg-white text-black':'bg-white/5 border border-white/10'}`}>DAY {d.day_number}: {d.day_name}</button>)}</div><div className="mt-6 space-y-3">{dayExs.map((e:any)=><div key={e.id} className={`bg-white/5 border rounded- p-5 flex gap-4 ${logs[e.id]?.done?'border-[#FF4D8D]/40 bg-[#FF4D8D]/5':'border-white/10'}`}><button onClick={()=>toggleDone(e.id)} className={`w-9 h-9 rounded-full border flex items-center justify-center ${logs[e.id]?.done?'bg-[#FF4D8D] border-[#FF4D8D] text-black':'border-white/20'}`}>{logs[e.id]?.done?'✓':''}</button><div className="flex-1"><div className="font-bold text-">{e.name}</div><div className="text- opacity-50">{e.sets}×{e.reps} • {e.rest}</div></div></div>)}</div><button onClick={()=>{alert('Completato!'); setActivePlan(null)}} className="mt-8 w-full bg-[#FF4D8D] text-black rounded-full py-4 font-bold">COMPLETA</button></div>
        </div>
      )}
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Anton&display=swap');.font-black{font-family:Anton,sans-serif}`}</style>
    </div>
  )
}