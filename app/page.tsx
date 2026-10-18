'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

type Exercise = { id: string; name: string; muscle_group?: string; video_url?: string; description?: string }
type Profile = { id: string; full_name?: string; email?: string }
type WorkoutDay = { id: string; workout_plan_id: string; exercise_id: string; sets?: number; reps?: string; order_index?: number; exercise_library?: Exercise }

export default function BuilderPage() {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [clients, setClients] = useState<Profile[]>([])
  const [selectedClient, setSelectedClient] = useState<Profile | null>(null)
  const [planId, setPlanId] = useState<string | null>(null)
  const [program, setProgram] = useState<WorkoutDay[]>([])
  const [showExerciseForm, setShowExerciseForm] = useState(false)
  const [newEx, setNewEx] = useState({ name: '', muscle_group: 'Chest', video_url: '' })

  useEffect(() => { loadAll() }, [])

  const loadAll = async () => {
    const { data: ex } = await supabase.from('exercise_library').select('*').order('name')
    const { data: cl } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
    if (ex) setExercises(ex)
    if (cl) setClients(cl)
  }

  const loadClientProgram = async (client: Profile) => {
    setSelectedClient(client)
    // find or create workout_plan for this client
    let { data: plans } = await supabase.from('workout_plans').select('*').eq('user_id', client.id).limit(1)
    if (!plans?.length) {
      const { data: plansByProfile } = await supabase.from('workout_plans').select('*').eq('profile_id', client.id).limit(1)
      plans = plansByProfile as any
    }
    if (!plans?.length) {
      // create plan
      const { data: newPlan } = await supabase.from('workout_plans').insert({ user_id: client.id, name: `${client.full_name || 'Client'} Program` }).select().single()
      if (newPlan) {
        setPlanId(newPlan.id)
        setProgram([])
        return
      }
    }
    if (plans && plans.length > 0) {
      setPlanId(plans[0].id)
      const { data: days } = await supabase.from('workout_days').select('*, exercise_library(*)').eq('workout_plan_id', plans[0].id).order('order_index')
      if (days) setProgram(days as any)
    }
  }

  const addExerciseToProgram = async (ex: Exercise) => {
    if (!planId) return
    const { data } = await supabase.from('workout_days').insert({
      workout_plan_id: planId,
      exercise_id: ex.id,
      order_index: program.length,
      sets: 3,
      reps: '10'
    }).select('*, exercise_library(*)').single()
    if (data) setProgram([...program, data as any])
  }

  const removeFromProgram = async (dayId: string) => {
    await supabase.from('workout_days').delete().eq('id', dayId)
    setProgram(program.filter(p => p.id !== dayId))
  }

  const createExercise = async () => {
    if (!newEx.name) return
    const { data } = await supabase.from('exercise_library').insert(newEx).select().single()
    if (data) setExercises([data, ...exercises])
    setShowExerciseForm(false)
    setNewEx({ name: '', muscle_group: 'Chest', video_url: '' })
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="max-w- mx-auto p-6">
        <h1 className="text-2xl font-bold tracking-tight">RAFIT Builder — Clean</h1>
        <p className="text-zinc-500 text-sm mb-6">Exercise library → Clients → Program (All saved to Supabase)</p>

        <div className="grid grid-cols-12 gap-5">
          {/* 1. EXERCISE LIBRARY */}
          <div className="col-span-3 bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-sm">1. EXERCISE LIBRARY</h3>
              <button onClick={()=>setShowExerciseForm(true)} className="text-xs bg-white text-black px-3 py-1.5 rounded-full font-medium">+ New</button>
            </div>
            <div className="space-y-2 max-h- overflow-y-auto pr-1">
              {exercises.map(ex => (
                <div key={ex.id} className="bg-black border border-zinc-800 rounded-xl p-3 hover:border-zinc-700 group">
                  <div className="font-medium text-">{ex.name}</div>
                  <div className="text- text-zinc-500">{ex.muscle_group || 'General'}</div>
                  {selectedClient && (
                    <button onClick={()=>addExerciseToProgram(ex)} className="mt-2 w-full text- bg-zinc-800 group-hover:bg-white group-hover:text-black py-1.5 rounded-full transition">+ Add to {selectedClient.full_name?.split(' ')[0]}</button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 2. CLIENTS */}
          <div className="col-span-3 bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4">
            <h3 className="font-semibold text-sm mb-4">2. CLIENTS (profiles)</h3>
            <div className="space-y-2 max-h- overflow-y-auto pr-1">
              {clients.map(c => (
                <button key={c.id} onClick={()=>loadClientProgram(c)} className={`w-full text-left p-3 rounded-xl border transition ${selectedClient?.id===c.id?'bg-white text-black border-white':'bg-black border-zinc-800 hover:border-zinc-700'}`}>
                  <div className="font-medium text-">{c.full_name || c.email?.split('@')[0] || 'Unnamed'}</div>
                  <div className="text- opacity-60 truncate">{c.email || c.id.slice(0,8)}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 3. CLIENT PROGRAM */}
          <div className="col-span-6 bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            {!selectedClient ? (
              <div className="h- flex flex-col items-center justify-center text-zinc-600">
                <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center mb-3">👈</div>
                <p className="text-sm">Select a client to view their program</p>
                <p className="text-xs mt-1">Program = workout_plans + workout_days in Supabase</p>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-xl font-bold">{selectedClient.full_name || selectedClient.email}'s Program</h2>
                    <p className="text-xs text-zinc-500">{program.length} exercises • workout_plan: {planId?.slice(0,8)}</p>
                  </div>
                  <div className="text-xs bg-white text-black px-3 py-1 rounded-full">{program.length} items</div>
                </div>

                <div className="space-y-2">
                  {program.length===0 && <div className="py-12 text-center text-zinc-500 text-sm border border-dashed border-zinc-800 rounded-xl">No exercises yet. Add from Exercise Library on left.</div>}
                  {program.map((day, idx) => (
                    <div key={day.id} className="flex items-center gap-3 bg-black border border-zinc-800 rounded-xl p-3">
                      <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-">{idx+1}</div>
                      <div className="flex-1">
                        <div className="text- font-medium">{day.exercise_library?.name || 'Exercise'}</div>
                        <div className="text- text-zinc-500">{day.sets || 3} sets x {day.reps || '10'} reps</div>
                      </div>
                      <input defaultValue={day.sets || 3} onBlur={async(e)=>{await supabase.from('workout_days').update({ sets: parseInt(e.target.value) }).eq('id', day.id)}} className="w-12 bg-zinc-900 border border-zinc-800 rounded-lg p-1 text-xs text-center"/>
                      <input defaultValue={day.reps || '10'} onBlur={async(e)=>{await supabase.from('workout_days').update({ reps: e.target.value }).eq('id', day.id)}} className="w-14 bg-zinc-900 border border-zinc-800 rounded-lg p-1 text-xs text-center"/>
                      <button onClick={()=>removeFromProgram(day.id)} className="text-zinc-600 hover:text-red-400 text-xs px-2">✕</button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {showExerciseForm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-sm">
            <h3 className="font-bold mb-4">New Exercise → exercise_library</h3>
            <input value={newEx.name} onChange={e=>setNewEx({...newEx, name:e.target.value})} placeholder="Exercise name" className="w-full bg-black border border-zinc-800 rounded-xl p-3 mb-2 text-sm"/>
            <input value={newEx.muscle_group} onChange={e=>setNewEx({...newEx, muscle_group:e.target.value})} placeholder="Muscle group" className="w-full bg-black border border-zinc-800 rounded-xl p-3 mb-2 text-sm"/>
            <input value={newEx.video_url} onChange={e=>setNewEx({...newEx, video_url:e.target.value})} placeholder="YouTube URL" className="w-full bg-black border border-zinc-800 rounded-xl p-3 mb-4 text-sm"/>
            <div className="flex gap-2">
              <button onClick={()=>setShowExerciseForm(false)} className="flex-1 bg-zinc-800 py-2.5 rounded-xl text-sm">Cancel</button>
              <button onClick={createExercise} className="flex-1 bg-white text-black py-2.5 rounded-xl text-sm font-bold">Save to Supabase</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}