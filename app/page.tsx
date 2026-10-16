
'use client'
export const dynamic = 'force-dynamic'
import React, { useState, useRef, useEffect } from 'react';
import { X, Plus, Play, Trash2, Check, GripVertical, ChevronRight, LogOut, Activity, Users, Dumbbell, ClipboardList, Home, User, Camera, TrendingUp, Edit3 } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { supabase } from '@/lib/supabase'

// --- TYPES ---
type Exercise = {
  id: string;
  name: string;
  sets: string;
  reps: string;
  rest: string;
  notes: string;
  video_url: string;
  day_id?: string;
};

type Day = {
  tempId: string;
  day_number: number;
  day_name: string;
  focus: string;
  exercises: Exercise[];
  id?: string;
};

const FOCUS_CYCLE = ["GLUTEI FOCUS","UPPER","GLUTEI BURN","FULL BODY","CORE BLAST","LEGS PUMP","PUSH POWER"];

const EXERCISE_LIBRARY_FALLBACK: Omit<Exercise, 'id'>[] = [
  { name: "Hip Thrust Machine", sets: "4", reps: "12", rest: "90s", notes: "Squeeze 2s at top", video_url: "https://videos.pexels.com/video-files/5310859/5310859-hd_1080_1920_25fps.mp4" },
  { name: "RDL - Romanian Deadlift", sets: "4", reps: "10", rest: "90s", notes: "Slow eccentric", video_url: "" },
  { name: "Bulgarian Split Squat", sets: "3", reps: "12/leg", rest: "60s", notes: "Knee over toe", video_url: "" },
  { name: "Cable Kickback", sets: "3", reps: "15", rest: "60s", notes: "Control", video_url: "" },
  { name: "Lat Pulldown Wide", sets: "4", reps: "12", rest: "75s", notes: "Chest up", video_url: "" },
  { name: "Seated Row Neutral", sets: "4", reps: "12", rest: "75s", notes: "Elbows close", video_url: "" },
];

function getYoutubeId(url:string){ if(!url) return null; const m=url.match(/(?:youtube\\.com\\/watch\\?v=|youtu\\.be\\/)([a-zA-Z0-9_-]{11})/); return m?m[1]:null }

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [role, setRole] = useState<'client'|'coach'>('coach');
  const [user, setUser] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const [days, setDays] = useState<Day[]>([
    { tempId: 'd1', day_number: 1, day_name: 'DAY 1 - GLUTEI FOCUS', focus: 'GLUTEI FOCUS', exercises: [] },
    { tempId: 'd2', day_number: 2, day_name: 'DAY 2 - UPPER', focus: 'UPPER', exercises: [] },
  ]);
  const [activeDayIdx, setActiveDayIdx] = useState(0);
  const exercises = days[activeDayIdx]?.exercises ?? [];
  const setExercises = (updater: Exercise[] | ((prev: Exercise[]) => Exercise[])) => {
    setDays(prev => {
      const newDays = [...prev];
      const current = newDays[activeDayIdx];
      if (!current) return prev;
      const nextExercises = typeof updater === 'function' ? (updater as any)(current.exercises) : updater;
      newDays[activeDayIdx] = { ...current, exercises: nextExercises };
      return newDays;
    });
  };

  const [clients, setClients] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [checkins, setCheckins] = useState<any[]>([]);
  const [myCheckins, setMyCheckins] = useState<any[]>([]);
  const [library, setLibrary] = useState<any[]>([]);
  const [planName, setPlanName] = useState('');
  const [selectedClient, setSelectedClient] = useState('');
  const [goal, setGoal] = useState('TONIFICAZIONE BIKINI');

  const [coachTab, setCoachTab] = useState<'clients'|'builder'|'plans'|'checkins'>('builder');
  const [clientTab, setClientTab] = useState<'home'|'workout'|'checkin'|'profile'>('workout');
  const [clientActiveDay, setClientActiveDay] = useState(0);

  const [toast, setToast] = useState<string | null>(null);
  const [videoModal, setVideoModal] = useState<Exercise | null>(null);
  const [sliderPos, setSliderPos] = useState(50);
  const sliderRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [checkInWeight, setCheckInWeight] = useState('');
  const [checkInNote, setCheckInNote] = useState('');
  const [checkInPhotos, setCheckInPhotos] = useState<string[]>([]);

  // Auth
  useEffect(()=>{
    (async()=>{
      const {data} = await supabase.auth.getSession();
      if(data.session?.user){
        setUser(data.session.user);
        const {data:prof} = await supabase.from('profiles').select('role').eq('id',data.session.user.id).single();
        if(prof){ setRole(prof.role as any); setIsLoggedIn(true); }
      }
    })()
  },[])

  const loadData = async()=>{
    const {data:cl}=await supabase.from('profiles').select('*').eq('role','client');
    if(cl) setClients(cl);
    const {data:pl}=await supabase.from('workout_plans').select('*, profiles!workout_plans_client_id_fkey(email)').order('created_at',{ascending:false});
    if(pl) setPlans(pl);
    const {data:ch}=await supabase.from('check_ins').select('*, profiles!check_ins_client_id_fkey(email)').order('created_at',{ascending:false});
    if(ch) setCheckins(ch);
    const {data:lib}=await supabase.from('exercise_library').select('*').order('name');
    if(lib && lib.length>0) setLibrary(lib);
    else setLibrary(EXERCISE_LIBRARY_FALLBACK.map((e,i)=>({id:`fb_${i}`,name:e.name,muscle_group:'GLUTEI',video_url:e.video_url,sets:e.sets,reps:e.reps,rest:e.rest})));
    if(user){
      const {data:my}=await supabase.from('check_ins').select('*').eq('client_id',user.id).order('created_at',{ascending:false});
      if(my) setMyCheckins(my);
    }
  }
  useEffect(()=>{ if(isLoggedIn) loadData() },[isLoggedIn,user]);

  const login=async()=>{
    setLoading(true);
    const {data,error}=await supabase.auth.signInWithPassword({email,password});
    if(error){ alert(error.message); setLoading(false); return }
    if(data.user){
      setUser(data.user);
      const {data:prof}=await supabase.from('profiles').select('role').eq('id',data.user.id).single();
      if(prof){ setRole(prof.role); setIsLoggedIn(true); loadData(); }
    }
    setLoading(false);
  }
  const signup=async()=>{
    const isCoach=email.toLowerCase().includes('mactito')||email.includes('coach');
    const {data,error}=await supabase.auth.signUp({email,password});
    if(error){ alert(error.message); return }
    if(data.user){ await supabase.from('profiles').insert({id:data.user.id,email,role:isCoach?'coach':'client',full_name:email.split('@')[0]}); alert('Account creato come '+(isCoach?'coach':'client')) }
  }

  const addDay = () => {
    const nextNum = days.length + 1;
    const focus = FOCUS_CYCLE[(nextNum - 1) % FOCUS_CYCLE.length];
    const newDay: Day = { tempId: `d${Date.now()}`, day_number: nextNum, day_name: `DAY ${nextNum} - ${focus}`, focus, exercises: [] };
    setDays(prev => [...prev, newDay]);
    setActiveDayIdx(days.length);
  };
  const deleteDay = (idx: number) => {
    if (days.length <= 1) { setToast("Keep at least 1 day"); setTimeout(()=>setToast(null),2000); return; }
    setDays(prev => { const filtered = prev.filter((_, i) => i !== idx); return filtered.map((d, i) => ({ ...d, day_number: i + 1 })); });
    setActiveDayIdx(prev => { if (idx === prev) return Math.max(0, prev - 1); if (idx < prev) return prev - 1; return prev; });
  };
  const addFromLibrary = (libEx: any) => {
    const newEx: Exercise = { id: `ex_${Date.now()}_${Math.random().toString(36).slice(2,5)}`, name: libEx.name, sets: libEx.sets||"4", reps: libEx.reps||"12", rest: libEx.rest||"90s", notes: libEx.notes||"", video_url: libEx.video_url||"" };
    setExercises(prev => [...prev, newEx]);
    setToast(`Added ${libEx.name} to ${days[activeDayIdx]?.day_name}`); setTimeout(()=>setToast(null),1800);
  };
  const removeExercise = (exId: string) => { setExercises(prev => prev.filter(e => e.id !== exId)); };
  const updateExerciseField = (exId: string, field: keyof Exercise, val: string) => { setExercises(prev => prev.map(e => e.id === exId ? { ...e, [field]: val } : e)); };

  const savePlan = async () => {
    if(!planName.trim()) return alert('Nome piano'); if(!selectedClient) return alert('Seleziona cliente');
    if(days.every(d=>d.exercises.length===0)) return alert('Aggiungi esercizi');
    const { data: plan, error } = await supabase.from('workout_plans').insert({coach_id:user.id,client_id:selectedClient,name:planName,goal_tag:goal}).select().single();
    if(error) return alert(error.message);
    for(const d of days){
      const { data: day } = await supabase.from('workout_days').insert({plan_id:plan.id,day_number:d.day_number,day_name:d.day_name}).select().single();
      if(!day) continue;
      for(const ex of d.exercises){ await supabase.from('exercises').insert({day_id:day.id,name:ex.name,sets:ex.sets,reps:ex.reps,rest:ex.rest,notes:ex.notes,video_url:ex.video_url}) }
    }
    const msg=`Saved ${days.length} days, ${days.reduce((a,d)=>a+d.exercises.length,0)} exercises on Supabase!`;
    setToast(msg); setTimeout(()=>setToast(null),4000); setPlanName(''); loadData();
  };

  const uploadCheckInPhoto = async(e:any)=>{
    const file=e.target.files[0]; if(!file) return;
    const fileName=`${user.id}/${Date.now()}_${file.name}`;
    const {error}=await supabase.storage.from('checkins').upload(fileName,file);
    if(error) return alert(error.message);
    const {data:pub}=supabase.storage.from('checkins').getPublicUrl(fileName);
    setCheckInPhotos([...checkInPhotos,pub.publicUrl]);
  }
  const sendCheckIn = async()=>{
    if(!checkInWeight) return alert('Peso');
    const {error}=await supabase.from('check_ins').insert({client_id:user.id,peso:parseFloat(checkInWeight),note:checkInNote,photos:checkInPhotos});
    if(error) return alert(error.message);
    setToast('Check-in inviato a Raphi!'); setTimeout(()=>setToast(null),3000); setCheckInWeight(''); setCheckInNote(''); setCheckInPhotos([]); loadData();
  }

  useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging || !sliderRef.current) return;
      const rect = sliderRef.current.getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const x = ((clientX - rect.left) / rect.width) * 100;
      setSliderPos(Math.min(100, Math.max(0, x)));
    };
    const handleUp = () => setIsDragging(false);
    if (isDragging) {
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('touchmove', handleMove);
      window.addEventListener('mouseup', handleUp);
      window.addEventListener('touchend', handleUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchend', handleUp);
    };
  }, [isDragging]);

  const WEIGHT_DATA = myCheckins.length>0 ? myCheckins.slice(0,7).reverse().map((c:any)=>({date:new Date(c.created_at).toLocaleDateString().slice(0,5),weight:c.peso})) : [
    { date: "03/01", weight: 68.2 },{ date: "03/08", weight: 67.8 },{ date: "03/15", weight: 67.1 },
  ];

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#080808] text-white flex flex-col items-center justify-center p-6 relative overflow-clip">
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Space+Grotesk:wght@300;400;500;700&display=swap'); *{font-family:"Space Grotesk",system-ui,sans-serif} .serif{font-family:"Instrument Serif",serif}`}</style>
        <div className="absolute -top-[20%] left-0 right-0 w-full h-[60%] bg-[radial-gradient(ellipse_at_center,_rgba(255,77,141,0.25),transparent_70%)] pointer-events-none" />
        <div className="w-full max-w-[420px] relative z-10">
          <div className="text-center mb-10"><h1 className="serif text-[72px] leading-[0.9] tracking-[-0.04em]">RAFIT</h1><p className="mt-3 text-[11px] tracking-[0.35em] text-white/50">V7 LUXURY • SUPABASE REAL</p><div className="mt-2 h-[1px] w-12 bg-[#FF4D8D] mx-auto" /></div>
          <div className="bg-[#121212] rounded-[32px] p-8 border border-white/[0.06]">
            <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" className="w-full h-[52px] rounded-[16px] bg-[#080808] border border-white/10 px-5 text-[14px] mb-3 focus:border-[#FF4D8D]/50 outline-none"/>
            <input value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" type="password" className="w-full h-[52px] rounded-[16px] bg-[#080808] border border-white/10 px-5 text-[14px] mb-4 focus:border-[#FF4D8D]/50 outline-none"/>
            <button onClick={login} disabled={loading} className="w-full bg-white text-black rounded-[20px] h-[56px] font-medium text-[14px] hover:bg-[#FF4D8D] hover:text-white transition-colors">{loading?'...':'ACCEDI'}</button>
            <button onClick={signup} className="w-full mt-3 bg-[#1E1E1E] border border-white/10 rounded-[20px] h-[56px] text-[14px]">REGISTRATI</button>
            <div className="mt-6 flex gap-2">
              <button onClick={()=>{setRole('coach'); setIsLoggedIn(true)}} className="flex-1 bg-[#1E1E1E] border border-white/10 rounded-[16px] py-3 text-[11px] tracking-widest">DEMO COACH</button>
              <button onClick={()=>{setRole('client'); setIsLoggedIn(true)}} className="flex-1 bg-[#1E1E1E] border border-white/10 rounded-[16px] py-3 text-[11px] tracking-widest">DEMO CLIENT</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080808] text-white selection:bg-[#FF4D8D]/30 overflow-x-clip relative">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Space+Grotesk:wght@300;400;500;700&display=swap'); *{font-family:"Space Grotesk",system-ui,sans-serif} .serif{font-family:"Instrument Serif",serif} ::-webkit-scrollbar{height:6px;width:6px} ::-webkit-scrollbar-thumb{background:#FF4D8D33;border-radius:10px}`}</style>
      <header className="sticky top-0 z-30 bg-[#080808]/80 backdrop-blur-xl border-b border-white/[0.06] px-5 md:px-8 h-[64px] flex items-center justify-between">
        <div className="flex items-center gap-4"><h1 className="serif text-[28px]">RAFIT</h1><span className="hidden md:inline-flex items-center gap-2 text-[10px] tracking-[0.25em] text-white/40 border border-white/10 rounded-full px-3 py-1"><span className="w-1.5 h-1.5 rounded-full bg-[#FF4D8D]" /> V7 MULTI-DAY • SUPABASE</span></div>
        <div className="flex items-center gap-3"><div className="hidden md:flex items-center gap-2 text-[11px] bg-[#121212] border border-white/10 rounded-full px-3 py-1.5">{role.toUpperCase()} • {user?.email}</div><button onClick={async()=>{await supabase.auth.signOut(); setIsLoggedIn(false)}} className="w-9 h-9 rounded-full bg-[#121212] border border-white/10 flex items-center justify-center hover:bg-white hover:text-black"><LogOut className="w-4 h-4" /></button></div>
      </header>

      <main className="px-5 md:px-8 pb-[120px] pt-6 max-w-[1280px] mx-auto w-full">
        {role === 'coach' ? (
          <>
            {coachTab === 'builder' && (
              <div className="space-y-6">
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div><h2 className="serif text-[42px] md:text-[56px] leading-[0.9]">MULTI-DAY<br /><span className="text-[#FF4D8D] italic">BUILDER</span></h2><p className="mt-3 text-[12px] tracking-[0.2em] text-white/40">Real Supabase • {days.length} days • {clients.length} clients • {library.length} library</p></div>
                  <button onClick={savePlan} className="h-[52px] px-7 rounded-full bg-[#FF4D8D] text-black font-medium text-[13px] tracking-[0.15em] flex items-center gap-2 hover:bg-white"><Check className="w-4 h-4" /> SAVE TO SUPABASE — {days.length} DAYS</button>
                </div>

                <div className="bg-[#121212] rounded-[28px] border border-white/[0.06] p-4">
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {days.map((day, idx) => (
                      <button key={day.tempId} onClick={() => setActiveDayIdx(idx)} className={`group flex-shrink-0 relative h-[44px] pl-5 pr-10 rounded-full border text-[12px] tracking-[0.12em] font-medium flex items-center ${idx === activeDayIdx ? 'bg-[#FF4D8D] border-[#FF4D8D] text-black' : 'bg-[#1E1E1E] border-white/10 text-white/70 hover:text-white'}`}>
                        <span className="truncate">{day.day_name}</span>
                        {days.length > 1 && <span onClick={(e) => { e.stopPropagation(); deleteDay(idx); }} className="absolute right-1 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center bg-black/15"><X className="w-3.5 h-3.5" /></span>}
                      </button>
                    ))}
                    <button onClick={addDay} className="flex-shrink-0 h-[44px] px-5 rounded-full bg-white text-black text-[12px] tracking-[0.12em] font-medium flex items-center gap-2 hover:bg-[#FF4D8D] hover:text-white border border-white"><Plus className="w-4 h-4" /> DAY</button>
                  </div>
                  <div className="mt-4 grid md:grid-cols-[1fr_auto] gap-3">
                    <input value={days[activeDayIdx]?.day_name ?? ''} onChange={(e) => { const val = e.target.value; setDays(prev => prev.map((d, i) => i === activeDayIdx ? { ...d, day_name: val.toUpperCase() } : d)); }} className="w-full h-[56px] rounded-[16px] bg-[#080808] border border-white/10 px-5 text-[14px] font-medium focus:border-[#FF4D8D]/50 outline-none" placeholder="DAY 1 - GLUTEI FOCUS" />
                    <select value={selectedClient} onChange={e=>setSelectedClient(e.target.value)} className="h-[56px] rounded-[16px] bg-[#080808] border border-white/10 px-5 text-[14px] outline-none"><option value="">Seleziona cliente</option>{clients.map((c:any)=><option key={c.id} value={c.id}>{c.email}</option>)}</select>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <input value={planName} onChange={e=>setPlanName(e.target.value)} placeholder="Nome piano es. Sara Bikini 4x" className="h-[48px] rounded-[16px] bg-[#080808] border border-white/10 px-5 text-[14px] outline-none"/>
                    <select value={goal} onChange={e=>setGoal(e.target.value)} className="h-[48px] rounded-[16px] bg-[#080808] border border-white/10 px-5 text-[13px] outline-none"><option>TONIFICAZIONE BIKINI</option><option>DIMAGRIMENTO</option><option>FORZA</option></select>
                  </div>
                </div>

                <div className="grid lg:grid-cols-[380px_1fr] gap-6">
                  <div className="bg-[#121212] rounded-[32px] border border-white/[0.06] p-5 flex flex-col max-h-[780px]">
                    <h3 className="text-[13px] tracking-[0.25em] text-white/50 mb-4">LIBRERIA REALE ({library.length})</h3>
                    <div className="space-y-2 overflow-y-auto pr-1 flex-1">
                      {library.map((lib:any, i:number) => (
                        <div key={lib.id||i} className="group flex items-center gap-3 bg-[#080808] border border-white/[0.06] rounded-[18px] p-3 hover:border-[#FF4D8D]/30">
                          <div className="w-11 h-11 rounded-[12px] bg-[#1E1E1E] flex items-center justify-center"><Dumbbell className="w-4 h-4 text-white/60" /></div>
                          <div className="flex-1 min-w-0"><p className="text-[13px] font-medium truncate">{lib.name}</p><p className="text-[10px] text-white/40">{lib.muscle_group||lib.muscle||''} {lib.video_url?'• VIDEO':''}</p></div>
                          <button onClick={() => addFromLibrary(lib)} className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center hover:bg-[#FF4D8D] hover:text-white"><Plus className="w-4 h-4" /></button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-[#121212] rounded-[32px] border border-white/[0.06] p-5 md:p-7 min-h-[600px] flex flex-col">
                    <div className="flex items-center justify-between mb-6"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-[#FF4D8D] text-black flex items-center justify-center font-bold text-[13px]">{days[activeDayIdx]?.day_number}</div><div><h3 className="text-[18px] font-medium">{days[activeDayIdx]?.day_name}</h3><p className="text-[11px] tracking-[0.15em] text-white/40">{exercises.length} EXERCISES</p></div></div></div>
                    {exercises.length === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center py-16 border border-dashed border-white/10 rounded-[24px] bg-[#080808]/50"><div className="w-14 h-14 rounded-full bg-[#1E1E1E] flex items-center justify-center mb-4"><Plus className="w-6 h-6 text-white/30" /></div><p className="text-[13px] text-white/40">No exercises yet</p></div>
                    ) : (
                      <div className="space-y-3">{exercises.map((ex, idx) => (
                        <div key={ex.id} className="group bg-[#080808] border border-white/[0.06] rounded-[20px] p-4 md:p-5 flex gap-4">
                          <GripVertical className="w-4 h-4 text-white/20 mt-1 hidden md:block" />
                          <div className="flex-1 grid gap-3"><div className="flex items-start justify-between gap-3"><input value={ex.name} onChange={e => updateExerciseField(ex.id, 'name', e.target.value)} className="flex-1 bg-transparent text-[15px] font-medium focus:outline-none focus:text-[#FF4D8D]" /><div className="flex items-center gap-1.5"><button onClick={() => setVideoModal(ex)} className="w-8 h-8 rounded-full bg-[#1E1E1E] border border-white/10 flex items-center justify-center hover:bg-[#FF4D8D]"><Play className="w-3.5 h-3.5 ml-[1px]" /></button><button onClick={() => removeExercise(ex.id)} className="w-8 h-8 rounded-full bg-[#1E1E1E] border border-white/10 flex items-center justify-center hover:bg-white hover:text-black"><Trash2 className="w-3.5 h-3.5" /></button></div></div><div className="grid grid-cols-3 gap-2"><input value={ex.sets} onChange={e => updateExerciseField(ex.id, 'sets', e.target.value)} className="bg-[#121212] rounded-[12px] border border-white/[0.06] px-3 py-2 text-[13px]" placeholder="sets"/><input value={ex.reps} onChange={e => updateExerciseField(ex.id, 'reps', e.target.value)} className="bg-[#121212] rounded-[12px] border border-white/[0.06] px-3 py-2 text-[13px]" placeholder="reps"/><input value={ex.rest} onChange={e => updateExerciseField(ex.id, 'rest', e.target.value)} className="bg-[#121212] rounded-[12px] border border-white/[0.06] px-3 py-2 text-[11px]" placeholder="90s"/></div></div>
                        </div>
                      ))}</div>
                    )}
                  </div>
                </div>
              </div>
            )}
            {coachTab === 'plans' && (<div className="space-y-6"><h2 className="serif text-[42px]">SAVED PLANS REAL</h2><div className="grid md:grid-cols-2 gap-4">{plans.map((p:any)=><div key={p.id} className="bg-[#121212] rounded-[32px] border border-white/[0.06] p-6"><div className="flex justify-between mb-2"><p className="text-[12px] text-white/50">{new Date(p.created_at).toLocaleDateString()}</p><span className="text-[10px] bg-[#FF4D8D] text-black px-2 py-1 rounded-full">{p.goal_tag}</span></div><p className="font-medium">{p.name}</p><p className="text-[11px] text-white/40 mt-1">{p.profiles?.email}</p></div>)}</div></div>)}
            {coachTab === 'clients' && (<div className="space-y-6"><h2 className="serif text-[42px]">CLIENTS REAL ({clients.length})</h2><div className="grid md:grid-cols-3 gap-4">{clients.map((c:any)=><div key={c.id} className="bg-[#121212] rounded-[32px] border border-white/[0.06] p-6"><div className="w-12 h-12 rounded-full bg-[#1E1E1E] border border-white/10 flex items-center justify-center text-[13px]">{c.email.slice(0,2).toUpperCase()}</div><p className="font-medium mt-3">{c.email}</p><p className="text-[11px] text-white/40">{checkins.filter((ch:any)=>ch.client_id===c.id).length} check-ins</p></div>)}</div><div className="mt-8 grid lg:grid-cols-2 gap-6"><BeforeAfterSlider /><div className="bg-[#121212] rounded-[32px] border border-white/[0.06] p-6"><h3 className="text-[13px] tracking-[0.2em] text-white/50 mb-4 flex items-center gap-2"><TrendingUp className="w-4 h-4" /> WEIGHT TREND REAL</h3><div className="h-[200px]"><ResponsiveContainer width="100%" height="100%"><LineChart data={WEIGHT_DATA}><XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize:10,fill:'#ffffff40'}}/><YAxis hide domain={['dataMin -1','dataMax +1']}/><Tooltip contentStyle={{background:'#121212',border:'1px solid #ffffff15',borderRadius:12,fontSize:11}}/><Line type="monotone" dataKey="weight" stroke="#FF4D8D" strokeWidth={2.5} dot={false}/></LineChart></ResponsiveContainer></div></div></div></div>)}
            {coachTab === 'checkins' && (<div className="space-y-6"><h2 className="serif text-[42px]">CHECK-INS REAL ({checkins.length})</h2><div className="grid md:grid-cols-2 gap-4">{checkins.map((ch:any)=><div key={ch.id} className="bg-[#121212] rounded-[32px] border border-white/[0.06] p-6"><div className="flex justify-between"><p className="font-medium text-[14px]">{ch.profiles?.email}</p><p className="text-[11px] text-white/40">{new Date(ch.created_at).toLocaleDateString()}</p></div><p className="mt-2 text-[13px]">{ch.peso}kg — {ch.note}</p><div className="mt-3 flex gap-2 flex-wrap">{(ch.photos||[]).map((u:string,i:number)=><img key={i} src={u} className="w-16 h-20 object-cover rounded-xl border border-white/10"/>)}</div></div>)}</div></div>)}
          </>
        ) : (
          <>
            {clientTab === 'home' && (<div className="space-y-6"><div className="bg-[#121212] rounded-[32px] border border-white/[0.06] p-7"><p className="text-[11px] tracking-[0.3em] text-[#FF4D8D]">CIAO, {(user?.email||'CLIENT').split('@')[0].toUpperCase()}</p><h2 className="serif text-[48px] md:text-[64px] leading-[0.85] mt-3">YOUR<br/>TRANSFORMATION<br/><span className="italic text-[#FF4D8D]">IS LOADING.</span></h2><div className="mt-6 grid grid-cols-3 gap-3"><div className="bg-[#080808] border border-white/10 rounded-[20px] p-4"><p className="text-[10px] text-white/40">CHECK-INS</p><p className="text-[22px] font-bold mt-1">{myCheckins.length} 🔥</p></div><div className="bg-[#080808] border border-white/10 rounded-[20px] p-4"><p className="text-[10px] text-white/40">PESO</p><p className="text-[22px] font-bold mt-1">{myCheckins[0]?.peso||'--'}kg</p></div><div className="bg-[#FF4D8D] rounded-[20px] p-4 text-black"><p className="text-[10px] font-bold">PIANI</p><p className="text-[22px] font-bold mt-1">{plans.length}</p></div></div></div><div className="grid lg:grid-cols-2 gap-6"><BeforeAfterSlider /><div className="bg-[#121212] rounded-[32px] border border-white/[0.06] p-6"><h3 className="text-[13px] tracking-[0.2em] text-white/50 mb-4">WEIGHT CHART REAL</h3><div className="h-[200px]"><ResponsiveContainer width="100%" height="100%"><LineChart data={WEIGHT_DATA}><XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize:10,fill:'#ffffff40'}}/><YAxis hide domain={['dataMin -1','dataMax +1']}/><Tooltip contentStyle={{background:'#121212',border:'1px solid #ffffff15',borderRadius:12}}/><Line type="monotone" dataKey="weight" stroke="#FF4D8D" strokeWidth={2.5} dot={{r:3,fill:'#FF4D8D'}}/></LineChart></ResponsiveContainer></div></div></div></div>)}
            {clientTab === 'workout' && (<div className="space-y-6"><h2 className="serif text-[42px]">WORKOUT REAL</h2><div className="flex gap-2 overflow-x-auto pb-2">{plans.map((p:any)=><button key={p.id} onClick={async()=>{ const {data:ds}=await supabase.from('workout_days').select('*').eq('plan_id',p.id).order('day_number'); if(ds){ setDays(ds.map((d:any)=>({...d,tempId:d.id,exercises:[]})); const {data:exs}=await supabase.from('exercises').select('*').in('day_id',ds.map((d:any)=>d.id)); if(exs){ setDays(prev=>prev.map(d=>({...d,exercises:exs.filter((e:any)=>e.day_id===d.id)}))) } } setClientActiveDay(0) }} className="flex-shrink-0 h-[44px] px-5 rounded-full bg-[#121212] border border-white/10 text-[12px]">{p.name}</button>)}</div><div className="bg-[#121212] rounded-[32px] border border-white/[0.06] p-5"><div className="flex gap-2 overflow-x-auto mb-4">{days.map((d,idx)=><button key={d.tempId} onClick={()=>setClientActiveDay(idx)} className={`flex-shrink-0 h-[40px] px-4 rounded-full text-[11px] ${idx===clientActiveDay?'bg-white text-black':'bg-[#080808] border border-white/10 text-white/60'}`}>{d.day_name}</button>)}</div><div className="space-y-3">{(days[clientActiveDay]?.exercises||[]).map((ex:any,i:number)=><div key={ex.id} className="bg-[#080808] border border-white/[0.06] rounded-[20px] p-4 flex gap-3"><div className="w-8 h-8 rounded-full bg-[#1E1E1E] flex items-center justify-center text-[11px]">{String(i+1).padStart(2,'0')}</div><div className="flex-1"><div className="flex justify-between"><p className="font-medium text-[14px]">{ex.name}</p><button onClick={()=>setVideoModal(ex)} className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center"><Play className="w-3.5 h-3.5 ml-[1px]"/></button></div><p className="text-[11px] text-white/40 mt-1">{ex.sets}x{ex.reps} • {ex.rest}</p></div></div>)}</div></div></div>)}
            {clientTab === 'checkin' && (<div className="space-y-6"><h2 className="serif text-[42px]">CHECK-IN REAL</h2><div className="bg-[#121212] rounded-[32px] border border-white/[0.06] p-6"><input value={checkInWeight} onChange={e=>setCheckInWeight(e.target.value)} placeholder="Peso kg" type="number" className="w-full h-[52px] rounded-[16px] bg-[#080808] border border-white/10 px-5 text-[14px] mb-3 outline-none"/><textarea value={checkInNote} onChange={e=>setCheckInNote(e.target.value)} placeholder="Come ti senti?" className="w-full min-h-[80px] rounded-[16px] bg-[#080808] border border-white/10 p-4 text-[13px] mb-3 outline-none"/><div className="flex gap-2 flex-wrap mb-3">{checkInPhotos.map((u:string,i:number)=><img key={i} src={u} className="w-16 h-20 object-cover rounded-xl"/>)}</div><label className="inline-block border border-white/15 rounded-full px-4 py-2 text-[11px] cursor-pointer"><input type="file" className="hidden" onChange={uploadCheckInPhoto}/>+ FOTO</label><button onClick={sendCheckIn} className="mt-4 w-full bg-[#FF4D8D] text-black rounded-full py-4 font-bold">INVIA A RAPHI</button></div><div className="grid gap-3">{myCheckins.map((c:any)=><div key={c.id} className="bg-[#121212] border border-white/10 rounded-[20px] p-4 flex justify-between"><div><p className="font-bold text-[14px]">{c.peso}kg</p><p className="text-[11px] text-white/40">{c.note}</p></div><p className="text-[11px] text-white/40">{new Date(c.created_at).toLocaleDateString()}</p></div>)}</div></div>)}
            {clientTab === 'profile' && (<div className="bg-[#121212] rounded-[32px] border border-white/[0.06] p-8 max-w-[560px]"><div className="w-20 h-20 rounded-full bg-[#FF4D8D] text-black flex items-center justify-center text-[24px] font-bold">{user?.email?.slice(0,2).toUpperCase()}</div><h3 className="serif text-[32px] mt-4">{user?.email}</h3><p className="text-[12px] text-white/40 mt-2">{plans.length} piani • {myCheckins.length} check-ins</p></div>)}
          </>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-40 px-4 pb-4 pt-2">
        <div className="max-w-[520px] mx-auto bg-[#121212]/90 backdrop-blur-2xl border border-white/[0.08] rounded-[28px] h-[68px] flex items-center justify-around px-2 shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
          {role === 'coach' ? (
            <>
              {[{k:'clients',icon:Users,label:'CLIENTS'},{k:'builder',icon:Dumbbell,label:'BUILDER'},{k:'plans',icon:ClipboardList,label:'PLANS'},{k:'checkins',icon:Activity,label:'CHECK-INS'}].map(item=>(
                <button key={item.k} onClick={()=>setCoachTab(item.k as any)} className={`flex flex-col items-center justify-center gap-1 w-[72px] h-[52px] rounded-[18px] ${coachTab===item.k?'bg-white text-black':'text-white/40 hover:text-white'}`}><item.icon className="w-[18px] h-[18px]" /><span className="text-[9px] tracking-[0.15em] font-medium">{item.label}</span></button>
              ))}
            </>
          ) : (
            <>
              {[{k:'home',icon:Home,label:'HOME'},{k:'workout',icon:Dumbbell,label:'WORKOUT'},{k:'checkin',icon:Activity,label:'CHECK-IN'},{k:'profile',icon:User,label:'PROFILE'}].map(item=>(
                <button key={item.k} onClick={()=>setClientTab(item.k as any)} className={`flex flex-col items-center justify-center gap-1 w-[72px] h-[52px] rounded-[18px] ${clientTab===item.k?'bg-[#FF4D8D] text-black':'text-white/40 hover:text-white'}`}><item.icon className="w-[18px] h-[18px]" /><span className="text-[9px] tracking-[0.15em] font-medium">{item.label}</span></button>
              ))}
            </>
          )}
        </div>
      </nav>

      {videoModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-6" onClick={() => setVideoModal(null)}>
          <div className="bg-[#121212] rounded-[32px] border border-white/10 overflow-hidden max-w-[420px] w-full" onClick={e => e.stopPropagation()}>
            <div className="aspect-[9/16] max-h-[70vh] bg-black relative">
              {getYoutubeId(videoModal.video_url) ? <iframe className="w-full h-full" src={`https://www.youtube.com/embed/${getYoutubeId(videoModal.video_url)}?autoplay=1`} allowFullScreen/> : <video src={videoModal.video_url} autoPlay muted loop playsInline className="w-full h-full object-cover" />}
              <button onClick={() => setVideoModal(null)} className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/60 backdrop-blur border border-white/10 flex items-center justify-center"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-6"><h4 className="font-medium text-[16px]">{videoModal.name}</h4><p className="text-[11px] text-white/40 mt-1">{videoModal.sets} × {videoModal.reps} • {videoModal.rest}</p></div>
          </div>
        </div>
      )}

      {toast && (<div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 max-w-[90%]"><div className="bg-white text-black rounded-full px-5 py-3 text-[12px] font-medium flex items-center gap-2"><span className="w-5 h-5 rounded-full bg-[#FF4D8D] text-white flex items-center justify-center"><Check className="w-3 h-3" /></span><span className="line-clamp-2">{toast}</span></div></div>)}
    </div>
  );
}

function BeforeAfterSlider(){
  const [sliderPos,setSliderPos]=useState(50);
  const sliderRef=useRef<HTMLDivElement>(null);
  const [isDragging,setIsDragging]=useState(false);
  useEffect(()=>{
    const move=(e:any)=>{ if(!isDragging||!sliderRef.current) return; const rect=sliderRef.current.getBoundingClientRect(); const cx='touches' in e?e.touches[0].clientX:e.clientX; setSliderPos(Math.min(100,Math.max(0,((cx-rect.left)/rect.width)*100))) };
    const up=()=>setIsDragging(false);
    if(isDragging){ window.addEventListener('mousemove',move); window.addEventListener('touchmove',move); window.addEventListener('mouseup',up); window.addEventListener('touchend',up); }
    return()=>{ window.removeEventListener('mousemove',move); window.removeEventListener('touchmove',move); window.removeEventListener('mouseup',up); window.removeEventListener('touchend',up); }
  },[isDragging]);
  return (
    <div className="bg-[#080808] rounded-[32px] border border-white/[0.06] p-3">
      <div className="flex items-center justify-between px-4 py-2"><p className="text-[11px] tracking-[0.25em] text-white/40">BEFORE / AFTER</p><span className="text-[10px] px-2.5 py-1 rounded-full bg-[#1E1E1E] border border-white/10">{Math.round(sliderPos)}%</span></div>
      <div ref={sliderRef} className="relative h-[320px] rounded-[24px] overflow-hidden bg-[#121212] cursor-ew-resize" onMouseDown={()=>setIsDragging(true)} onTouchStart={()=>setIsDragging(true)}>
        <div className="absolute inset-0 flex items-center justify-center bg-[radial-gradient(ellipse_at_center,_#FF4D8D22,_#121212)]"><div className="text-center"><p className="serif text-[28px] text-white/80">AFTER</p><p className="text-[11px] text-white/30 mt-1">WEEK 12</p></div></div>
        <div className="absolute inset-0 overflow-hidden bg-[#1A1A1A] flex items-center justify-center border-r border-white/10" style={{width:`${sliderPos}%`}}><div className="text-center" style={{width:`${100/(sliderPos/100||1)}%`}}><p className="serif text-[28px] text-white/50">BEFORE</p><p className="text-[11px] text-white/20 mt-1">WEEK 1</p></div></div>
        <div className="absolute top-0 bottom-0 w-[2px] bg-white z-10" style={{left:`${sliderPos}%`}}><div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-white text-black flex items-center justify-center shadow-xl"><div className="flex gap-[2px]"><div className="w-[1.5px] h-3 bg-black/40" /><div className="w-[1.5px] h-3 bg-black/40" /></div></div></div>
      </div>
    </div>
  )
}
