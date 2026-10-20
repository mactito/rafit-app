'use client'
import { useState, useEffect } from 'react'
import { Play, Check, TrendingUp } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function ClientApp({ user, setVideoModal, setToast }: any) {
  const [plans, setPlans] = useState<any[]>([])
  const [activePlan, setActivePlan] = useState<any>(null)
  const [days, setDays] = useState<any[]>([])
  const [activeDayIdx, setActiveDayIdx] = useState(0)
  const [completed, setCompleted] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.id) return
    loadClientPlans()
  }, [user?.id])

  const loadClientPlans = async () => {
    setLoading(true)
    // Get plans where client_id = user.id OR user_id = user.id (covers both schemas)
    let { data: plansData } = await supabase.from('workout_plans').select('*').eq('client_id', user.id).order('created_at', { ascending: false })
    if (!plansData?.length) {
      const { data: byUserId } = await supabase.from('workout_plans').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
      plansData = byUserId || []
    }
    if (!plansData?.length) {
      const { data: byProfile } = await supabase.from('workout_plans').select('*').eq('profile_id', user.id).order('created_at', { ascending: false })
      plansData = byProfile || []
    }
    
    setPlans(plansData || [])
    if (plansData && plansData.length > 0) {
      setActivePlan(plansData[0])
      await loadDays(plansData[0].id)
    }
    setLoading(false)
  }

  const loadDays = async (planId: string) => {
    const { data: daysData } = await supabase.from('workout_days').select('*, exercises(*)').eq('plan_id', planId).order('day_number')
    if (daysData) {
      // Also try with workout_plan_id if plan_id fails
      if (daysData.length === 0) {
        const { data: altDays } = await supabase.from('workout_days').select('*, exercises(*)').eq('workout_plan_id', planId).order('day_number')
        setDays(altDays || [])
      } else {
        setDays(daysData)
      }
    }
  }

  const toggleComplete = (exId: string) => {
    const next = new Set(completed)
    if (next.has(exId)) next.delete(exId)
    else next.add(exId)
    setCompleted(next)
  }

  const logWorkout = async () => {
    if (!activePlan) return
    // Save to workout_logs + exercise_logs if you have them
    await supabase.from('workout_logs').insert({ plan_id: activePlan.id, user_id: user.id, day_number: days[activeDayIdx]?.day_number }).catch(()=>{})
    setToast(`Day ${activeDayIdx+1} logged! 🔥`)
    setTimeout(()=>setToast(null), 3000)
  }

  if (loading) return <div className="min-h- flex items-center justify-center text-white/40 text-sm">Loading your program...</div>

  if (plans.length === 0) {
    return (
      <div className="min-h- flex flex-col items-center justify-center p-6">
        <div className="w-16 h-16 rounded-full bg-[#1E1E1E] flex items-center justify-center mb-4 text-2xl">🏋️</div>
        <h3 className="text- font-semibold">Nessun piano ancora</h3>
        <p className="text- text-white/40 mt-1 text-center max-w-">Il tuo coach non ti ha ancora assegnato un programma. Contattalo.</p>
        <p className="text- text-white/20 mt-4 font-mono">user: {user.id.slice(0,8)}</p>
      </div>
    )
  }

  const activeDay = days[activeDayIdx]
  const dayExercises = activeDay?.exercises || []

  return (
    <div className="w-full space-y-5 pb-24">
      {/* HEADER */}
      <div className="flex items-end justify-between">
        <div>
          <h2 className="serif text- md:text- leading-[0.9]">YOUR<br/><span className="text-[#FF4D8D] italic">PROGRAM</span></h2>
          <p className="text- text-white/40 mt-2">{activePlan?.name} • {activePlan?.goal_tag || 'Focus'}</p>
        </div>
        <div className="text-right">
          <div className="text- text-white/40">PROGRESS</div>
          <div className="text- font-bold">{completed.size}/{dayExercises.length}</div>
        </div>
      </div>

      {/* PLAN SELECTOR if multiple */}
      {plans.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {plans.map((p:any)=>(
            <button key={p.id} onClick={async()=>{setActivePlan(p); await loadDays(p.id); setActiveDayIdx(0); setCompleted(new Set())}} className={`shrink-0 h- px-4 rounded-full text- font-medium border ${activePlan?.id===p.id?'bg-white text-black border-white':'bg-[#1E1E1E] border-white/10 text-white/70'}`}>{p.name}</button>
          ))}
        </div>
      )}

      {/* DAY TABS */}
      <div className="bg-[#121212] rounded- border border-white/[0.08] p-3">
        <div className="flex gap-2 overflow-x-auto scrollbar-none">
          {days.map((d:any,i:number)=>(
            <button key={d.id || i} onClick={()=>{setActiveDayIdx(i); setCompleted(new Set())}} className={`shrink-0 h- px-5 rounded-full text- font-bold tracking-wide whitespace-nowrap transition ${i===activeDayIdx?'bg-[#FF4D8D] text-black':'bg-[#1E1E1E] border border-white/10 text-white/60'}`}>
              DAY {d.day_number} • {d.day_name?.split('-')[0] || d.focus || ''}
            </button>
          ))}
        </div>
      </div>

      {/* EXERCISES */}
      <div className="bg-[#121212] rounded- border border-white/[0.08] p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text- font-bold tracking-wide">{activeDay?.day_name || `DAY ${activeDayIdx+1}`} • {dayExercises.length} EX</h3>
          <button onClick={logWorkout} className="h- px-5 rounded-full bg-white text-black text- font-bold flex items-center gap-1.5"><Check className="w-3.5 h-3.5"/> COMPLETE DAY</button>
        </div>

        <div className="space-y-3">
          {dayExercises.map((ex:any)=> {
            const isDone = completed.has(ex.id)
            return (
              <div key={ex.id} className={`border rounded- p-3.5 flex gap-3 items-center transition ${isDone?'bg-[#FF4D8D]/10 border-[#FF4D8D]/30':'bg-[#080808] border-white/[0.06]'}`}>
                <button onClick={()=>toggleComplete(ex.id)} className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border transition ${isDone?'bg-[#FF4D8D] border-[#FF4D8D] text-black':'bg-[#1E1E1E] border-white/10 text-white/30'}`}>
                  <Check className="w-4 h-4"/>
                </button>
                <div className="flex-1 min-w-0">
                  <div className={`text- font-medium truncate ${isDone?'line-through text-white/50':''}`}>{ex.name}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text- bg-white/10 px-2 py-0.5 rounded-full">{ex.sets} x {ex.reps}</span>
                    <span className="text- text-white/30">{ex.rest || '90s'} rest</span>
                  </div>
                </div>
                {ex.video_url && (
                  <button onClick={()=>setVideoModal(ex)} className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center shrink-0"><Play className="w-3.5 h-3.5 fill-black"/></button>
                )}
              </div>
            )
          })}
          {dayExercises.length===0 && <div className="py-12 text-center text-xs text-white/30 border border-dashed border-white/10 rounded-">No exercises for this day</div>}
        </div>
      </div>

      {/* QUICK CHECK IN LINK */}
      <div className="bg-gradient-to-br from-[#FF4D8D]/20 to-[#FF4D8D]/5 border border-[#FF4D8D]/20 rounded- p-4 flex items-center justify-between">
        <div>
          <div className="text- font-bold flex items-center gap-2"><TrendingUp className="w-4 h-4 text-[#FF4D8D]"/> Check-in settimanale</div>
          <div className="text- text-white/50 mt-1">Peso, foto, misure</div>
        </div>
        <div className="text- bg-[#FF4D8D] text-black px-4 py-2 rounded-full font-bold">Vai →</div>
      </div>
    </div>
  )
}