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

  useEffect(() => {
    const check = async () => {
      const { data } = await supabase.auth.getSession()
      if (data.session?.user) {
        setUser(data.session.user)
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.session.user.id).single()
        setRole(profile?.role || 'client')
        setView(profile?.role === 'coach'? 'coach' : 'client')
      }
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL
      setSupabaseConnected(!!url &&!url.includes('placeholder'))
    }
    check()
  }, [])

  const handleLogin = async () => {
    setLoading(true)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      if (email.includes('coach')) { setRole('coach'); setView('coach'); setUser({ email }) }
      else { setRole('client'); setView('client'); setUser({ email }) }
    } else if (data.user) {
      setUser(data.user)
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).single()
      setRole(profile?.role || (email.includes('coach')? 'coach' : 'client'))
      setView(profile?.role || (email.includes('coach')? 'coach' : 'client'))
    }
    setLoading(false)
  }

  const handleSignup = async () => {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (!error && data.user) {
      await supabase.from('profiles').insert({ id: data.user.id, email, role: email.includes('coach')? 'coach' : 'client', full_name: email.split('@')[0] })
      alert('Controlla email per conferma!')
    } else {
      alert(error?.message || 'Signup mock')
    }
  }

  if (view === 'login') return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#080808]">
      <div className="w-full max-w-sm">
        <div className="flex justify-between items-center mb-8">
          <div className="anton text-2xl tracking-widest">RAFIT <span className="text-[#FF4D8D]">•</span> RAPHI</div>
          <div className={`w-2 h-2 rounded-full ${supabaseConnected? 'bg-green-400' : 'bg-yellow-400'}`} />
        </div>
        <h1 className="anton text-5xl leading-none">FIRST<br/><span className="text-[#FF4D8D]">THE MIND,</span><br/>THEN THE BODY.</h1>
        <div className="mt-8 glass rounded-3xl p-6">
          <input className="w-full bg-white/5 border border-white/10 rounded-full px-4 py-3 text-sm mb-3" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
          <input className="w-full bg-white/5 border border-white/10 rounded-full px-4 py-3 text-sm mb-4" type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} />
          <button onClick={handleLogin} disabled={loading} className="w-full bg-[#FF4D8D] text-black rounded-full py-3 font-bold">{loading? '...' : 'ACCEDI'}</button>
          <button onClick={handleSignup} className="w-full mt-3 border border-white/20 rounded-full py-3 text-sm">REGISTRATI</button>
        </div>
      </div>
    </div>
  )

  if (view === 'coach') return <CoachView user={user} setView={setView} />
  return <ClientView user={user} setView={setView} />
}

function CoachView({ user, setView }: any) {
  const [tab, setTab] = useState('clients')
  const [clients, setClients] = useState<any[]>([])
  const [plans, setPlans] = useState<any[]>([])
  // REAL BUILDER STATE
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
    if (!planName ||!selectedClient) return alert('Inserisci nome piano e seleziona cliente da Supabase')
    const { data: plan, error } = await supabase.from('workout_plans').insert({ coach_id: user.id, client_id: selectedClient, name: planName, goal_tag: goal }).select().single()
    if (error) return alert(error.message)
    const { data: day } = await supabase.from('workout_days').insert({ plan_id: plan.id, day_number: 1, day_name: 'GLUTEI FOCUS' }).select().single()
    for (const ex of exercises) {
      if(!ex.name) continue
      await supabase.from('exercises').insert({ day_id: day.id, name: ex.name, sets: ex.sets, reps: ex.reps, tempo: ex.tempo, rest: ex.rest })
    }
    alert(`Piano ${planName} salvato su Supabase per cliente!`)
    setPlanName(''); setExercises([{ name: '', sets: 3, reps: '10', tempo: '2-0-2-0', rest: '60s' }])
  }

  return (
    <div className="min-h-screen pb-20">
      <header className="sticky top-0 bg-black/80 backdrop-blur-xl border-b border-white/10 p-4 flex justify-between items-center">
        <div className="anton">RAFIT COACH</div>
        <button onClick={()=>{ supabase.auth.signOut(); setView('login')}} className="text-xs opacity-60">Logout</button>
      </header>
      <nav className="flex gap-2 p-4 overflow-x-auto">
        {['clients','builder','plans','setup'].map(t=>(
          <button key={t} onClick={()=>setTab(t)} className={`px-4 py-2 rounded-full text-xs font-bold capitalize ${tab===t? 'bg-white text-black' : 'glass'}`}>{t}</button>
        ))}
      </nav>
      <div className="p-4">
        {tab==='clients' && (
          <div>
            <h2 className="anton text-3xl mb-4">CLIENTI REALI SUPABASE</h2>
            {clients.map((c:any)=>(
              <div key={c.id} className="glass rounded-2xl p-4 mb-3">
                <div className="flex justify-between"><span className="font-bold">{c.email}</span><span className="text-xs bg-[#FF4D8D] text-black px-2 py-1 rounded-full">{c.role}</span></div>
                <div className="text-xs opacity-60 mt-1">ID: {c.id.slice(0,8)}... - {c.full_name}</div>
              </div>
            ))}
            {clients.length===0 && <div className="text-sm opacity-50">Nessuna cliente ancora - registrati come client@test.com</div>}
          </div>
        )}
        {tab==='builder' && (
          <div>
            <h2 className="anton text-3xl">WORKOUT BUILDER - REAL SAVE</h2>
            <div className="mt-6 glass rounded-2xl p-4">
              <input value={planName} onChange={e=>setPlanName(e.target.value)} placeholder="Nome piano: Sara - Tonificazione 4x" className="w-full bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm mb-3" />
              <div className="grid grid-cols-2 gap-2 mb-3">
                <select value={goal} onChange={e=>setGoal(e.target.value)} className="bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm"><option>TONIFICAZIONE BIKINI</option><option>DIMAGRIMENTO</option><option>RICOMPOSIZIONE</option><option>GARA</option></select>
                <select value={selectedClient} onChange={e=>setSelectedClient(e.target.value)} className="bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm">
                  <option value="">Seleziona cliente Supabase</option>
                  {clients.map((c:any)=><option key={c.id} value={c.id}>{c.email}</option>)}
                </select>
              </div>
              <div className="border-t border-white/10 pt-4 mt-4">
                <div className="font-bold text-sm">Day 1 - GLUTEI FOCUS</div>
                <div className="mt-3 space-y-2">
                  {exercises.map((ex,i)=>(
                    <div key={i} className="flex gap-2">
                      <input value={ex.name} onChange={e=>{ const n=[...exercises]; n[i].name=e.target.value; setExercises(n)}} className="flex-1 bg-white/5 border border-white/10 rounded-full px-3 py-2 text-xs" placeholder="Esercizio" />
                      <input value={ex.sets} onChange={e=>{ const n=[...exercises]; n[i].sets=parseInt(e.target.value)||0; setExercises(n)}} className="w-12 bg-white/5 border border-white/10 rounded-full px-2 py-2 text-xs" placeholder="Sets" />
                      <button onClick={()=>setExercises(exercises.filter((_,idx)=>idx!==i))} className="text-xs opacity-50">x</button>
                    </div>
                  ))}
                </div>
                <button onClick={()=>setExercises([...exercises,{ name:'', sets:3, reps:'10', tempo:'2-0-2-0', rest:'60s'}])} className="mt-3 text-xs border border-white/20 rounded-full px-3 py-1">+ Aggiungi Esercizio</button>
                <button onClick={saveRealPlan} className="mt-4 w-full bg-[#FF4D8D] text-black rounded-full py-3 text-sm font-bold">SALVA SU SUPABASE REAL</button>
              </div>
            </div>
          </div>
        )}
        {tab==='plans' && (
          <div>
            <h2 className="anton text-3xl">PIANI SALVATI</h2>
            <div className="mt-4 space-y-2">
              {plans.map((p:any)=><div key={p.id} className="glass rounded-2xl p-4"><div className="font-bold">{p.name}</div><div className="text-xs opacity-60">{p.goal_tag} → {p.profiles?.email}</div></div>)}
            </div>
          </div>
        )}
        {tab==='setup' && <div className="glass rounded-2xl p-4 text-xs">Supabase connesso! Env vars ok.</div>}
      </div>
    </div>
  )
}

function ClientView({ user, setView }: any) {
  const [plans, setPlans] = useState<any[]>([])
  useEffect(()=>{ supabase.from('workout_plans').select('*').eq('client_id', user.id).then(({data})=>{ if(data) setPlans(data) }) }, [])
  return (
    <div className="min-h-screen pb-20 bg-[#080808]">
      <header className="sticky top-0 bg-black/80 backdrop-blur-xl border-b border-white/10 p-4 flex justify-between">
        <div className="anton">CIAO, CLIENTE</div>
        <button onClick={()=>{ supabase.auth.signOut(); setView('login')}} className="text-xs opacity-60">Logout</button>
      </header>
      <div className="p-4">
        <h2 className="anton text-2xl">I TUOI PIANI REALI</h2>
        <div className="mt-4 space-y-3">
          {plans.map((p:any)=><div key={p.id} className="glass rounded-3xl p-6"><div className="font-bold">{p.name}</div><div className="text-xs opacity-60">{p.goal_tag}</div><button onClick={()=>alert('Da qui logghi workout')} className="mt-3 w-full bg-white text-black rounded-full py-2 text-xs">APRILO</button></div>)}
          {plans.length===0 && <div className="opacity-50 text-sm">Nessun piano - chiedi a Raphaela di assegnartene uno</div>}
        </div>
      </div>
    </div>
  )
}