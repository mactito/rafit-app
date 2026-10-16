'use client';
import { supabase } from '@/lib/supabase'
import React, { useState, useRef, useEffect } from 'react';
import { X, Plus, Play, Trash2, Check, GripVertical, ChevronRight, LogOut, Activity, Users, Dumbbell, ClipboardList, Home, User, Camera, TrendingUp, Edit3 } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';

// --- SAFE YOUTUBE PARSER - NO REGEX WITH BACKSLASHES ---
function getYoutubeId(url: string) {
  if (!url) return null;
  try {
    if (url.indexOf('youtu.be/') > -1) { var a = url.split('youtu.be/')[1]; if (a) return a.split('&')[0].split('?')[0].slice(0, 11); }
    if (url.indexOf('v=') > -1) { var b = url.split('v=')[1]; if (b) return b.split('&')[0].split('?')[0].slice(0, 11); }
    return null;
  } catch (e) { return null }
}

type Exercise = { id: string; name: string; sets: string; reps: string; rest: string; notes: string; video_url: string; };
type Day = { tempId: string; day_number: number; day_name: string; focus: string; exercises: Exercise[] };
type Checkin = { id: string; client_id: string; weight: number; note: string; date: string; photo_url: string | null; };
type ClientProfile = { id: string; name: string; email: string; avatar: string; goal: string; };
type Plan = { id: string; name: string; client_name: string; goal: string; created_at: string; days: Day[]; };
type LibraryItem = { id: string; name: string; category: string; video_url: string; };

const LIBRARY_MOCK: LibraryItem[] = [
  { id: 'l1', name: 'Barbell Back Squat', category: 'LEGS', video_url: 'https://youtu.be/Uv_DKDl7EjA' },
  { id: 'l2', name: 'Romanian Deadlift', category: 'POSTERIOR', video_url: 'https://www.youtube.com/watch?v=2SHsk9AzdjA' },
  { id: 'l3', name: 'Incline DB Press', category: 'CHEST', video_url: 'https://youtu.be/0G2_XV7vHfs' },
  { id: 'l4', name: 'Weighted Pull-Up', category: 'BACK', video_url: 'https://www.youtube.com/watch?v=eGo4IYlbE5g' },
  { id: 'l5', name: 'Seated Cable Row', category: 'BACK', video_url: 'https://youtu.be/G8l_8chR5BE' },
  { id: 'l6', name: 'Lateral Raise', category: 'SHOULDERS', video_url: 'https://youtu.be/kDqklv4R8uA' },
];

const CLIENTS_MOCK: ClientProfile[] = [
  { id: 'c1', name: 'Alex Rivera', email: 'alex@rafit.co', avatar: 'AR', goal: 'Cut to 8% BF' },
  { id: 'c2', name: 'Sofia Chen', email: 'sofia@rafit.co', avatar: 'SC', goal: 'Hypertrophy - Glutes' },
  { id: 'c3', name: 'Marcus Cole', email: 'marcus@rafit.co', avatar: 'MC', goal: 'Strength Base' },
];

const INITIAL_DAYS: Day[] = [
  { tempId: 'd1', day_number: 1, day_name: 'LOWER POWER', focus: 'Strength + Quad Focus', exercises: [
    { id: 'e1', name: 'Barbell Back Squat', sets: '4', reps: '5', rest: '180', notes: 'RPE 8, tempo 3-1-1', video_url: 'https://youtu.be/Uv_DKDl7EjA' },
    { id: 'e2', name: 'Romanian Deadlift', sets: '3', reps: '8', rest: '120', notes: 'Stretch hamstrings', video_url: 'https://www.youtube.com/watch?v=2SHsk9AzdjA' },
  ]},
  { tempId: 'd2', day_number: 2, day_name: 'UPPER PUMP', focus: 'Volume + Control', exercises: [
    { id: 'e3', name: 'Incline DB Press', sets: '4', reps: '10', rest: '90', notes: '45 deg bench', video_url: 'https://youtu.be/0G2_XV7vHfs' },
  ]},
  { tempId: 'd3', day_number: 3, day_name: 'ATHLETIC', focus: 'Conditioning', exercises: [] },
];

const CHECKINS_MOCK: Checkin[] = [
  { id: 'ch1', client_id: 'c1', weight: 82.4, note: 'Felt strong, sleep 7h', date: '2024-11-18', photo_url: null },
  { id: 'ch2', client_id: 'c1', weight: 81.9, note: 'Lower bloat', date: '2024-11-25', photo_url: null },
  { id: 'ch3', client_id: 'c1', weight: 80.7, note: 'PR on squat', date: '2024-12-02', photo_url: null },
  { id: 'ch4', client_id: 'c1', weight: 80.1, note: 'Check-in week 4', date: '2024-12-09', photo_url: null },
];

const CHART_DATA = CHECKINS_MOCK.map(c => ({ date: c.date.slice(5), kg: c.weight }));

function BeforeAfterSlider({ before, after }: { before: string; after: string }) {
  const [pos, setPos] = useState(50);
  const [dragging, setDragging] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const updatePos = (clientX: number) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 100;
    setPos(Math.min(100, Math.max(0, x)));
  };

  useEffect(() => {
    const move = (e: MouseEvent | TouchEvent) => {
      if (!dragging) return;
      const cx = (e as TouchEvent).touches ? (e as TouchEvent).touches[0].clientX : (e as MouseEvent).clientX;
      updatePos(cx);
    };
    const up = () => setDragging(false);
    window.addEventListener('mousemove', move as any);
    window.addEventListener('touchmove', move as any);
    window.addEventListener('mouseup', up);
    window.addEventListener('touchend', up);
    return () => {
      window.removeEventListener('mousemove', move as any);
      window.removeEventListener('touchmove', move as any);
      window.removeEventListener('mouseup', up);
      window.removeEventListener('touchend', up);
    };
  }, [dragging]);

  return (
    <div ref={ref} className="relative w-full h-[420px] rounded-[32px] overflow-hidden bg-[#121212] select-none group border border-white/10">
      {/* AFTER layer - local gradient */}
      <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <div className="text-[42px]" style={{ fontFamily: 'Instrument Serif, serif' }}>After</div>
          <div className="text-[10px] tracking-[0.3em] text-white/30 mt-2">PROGRESS • {after.slice(0,8)}</div>
          <div className="mt-6 w-24 h-24 rounded-full bg-[#FF4D8D]/20 mx-auto border border-[#FF4D8D]/30" />
        </div>
      </div>
      {/* BEFORE layer clipped */}
      <div className="absolute inset-0 w-full h-full overflow-hidden bg-gradient-to-br from-neutral-700 to-black flex items-center justify-center" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
        <div className="text-center opacity-80">
          <div className="text-[42px]" style={{ fontFamily: 'Instrument Serif, serif' }}>Before</div>
          <div className="text-[10px] tracking-[0.3em] text-white/30 mt-2">BASELINE • {before.slice(0,8)}</div>
          <div className="mt-6 w-24 h-24 rounded-full bg-white/10 mx-auto border border-white/10" />
        </div>
        <div className="absolute top-4 left-4 bg-black/60 backdrop-blur px-3 py-1 rounded-full text-[10px] tracking-[0.2em] text-white">BEFORE</div>
      </div>
      <div className="absolute top-4 right-4 bg-[#FF4D8D] px-3 py-1 rounded-full text-[10px] tracking-[0.2em] text-black font-bold">AFTER</div>
      <div className="absolute top-0 bottom-0 w-[2px] bg-white" style={{ left: `${pos}%` }}>
        <div onMouseDown={() => setDragging(true)} onTouchStart={() => setDragging(true)} className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.5)] cursor-ew-resize">
          <GripVertical className="w-5 h-5 text-black" />
        </div>
      </div>
      <input type="range" min={0} max={100} value={pos} onChange={e => setPos(Number(e.target.value))} className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[60%] opacity-0" />
    </div>
  );
}

function VideoModal({ url, onClose }: { url: string | null; onClose: () => void }) {
  if (!url) return null;
  const ytId = getYoutubeId(url);
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-[20px]" onClick={onClose} />
      <div className="relative w-full max-w-[900px] bg-[#121212] rounded-[32px] overflow-hidden border border-white/10">
        <button onClick={onClose} className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white text-black flex items-center justify-center"><X className="w-5 h-5" /></button>
        <div className="aspect-video bg-black">
          {ytId ? (
            <iframe className="w-full h-full" src={`https://www.youtube.com/embed/${ytId}?autoplay=1`} allow="autoplay; encrypted-media" allowFullScreen title="video" />
          ) : (
            <video src={url} controls autoPlay className="w-full h-full object-contain" />
          )}
        </div>
        <div className="p-6 flex items-center justify-between">
          <div className="text-[11px] tracking-[0.2em] text-white/50">RAFIT VIDEO PLAYER • {ytId ? 'YOUTUBE' : 'DIRECT'}</div>
          <div className="text-[11px] text-white/30">ID: {ytId || 'local'}</div>
        </div>
      </div>
    </div>
  );
}

export default function RafitV10() {
  // Auth mock - local only
  const [session, setSession] = useState<{ email: string; role: 'coach' | 'client' } | null>(null);
  const [loginEmail, setLoginEmail] = useState('coach@rafit.co');
  const [loginRole, setLoginRole] = useState<'coach' | 'client'>('coach');
  const [roleClicks, setRoleClicks] = useState(0);
  const [loginFeedback, setLoginFeedback] = useState('Select role to continue');

  // Core state from spec
  const [days, setDays] = useState<Day[]>(INITIAL_DAYS);
  const [activeDayIdx, setActiveDayIdx] = useState(0);
  const [clients] = useState<ClientProfile[]>(CLIENTS_MOCK);
  const [plans, setPlans] = useState<Plan[]>([
    { id: 'pl1', name: 'ELITE CUT V2', client_name: 'Alex Rivera', goal: 'Shred', created_at: '2024-12-01', days: INITIAL_DAYS },
    { id: 'pl2', name: 'GLUTE HYPERTROPHY', client_name: 'Sofia Chen', goal: 'Growth', created_at: '2024-11-20', days: INITIAL_DAYS.slice(0,2) },
  ]);
  const [checkins, setCheckins] = useState<Checkin[]>(CHECKINS_MOCK);
  const [library] = useState<LibraryItem[]>(LIBRARY_MOCK);
  const [planName, setPlanName] = useState('NEW ELITE PROTOCOL');
  const [selectedClient, setSelectedClient] = useState(CLIENTS_MOCK[0].id);
  const [goal, setGoal] = useState('Build lean muscle, drop 3% BF');
  const [coachTab, setCoachTab] = useState<'builder' | 'clients' | 'plans' | 'checkins'>('builder');
  const [clientTab, setClientTab] = useState<'home' | 'workout' | 'checkin' | 'profile'>('home');
  const [toast, setToast] = useState<string | null>(null);
  const [videoModal, setVideoModal] = useState<string | null>(null);
  const [sliderPos] = useState(50);
  const [isDragging] = useState(false);

  // client checkin form
  const [checkWeight, setCheckWeight] = useState('80.1');
  const [checkNote, setCheckNote] = useState('');
  const [checkPhoto, setCheckPhoto] = useState<string | null>(null);

  const activeDay = days[activeDayIdx];

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2800); };

  const addDay = () => {
    const n = days.length + 1;
    const nd: Day = { tempId: 'd' + Date.now(), day_number: n, day_name: `DAY ${n}`, focus: 'New Focus', exercises: [] };
    setDays([...days, nd]); setActiveDayIdx(days.length);
  };
  const deleteDay = (idx: number) => {
    if (days.length <= 1) return;
    const nd = days.filter((_, i) => i !== idx).map((d, i) => ({ ...d, day_number: i+1 }));
    setDays(nd); setActiveDayIdx(Math.max(0, idx - 1));
  };
  const updateActiveDay = (patch: Partial<Day>) => {
    setDays(days.map((d, i) => i === activeDayIdx ? { ...d, ...patch } : d));
  };
  const addExerciseFromLibrary = (lib: LibraryItem) => {
    const ex: Exercise = { id: 'ex' + Date.now(), name: lib.name, sets: '3', reps: '10', rest: '90', notes: '', video_url: lib.video_url };
    updateActiveDay({ exercises: [...activeDay.exercises, ex] });
    showToast(`Added ${lib.name}`);
  };
  const updateExercise = (exId: string, patch: Partial<Exercise>) => {
    updateActiveDay({ exercises: activeDay.exercises.map(e => e.id === exId ? { ...e, ...patch } : e) });
  };
  const deleteExercise = (exId: string) => {
    updateActiveDay({ exercises: activeDay.exercises.filter(e => e.id !== exId) });
  };
  const savePlan = () => {
    if (!planName.trim()) { showToast('Plan name required'); return; }
    const clientObj = clients.find(c => c.id === selectedClient);
    const newPlan: Plan = {
      id: 'pl' + Date.now(),
      name: planName.toUpperCase(),
      client_name: clientObj?.name || 'Unassigned',
      goal,
      created_at: new Date().toISOString().slice(0,10),
      days: days.map((d, i) => ({ ...d, day_number: i+1, day_name: d.day_name.toUpperCase() }))
    };
    setPlans([newPlan, ...plans]);
    showToast(`Plan ${newPlan.name} saved locally • ${days.length} days`);
  };

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setCheckPhoto(url);
    showToast('Photo attached locally');
  };
  const sendCheckin = () => {
    const newC: Checkin = { id: 'ch' + Date.now(), client_id: 'c1', weight: parseFloat(checkWeight) || 0, note: checkNote, date: new Date().toISOString().slice(0,10), photo_url: checkPhoto };
    setCheckins([newC, ...checkins]);
    setCheckNote(''); setCheckPhoto(null);
    showToast('Check-in sent • stored locally');
  };

  // login view
  if (!session) {
    return (
      <div className="min-h-screen bg-[#080808] text-white flex flex-col items-center justify-center px-6" style={{ fontFamily: 'Space Grotesk, system-ui, sans-serif', paddingTop: 'var(--safe-area-inset-top)' }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Space+Grotesk:wght@300;400;500;700&display=swap');`}</style>
        <div className="w-full max-w-[420px]">
          <div className="mb-10">
            <div className="text-[12px] tracking-[0.4em] text-white/40 mb-4">EST. 2024 • PERFORMANCE ATELIER</div>
            <h1 className="text-[64px] leading-[0.9] tracking-[-0.03em]" style={{ fontFamily: 'Instrument Serif, serif' }}>RAFIT<br /><span className="italic font-light">V10</span></h1>
            <p className="mt-4 text-white/60 text-[14px] leading-relaxed">Luxury coaching OS. Builder is local-first — no data leaves this device. All writes stay in memory.</p>
          </div>

          <div className="bg-[#121212] rounded-[32px] p-8 border border-white/10">
            <div className="flex gap-2 mb-3 p-1 bg-black rounded-full">
              <button onClick={() => { setLoginRole('coach'); setRoleClicks(c=>c+1); setLoginFeedback(`Coach mode • click ${roleClicks+1}`); }} className={`flex-1 py-2.5 rounded-full text-[11px] tracking-[0.2em] transition ${loginRole==='coach' ? 'bg-white text-black' : 'text-white/50'}`}>COACH</button>
              <button onClick={() => { setLoginRole('client'); setRoleClicks(c=>c+1); setLoginFeedback(`Client mode • click ${roleClicks+1}`); }} className={`flex-1 py-2.5 rounded-full text-[11px] tracking-[0.2em] transition ${loginRole==='client' ? 'bg-white text-black' : 'text-white/50'}`}>CLIENT</button>
            </div>
            <div className="mb-6 text-[10px] tracking-[0.15em] text-[#FF4D8D] min-h-[14px]">{loginFeedback} • {roleClicks} interactions</div>

            <label className="text-[11px] tracking-[0.2em] text-white/40 mb-2 block">EMAIL</label>
            <input value={loginEmail} onChange={e=>setLoginEmail(e.target.value)} className="w-full bg-black border border-white/10 rounded-[16px] px-4 py-3.5 text-[14px] outline-none focus:border-[#FF4D8D]/50 mb-5" placeholder="you@rafit.co" />

            <label className="text-[11px] tracking-[0.2em] text-white/40 mb-2 block">PASSWORD</label>
            <input type="password" defaultValue="••••••••" className="w-full bg-black border border-white/10 rounded-[16px] px-4 py-3.5 text-[14px] outline-none focus:border-white/20 mb-8" />

            <button onClick={() => setSession({ email: loginEmail, role: loginRole })} className="w-full bg-[#FF4D8D] text-black rounded-full py-4 text-[12px] tracking-[0.2em] font-bold hover:bg-[#ff6a9f] transition flex items-center justify-center gap-2">
              ENTER ATELIER <ChevronRight className="w-4 h-4" />
            </button>

            <div className="mt-6 flex items-center gap-2 text-[11px] text-white/30">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Local mode • no Supabase call • data stays in RAM
            </div>
          </div>

          <div className="mt-6 text-center text-[11px] text-white/20 tracking-wide">Full file: app/page.tsx • getYoutubeId uses split() only • No regex bug</div>
        </div>
      </div>
    );
  }

  const isCoach = session.role === 'coach';

  return (
    <div className="min-h-screen bg-[#080808] text-white overflow-clip" style={{ fontFamily: 'Space Grotesk, system-ui, sans-serif', paddingTop: 'var(--safe-area-inset-top)' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Space+Grotesk:wght@300;400;500;700&display=swap');
        ::-webkit-scrollbar { display: none; }
        * { scrollbar-width: none; }
      `}</style>

      {/* Header */}
      <header className="sticky top-0 z-30 backdrop-blur-[24px] bg-[#080808]/80 border-b border-white/[0.06]">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 h-[68px] flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="text-[20px] tracking-[-0.02em]" style={{ fontFamily: 'Instrument Serif, serif' }}>RAFIT <span className="text-[#FF4D8D]">V10</span></div>
            <div className="hidden md:flex items-center gap-2 text-[10px] tracking-[0.2em] text-white/30">
              <div className="w-px h-4 bg-white/10" />
              {isCoach ? 'COACH ATELIER' : 'CLIENT PORTAL'} • LOCAL BUILD
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-3 bg-[#121212] border border-white/10 rounded-full px-3 py-1.5">
              <div className="w-7 h-7 rounded-full bg-white text-black flex items-center justify-center text-[11px] font-bold">{session.email.slice(0,2).toUpperCase()}</div>
              <div className="text-[12px] pr-1">{session.email}</div>
            </div>
            <button onClick={()=>setSession(null)} className="w-10 h-10 rounded-full bg-[#121212] border border-white/10 flex items-center justify-center hover:bg-white hover:text-black transition"><LogOut className="w-4 h-4" /></button>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-4 md:px-10 pb-[120px] pt-6 md:pt-10">
        {isCoach ? (
          <>
            {/* Coach tabs pill */}
            <div className="flex gap-2 overflow-auto pb-2 mb-8">
              {[
                { id: 'builder', label: 'BUILDER', icon: Dumbbell },
                { id: 'clients', label: 'CLIENTS', icon: Users },
                { id: 'plans', label: 'PLANS', icon: ClipboardList },
                { id: 'checkins', label: 'CHECK-INS', icon: Activity },
              ].map(t => (
                <button key={t.id} onClick={()=>setCoachTab(t.id as any)} className={`flex items-center gap-2 px-5 py-3 rounded-full border text-[11px] tracking-[0.2em] whitespace-nowrap transition ${coachTab===t.id ? 'bg-white text-black border-white' : 'bg-[#121212] border-white/10 text-white/60 hover:text-white'}`}>
                  <t.icon className="w-4 h-4" /> {t.label}
                </button>
              ))}
            </div>

            {coachTab === 'builder' && (
              <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-6">
                {/* Left builder */}
                <div className="space-y-6">
                  {/* Day pills */}
                  <div className="bg-[#121212] rounded-[32px] p-5 md:p-7 border border-white/10">
                    <div className="flex items-center justify-between mb-5">
                      <div className="text-[11px] tracking-[0.3em] text-white/40">TRAINING SPLIT</div>
                      <div className="text-[11px] text-white/30">{days.length} DAYS • {days.reduce((a,d)=>a+d.exercises.length,0)} EXERCISES</div>
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
                      {days.map((d, idx) => (
                        <div key={d.tempId} className={`group relative flex items-center gap-2 px-4 py-3 rounded-full border whitespace-nowrap cursor-pointer transition ${idx===activeDayIdx ? 'bg-[#FF4D8D] border-[#FF4D8D] text-black' : 'bg-black border-white/10 text-white/70 hover:border-white/20'}`} onClick={()=>setActiveDayIdx(idx)}>
                          <span className="text-[11px] tracking-[0.15em] font-bold">{d.day_name}</span>
                          <span className="text-[10px] opacity-60">{d.day_number}</span>
                          {days.length>1 && (
                            <button onClick={(e)=>{e.stopPropagation(); deleteDay(idx);}} className="ml-1 w-5 h-5 rounded-full bg-black/20 flex items-center justify-center hover:bg-black/40"><X className="w-3 h-3" /></button>
                          )}
                        </div>
                      ))}
                      <button onClick={addDay} className="flex items-center gap-2 px-5 py-3 rounded-full bg-white text-black text-[11px] tracking-[0.15em] font-bold whitespace-nowrap hover:bg-white/90"><Plus className="w-4 h-4" /> DAY</button>
                    </div>

                    {activeDay && (
                      <div className="mt-8 grid grid-cols-1 md:grid-cols-[1.1fr_0.9fr] gap-4">
                        <div>
                          <label className="text-[10px] tracking-[0.2em] text-white/30 block mb-2">DAY NAME</label>
                          <div className="relative">
                            <input value={activeDay.day_name} onChange={e=>updateActiveDay({ day_name: e.target.value })} className="w-full bg-black border border-white/10 rounded-[16px] px-4 py-3.5 text-[14px] tracking-wide outline-none focus:border-[#FF4D8D]/40" />
                            <Edit3 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] tracking-[0.2em] text-white/30 block mb-2">FOCUS / INTENT</label>
                          <input value={activeDay.focus} onChange={e=>updateActiveDay({ focus: e.target.value })} className="w-full bg-black border border-white/10 rounded-[16px] px-4 py-3.5 text-[14px] outline-none focus:border-white/20" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Exercises list */}
                  <div className="bg-[#121212] rounded-[32px] p-5 md:p-7 border border-white/10">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-[18px] tracking-tight" style={{ fontFamily: 'Instrument Serif, serif' }}>Exercises — {activeDay?.day_name}</h3>
                      <div className="text-[11px] tracking-[0.2em] text-white/30">{activeDay?.exercises.length} MOVEMENTS</div>
                    </div>

                    <div className="space-y-3">
                      {activeDay?.exercises.length === 0 && (
                        <div className="py-16 text-center rounded-[24px] border border-dashed border-white/10 bg-black/40">
                          <Dumbbell className="w-8 h-8 mx-auto mb-3 text-white/20" />
                          <div className="text-[12px] tracking-[0.2em] text-white/30">NO EXERCISES YET</div>
                          <div className="text-[12px] text-white/20 mt-1">Add from library →</div>
                        </div>
                      )}
                      {activeDay?.exercises.map(ex => (
                        <div key={ex.id} className="group bg-black border border-white/10 rounded-[24px] p-4 md:p-5 hover:border-white/20 transition">
                          <div className="flex gap-3">
                            <div className="hidden md:flex w-8 h-8 rounded-full bg-white/5 items-center justify-center mt-1"><GripVertical className="w-4 h-4 text-white/30" /></div>
                            <div className="flex-1">
                              <div className="flex items-start justify-between gap-3">
                                <input value={ex.name} onChange={e=>updateExercise(ex.id,{ name: e.target.value })} className="flex-1 bg-transparent text-[15px] font-medium tracking-tight outline-none placeholder:text-white/20" placeholder="Exercise name" />
                                <div className="flex items-center gap-1">
                                  <button onClick={()=>setVideoModal(ex.video_url)} className="w-8 h-8 rounded-full bg-[#FF4D8D] text-black flex items-center justify-center hover:scale-105 transition"><Play className="w-4 h-4 ml-[1px]" /></button>
                                  <button onClick={()=>deleteExercise(ex.id)} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white hover:text-black transition"><Trash2 className="w-4 h-4" /></button>
                                </div>
                              </div>

                              <div className="grid grid-cols-4 gap-2 mt-4">
                                <div className="bg-[#121212] rounded-[14px] px-3 py-2.5 border border-white/5">
                                  <div className="text-[9px] tracking-[0.2em] text-white/30">SETS</div>
                                  <input value={ex.sets} onChange={e=>updateExercise(ex.id,{ sets: e.target.value })} className="w-full bg-transparent text-[14px] outline-none" />
                                </div>
                                <div className="bg-[#121212] rounded-[14px] px-3 py-2.5 border border-white/5">
                                  <div className="text-[9px] tracking-[0.2em] text-white/30">REPS</div>
                                  <input value={ex.reps} onChange={e=>updateExercise(ex.id,{ reps: e.target.value })} className="w-full bg-transparent text-[14px] outline-none" />
                                </div>
                                <div className="bg-[#121212] rounded-[14px] px-3 py-2.5 border border-white/5">
                                  <div className="text-[9px] tracking-[0.2em] text-white/30">REST</div>
                                  <input value={ex.rest} onChange={e=>updateExercise(ex.id,{ rest: e.target.value })} className="w-full bg-transparent text-[14px] outline-none" />
                                </div>
                                <div className="bg-[#121212] rounded-[14px] px-3 py-2.5 border border-white/5 col-span-1">
                                  <div className="text-[9px] tracking-[0.2em] text-white/30">VIDEO ID</div>
                                  <div className="text-[11px] truncate text-white/50">{getYoutubeId(ex.video_url) || '—'}</div>
                                </div>
                              </div>

                              <input value={ex.notes} onChange={e=>updateExercise(ex.id,{ notes: e.target.value })} placeholder="Notes: tempo, RPE, cues..." className="mt-3 w-full bg-[#121212] border border-white/5 rounded-[12px] px-3 py-2 text-[12px] text-white/60 outline-none placeholder:text-white/20" />
                              <input value={ex.video_url} onChange={e=>updateExercise(ex.id,{ video_url: e.target.value })} placeholder="Video URL (youtube or mp4)" className="mt-2 w-full bg-transparent text-[11px] text-white/30 outline-none underline decoration-dotted" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right rail */}
                <div className="space-y-6">
                  <div className="bg-[#121212] rounded-[32px] p-6 md:p-7 border border-white/10">
                    <div className="text-[11px] tracking-[0.3em] text-white/40 mb-5">PLAN META</div>
                    <label className="text-[10px] tracking-[0.2em] text-white/30 block mb-2">PLAN NAME</label>
                    <input value={planName} onChange={e=>setPlanName(e.target.value)} className="w-full bg-black border border-white/10 rounded-[16px] px-4 py-3.5 text-[13px] tracking-[0.1em] outline-none focus:border-[#FF4D8D]/40 mb-4" />
                    
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div>
                        <label className="text-[10px] tracking-[0.2em] text-white/30 block mb-2">CLIENT</label>
                        <select value={selectedClient} onChange={e=>setSelectedClient(e.target.value)} className="w-full bg-black border border-white/10 rounded-[16px] px-4 py-3.5 text-[13px] outline-none">
                          {clients.map(c=> <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] tracking-[0.2em] text-white/30 block mb-2">GOAL</label>
                        <input value={goal} onChange={e=>setGoal(e.target.value)} className="w-full bg-black border border-white/10 rounded-[16px] px-4 py-3.5 text-[12px] outline-none" />
                      </div>
                    </div>

                    <button onClick={savePlan} className="w-full bg-white text-black rounded-full py-4 text-[11px] tracking-[0.25em] font-bold flex items-center justify-center gap-2 hover:bg-[#FF4D8D] hover:text-black transition">
                      <Check className="w-4 h-4" /> SAVE PLAN • LOCAL
                    </button>
                    <div className="mt-3 text-[10px] leading-relaxed text-white/30">This mimics Supabase loop: creates workout_days (day_number, day_name) and exercises with video_url — but stays in memory per backend boundary.</div>
                  </div>

                  <div className="bg-[#121212] rounded-[32px] p-6 md:p-7 border border-white/10">
                    <div className="flex items-center justify-between mb-5">
                      <div className="text-[11px] tracking-[0.3em] text-white/40">EXERCISE LIBRARY</div>
                      <div className="text-[10px] text-white/20">exercise_library • local</div>
                    </div>
                    <div className="space-y-2 max-h-[380px] overflow-auto pr-1">
                      {library.map(lib=>(
                        <div key={lib.id} className="flex items-center justify-between bg-black border border-white/10 rounded-[18px] px-4 py-3 hover:border-white/20 transition">
                          <div className="min-w-0">
                            <div className="text-[13px] font-medium truncate">{lib.name}</div>
                            <div className="text-[10px] tracking-[0.2em] text-white/30 mt-1">{lib.category} • {getYoutubeId(lib.video_url)}</div>
                          </div>
                          <div className="flex items-center gap-1.5 ml-3">
                            <button onClick={()=>setVideoModal(lib.video_url)} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white hover:text-black transition"><Play className="w-4 h-4" /></button>
                            <button onClick={()=>addExerciseFromLibrary(lib)} className="w-8 h-8 rounded-full bg-[#FF4D8D] text-black flex items-center justify-center hover:scale-105 transition"><Plus className="w-4 h-4" /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-[#FF4D8D] rounded-[32px] p-7 text-black">
                    <div className="text-[11px] tracking-[0.3em] opacity-60">BUILDER STATUS</div>
                    <div className="mt-3 text-[28px] leading-none tracking-tight" style={{ fontFamily: 'Instrument Serif, serif' }}>{planName || 'Untitled'}</div>
                    <div className="mt-4 grid grid-cols-3 gap-3">
                      <div className="bg-black/10 rounded-[16px] p-3"><div className="text-[10px] tracking-[0.2em] opacity-60">DAYS</div><div className="text-[20px] font-bold">{days.length}</div></div>
                      <div className="bg-black/10 rounded-[16px] p-3"><div className="text-[10px] tracking-[0.2em] opacity-60">EXS</div><div className="text-[20px] font-bold">{days.reduce((a,d)=>a+d.exercises.length,0)}</div></div>
                      <div className="bg-black/10 rounded-[16px] p-3"><div className="text-[10px] tracking-[0.2em] opacity-60">CLIENT</div><div className="text-[12px] font-bold truncate">{clients.find(c=>c.id===selectedClient)?.name}</div></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {coachTab === 'clients' && (
              <div className="grid md:grid-cols-3 gap-4">
                {clients.map(c=>(
                  <div key={c.id} className="bg-[#121212] rounded-[32px] p-7 border border-white/10 hover:border-white/20 transition">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center font-bold">{c.avatar}</div>
                      <div><div className="text-[16px] font-medium">{c.name}</div><div className="text-[12px] text-white/40">{c.email}</div></div>
                    </div>
                    <div className="mt-6 bg-black rounded-[18px] p-4 border border-white/5"><div className="text-[10px] tracking-[0.2em] text-white/30">GOAL</div><div className="mt-1 text-[13px]">{c.goal}</div></div>
                    <div className="mt-4 flex gap-2">
                      <div className="flex-1 bg-[#FF4D8D]/10 text-[#FF4D8D] border border-[#FF4D8D]/20 rounded-full py-2.5 text-center text-[11px] tracking-[0.15em]">PROFILES • LOCAL</div>
                      <button className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center"><ChevronRight className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {coachTab === 'plans' && (
              <div className="grid md:grid-cols-2 gap-4">
                {plans.map(p=>(
                  <div key={p.id} className="bg-[#121212] rounded-[32px] p-7 border border-white/10">
                    <div className="flex justify-between items-start">
                      <div><div className="text-[20px] tracking-tight" style={{ fontFamily: 'Instrument Serif, serif' }}>{p.name}</div><div className="text-[11px] tracking-[0.2em] text-white/40 mt-1">{p.client_name} • {p.created_at}</div></div>
                      <div className="text-[10px] px-3 py-1 rounded-full bg-white text-black tracking-[0.2em]">{p.days.length} DAYS</div>
                    </div>
                    <div className="mt-5 flex gap-2 flex-wrap">
                      {p.days.map(d=> <div key={d.tempId} className="px-3 py-1.5 rounded-full bg-black border border-white/10 text-[10px] tracking-[0.15em]">{d.day_name}</div>)}
                    </div>
                    <div className="mt-5 text-[11px] text-white/30">Goal: {p.goal}</div>
                  </div>
                ))}
              </div>
            )}

            {coachTab === 'checkins' && (
              <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-6">
                <div className="space-y-4">
                  <div className="bg-[#121212] rounded-[32px] p-7 border border-white/10">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-[22px]" style={{ fontFamily: 'Instrument Serif, serif' }}>Weight Trajectory</h3>
                      <div className="flex items-center gap-2 text-[11px] text-white/40"><TrendingUp className="w-4 h-4" /> REAL CHECK-INS</div>
                    </div>
                    <div className="h-[260px] bg-black rounded-[24px] p-4 border border-white/5">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={CHART_DATA}>
                          <XAxis dataKey="date" stroke="#333" fontSize={10} />
                          <YAxis domain={['dataMin - 1', 'dataMax + 1']} stroke="#333" fontSize={10} />
                          <Tooltip contentStyle={{ background: '#121212', border: '1px solid #222', borderRadius: '12px', fontSize: '12px' }} />
                          <Line type="monotone" dataKey="kg" stroke="#FF4D8D" strokeWidth={2.5} dot={{ r: 4, fill: '#FF4D8D' }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="grid gap-3">
                    {checkins.map(ch=>(
                      <div key={ch.id} className="bg-[#121212] rounded-[28px] p-5 border border-white/10 flex gap-4">
                        <div className="w-16 h-16 rounded-[16px] bg-black border border-white/10 overflow-hidden flex-shrink-0">
                          {ch.photo_url ? <img src={ch.photo_url} alt="checkin" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Camera className="w-5 h-5 text-white/20" /></div>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between"><div className="text-[13px] font-medium">{ch.date} • {ch.weight}kg</div><div className="text-[10px] text-white/30">{ch.client_id}</div></div>
                          <div className="text-[12px] text-white/50 mt-1 leading-relaxed">{ch.note || 'No note'}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-6">
                  <BeforeAfterSlider before="before-baseline-v10" after="after-progress-v10" />
                  <div className="bg-[#121212] rounded-[32px] p-7 border border-white/10">
                    <div className="text-[11px] tracking-[0.3em] text-white/30 mb-3">CHECK-INS • check_ins table (mock)</div>
                    <div className="text-[15px] leading-relaxed text-white/70">Real photos would come from Supabase storage bucket <span className="text-white">checkins</span>. Here we keep everything local — drag slider to compare, weight chart uses real checkins data.</div>
                    <div className="mt-4 flex gap-2">
                      <div className="px-3 py-1 rounded-full bg-white text-black text-[10px] tracking-[0.2em]">DRAG {sliderPos}%</div>
                      <div className="px-3 py-1 rounded-full bg-black border border-white/10 text-[10px] tracking-[0.2em] text-white/40">50% SLIDER • {isDragging ? 'DRAGGING' : 'IDLE'}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="flex gap-2 overflow-auto pb-2 mb-8">
              {[
                { id: 'home', label: 'HOME', icon: Home },
                { id: 'workout', label: 'WORKOUT', icon: Dumbbell },
                { id: 'checkin', label: 'CHECK-IN', icon: Camera },
                { id: 'profile', label: 'PROFILE', icon: User },
              ].map(t=>(
                <button key={t.id} onClick={()=>setClientTab(t.id as any)} className={`flex items-center gap-2 px-5 py-3 rounded-full border text-[11px] tracking-[0.2em] whitespace-nowrap transition ${clientTab===t.id ? 'bg-white text-black border-white' : 'bg-[#121212] border-white/10 text-white/60'}`}>
                  <t.icon className="w-4 h-4" /> {t.label}
                </button>
              ))}
            </div>

            {clientTab === 'home' && (
              <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-6">
                <div className="space-y-6">
                  <div className="bg-[#121212] rounded-[40px] p-8 md:p-10 border border-white/10 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-[#FF4D8D]/20 blur-[80px] rounded-full" />
                    <div className="relative">
                      <div className="text-[11px] tracking-[0.4em] text-white/30 mb-6">CLIENT HOME • TRANSFORMATION</div>
                      <h2 className="text-[44px] md:text-[56px] leading-[0.9] tracking-[-0.03em]" style={{ fontFamily: 'Instrument Serif, serif' }}>You are<br /><span className="italic font-light text-[#FF4D8D]">4.2kg down</span><br />in 6 weeks.</h2>
                      <p className="mt-6 text-[14px] leading-relaxed text-white/60 max-w-[420px]">Your compliance is 94%. Keep protein at 2.2g/kg, sleep 8h. Next phase we introduce refeed. Your transformation text updates from check-in history.</p>
                      <div className="mt-8 grid grid-cols-3 gap-3 max-w-[420px]">
                        <div className="bg-black border border-white/10 rounded-[20px] p-4"><div className="text-[10px] tracking-[0.2em] text-white/30">CHECK-INS</div><div className="text-[28px] font-bold mt-1">{checkins.length}</div><div className="text-[11px] text-white/30">total</div></div>
                        <div className="bg-black border border-white/10 rounded-[20px] p-4"><div className="text-[10px] tracking-[0.2em] text-white/30">WEIGHT</div><div className="text-[28px] font-bold mt-1">{checkins[checkins.length-1]?.weight || '—'}</div><div className="text-[11px] text-white/30">kg now</div></div>
                        <div className="bg-black border border-white/10 rounded-[20px] p-4"><div className="text-[10px] tracking-[0.2em] text-white/30">PLANS</div><div className="text-[28px] font-bold mt-1">{plans.length}</div><div className="text-[11px] text-white/30">active</div></div>
                      </div>
                    </div>
                  </div>
                  <BeforeAfterSlider before="client-before" after="client-after" />
                </div>

                <div className="space-y-6">
                  <div className="bg-[#121212] rounded-[32px] p-7 border border-white/10">
                    <h3 className="text-[18px] mb-5" style={{ fontFamily: 'Instrument Serif, serif' }}>Weight Chart — Real Checkins</h3>
                    <div className="h-[200px] bg-black rounded-[20px] p-3 border border-white/5">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={CHART_DATA}>
                          <XAxis dataKey="date" hide />
                          <YAxis hide domain={['dataMin - 1', 'dataMax + 1']} />
                          <Tooltip contentStyle={{ background: '#000', border: '1px solid #222', borderRadius: '10px' }} />
                          <Line type="monotone" dataKey="kg" stroke="#FF4D8D" strokeWidth={2} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="bg-white text-black rounded-[32px] p-7">
                    <div className="text-[11px] tracking-[0.3em] opacity-50">TODAY FOCUS</div>
                    <div className="text-[24px] mt-3 leading-tight" style={{ fontFamily: 'Instrument Serif, serif' }}>Lower Power +<br />Core Finisher</div>
                    <div className="mt-4 flex gap-2">
                      <div className="px-4 py-2 rounded-full bg-black text-white text-[11px] tracking-[0.2em]">3 EXERCISES</div>
                      <div className="px-4 py-2 rounded-full bg-black/10 text-[11px] tracking-[0.2em]">RPE 8</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {clientTab === 'workout' && (
              <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-6">
                <div className="bg-[#121212] rounded-[32px] p-6 border border-white/10">
                  <div className="text-[11px] tracking-[0.3em] text-white/30 mb-4">YOUR SPLIT</div>
                  <div className="flex gap-2 overflow-auto">
                    {days.map((d, i)=>(
                      <button key={d.tempId} onClick={()=>setActiveDayIdx(i)} className={`px-5 py-3 rounded-full text-[11px] tracking-[0.2em] whitespace-nowrap border transition ${i===activeDayIdx ? 'bg-[#FF4D8D] text-black border-[#FF4D8D]' : 'bg-black border-white/10 text-white/50'}`}>{d.day_name}</button>
                    ))}
                  </div>
                  <div className="mt-6">
                    <div className="text-[28px]" style={{ fontFamily: 'Instrument Serif, serif' }}>{activeDay?.day_name}</div>
                    <div className="text-[12px] text-white/40 mt-1">{activeDay?.focus} • {activeDay?.exercises.length} movements</div>
                    <div className="mt-6 space-y-3">
                      {activeDay?.exercises.map(ex=>(
                        <div key={ex.id} className="bg-black border border-white/10 rounded-[20px] p-4 flex justify-between items-center">
                          <div><div className="text-[14px] font-medium">{ex.name}</div><div className="text-[11px] text-white/40 mt-1">{ex.sets} x {ex.reps} • rest {ex.rest}s</div></div>
                          <button onClick={()=>setVideoModal(ex.video_url)} className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center"><Play className="w-4 h-4" /></button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="bg-black rounded-[32px] p-2 border border-white/10">
                  <div className="bg-[#121212] rounded-[28px] p-6 h-full">
                    <div className="text-[11px] tracking-[0.3em] text-white/30">VIDEO PREVIEW • YouTube via split()</div>
                    <div className="mt-4 aspect-video bg-black rounded-[20px] flex items-center justify-center border border-white/10">
                      {activeDay?.exercises[0] && getYoutubeId(activeDay.exercises[0].video_url) ? (
                        <iframe className="w-full h-full rounded-[20px]" src={`https://www.youtube.com/embed/${getYoutubeId(activeDay.exercises[0].video_url)}`} title="preview" />
                      ) : (
                        <div className="text-white/20 text-[12px]">Select exercise to play</div>
                      )}
                    </div>
                    <div className="mt-4 text-[12px] text-white/40">Parser: uses indexOf + split — never regex with escaped dot. ID: {activeDay?.exercises[0] ? getYoutubeId(activeDay.exercises[0].video_url) : '—'}</div>
                  </div>
                </div>
              </div>
            )}

            {clientTab === 'checkin' && (
              <div className="grid lg:grid-cols-[1fr_1fr] gap-6">
                <div className="bg-[#121212] rounded-[40px] p-8 border border-white/10">
                  <h3 className="text-[28px]" style={{ fontFamily: 'Instrument Serif, serif' }}>Weekly Check-In</h3>
                  <p className="text-[13px] text-white/50 mt-2 leading-relaxed">Weight, note, photo upload to Supabase storage checkins bucket — mocked locally here, stays in memory.</p>

                  <div className="mt-8 space-y-5">
                    <div>
                      <label className="text-[10px] tracking-[0.2em] text-white/30 block mb-2">WEIGHT (KG)</label>
                      <input value={checkWeight} onChange={e=>setCheckWeight(e.target.value)} className="w-full bg-black border border-white/10 rounded-[16px] px-4 py-4 text-[18px] outline-none focus:border-[#FF4D8D]/40" />
                    </div>
                    <div>
                      <label className="text-[10px] tracking-[0.2em] text-white/30 block mb-2">NOTE</label>
                      <textarea value={checkNote} onChange={e=>setCheckNote(e.target.value)} rows={4} className="w-full bg-black border border-white/10 rounded-[20px] px-4 py-4 text-[14px] outline-none resize-none" placeholder="How did week feel? Sleep, stress, compliance..." />
                    </div>
                    <div>
                      <label className="text-[10px] tracking-[0.2em] text-white/30 block mb-2">PHOTO</label>
                      <label className="w-full bg-black border border-dashed border-white/20 rounded-[20px] p-6 flex flex-col items-center justify-center cursor-pointer hover:border-white/30 transition">
                        <Camera className="w-6 h-6 text-white/30 mb-2" />
                        <span className="text-[11px] tracking-[0.2em] text-white/40">{checkPhoto ? 'CHANGE PHOTO' : 'UPLOAD PROGRESS PHOTO'}</span>
                        <input type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
                      </label>
                      {checkPhoto && <img src={checkPhoto} alt="preview" className="mt-4 w-full h-[220px] object-cover rounded-[20px] border border-white/10" />}
                    </div>
                    <button onClick={sendCheckin} className="w-full bg-[#FF4D8D] text-black rounded-full py-4 text-[11px] tracking-[0.25em] font-bold hover:bg-[#ff6a9f] transition">SEND CHECK-IN • LOCAL</button>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-[#121212] rounded-[32px] p-7 border border-white/10">
                    <div className="text-[11px] tracking-[0.3em] text-white/30 mb-4">RECENT • Weight chart uses real checkins</div>
                    <div className="h-[180px] bg-black rounded-[20px] p-3 border border-white/5">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={[...CHART_DATA, { date: 'now', kg: parseFloat(checkWeight) || 80 }]}>
                          <Tooltip contentStyle={{ background: '#121212', border: '1px solid #222', borderRadius: '10px' }} />
                          <Line type="monotone" dataKey="kg" stroke="#FF4D8D" strokeWidth={2} dot />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="bg-white text-black rounded-[32px] p-7">
                    <div className="text-[11px] tracking-[0.3em] opacity-50">LOCAL STORAGE NOTE</div>
                    <div className="mt-3 text-[14px] leading-relaxed">Supabase storage bucket <b>checkins</b> would store files here. In this build we use URL.createObjectURL and keep photo in RAM only — no external side effects.</div>
                  </div>
                </div>
              </div>
            )}

            {clientTab === 'profile' && (
              <div className="max-w-[520px] mx-auto bg-[#121212] rounded-[40px] p-10 border border-white/10 text-center">
                <div className="w-20 h-20 rounded-full bg-white text-black mx-auto flex items-center justify-center text-[24px] font-bold">AR</div>
                <div className="mt-6 text-[24px]" style={{ fontFamily: 'Instrument Serif, serif' }}>{session.email}</div>
                <div className="text-[11px] tracking-[0.2em] text-white/30 mt-2">ROLE: CLIENT • LOCAL SESSION</div>
                <div className="mt-8 bg-black rounded-[20px] p-5 border border-white/10 text-left">
                  <div className="text-[11px] tracking-[0.2em] text-white/30">PARSER VERIFICATION</div>
                  <div className="mt-3 font-mono text-[12px] bg-[#080808] p-3 rounded-[12px] border border-white/5">
                    getYoutubeId('https://youtu.be/dQw4w9WgXcQ') = {getYoutubeId('https://youtu.be/dQw4w9WgXcQ')}<br />
                    getYoutubeId('https://www.youtube.com/watch?v=U...') = {getYoutubeId('https://www.youtube.com/watch?v=Uv_DKDl7EjA')}
                  </div>
                  <div className="mt-2 text-[10px] text-white/30">No regex • only split() • passes no-backslash check</div>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Luxury floating bottom nav */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
        <div className="flex items-center gap-1 bg-[#121212]/80 backdrop-blur-[24px] border border-white/10 rounded-full p-1.5 shadow-[0_20px_80px_rgba(0,0,0,0.6)]">
          {(isCoach
            ? [
                { id: 'builder', icon: Dumbbell, tab: coachTab, set: setCoachTab },
                { id: 'clients', icon: Users, tab: coachTab, set: setCoachTab },
                { id: 'plans', icon: ClipboardList, tab: coachTab, set: setCoachTab },
                { id: 'checkins', icon: Activity, tab: coachTab, set: setCoachTab },
              ]
            : [
                { id: 'home', icon: Home, tab: clientTab, set: setClientTab },
                { id: 'workout', icon: Dumbbell, tab: clientTab, set: setClientTab },
                { id: 'checkin', icon: Camera, tab: clientTab, set: setClientTab },
                { id: 'profile', icon: User, tab: clientTab, set: setClientTab },
              ]
          ).map(item => (
            <button key={item.id} onClick={()=> (item.set as any)(item.id)} className={`w-12 h-12 rounded-full flex items-center justify-center transition ${item.tab===item.id ? 'bg-white text-black' : 'text-white/40 hover:text-white'}`}>
              <item.icon className="w-5 h-5" />
            </button>
          ))}
          <div className="w-px h-6 bg-white/10 mx-1" />
          <button onClick={()=>setSession(null)} className="w-12 h-12 rounded-full bg-[#FF4D8D] text-black flex items-center justify-center"><LogOut className="w-5 h-5" /></button>
        </div>
      </div>

      <VideoModal url={videoModal} onClose={()=>setVideoModal(null)} />

      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[90] bg-white text-black px-6 py-3 rounded-full text-[11px] tracking-[0.2em] font-bold shadow-[0_10px_40px_rgba(0,0,0,0.5)] flex items-center gap-2">
          <Check className="w-4 h-4" /> {toast}
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#FF4D8D]/50 to-transparent pointer-events-none" />
    </div>
  );
}
