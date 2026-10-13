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
      console.log('SESSION:', data.session)
      if (data.session?.user) {
        setUser(data.session.user)
        const { data: profile, error } = await supabase.from('profiles').select('role').eq('id', data.session.user.id).single()
        console.log('PROFILE:', profile, error)
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
    console.log('Trying login:', email)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      alert(`LOGIN ERROR: ${error.message}\n\nCheck: 1) Password 2) Supabase env vars 3) User confirmed in Supabase dashboard`)
      console.error(error)
      setLoading(false)
      return // <-- NO MORE FAKE LOGIN
    }

    if (data.user) {
      setUser(data.user)
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).single()
      console.log('Logged in profile role:', profile?.role)
      const r = (profile?.role as Role) || 'client'
      setRole(r)
      setView(r === 'coach'? 'coach' : 'client')
    }
    setLoading(false)
  }

  const handleSignup = async () => {
    const inferredRole = email.toLowerCase().includes('mactito') || email.toLowerCase().includes('coach') || email === 'mactito2@gmail.com'? 'coach' : 'client'
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) {
      alert(`SIGNUP ERROR: ${error.message}`)
      return
    }
    if (data.user) {
      const { error: pError } = await supabase.from('profiles').insert({
        id: data.user.id,
        email,
        role: inferredRole,
        full_name: email.split('@')[0]
      })
      if(pError) console.error(pError)
      alert(`Account creato come ${inferredRole}! Controlla email per conferma, poi abilita Auto Confirm in Supabase > Authentication > Users.`)
    }
  }

  if (view === 'login') return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#080808] text-white">
      <div className="w-full max-w-sm">
        <div className="flex justify-between items-center mb-8">
          <div className="anton text-2xl tracking-widest">RAFIT <span className="text-[#FF4D8D]">•</span> RAPHI</div>
          <div className={`w-2 h-2 rounded-full ${supabaseConnected? 'bg-green-400' : 'bg-red-500'}`} title={supabaseConnected? 'Supabase OK' : 'ENV MISSING'} />
        </div>
        <h1 className="anton text-5xl leading-none">FIRST<br/><span className="text-[#FF4D8D]">THE MIND,</span><br/>THEN THE BODY.</h1>
        <div className="mt-8 bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur">
          <input className="w-full bg-white/5 border border-white/10 rounded-full px-4 py-3 text-sm mb-3 text-white" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
          <input className="w-full bg-white/5 border border-white/10 rounded-full px-4 py-3 text-sm mb-4 text-white" type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} />
          <button onClick={handleLogin} disabled={loading} className="w-full bg-[#FF4D8D] text-black rounded-full py-3 font-bold">{loading? '...' : 'ACCEDI'}</button>
          <button onClick={handleSignup} className="w-full mt-3 border border-white/20 rounded-full py-3 text-sm">REGISTRATI</button>
          <div className="mt-4 text- opacity-40 break-all">URL: {process.env.NEXT_PUBLIC_SUPABASE_URL}<br/>KEY: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.slice(0,20)}...</div>
        </div>
      </div>
    </div>
  )

  if (view === 'coach') return <CoachView user={user} setView={setView} />
  return <ClientView user={user} setView={setView} />
}

//... keep your CoachView and ClientView exactly as you had them, but change logout to:
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
    if (!planName ||!selectedClient) return alert('Inserisci nome piano e seleziona cliente')
    const { data: plan, error } = await supabase.from('workout_plans').insert({ coach_id: user.id, client_id: selectedClient, name: planName, goal_tag: goal }).select().single()
    if (error) return alert(error.message)
    const { data: day } = await supabase.from('workout_days').insert({ plan_id: plan.id, day_number: 1, day_name: 'GLUTEI FOCUS' }).select().single()
    for (const ex of exercises) {
      if(!ex.name) continue
      await supabase.from('exercises').insert({ day_id: day.id, name: ex.name, sets: ex.sets, reps: ex.reps, tempo: ex.tempo, rest: ex.rest })
    }
    alert(`Piano ${planName} salvato!`)
  }

  return (
    <div className="min-h-screen pb-20 bg-[#080808] text-white">
      <header className="sticky top-0 bg-black/80 backdrop-blur-xl border-b border-white/10 p-4 flex justify-between items-center">
        <div className="anton">RAFIT COACH - {user.email}</div>
        <button onClick={async ()=>{ await supabase.auth.signOut(); setView('login')}} className="text-xs opacity-60">Logout</button>
      </header>
      <nav className="flex gap-2 p-4 overflow-x-auto">
        {['clients','builder','plans'].map(t=>(
          <button key={t} onClick={()=>setTab(t)} className={`px-4 py-2 rounded-full text-xs font-bold capitalize ${tab===t? 'bg-white text-black' : 'bg-white/10'}`}>{t}</button>
        ))}
      </nav>
      <div className="p-4">
        {tab==='clients' && (
          <div>
            <h2 className="anton text-3xl mb-4">CLIENTI REALI</h2>
            {clients.map((c:any)=>(
              <div key={c.id} className="bg-white/5 rounded-2xl p-4 mb-3">
                <div className="flex justify-between"><span className="font-bold">{c.email}</span><span className="text-xs bg-[#FF4D8D] text-black px-2 py-1 rounded-full">{c.role}</span></div>
                <div className="text-xs opacity-60 mt-1">{c.id.slice(0,8)}</div>
              </div>
            ))}
          </div>
        )}
        {tab==='builder' && (
          <div>
            <h2 className="anton text-3xl">WORKOUT BUILDER</h2>
            <div className="mt-6 bg-white/5 rounded-2xl p-4">
              <input value={planName} onChange={e=>setPlanName(e.target.value)} placeholder="Nome piano" className="w-full bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm mb-3" />
              <div className="grid grid-cols-2 gap-2 mb-3">
                <select value={goal} onChange={e=>setGoal(e.target.value)} className="bg-black border border-white/10 rounded-full px-4 py-2 text-sm"><option>TONIFICAZIONE BIKINI</option><option>DIMAGRIMENTO</option></select>
                <select value={selectedClient} onChange={e=>setSelectedClient(e.target.value)} className="bg-black border border-white/10 rounded-full px-4 py-2 text-sm">
                  <option value="">Seleziona cliente</option>
                  {clients.map((c:any)=><option key={c.id} value={c.id}>{c.email}</option>)}
                </select>
              </div>
              {exercises.map((ex,i)=>(
                <div key={i} className="flex gap-2 mb-2">
                  <input value={ex.name} onChange={e=>{ const n=[...exercises]; n[i].name=e.target.value; setExercises(n)}} className="flex-1 bg-white/5 border border-white/10 rounded-full px-3 py-2 text-xs" placeholder="Esercizio" />
                  <input value={ex.sets as any} onChange={e=>{ const n=[...exercises]; (n[i] as any).sets=parseInt(e.target.value)||0; setExercises(n)}} className="w-12 bg-white/5 border border-white/10 rounded-full px-2 py-2 text-xs" />
                </div>
              ))}
              <button onClick={saveRealPlan} className="mt-4 w-full bg-[#FF4D8D] text-black rounded-full py-3 text-sm font-bold">SALVA SU SUPABASE</button>
            </div>
          </div>
        )}
        {tab==='plans' && <div>{plans.map((p:any)=><div key={p.id} className="bg-white/5 rounded-2xl p-4 mb-2">{p.name} → {p.profiles?.email}</div>)}</div>}
      </div>
    </div>
  )
}

function ClientView({ user, setView }: any) {
  const [plans, setPlans] = useState<any[]>([])
  useEffect(()=>{ if(user?.id) supabase.from('workout_plans').select('*').eq('client_id', user.id).then(({data})=>{ if(data) setPlans(data) }) }, [user])
  return (
    <div className="min-h-screen bg-[#080808] text-white">
      <header className="p-4 flex justify-between border-b border-white/10"><div className="anton">CIAO, {user.email}</div><button onClick={async ()=>{ await supabase.auth.signOut(); setView('login')}} className="text-xs opacity-60">Logout</button></header>
      <div className="p-4">
        <h2 className="anton text-2xl">I TUOI PIANI</h2>
        <div className="mt-4 space-y-3">
          {plans.map((p:any)=><div key={p.id} className="bg-white/5 rounded-3xl p-6"><div className="font-bold">{p.name}</div><div className="text-xs opacity-60">{p.goal_tag}</div></div>)}
          {plans.length===0 && <div className="opacity-50 text-sm">Nessun piano</div>}
        </div>
      </div>
    </div>
  )
}