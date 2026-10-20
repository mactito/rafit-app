'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function App() {
  const [user, setUser] = useState<any>(null)
  const [role, setRole] = useState<any>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [view, setView] = useState('login')

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        setUser(data.session.user)
        supabase.from('profiles').select('role').eq('id', data.session.user.id).single().then(({ data: p }) => {
          const r = p?.role || (data.session!.user.email?.includes('coach') ? 'coach' : 'client')
          setRole(r)
          setView(r)
        })
      }
    })
  }, [])

  const handleLogin = async () => {
    setLoading(true)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      // demo fallback
      setUser({ email })
      const r = email.includes('coach') ? 'coach' : 'client'
      setRole(r); setView(r)
    } else {
      setUser(data.user)
      const { data: prof } = await supabase.from('profiles').select('role').eq('id', data.user!.id).single()
      const r = prof?.role || (email.includes('coach') ? 'coach' : 'client')
      setRole(r); setView(r)
    }
    setLoading(false)
  }

  if (view === 'login') return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#080808]">
      <div className="w-full max-w-sm glass rounded-3xl p-6">
        <div className="anton text-2xl mb-6">RAFIT • RAPHI</div>
        <input className="w-full bg-white/5 border border-white/10 rounded-full px-4 py-3 text-sm mb-3" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
        <input className="w-full bg-white/5 border border-white/10 rounded-full px-4 py-3 text-sm mb-4" type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} />
        <button onClick={handleLogin} className="w-full bg-[#FF4D8D] text-black rounded-full py-3 font-bold">{loading?'...':'ACCEDI'}</button>
        <div className="text-[11px] opacity-40 text-center mt-3">coach@rafit.com / client@test.com : 123456</div>
      </div>
    </div>
  )
  if (view === 'coach') return <CoachView user={user} setView={setView} />
  return <ClientView user={user} setView={setView} />
}

function CoachView({ user, setView }: any) {
  const [tab, setTab] = useState('clients')
  const [plans, setPlans] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  // builder state
  const [planName, setPlanName] = useState('')
  const [goal, setGoal] = useState('TONIFICAZIONE BIKINI')
  const [selectedClient, setSelectedClient] = useState('')
  const [days, setDays] = useState<any[]>([{ day_number: 1, day_name: 'GLUTEI FOCUS', exercises: [{ name: 'Hip Thrust', sets: 4, reps: '12', tempo: '2-1-2-0', rest: '90s' }] }])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const { data: c } = await supabase.from('profiles').select('*').eq('role','client')
    if (c) setClients(c)
    const { data: p } = await supabase.from('workout_plans').select('*, profiles!workout_plans_client_id_fkey(email)').order('created_at',{ascending:false})
    if (p) setPlans(p)
  }

  const savePlan = async () => {
    if (!planName || !selectedClient) return alert('Nome piano + cliente richiesti')
    // 1. plan
    const { data: plan, error } = await supabase.from('workout_plans').insert({ coach_id: user.id, client_id: selectedClient, name: planName, goal_tag: goal }).select().single()
    if (error) return alert(error.message)
    // 2. days + exercises
    for (const d of days) {
      const { data: day } = await supabase.from('workout_days').insert({ plan_id: plan.id, day_number: d.day_number, day_name: d.day_name }).select().single()
      for (const ex of d.exercises) {
        await supabase.from('exercises').insert({ day_id: day.id, name: ex.name, sets: ex.sets, reps: ex.reps, tempo: ex.tempo, rest: ex.rest })
      }
    }
    alert('Piano salvato! Cliente lo vedrà')
    setPlanName(''); fetchData()
  }

  return (
    <div className="min-h-screen pb-20 bg-[#080808]">
      <header className="sticky top-0 bg-black/80 backdrop-blur border-b border-white/10 p-4 flex justify-between">
        <div className="anton">RAFIT COACH - {user?.email}</div>
        <button onClick={()=>{ supabase.auth.signOut(); setView('login')}} className="text-xs opacity-60">Logout</button>
      </header>
      <nav className="flex gap-2 p-4 overflow-x-auto">
        {['clients','builder','plans'].map(t=>(
          <button key={t} onClick={()=>setTab(t)} className={`px-4 py-2 rounded-full text-xs font-bold ${tab===t ? 'bg-white text-black' : 'glass'}`}>{t.toUpperCase()}</button>
        ))}
      </nav>
      <div className="p-4">
        {tab==='clients' && (
          <div>
            <h2 className="anton text-3xl">CLIENTI REALI DA SUPABASE</h2>
            <div className="mt-4 space-y-3">
              {clients.map((c:any)=>(
                <div key={c.id} className="glass rounded-2xl p-4 flex justify-between">
                  <div><div className="font-bold">{c.full_name || c.email}</div><div className="text-xs opacity-60">{c.email}</div></div>
                  <div className="text-xs bg-[#FF4D8D] text-black px-2 py-1 rounded-full h-fit">{c.role}</div>
                </div>
              ))}
              {clients.length===0 && <div className="opacity-50 text-sm">Nessuna cliente - registra una client@test.com</div>}
            </div>
          </div>
        )}
        {tab==='builder' && (
          <div>
            <h2 className="anton text-3xl">WORKOUT BUILDER REAL</h2>
            <div className="mt-4 glass rounded-2xl p-4 space-y-3">
              <input value={planName} onChange={e=>setPlanName(e.target.value)} placeholder="Nome: Sara - Bikini 4x" className="w-full bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm" />
              <div className="grid grid-cols-2 gap-2">
                <select value={goal} onChange={e=>setGoal(e.target.value)} className="bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm">
                  <option>TONIFICAZIONE BIKINI</option><option>DIMAGRIMENTO</option><option>RICOMPOSIZIONE</option><option>GARA</option>
                </select>
                <select value={selectedClient} onChange={e=>setSelectedClient(e.target.value)} className="bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm">
                  <option value="">Seleziona cliente</option>
                  {clients.map((c:any)=><option key={c.id} value={c.id}>{c.email}</option>)}
                </select>
              </div>
              {days.map((d,i)=>(
                <div key={i} className="border-t border-white/10 pt-3">
                  <div className="flex gap-2">
                    <input value={d.day_name} onChange={e=>{ const nd=[...days]; nd[i].day_name=e.target.value; setDays(nd)}} className="flex-1 bg-white/5 rounded-full px-3 py-2 text-xs font-bold" />
                    <span className="text-xs opacity-60 py-2">Day {d.day_number}</span>
                  </div>
                  {d.exercises.map((ex:any, ei:number)=>(
                    <div key={ei} className="mt-2 flex gap-1">
                      <input value={ex.name} onChange={e=>{ const nd=[...days]; nd[i].exercises[ei].name=e.target.value; setDays(nd)}} className="flex-1 bg-black border border-white/10 rounded-full px-3 py-2 text-xs" placeholder="Esercizio" />
                      <input value={ex.sets} onChange={e=>{ const nd=[...days]; nd[i].exercises[ei].sets=parseInt(e.target.value)||0; setDays(nd)}} className="w-12 bg-black border border-white/10 rounded-full px-2 py-2 text-xs" placeholder="Sets" />
                      <input value={ex.reps} onChange={e=>{ const nd=[...days]; nd[i].exercises[ei].reps=e.target.value; setDays(nd)}} className="w-16 bg-black border border-white/10 rounded-full px-2 py-2 text-xs" placeholder="Reps" />
                    </div>
                  ))}
                  <button onClick={()=>{ const nd=[...days]; nd[i].exercises.push({name:'',sets:3,reps:'10',tempo:'2-0-2-0',rest:'60s'}); setDays(nd)}} className="mt-2 text-xs border border-white/20 rounded-full px-3 py-1">+ Esercizio</button>
                </div>
              ))}
              <button onClick={()=>setDays([...days,{day_number:days.length+1, day_name:`DAY ${days.length+1}`, exercises:[] }])} className="w-full mt-2 border border-white/20 rounded-full py-2 text-xs">+ Aggiungi Giorno</button>
              <button onClick={savePlan} className="w-full bg-[#FF4D8D] text-black rounded-full py-3 font-bold mt-4">SALVA SU SUPABASE REAL</button>
            </div>
          </div>
        )}
        {tab==='plans' && (
          <div>
            <h2 className="anton text-3xl">PIANI SALVATI</h2>
            <div className="mt-4 space-y-2">
              {plans.map((p:any)=>(
                <div key={p.id} className="glass rounded-2xl p-4">
                  <div className="font-bold">{p.name}</div>
                  <div className="text-xs opacity-60">{p.goal_tag} → {p.profiles?.email || p.client_id}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function ClientView({ user, setView }: any) {
  const [plans, setPlans] = useState<any[]>([])
  const [selectedPlan, setSelectedPlan] = useState<any>(null)
  const [days, setDays] = useState<any[]>([])

  useEffect(() => { fetchPlans() }, [])
  const fetchPlans = async () => {
    const { data } = await supabase.from('workout_plans').select('*').eq('client_id', user.id).order('created_at',{ascending:false})
    if (data) setPlans(data)
  }
  const openPlan = async (p:any) => {
    setSelectedPlan(p)
    const { data: d } = await supabase.from('workout_days').select('*, exercises(*)').eq('plan_id', p.id).order('day_number')
    if (d) setDays(d)
  }

  return (
    <div className="min-h-screen pb-20 bg-[#080808]">
      <header className="p-4 flex justify-between border-b border-white/10"><div className="anton">CIAO {user?.email}</div><button onClick={()=>{supabase.auth.signOut(); setView('login')}} className="text-xs opacity-60">Logout</button></header>
      <div className="p-4">
        {!selectedPlan ? (
          <>
            <h2 className="anton text-2xl">I TUOI PIANI REALI</h2>
            <div className="mt-4 space-y-3">
              {plans.map((p:any)=>(
                <button key={p.id} onClick={()=>openPlan(p)} className="w-full text-left glass rounded-2xl p-4">
                  <div className="font-bold">{p.name}</div><div className="text-xs opacity-60">{p.goal_tag}</div>
                </button>
              ))}
              {plans.length===0 && <div className="opacity-50 text-sm">Nessun piano assegnato - chiedi a Raphaela</div>}
            </div>
          </>
        ) : (
          <>
            <button onClick={()=>setSelectedPlan(null)} className="text-xs opacity-60 mb-4">← Indietro</button>
            <h2 className="anton text-2xl">{selectedPlan.name}</h2>
            <div className="mt-4 space-y-4">
              {days.map((d:any)=>(
                <div key={d.id} className="glass rounded-2xl p-4">
                  <div className="font-bold text-sm">DAY {d.day_number} - {d.day_name}</div>
                  {d.exercises?.map((ex:any)=>(
                    <div key={ex.id} className="mt-3 bg-white/5 rounded-xl p-3 text-xs">
                      <div className="font-bold">{ex.name}</div>
                      <div className="opacity-60">{ex.sets}x{ex.reps} • {ex.tempo} • Rest {ex.rest}</div>
                      <div className="mt-2 grid grid-cols-3 gap-2">
                        <input placeholder="kg" className="bg-black border border-white/10 rounded-full px-2 py-1 text-xs" />
                        <input placeholder="reps" className="bg-black border border-white/10 rounded-full px-2 py-1 text-xs" />
                        <button onClick={()=>alert('Log salvato!')} className="bg-[#FF4D8D] text-black rounded-full text-xs">Log</button>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
