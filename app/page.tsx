'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
type Role = 'coach' | 'client' | null

// ===== MAIN =====
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
      alert(`Creato come ${inferred}. Se Auto Confirm ON puoi loggarti.`)
    }
  }

  if(view==='login') return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#080808] text-white relative overflow-hidden">
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w- h- bg-[#FF4D8D]/15 rounded-full blur- pointer-events-none"/>
      <div className="w-full max-w- z-10">
        <div className="flex justify-between mb-10"><div className="font-black text- tracking-[0.2em]">RAFIT <span className="text-[#FF4D8D]">•</span> RAPHI</div><div className={`w-2 h-2 rounded-full mt-2 ${connected?'bg-emerald-400':'bg-red-500'}`}/></div>
        <h1 className="font-black text- leading-[0.85]">FIRST<br/>THE MIND,<br/><span className="text-[#FF4D8D]">THEN THE BODY.</span></h1>
        <div className="mt-8 bg-white/[0.05] border border-white/[0.08] backdrop-blur- rounded- p-7">
          <input className="w-full bg-white/[0.06] border border-white/10 rounded-full px-5 py-3.5 text- mb-3" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)}/>
          <input className="w-full bg-white/[0.06] border border-white/10 rounded-full px-5 py-3.5 text- mb-4" type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)}/>
          <button onClick={login} disabled={loading} className="w-full bg-[#FF4D8D] text-black rounded-full py-4 font-bold text- tracking-[0.15em]">{loading?'...':'ACCEDI'}</button>
          <button onClick={signup} className="w-full mt-3 border border-white/15 rounded-full py-4 text-">REGISTRATI</button>
        </div>
      </div>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Anton&display=swap');.font-black{font-family:Anton,sans-serif}`}</style>
    </div>
  )
  if(view==='coach') return <CoachView user={user} setView={setView}/>
  return <ClientView user={user} setView={setView}/>
}

// ===== COACH =====
function CoachView({user,setView}:any){
  const [tab,setTab]=useState('clients')
  const [clients,setClients]=useState<any[]>([])
  const [plans,setPlans]=useState<any[]>([])
  const [planName,setPlanName]=useState('')
  const [goal,setGoal]=useState('TONIFICAZIONE BIKINI')
  const [selectedClient,setSelectedClient]=useState('')
  const [exercises,setExercises]=useState([{name:'Hip Thrust',sets:4,reps:'12',tempo:'2-1-2-0',rest:'90s'},{name:'RDL',sets:3,reps:'10',tempo:'3-1-1-0',rest:'90s'}])

  useEffect(()=>{
    supabase.from('profiles').select('*').eq('role','client').then(({data})=>{if(data)setClients(data)})
    supabase.from('workout_plans').select('*, profiles!workout_plans_client_id_fkey(email)').order('created_at',{ascending:false}).then(({data})=>{if(data)setPlans(data)})
  },[])

  const savePlan=async()=>{
    const name=planName.trim()
    if(!name) return alert('Nome piano mancante')
    if(!selectedClient) return alert('Seleziona cliente')
    const {data:plan,[STRIPPED] supabase.from('workout_plans').insert({coach_id:user.id,client_id:selectedClient,name,goal_tag:goal}).select().single()
    if(error) return alert(error.message)
    const {data:day}=await supabase.from('workout_days').insert({plan_id:plan.id,day_number:1,day_name:'GLUTEI FOCUS'}).select().single()
    for(const ex of exercises){ if(!ex.name) continue; await supabase.from('exercises').insert({day_id:day.id,name:ex.name,sets:ex.sets,reps:ex.reps,tempo:ex.tempo,rest:ex.rest}) }
    alert(`✅ ${name} salvato`); setPlanName(''); supabase.from('workout_plans').select('*, profiles!workout_plans_client_id_fkey(email)').order('created_at',{ascending:false}).then(({data})=>{if(data)setPlans(data)})
  }
  const deletePlan=async(id:string)=>{
    if(!confirm('Elimina piano?')) return
    await supabase.from('workout_plans').delete().eq('id',id)
    setPlans(plans.filter((p:any)=>p.id!==id))
  }

  return (
    <div className="min-h-screen bg-[#080808] text-white pb-20">
      <header className="sticky top-0 bg-black/80 backdrop-blur-xl border-b border-white/10 p-4 flex justify-between z-20"><div className="font-black text-">RAFIT COACH — {user.email}</div><button onClick={async()=>{await supabase.auth.signOut(); setView('login')}} className="text- border border-white/15 rounded-full px-3 py-1">Logout</button></header>
      <nav className="flex gap-2 p-4 overflow-x-auto">{['clients','builder','plans'].map(t=><button key={t} onClick={()=>setTab(t)} className={`px-5 py-2.5 rounded-full text- font-bold tracking-widest uppercase ${tab===t?'bg-white text-black':'bg-white/5 border border-white/10'}`}>{t}</button>)}</nav>
      <div className="p-4 max-w- mx-auto">
        {tab==='clients'&&<div><h2 className="font-black text-">CLIENTI <span className="text-[#FF4D8D]">REALI</span></h2><div className="mt-6 grid gap-3">{clients.map((c:any)=><div key={c.id} className="bg-white/5 border border-white/10 rounded- p-5 flex justify-between"><div><div className="font-bold">{c.email}</div><div className="text- opacity-40">{c.id.slice(0,8)}</div></div><span className="bg-[#FF4D8D] text-black px-3 py-1 rounded-full text- font-bold">{c.role}</span></div>)}</div></div>}
        {tab==='builder'&&<div><h2 className="font-black text-">WORKOUT BUILDER</h2><div className="mt-6 bg-white/5 border border-white/10 rounded- p-6"><input value={planName} onChange={e=>setPlanName(e.target.value)} placeholder="Nome piano" className="w-full bg-white/5 border border-white/10 rounded-full px-5 py-3 text- mb-4"/><div className="grid grid-cols-2 gap-3 mb-4"><select value={goal} onChange={e=>setGoal(e.target.value)} className="bg-black border border-white/10 rounded-full px-4 py-3 text-"><option>TONIFICAZIONE BIKINI</option><option>DIMAGRIMENTO</option><option>FORZA</option></select><select value={selectedClient} onChange={e=>setSelectedClient(e.target.value)} className="bg-black border border-white/10 rounded-full px-4 py-3 text-"><option value="">Seleziona cliente</option>{clients.map((c:any)=><option key={c.id} value={c.id}>{c.email}</option>)}</select></div>{exercises.map((ex,i)=><div key={i} className="flex gap-2 mb-2"><input value={ex.name} onChange={e=>{const n=[...exercises]; n[i].name=e.target.value; setExercises(n)}} className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2.5 text-" placeholder="Esercizio"/><input value={ex.sets as any} type="number" onChange={e=>{const n=[...exercises]; (n[i] as any).sets=parseInt(e.target.value)||0; setExercises(n)}} className="w- bg-white/5 border border-white/10 rounded-full py-2.5 text-center text-"/><button onClick={()=>setExercises(exercises.filter((_,j)=>j!==i))} className="w-8 h-8 border border-white/10 rounded-full">×</button></div>)}<button onClick={()=>setExercises([...exercises,{name:'',sets:3,reps:'10',tempo:'2-1-1-0',rest:'60s'}])} className="mt-2 border border-white/15 rounded-full px-4 py-2 text-">+ ESERCIZIO</button><button onClick={savePlan} className="mt-6 w-full bg-[#FF4D8D] text-black rounded-full py-4 font-bold">SALVA SU SUPABASE</button></div></div>}
        {tab==='plans'&&<div className="grid gap-2">{plans.map((p:any)=><div key={p.id} className="bg-white/5 border border-white/10 rounded- p-4 flex justify-between items-center"><div><div className="font-bold">{p.name}</div><div className="text- opacity-50">{p.profiles?.email}</div></div><button onClick={()=>deletePlan(p.id)} className="text- border border-white/15 rounded-full px-3 py-1">Elimina</button></div>)}</div>}
      </div>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Anton&display=swap');.font-black{font-family:Anton,sans-serif}`}</style>
    </div>
  )
}

// ===== CLIENT + LOGGER =====
function ClientView({user,setView}:any){
  const [plans,setPlans]=useState<any[]>([])
  const [activePlan,setActivePlan]=useState<any>(null)
  const [days,setDays]=useState<any[]>([])
  const [exs,setExs]=useState<any[]>([])
  const [logs,setLogs]=useState<Record<string,{done:boolean,weight:string,reps:string}>>({})
  const [dayIdx,setDayIdx]=useState(0)
  const [rest,setRest]=useState(0)

  useEffect(()=>{ if(user?.id) supabase.from('workout_plans').select('*').eq('client_id',user.id).order('created_at',{ascending:false}).then(({data})=>{if(data)setPlans(data)}) },[user])
  useEffect(()=>{ if(rest>0){ const t=setTimeout(()=>setRest(r=>r-1),1000); return ()=>clearTimeout(t) } },[rest])

  const openPlan=async(p:any)=>{
    setActivePlan(p)
    const {data:ds}=await supabase.from('workout_days').select('*').eq('plan_id',p.id).order('day_number')
    if(ds){ setDays(ds); const {data:exData}=await supabase.from('exercises').select('*').in('day_id',ds.map((d:any)=>d.id)); if(exData) setExs(exData) }
    setDayIdx(0)
  }

  const toggleDone=(id:string)=>{
    const cur=logs[id]?.done
    setLogs({...logs,[id]:{done:!cur,weight:logs[id]?.weight||'',reps:logs[id]?.reps||''}})
    if(!cur){ setRest(90); try{ supabase.from('workout_logs').insert({client_id:user.id,plan_id:activePlan.id,day_id:days[dayIdx]?.id,exercise_id:id,done:true}); }catch{} }
  }

  const currentDay=days[dayIdx]
  const dayExs=exs.filter((e:any)=>e.day_id===currentDay?.id)
  const doneCount=dayExs.filter((e:any)=>logs[e.id]?.done).length

  return (
    <div className="min-h-screen bg-[#080808] text-white">
      <header className="p-5 flex justify-between border-b border-white/10 sticky top-0 bg-black/70 backdrop-blur-xl z-10"><div className="font-black">CIAO, {(user.email||'').split('@')[0].toUpperCase()}</div><button onClick={async()=>{await supabase.auth.signOut(); setView('login')}} className="text- border border-white/15 rounded-full px-3 py-1">Logout</button></header>
      <div className="p-6 max-w- mx-auto">
        <h2 className="font-black text- leading-[0.9]">I TUOI<br/><span className="text-[#FF4D8D]">PIANI REALI</span></h2>
        <div className="mt-8 space-y-4">{plans.map((p:any)=><div key={p.id} className="bg-white/5 border border-white/10 rounded- p-7"><div className="font-bold text-">{p.name}</div><div className="text- opacity-60 border border-white/10 rounded-full px-3 py-1 inline-flex mt-2">{p.goal_tag}</div><button onClick={()=>openPlan(p)} className="mt-5 w-full border border-white/15 rounded-full py-3 text- hover:bg-white hover:text-black transition">APRI WORKOUT</button></div>)}{plans.length===0&&<div className="bg-white/5 border border-white/10 rounded- p-12 text-center opacity-40">Nessun piano</div>}</div>
      </div>

      {activePlan&&(
        <div className="fixed inset-0 bg-[#050505] z-50 overflow-auto">
          <div className="sticky top-0 bg-black/80 backdrop-blur-xl border-b border-white/10 p-4 flex justify-between items-center">
            <div><div className="font-black text-">{activePlan.name}</div><div className="text- opacity-60">{doneCount}/{dayExs.length} • {Math.round((doneCount/dayExs.length||0)*100)}% • {currentDay?.day_name}</div></div>
            <div className="flex gap-2"><div className={`px-3 py-1 rounded-full text- font-bold ${rest>0?'bg-[#FF4D8D] text-black':'bg-white/10'}`}>{rest>0?`${rest}s REST`:'REST'}</div><button onClick={()=>setActivePlan(null)} className="w-8 h-8 border border-white/15 rounded-full">×</button></div>
          </div>
          <div className="p-4 max-w- mx-auto">
            <div className="flex gap-2 overflow-x-auto pb-2">{days.map((d:any,i:number)=><button key={d.id} onClick={()=>setDayIdx(i)} className={`px-4 py-2 rounded-full text- whitespace-nowrap ${i===dayIdx?'bg-white text-black':'bg-white/5 border border-white/10'}`}>DAY {d.day_number}: {d.day_name}</button>)}</div>
            <div className="mt-2 h-1 bg-white/10 rounded-full overflow-hidden"><div className="h-full bg-[#FF4D8D] transition-all" style={{width:`${(doneCount/(dayExs.length||1))*100}%`}}/></div>
            <div className="mt-6 space-y-3">
              {dayExs.map((e:any)=>(
                <div key={e.id} className={`bg-white/5 border rounded- p-5 flex gap-4 ${logs[e.id]?.done?'border-[#FF4D8D]/40 bg-[#FF4D8D]/5':'border-white/10'}`}>
                  <button onClick={()=>toggleDone(e.id)} className={`w-9 h-9 rounded-full border flex items-center justify-center flex-shrink-0 ${logs[e.id]?.done?'bg-[#FF4D8D] border-[#FF4D8D] text-black':'border-white/20'}`}>{logs[e.id]?.done?'✓':''}</button>
                  <div className="flex-1">
                    <div className="font-bold text-">{e.name}</div>
                    <div className="text- opacity-50 mt-1">{e.sets}×{e.reps} • {e.tempo} • {e.rest}</div>
                    <div className="flex gap-2 mt-3">
                      <input value={logs[e.id]?.weight||''} onChange={ev=>setLogs({...logs,[e.id]:{...logs[e.id],weight:ev.target.value,done:logs[e.id]?.done||false,reps:logs[e.id]?.reps||''}})} placeholder="kg" className="w- bg-black border border-white/10 rounded-full px-3 py-2 text-"/>
                      <input value={logs[e.id]?.reps||''} onChange={ev=>setLogs({...logs,[e.id]:{...logs[e.id],reps:ev.target.value,done:logs[e.id]?.done||false,weight:logs[e.id]?.weight||''}})} placeholder="reps fatte" className="flex-1 bg-black border border-white/10 rounded-full px-3 py-2 text-"/>
                      <button onClick={()=>setRest(parseInt(e.rest)||90)} className="px-3 py-2 bg-white/5 border border-white/10 rounded-full text-">REST</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={()=>{alert(`Allenamento completato! ${doneCount}/${dayExs.length}`); setActivePlan(null)}} className="mt-8 w-full bg-[#FF4D8D] text-black rounded-full py-4 font-bold tracking-widest">COMPLETA ALLENAMENTO</button>
          </div>
        </div>
      )}
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Anton&display=swap');.font-black{font-family:Anton,sans-serif}`}</style>
    </div>
  )
}