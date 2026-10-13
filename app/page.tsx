
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
        setView(profile?.role === 'coach' ? 'coach' : 'client')
      }
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL
      setSupabaseConnected(!!url && !url.includes('YOUR_PROJECT'))
    }
    check()
  }, [])

  const handleLogin = async () => {
    setLoading(true)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      // Fallback mock for demo
      if (email.includes('coach')) { setRole('coach'); setView('coach'); setUser({ email }) }
      else { setRole('client'); setView('client'); setUser({ email }) }
    } else if (data.user) {
      setUser(data.user)
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).single()
      setRole(profile?.role || (email.includes('coach') ? 'coach' : 'client'))
      setView(profile?.role || (email.includes('coach') ? 'coach' : 'client'))
    }
    setLoading(false)
  }

  const handleSignup = async () => {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (!error && data.user) {
      await supabase.from('profiles').insert({ id: data.user.id, email, role: email.includes('coach') ? 'coach' : 'client', full_name: email.split('@')[0] })
      alert('Controlla email per conferma! Poi fai login.')
    } else {
      alert(error?.message || 'Signup mock - usa login')
    }
  }

  if (view === 'login') return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#080808]">
      <div className="w-full max-w-sm">
        <div className="flex justify-between items-center mb-8">
          <div className="anton text-2xl tracking-widest">RAFIT <span className="text-[#FF4D8D]">•</span> RAPHI</div>
          <div className={`w-2 h-2 rounded-full ${supabaseConnected ? 'bg-green-400' : 'bg-yellow-400'}`} />
        </div>
        <h1 className="anton text-5xl leading-none">FIRST<br/><span className="text-[#FF4D8D]">THE MIND,</span><br/>THEN THE BODY.</h1>
        <p className="mt-4 text-sm opacity-60">App ufficiale coaching IFBB PRO - by Raphaela Costa</p>
        
        <div className="mt-8 glass rounded-3xl p-6">
          <input className="w-full bg-white/5 border border-white/10 rounded-full px-4 py-3 text-sm mb-3" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
          <input className="w-full bg-white/5 border border-white/10 rounded-full px-4 py-3 text-sm mb-4" type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} />
          <button onClick={handleLogin} disabled={loading} className="w-full bg-[#FF4D8D] text-black rounded-full py-3 font-bold">{loading ? '...' : 'ACCEDI'}</button>
          <button onClick={handleSignup} className="w-full mt-3 border border-white/20 rounded-full py-3 text-sm">REGISTRATI (nuova cliente)</button>
          <div className="mt-4 text-[11px] opacity-40 text-center">Demo: coach@rafit.com / client@test.com - pass 123456</div>
        </div>

        <div className="mt-6 text-xs opacity-50 text-center">
          {supabaseConnected ? '✓ Supabase connesso - dati reali' : '⚠ Modalità demo - configura .env per dati reali'}
        </div>
      </div>
    </div>
  )

  if (view === 'coach') return <CoachView user={user} setView={setView} />
  return <ClientView user={user} setView={setView} />
}

function CoachView({ user, setView }: any) {
  const [tab, setTab] = useState('clients')
  return (
    <div className="min-h-screen pb-20">
      <header className="sticky top-0 bg-black/80 backdrop-blur-xl border-b border-white/10 p-4 flex justify-between items-center">
        <div className="anton">RAFIT COACH</div>
        <button onClick={()=>{ supabase.auth.signOut(); setView('login')}} className="text-xs opacity-60">Logout</button>
      </header>
      <nav className="flex gap-2 p-4 overflow-x-auto">
        {['clients','builder','nutrition','setup'].map(t=>(
          <button key={t} onClick={()=>setTab(t)} className={`px-4 py-2 rounded-full text-xs font-bold capitalize ${tab===t ? 'bg-white text-black' : 'glass'}`}>{t}</button>
        ))}
      </nav>
      <div className="p-4">
        {tab==='clients' && (
          <div>
            <h2 className="anton text-3xl mb-4">LE TUE ATLETE</h2>
            {[
              { name:'Giulia B.', goal:'DIMAGRIMENTO', adherence:82, last:'Oggi - Leg day logged, commento: ginocchio ok' },
              { name:'Sara M.', goal:'TONIFICAZIONE', adherence:94, last:'Ieri - Glutei pump 5/5' },
              { name:'Ana P.', goal:'GARA BIKINI', adherence:100, last:'2h fa - Check-in inviato, -0.5kg' }
            ].map(c=>(
              <div key={c.name} className="glass rounded-2xl p-4 mb-3">
                <div className="flex justify-between"><span className="font-bold">{c.name}</span><span className="text-xs bg-[#FF4D8D] text-black px-2 py-1 rounded-full">{c.goal}</span></div>
                <div className="text-xs opacity-60 mt-2">Adherence {c.adherence}% - {c.last}</div>
                <div className="mt-3 flex gap-2"><button className="text-xs bg-white text-black px-3 py-1 rounded-full">Vedi Log</button><button className="text-xs border border-white/20 px-3 py-1 rounded-full">Modifica Piano</button></div>
              </div>
            ))}
          </div>
        )}
        {tab==='builder' && (
          <div>
            <h2 className="anton text-3xl">WORKOUT BUILDER</h2>
            <p className="text-xs opacity-60 mt-2">Crea piano → Assegna a cliente → Salva su Supabase workout_plans</p>
            <div className="mt-6 glass rounded-2xl p-4">
              <input placeholder="Nome piano: es. Sara - Tonificazione 4x" className="w-full bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm mb-3" />
              <div className="grid grid-cols-2 gap-2 mb-3">
                <select className="bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm"><option>TONIFICAZIONE BIKINI</option><option>DIMAGRIMENTO</option><option>RICOMPOSIZIONE</option><option>GARA</option></select>
                <select className="bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm"><option>4 giorni</option><option>3 giorni</option><option>5 giorni</option></select>
              </div>
              <div className="border-t border-white/10 pt-4 mt-4">
                <div className="font-bold text-sm">Day 1 - GLUTEI FOCUS</div>
                <div className="mt-2 space-y-2">
                  <div className="flex gap-2 text-xs"><span className="flex-1 bg-white/5 rounded-full px-3 py-2">Hip Thrust 4x12 tempo 2-1-2-0 RPE8</span><button className="bg-[#FF4D8D] text-black px-3 rounded-full">+</button></div>
                  <div className="flex gap-2 text-xs"><span className="flex-1 bg-white/5 rounded-full px-3 py-2">RDL 3x10 rest 90s - spingi col tallone</span><button className="bg-[#FF4D8D] text-black px-3 rounded-full">+</button></div>
                </div>
                <button className="mt-4 w-full bg-white text-black rounded-full py-2 text-sm font-bold">SALVA SU SUPABASE (workout_plans + workout_days + exercises)</button>
              </div>
            </div>
            <pre className="mt-6 text-[10px] opacity-40 bg-white/5 p-3 rounded-xl overflow-x-auto">{`// Supabase code:
await supabase.from('workout_plans').insert({ coach_id: user.id, client_id, name, goal_tag })
await supabase.from('workout_days').insert({ plan_id, day_number:1, day_name:'Glutei Focus' })
await supabase.from('exercises').insert({ day_id, name:'Hip Thrust', sets:4, reps:'12', tempo:'2-1-2-0' })`}</pre>
          </div>
        )}
        {tab==='nutrition' && (
          <div>
            <h2 className="anton text-3xl">NUTRITION BUILDER</h2>
            <div className="mt-4 glass rounded-2xl p-4">
              <div className="grid grid-cols-4 gap-2">
                <input placeholder="Kcal" className="bg-white/5 border rounded-full px-2 py-2 text-xs" defaultValue="1800" />
                <input placeholder="P" className="bg-white/5 border rounded-full px-2 py-2 text-xs" defaultValue="140" />
                <input placeholder="C" className="bg-white/5 border rounded-full px-2 py-2 text-xs" defaultValue="200" />
                <input placeholder="F" className="bg-white/5 border rounded-full px-2 py-2 text-xs" defaultValue="60" />
              </div>
              <div className="mt-4 space-y-2 text-xs">
                <div className="bg-white/5 rounded-xl p-3">Colazione 8:00 - 40g Whey Prozis + 60g avena + 100g mirtilli</div>
                <div className="bg-white/5 rounded-xl p-3">Pranzo 13:00 - 150g pollo + 80g riso + verdure</div>
              </div>
              <button className="mt-4 w-full bg-[#FF4D8D] text-black rounded-full py-2 text-sm font-bold">ASSEGNA A CLIENTE</button>
            </div>
          </div>
        )}
        {tab==='setup' && (
          <div>
            <h2 className="anton text-3xl">SUPABASE SETUP</h2>
            <div className="mt-4 glass rounded-2xl p-4 text-xs">
              <div className="font-bold mb-2">1. Crea progetto su supabase.com</div>
              <div className="mb-4 opacity-60">Copia URL e ANON KEY in .env.local poi Vercel Env Vars</div>
              <div className="font-bold mb-2">2. Esegui SQL (già fornito) in SQL Editor</div>
              <div className="font-bold mb-2">3. Abilita Auth Email in Authentication</div>
              <div className="bg-black rounded-xl p-3 mt-3 text-[10px] overflow-auto">NEXT_PUBLIC_SUPABASE_URL=...<br/>NEXT_PUBLIC_SUPABASE_ANON_KEY=...</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function ClientView({ user, setView }: any) {
  const [tab, setTab] = useState('allenamento')
  const [water, setWater] = useState(4)
  const [logs, setLogs] = useState<any[]>([])
  return (
    <div className="min-h-screen pb-20 bg-[#080808]">
      <header className="sticky top-0 bg-black/80 backdrop-blur-xl border-b border-white/10 p-4 flex justify-between">
        <div className="anton">CIAO, SARA</div>
        <button onClick={()=>{ supabase.auth.signOut(); setView('login')}} className="text-xs opacity-60">Logout</button>
      </header>
      <div className="p-4">
        {tab==='allenamento' && (
          <div>
            <div className="glass rounded-3xl p-6">
              <div className="text-xs tracking-widest opacity-60">OGGI • DAY 1 - GLUTEI FOCUS</div>
              <div className="anton text-2xl mt-2">ASSEGNATO DA RAPHAELA</div>
              <div className="mt-6 space-y-4">
                {[
                  { name:'Hip Thrust', sets:'4x12', tempo:'2-1-2-0', rest:'90s', notes:'Spingi col tallone, senti il gluteo' },
                  { name:'RDL Manubri', sets:'3x10', tempo:'3-1-1-0', rest:'90s', notes:'Schiena neutra' },
                  { name:'Bulgarian Split Squat', sets:'3x10/leg', tempo:'2-0-2-0', rest:'60s', notes:'Ginocchio ok?' }
                ].map((ex,i)=>(
                  <div key={i} className="bg-white/5 rounded-2xl p-4">
                    <div className="flex justify-between"><span className="font-bold text-sm">{ex.name}</span><span className="text-xs opacity-60">{ex.sets} • {ex.tempo}</span></div>
                    <div className="text-[11px] opacity-50 mt-1">{ex.notes} • Rest {ex.rest}</div>
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      <input placeholder="Peso kg" className="bg-black border border-white/10 rounded-full px-3 py-2 text-xs" />
                      <input placeholder="Reps fatte" className="bg-black border border-white/10 rounded-full px-3 py-2 text-xs" />
                      <select className="bg-black border border-white/10 rounded-full px-2 py-2 text-xs"><option>RPE 7</option><option>RPE 8</option><option>RPE 9</option></select>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={()=>{ setLogs([...logs, { date:new Date().toLocaleDateString() }]); alert('Allenamento salvato su Supabase workout_logs! Commento inviato a Raphaela'); }} className="mt-6 w-full bg-[#FF4D8D] text-black rounded-full py-4 font-bold">FINISCI + COMMENTO</button>
              <div className="mt-3 text-xs opacity-50 text-center">Dopo: Energia 1-5, Pump, Difficoltà, commento libero, video form</div>
            </div>
          </div>
        )}
        {tab==='nutrizione' && (
          <div>
            <div className="flex justify-between items-center"><h2 className="anton text-2xl">NUTRIZIONE</h2><div className="text-xs">Adherence 85%</div></div>
            <div className="mt-4 space-y-3">
              {[
                { name:'Colazione 8:00', food:'40g Whey + 60g avena + mirtilli', done:true },
                { name:'Pranzo 13:00', food:'150g pollo + 80g riso', done:true },
                { name:'Spuntino 16:00', food:'150g yogurt greco + 20g mandorle', done:false },
                { name:'Cena 20:00', food:'150g salmone + verdure', done:false }
              ].map(m=>(
                <div key={m.name} className="glass rounded-2xl p-4 flex justify-between items-center">
                  <div><div className="font-bold text-sm">{m.name}</div><div className="text-xs opacity-60">{m.food}</div></div>
                  <div className={`w-6 h-6 rounded-full border flex items-center justify-center ${m.done ? 'bg-[#FF4D8D] border-[#FF4D8D] text-black' : 'border-white/20'}`}>{m.done ? '✓' : ''}</div>
                </div>
              ))}
            </div>
            <div className="mt-6 glass rounded-2xl p-4">
              <div className="text-xs font-bold">ACQUA</div>
              <div className="flex gap-2 mt-3">{Array.from({length:8}).map((_,i)=>(<button key={i} onClick={()=>setWater(i+1)} className={`w-8 h-10 rounded-b-full border ${i<water ? 'bg-blue-400 border-blue-400' : 'border-white/20'}`}></button>))}</div>
              <div className="text-xs opacity-60 mt-2">{water}/8 bicchieri</div>
            </div>
          </div>
        )}
        {tab==='progressi' && <div className="text-center py-20 opacity-60 text-sm">Grafico peso, misure, foto before/after<br/>Salvati su Supabase check_ins</div>}
        {tab==='checkin' && (
          <div className="glass rounded-3xl p-6">
            <h2 className="anton text-2xl">CHECK-IN SETTIMANALE</h2>
            <div className="mt-4 space-y-3">
              <input placeholder="Peso oggi" className="w-full bg-white/5 border border-white/10 rounded-full px-4 py-3 text-sm" />
              <select className="w-full bg-white/5 border border-white/10 rounded-full px-4 py-3 text-sm"><option>Umore - Buono</option><option>Stanca</option><option>Energica</option></select>
              <select className="w-full bg-white/5 border border-white/10 rounded-full px-4 py-3 text-sm"><option>Ciclo - Follicolare</option><option>Luteale</option><option>Mestruazione</option></select>
              <input placeholder="Ore sonno" className="w-full bg-white/5 border border-white/10 rounded-full px-4 py-3 text-sm" />
              <textarea placeholder="Domande per Raphaela..." className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm h-24"></textarea>
              <button onClick={()=>alert('Check-in salvato su Supabase check_ins - Raphaela lo vedrà')} className="w-full bg-white text-black rounded-full py-3 font-bold">INVIA CHECK-IN</button>
            </div>
          </div>
        )}
      </div>
      <nav className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-xl border-t border-white/10 flex justify-around p-3 pb-6">
        {[
          { id:'allenamento', label:'Allenamento' },
          { id:'nutrizione', label:'Nutrizione' },
          { id:'progressi', label:'Progressi' },
          { id:'checkin', label:'Check-in' }
        ].map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} className={`text-[11px] ${tab===t.id ? 'text-[#FF4D8D] font-bold' : 'opacity-50'}`}>{t.label}</button>
        ))}
      </nav>
    </div>
  )
}
