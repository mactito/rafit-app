'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function Page() {
  const [exercises, setExercises] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [selected, setSelected] = useState<any>(null)
  const [program, setProgram] = useState<any[]>([])
  const [planId, setPlanId] = useState<string | null>(null)
  const [newEx, setNewEx] = useState({ name: '', muscle_group: 'Chest', video_url: '' })
  const [showNew, setShowNew] = useState(false)

  useEffect(() => {
    supabase.from('exercise_library').select('*').order('name').then(({data}) => data && setExercises(data))
    supabase.from('profiles').select('*').order('created_at', {ascending: false}).limit(30).then(({data}) => data && setClients(data))
  }, [])

  const selectClient = async (c: any) => {
    setSelected(c)
    const {data: plans} = await supabase.from('workout_plans').select('*').eq('user_id', c.id).limit(1)
    let pId = plans?.[0]?.id
    if (!pId) {
      const {data: byProfile} = await supabase.from('workout_plans').select('*').eq('profile_id', c.id).limit(1)
      pId = byProfile?.[0]?.id
    }
    if (!pId) {
      const {data: newP} = await supabase.from('workout_plans').insert({ user_id: c.id, name: `${c.full_name || 'Client'} Plan` }).select().single()
      pId = newP?.id
    }
    if (pId) {
      setPlanId(pId)
      const {data: days} = await supabase.from('workout_days').select('*, exercise_library(*)').eq('workout_plan_id', pId).order('order_index')
      setProgram(days || [])
    }
  }

  const addEx = async (ex: any) => {
    if (!planId) return
    const {data} = await supabase.from('workout_days').insert({ workout_plan_id: planId, exercise_id: ex.id, order_index: program.length, sets: 3, reps: '10' }).select('*, exercise_library(*)').single()
    if (data) setProgram([...program, data])
  }

  return (
    <div className="min-h-screen bg-[#080808] text-white font-[Inter] antialiased">
      <div className="max-w- mx-auto px-8 py-8">
        <div className="flex justify-between items-end mb-10">
          <div>
            <h1 className="text- font-semibold tracking-tight">RAFIT</h1>
            <p className="text- text-zinc-500 mt-1">Exercise library → Clients → Program • All in Supabase</p>
          </div>
          <div className="text- text-zinc-600">{exercises.length} exercises • {clients.length} clients</div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-3">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text- font-medium tracking-widest text-zinc-400">EXERCISES</h3>
              <button onClick={()=>setShowNew(true)} className="text- bg-white text-black px-3 py-1 rounded-full">+ NEW</button>
            </div>
            <div className="space-y-2">
              {exercises.map(ex => (
                <div key={ex.id} className="group bg-zinc-900/50 border border-zinc-800/60 rounded-2xl p-3.5 hover:border-zinc-700 transition">
                  <div className="text- font-medium">{ex.name}</div>
                  <div className="text- text-zinc-500 mt-0.5">{ex.muscle_group || ex.category || '—'}</div>
                  {selected && <button onClick={()=>addEx(ex)} className="mt-2.5 w-full bg-zinc-800 group-hover:bg-white group-hover:text-black text- py-1.5 rounded-full transition">Add to client</button>}
                </div>
              ))}
            </div>
          </div>

          <div className="col-span-3">
            <h3 className="text- font-medium tracking-widest text-zinc-400 mb-4">CLIENTS</h3>
            <div className="space-y-2">
              {clients.map(c => (
                <button key={c.id} onClick={()=>selectClient(c)} className={`w-full text-left rounded-2xl p-3.5 border transition text- ${selected?.id===c.id?'bg-white text-black border-white':'bg-zinc-900/50 border-zinc-800/60 hover:border-zinc-700'}`}>
                  <div className="font-medium">{c.full_name || c.email?.split('@')[0]}</div>
                  <div className="text- opacity-60 truncate mt-0.5">{c.email}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="col-span-6">
            <div className="bg-zinc-900/40 border border-zinc-800/60 rounded- p-6 min-h-">
              {!selected ? (
                <div className="h- flex flex-col items-center justify-center">
                  <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-500 mb-3">→</div>
                  <p className="text- text-zinc-500">Select a client</p>
                </div>
              ) : (
                <>
                  <div className="flex justify-between mb-6">
                    <div>
                      <h2 className="text- font-semibold">{selected.full_name || selected.email}</h2>
                      <p className="text- text-zinc-500 mt-1">{program.length} exercises in Supabase</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {program.length===0 && <div className="text-center py-16 text- text-zinc-600 border border-dashed border-zinc-800 rounded-2xl">No exercises yet</div>}
                    {program.map((d,i) => (
                      <div key={d.id} className="flex items-center gap-3 bg-black border border-zinc-800 rounded-xl px-3 py-2.5">
                        <span className="text- w-5 h-5 bg-zinc-800 rounded-full flex items-center justify-center">{i+1}</span>
                        <span className="flex-1 text-">{d.exercise_library?.name}</span>
                        <span className="text- text-zinc-500">{d.sets}x{d.reps}</span>
                        <button onClick={async()=>{await supabase.from('workout_days').delete().eq('id', d.id); setProgram(program.filter(x=>x.id!==d.id))}} className="text-zinc-600 hover:text-white text-">✕</button>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {showNew && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 w-full max-w-sm">
            <input value={newEx.name} onChange={e=>setNewEx({...newEx, name:e.target.value})} placeholder="Exercise name" className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-sm mb-2"/>
            <input value={newEx.muscle_group} onChange={e=>setNewEx({...newEx, muscle_group:e.target.value})} placeholder="Muscle group" className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-sm mb-4"/>
            <div className="flex gap-2">
              <button onClick={()=>setShowNew(false)} className="flex-1 bg-zinc-800 py-2.5 rounded-xl text-sm">Cancel</button>
              <button onClick={async()=>{const {data}=await supabase.from('exercise_library').insert(newEx).select().single(); if(data){setExercises([data, ...exercises]); setShowNew(false)}}} className="flex-1 bg-white text-black py-2.5 rounded-xl text-sm font-medium">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}