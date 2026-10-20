'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

// SAFE IMPORTS - works whether components use default or named export
import * as CoachMod from '@/components/CoachBuilder'
import * as ClientMod from '@/components/ClientApp'
import * as VideoMod from '@/components/VideoModal'
import * as BeforeMod from '@/components/BeforeAfterSlider'
import * as WeightMod from '@/components/WeightChart'

const CoachBuilder = (CoachMod as any).CoachBuilder || (CoachMod as any).default
const ClientApp = (ClientMod as any).default || (ClientMod as any).ClientApp
const VideoModal = (VideoMod as any).VideoModal || (VideoMod as any).default
const BeforeAfterSlider = (BeforeMod as any).BeforeAfterSlider || (BeforeMod as any).default
const WeightChart = (WeightMod as any).WeightChart || (WeightMod as any).default

export default function Page() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'home'|'builder'|'checkin'>('home')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [clients, setClients] = useState<any[]>([])
  const [library, setLibrary] = useState<any[]>([])
  const [days, setDays] = useState<any[]>([
    { tempId: 'd1', day_number: 1, day_name: 'DAY 1 - GLUTEI', focus: 'GLUTEI FOCUS', exercises: [] },
    { tempId: 'd2', day_number: 2, day_name: 'DAY 2 - GAMBE', focus: 'GAMBE', exercises: [] },
    { tempId: 'd3', day_number: 3, day_name: 'DAY 3 - SPALLE', focus: 'SPALLE', exercises: [] },
  ])
  const [activeDayIdx, setActiveDayIdx] = useState(0)
  const [planName, setPlanName] = useState('')
  const [selectedClient, setSelectedClient] = useState('')
  const [goal, setGoal] = useState('glutei')
  const [toast, setToast] = useState<string|null>(null)
  const [videoModal, setVideoModal] = useState<any>(null)
  const [checkins, setCheckins] = useState<any[]>([])

  useEffect(()=>{ checkUser() },[])

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if(session?.user){ setUser(session.user); await loadData() }
    setLoading(false)
  }

  const loadData = async () => {
    const { data: lib } = await supabase.from('exercise_library').select('*').order('name')
    if(lib) setLibrary(lib)
    const { data: profs } = await supabase.from('profiles').select('*').order('created_at',{ascending:false}).limit(50)
    if(profs) setClients(profs)
    const { data: checks } = await supabase.from('check_ins').select('*').order('created_at',{ascending:false}).limit(20)
    if(checks) setCheckins(checks)
  }

  const handleLogin = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if(error) alert(error.message)
    else { setUser(data.user); await loadData() }
  }

  const handleLogout = async () => { await supabase.auth.signOut(); setUser(null) }

  if(loading) return <div className="min-h-screen bg-[#080808] flex items-center justify-center text-white/40 text-sm">Loading RAFIT...</div>

  if(!user){
    return (
      <div className="min-h-screen bg-[#080808] text-white flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <h1 className="text- leading-[0.9] font-serif">RAFIT<br/><span className="text-[#FF4D8D] italic">ULTRA</span></h1>
          <div className="space-y-3 mt-8">
            <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" className="w-full h- rounded- bg-[#121212] border border-white/10 px-5 text-"/>
            <input value={password} onChange={e=>setPassword(e.target.value)} type="password" placeholder="Password" className="w-full h- rounded- bg-[#121212] border border-white/10 px-5 text-"/>
            <button onClick={handleLogin} className="w-full h- rounded-full bg-[#FF4D8D] text-black font-bold text-">LOGIN</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#080808] text-white">
      <div className="sticky top-0 z-40 bg-[#080808]/80 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w- mx-auto px-4 md:px-6 h- flex items-center justify-between">
          <h1 className="text- font-serif">RAFIT</h1>
          <div className="flex gap-2">
            <button onClick={()=>setView('home')} className={`h- px-4 rounded-full text- font-bold ${view==='home'?'bg-white text-black':'bg-[#1E1E1E] text-white/60'}`}>HOME</button>
            <button onClick={()=>setView('builder')} className={`h- px-4 rounded-full text- font-bold ${view==='builder'?'bg-white text-black':'bg-[#1E1E1E] text-white/60'}`}>BUILDER</button>
            <button onClick={()=>setView('checkin')} className={`h- px-4 rounded-full text- font-bold ${view==='checkin'?'bg-white text-black':'bg-[#1E1E1E] text-white/60'}`}>CHECK-IN</button>
            <button onClick={handleLogout} className="h- px-4 rounded-full bg-[#1E1E1E] border border-white/10 text-">LOGOUT</button>
          </div>
        </div>
      </div>

      <div className="max-w- mx-auto px-4 md:px-6 py-6">
        {view==='home' && <ClientApp user={user} setVideoModal={setVideoModal} setToast={setToast} />}
        {view==='builder' && <CoachBuilder user={user} clients={clients} library={library} days={days} setDays={setDays} activeDayIdx={activeDayIdx} setActiveDayIdx={setActiveDayIdx} planName={planName} setPlanName={setPlanName} selectedClient={selectedClient} setSelectedClient={setSelectedClient} goal={goal} setGoal={setGoal} setToast={setToast} setVideoModal={setVideoModal} loadData={loadData} />}
        {view==='checkin' && (
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-[#121212] rounded- border border-white/10 p-5"><WeightChart data={checkins} /></div>
            <div className="bg-[#121212] rounded- border border-white/10 p-5"><BeforeAfterSlider /></div>
          </div>
        )}
      </div>

      {videoModal && <VideoModal video={videoModal} onClose={()=>setVideoModal(null)} />}
      {toast && <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white text-black px-5 py-3 rounded-full text- font-bold z-50">{toast}</div>}
    </div>
  )
}