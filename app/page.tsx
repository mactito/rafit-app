'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

type Role = 'coach' | 'client' | null

export default function App() {
  const [user, setUser] = useState<any>(null)
  const [role, setRole] = useState<Role>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [view, setView] = useState('login')
  const [supabaseConnected, setSupabaseConnected] = useState(false)
  const [showEnv, setShowEnv] = useState(false)

  useEffect(() => {
    const check = async () => {
      const { data } = await supabase.auth.getSession()
      if (data.session?.user) {
        setUser(data.session.user)
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.session.user.id).single()
        const r = (profile?.role as Role) || 'client'
        setRole(r)
        setView(r === 'coach'? 'coach' : 'client')
      }
      setSupabaseConnected(!!process.env.NEXT_PUBLIC_SUPABASE_URL)
    }
    check()
  }, [])

  const handleLogin = async () => {
    setLoading(true)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      alert(`LOGIN ERROR: ${error.message}\n\nCheck: 1) Password 2) Supabase env vars 3) User confirmed`)
      setLoading(false)
      return
    }
    if (data.user) {
      setUser(data.user)
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).single()
      const r = (profile?.role as Role) || 'client'
      setRole(r)
      setView(r === 'coach'? 'coach' : 'client')
    }
    setLoading(false)
  }

  const handleSignup = async () => {
    const inferredRole = email.toLowerCase().includes('mactito') || email.toLowerCase().includes('coach') || email === 'mactito2@gmail.com'? 'coach' : 'client'
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) { alert(`SIGNUP ERROR: ${error.message}`); return }
    if (data.user) {
      await supabase.from('profiles').insert({ id: data.user.id, email, role: inferredRole, full_name: email.split('@')[0] })
      alert(`Account creato come ${inferredRole}! Se hai Auto Confirm attivo puoi loggarti subito.`)
    }
  }

  if (view === 'login') return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#080808] text-white relative overflow-hidden">
      {/* pink glow */}
      <div className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 w- h- bg-[#FF4D8D]/15 rounded-full blur-" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 w- h- bg-white/[0.03] rounded-full blur-" />

      <div className="w-full max-w- relative z-10">
        <div className="flex justify-between items-center mb-10">
          <div className="font-black text- tracking-[0.2em]">RAFIT <span className="text-[#FF4D8D]">•</span> RAPHI</div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${supabaseConnected? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]' : 'bg-red-500'}`} />
            <button onClick={()=>setShowEnv(!showEnv)} className="text- opacity-40 tracking-widest">ENV {showEnv?'▲':'▼'}</button>
          </div>
        </div>

        <h1 className="font-black text- md:text- leading-[0.85] tracking-[-0.02em]">
          FIRST<br/>THE MIND,<br/><span className="text-[#FF4D8D]">THEN THE BODY.</span>
        </h1>
        <p className="mt-4 text- tracking-[0.2em] opacity-40 uppercase">Rafit Coaching • Mind first protocol</p>

        <div className="mt-8 bg-white/[0.05] border border-white/[0.08] backdrop-blur- rounded- p-7 shadow-[0_20px_80px_rgba(0,0,0,0.6)]">
          <div className="space-y-3">
            <input className="w-full bg-white/[0.06] border border-white/[0.08] rounded-full px-5 py-3.5 text- text-white placeholder:text-white/30 focus:outline-none focus:border-[#FF4D8D]/40 focus:bg-white/[0.08] transition-all" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
            <input className="w-full bg-white/[0.06] border border-white/[0.08] rounded-full px-5 py-3.5 text- text-white placeholder:text-white/30 focus:outline-none focus:border-[#FF4D8D]/40 focus:bg-white/[0.08] transition-all" type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} />
          </div>

          <button onClick={handleLogin} disabled={loading} className="mt-5 w-full bg-[#FF4D8D] hover:bg-[#ff6da2] text-black rounded-full py-4 font-bold text- tracking-[0.15em] transition-all disabled:opacity-50">
            {loading? '...' : 'ACCEDI'}
          </button>
          <button onClick={handleSignup} className="mt-3 w-full border border-white/15 hover:border-white/30 hover:bg-white/[0.04] rounded-full py-4 text- tracking-[0.1em] transition-all">
            REGISTRATI
          </button>

          {showEnv && (
            <div className="mt-5 p-3 bg-black/50 rounded-2xl text- opacity-40 break-all font-mono border border-white/5">
              URL: {process.env.NEXT_PUBLIC_SUPABASE_URL}<br/>KEY: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.slice(0,22)}...
            </div>
          )}

          <div className="mt-6 flex gap-2">
            <button onClick={()=>{setEmail('mactito2@gmail.com'); setPassword('')}} className="flex-1 bg-white/[0.04] border border-white/10 rounded-full py-2 text- tracking-widest">DEMO COACH</button>
            <button onClick={()=>{setEmail('client@test.com'); setPassword('')}} className="flex-1 bg-white/[0.04] border border-white/10 rounded-full py-2 text- tracking-widest">DEMO CLIENT</button>
          </div>
        </div>

        <div className="mt-8 text-center text- tracking-[0.2em] opacity-20 uppercase">Est. 2026 • Cesena, Italy</div>
      </div>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Anton&family=Space+Grotesk:wght@400;700&display=swap');.font-black{font-family:Anton,sans-serif}`}</style>
    </div>
  )

  if (view === 'coach') return <CoachView user={user} setView={setView} />
  return <ClientView user={user} setView={setView} />
}

function CoachView({ user, setView }: any) {
  const [tab, setTab] = useState('clients')
  const [clients, setClients] = useState<any[]>([])
  const [plans, setPlans] = useState<any[]>([])
  const [planName, setPlanName] = useState('')
  const [goal, setGoal] = useState('TONIFICAZIONE BIKINI')
  const [selectedClient, setSelectedClient] = useState('')
  const [exercises, setExercises] = useState([
    { name: 'Hip Thrust', sets: 4, reps: '12', tempo: '2-1-2-0', rest: '90s' },
    { name: 'RDL', sets: 3, reps: '10', tempo: '3-1-1-0', rest: '90s' }
  ])

  useEffect(() => {
    supabase.from('profiles').select('*').eq('role','client').then(({data})=>{ if(data) setClients(data) })
    supabase.from('workout_plans').select('*, profiles!workout_plans_client_id_fkey(email)').order('created_at',{ascending:false}).then(({data})=>{ if(data) setPlans(data) })
  }, [])

  const saveRealPlan = async () => {
    const trimmedName = planName.trim()
    if (!trimmedName) return alert('ERRORE: Inserisci nome piano')
    if (!selectedClient) return alert('ERRORE: Seleziona cliente')
    if (!user?.id) return alert('ERRORE: coach_id mancante - rifai login')
    const { data: plan, error } = await supabase.from('workout_plans').insert({ coach_id: user.id, client_id: selectedClient, name: trimmedName, goal_tag: goal }).select().single()
    if (error) return alert(`SUPABASE ERROR: ${error.message}`)
    const { data: day, error: dayErr } = await supabase.from('workout_days').insert({ plan_id: plan.id, day_number: 1, day_name: 'GLUTEI FOCUS' }).select().single()
    if (dayErr) return alert(`DAY ERROR: ${dayErr.message}`)
    for (const ex of exercises) {
      if(!ex.name) continue
      await supabase.from('exercises').insert({ day_id: day.id, name: ex.name, sets: ex.sets, reps: ex.reps, tempo: ex.tempo, rest: ex.rest })
    }
    alert(`✅ ${trimmedName} salvato!`)
    setPlanName('')
    supabase.from('workout_plans').select('*, profiles!workout_plans_client_id_fkey(email)').order('created_at',{ascending:false}).then(({data})=>{ if(data) setPlans(data) })
  }

  return (
    <div className="min-h-screen pb-20 bg-[#080808] text-white">
      <header className="sticky top-0 bg-black/80 backdrop-blur-xl border-b border-white/10 p-4 flex justify-between items-center z-20">
        <div className="font-black tracking-[0.15em] text-">RAFIT COACH — <span className="opacity-60 font-normal">{user.email}</span></div>
        <button onClick={async ()=>{ await supabase.auth.signOut(); setView('login')}} className="text- border border-white/15 rounded-full px-3 py-1">Logout</button>
      </header>
      <nav className="flex gap-2 p-4 overflow-x-auto">
        {['clients','builder','plans'].map(t=>(
          <button key={t} onClick={()=>setTab(t)} className={`px-5 py-2.5 rounded-full text- font-bold tracking-[0.15em] uppercase transition-all ${tab===t? 'bg-white text-black' : 'bg-white/[0.06] border border-white/10 hover:bg-white/[0.1]'}`}>{t}</button>
        ))}
      </nav>
      <div className="p-4 max-w- mx-auto">
        {tab==='clients' && (
          <div>
            <h2 className="font-black text- leading-[0.9]">CLIENTI<br/><span className="text-[#FF4D8D]">REALI</span></h2>
            <div className="mt-6 grid gap-3">
              {clients.map((c:any)=>(
                <div key={c.id} className="bg-white/[0.05] border border-white/[0.08] backdrop-blur-xl rounded- p-5 flex justify-between items-center">
                  <div><div className="font-bold text-">{c.email}</div><div className="text- opacity-40 mt-1 font-mono">{c.id.slice(0,8)} • {c.full_name||'client'}</div></div>
                  <span className="text- bg-[#FF4D8D] text-black px-3 py-1 rounded-full font-bold tracking-widest">{c.role}</span>
                </div>
              ))}
              {clients.length===0 && <div className="bg-white/[0.03] border border-white/5 rounded- p-10 text-center opacity-40 text-sm">Nessun cliente — crea client@test.com</div>}
            </div>
          </div>
        )}
        {tab==='builder' && (
          <div>
            <h2 className="font-black text- leading-[0.9]">WORKOUT<br/><span className="text-white/40">BUILDER</span></h2>
            <div className="mt-6 bg-white/[0.05] border border-white/[0.08] backdrop-blur-xl rounded- p-6">
              <input value={planName} onChange={e=>setPlanName(e.target.value)} placeholder="Nome piano — es. Sara - Tonificazione 4x" className="w-full bg-white/[0.06] border border-white/10 rounded-full px-5 py-3 text- mb-4 focus:outline-none focus:border-[#FF4D8D]/40" />
              <div className="grid grid-cols-2 gap-3 mb-5">
                <select value={goal} onChange={e=>setGoal(e.target.value)} className="bg-black border border-white/10 rounded-full px-4 py-3 text-"><option>TONIFICAZIONE BIKINI</option><option>DIMAGRIMENTO</option><option>FORZA</option></select>
                <select value={selectedClient} onChange={e=>setSelectedClient(e.target.value)} className="bg-black border border-white/10 rounded-full px-4 py-3 text-">
                  <option value="">Seleziona cliente Supabase</option>
                  {clients.map((c:any)=><option key={c.id} value={c.id}>{c.email}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                {exercises.map((ex,i)=>(
                  <div key={i} className="flex gap-2 items-center">
                    <input value={ex.name} onChange={e=>{ const n=[...exercises]; n[i].name=e.target.value; setExercises(n)}} className="flex-1 bg-white/[0.06] border border-white/10 rounded-full px-4 py-2.5 text-" placeholder="Esercizio" />
                    <input value={ex.sets as any} type="number" onChange={e=>{ const n=[...exercises]; (n[i] as any).sets=parseInt(e.target.value)||0; setExercises(n)}} className="w- bg-white/[0.06] border border-white/10 rounded-full px-2 py-2.5 text- text-center" placeholder="sets" />
                    <button onClick={()=>setExercises(exercises.filter((_,j)=>j!==i))} className="w-8 h-8 rounded-full border border-white/10 text- opacity-50">×</button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={()=>setExercises([...exercises,{ name:'', sets:3, reps:'10', tempo:'2-1-1-0', rest:'60s'}])} className="border border-white/15 rounded-full px-4 py-2 text- tracking-widest">+ ESERCIZIO</button>
              </div>
              <button onClick={saveRealPlan} className="mt-6 w-full bg-[#FF4D8D] hover:bg-[#ff6da2] text-black rounded-full py-4 text- font-bold tracking-[0.15em]">SALVA SU SUPABASE REAL</button>
            </div>
          </div>
        )}
        {tab==='plans' && <div className="grid gap-2">{plans.map((p:any)=><div key={p.id} className="bg-white/[0.05] border border-white/10 rounded- p-4 flex justify-between"><span className="font-bold text-">{p.name}</span><span className="text- opacity-50">{p.profiles?.email}</span></div>)}</div>}
      </div>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Anton&display=swap');.font-black{font-family:Anton,sans-serif}`}</style>
    </div>
  )
}

function ClientView({ user, setView }: any) {
  const [plans, setPlans] = useState<any[]>([])
  useEffect(()=>{ if(user?.id) supabase.from('workout_plans').select('*').eq('client_id', user.id).order('created_at',{ascending:false}).then(({data})=>{ if(data) setPlans(data) }) }, [user])
  return (
    <div className="min-h-screen bg-[#080808] text-white">
      <header className="p-5 flex justify-between border-b border-white/10 sticky top-0 bg-black/70 backdrop-blur-xl z-10"><div className="font-black tracking-[0.1em]">CIAO, {(user.email||'').split('@')[0].toUpperCase()}</div><button onClick={async ()=>{ await supabase.auth.signOut(); setView('login')}} className="text- border border-white/15 rounded-full px-3 py-1">Logout</button></header>
      <div className="p-6 max-w- mx-auto">
        <h2 className="font-black text- leading-[0.9]">I TUOI<br/><span className="text-[#FF4D8D]">PIANI REALI</span></h2>
        <p className="text- opacity-40 mt-3 tracking-[0.15em] uppercase">Sincronizzato da Supabase • Coach Raphi</p>
        <div className="mt-8 space-y-4">
          {plans.map((p:any)=>(
            <div key={p.id} className="bg-white/[0.05] border border-white/[0.08] backdrop-blur-xl rounded- p-7 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w- h- bg-[#FF4D8D]/10 rounded-full blur- group-hover:bg-[#FF4D8D]/15 transition" />
              <div className="font-bold text-">{p.name}</div>
              <div className="mt-2 inline-flex text- tracking-[0.15em] border border-white/10 rounded-full px-3 py-1 opacity-60">{p.goal_tag}</div>
              <div className="mt-5 grid grid-cols-3 gap-3">
                <div className="bg-black/40 rounded-2xl p-3 border border-white/5"><div className="text- opacity-40 tracking-widest">GIORNI</div><div className="font-bold mt-1">4 / week</div></div>
                <div className="bg-black/40 rounded-2xl p-3 border border-white/5"><div className="text- opacity-40 tracking-widest">FOCUS</div><div className="font-bold mt-1">Glutei</div></div>
                <div className="bg-black/40 rounded-2xl p-3 border border-white/5"><div className="text- opacity-40 tracking-widest">PROG</div><div className="font-bold mt-1">68%</div></div>
              </div>
              <button className="mt-5 w-full border border-white/15 rounded-full py-3 text- tracking-[0.1em] hover:bg-white hover:text-black transition">APRI WORKOUT</button>
            </div>
          ))}
          {plans.length===0 && <div className="bg-white/[0.03] border border-white/5 rounded- p-12 text-center opacity-40 text-sm">Nessun piano — il coach deve assegnartene uno da Builder → Plans</div>}
        </div>
      </div>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Anton&display=swap');.font-black{font-family:Anton,sans-serif}`}</style>
    </div>
  )
}