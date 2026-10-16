'use client'
import React, { useState, useRef, useEffect } from 'react';
import { X, Plus, Play, Trash2, Check, GripVertical, ChevronRight, LogOut, Activity, Users, Dumbbell, ClipboardList, Home, User, Camera, TrendingUp, Edit3 } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';

// --- TYPES ---
type Exercise = {
  id: string;
  name: string;
  sets: string;
  reps: string;
  rest: string;
  notes: string;
  video_url: string;
};

type Day = {
  tempId: string;
  day_number: number;
  day_name: string;
  focus: string;
  exercises: Exercise[];
};

type SavedPlan = {
  id: string;
  createdAt: string;
  days: Day[];
};

type Role = 'client' | 'coach';

const FOCUS_CYCLE = [
  "GLUTEI FOCUS",
  "UPPER",
  "GLUTEI BURN",
  "FULL BODY",
  "CORE BLAST",
  "LEGS PUMP",
  "PUSH POWER"
];

const EXERCISE_LIBRARY: Omit<Exercise, 'id'>[] = [
  { name: "Hip Thrust Machine", sets: "4", reps: "12", rest: "90s", notes: "Squeeze 2s at top", video_url: "https://videos.pexels.com/video-files/5310859/5310859-hd_1080_1920_25fps.mp4" },
  { name: "RDL - Romanian Deadlift", sets: "4", reps: "10", rest: "90s", notes: "Slow eccentric", video_url: "https://videos.pexels.com/video-files/5310859/5310859-hd_1080_1920_25fps.mp4" },
  { name: "Bulgarian Split Squat", sets: "3", reps: "12/leg", rest: "60s", notes: "Knee over toe", video_url: "https://videos.pexels.com/video-files/5310859/5310859-hd_1080_1920_25fps.mp4" },
  { name: "Cable Kickback", sets: "3", reps: "15", rest: "60s", notes: "Control, no swing", video_url: "https://videos.pexels.com/video-files/5310859/5310859-hd_1080_1920_25fps.mp4" },
  { name: "Lat Pulldown Wide", sets: "4", reps: "12", rest: "75s", notes: "Chest up", video_url: "https://videos.pexels.com/video-files/5310859/5310859-hd_1080_1920_25fps.mp4" },
  { name: "Seated Row Neutral", sets: "4", reps: "12", rest: "75s", notes: "Elbows close", video_url: "https://videos.pexels.com/video-files/5310859/5310859-hd_1080_1920_25fps.mp4" },
  { name: "DB Shoulder Press", sets: "3", reps: "10", rest: "60s", notes: "No arch", video_url: "https://videos.pexels.com/video-files/5310859/5310859-hd_1080_1920_25fps.mp4" },
  { name: "Cable Lateral Raise", sets: "3", reps: "15", rest: "45s", notes: "Lean slightly", video_url: "https://videos.pexels.com/video-files/5310859/5310859-hd_1080_1920_25fps.mp4" },
  { name: "Abduction Machine", sets: "3", reps: "20", rest: "45s", notes: "Lean forward 20°", video_url: "https://videos.pexels.com/video-files/5310859/5310859-hd_1080_1920_25fps.mp4" },
  { name: "Leg Press Glute Bias", sets: "4", reps: "12", rest: "90s", notes: "High feet", video_url: "https://videos.pexels.com/video-files/5310859/5310859-hd_1080_1920_25fps.mp4" },
  { name: "Plank DB Drag", sets: "3", reps: "8/side", rest: "45s", notes: "No hip shift", video_url: "https://videos.pexels.com/video-files/5310859/5310859-hd_1080_1920_25fps.mp4" },
  { name: "Incline Curl", sets: "3", reps: "12", rest: "60s", notes: "Full stretch", video_url: "https://videos.pexels.com/video-files/5310859/5310859-hd_1080_1920_25fps.mp4" },
];

const WEIGHT_DATA = [
  { date: "03/01", weight: 68.2 },
  { date: "03/08", weight: 67.8 },
  { date: "03/15", weight: 67.1 },
  { date: "03/22", weight: 66.9 },
  { date: "03/29", weight: 66.4 },
  { date: "04/05", weight: 66.1 },
  { date: "04/12", weight: 65.7 },
];

const MOCK_CLIENTS = [
  { id: "c1", name: "Sofia R.", goal: "Glute hypertrophy", avatar: "SR", status: "active", plan: "V6 Glute" },
  { id: "c2", name: "Marta L.", goal: "Cut + Upper", avatar: "ML", status: "check-in", plan: "V7 Upper" },
  { id: "c3", name: "Giulia F.", goal: "Full recomposition", avatar: "GF", status: "active", plan: "V7 Full" },
];

export default function App() {
  // Auth mock - no persistence, in-memory only per instructions
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [role, setRole] = useState<Role>('coach');

  // Builder State - core requirement
  const [days, setDays] = useState<Day[]>([
    {
      tempId: 'd1',
      day_number: 1,
      day_name: 'DAY 1 - GLUTEI FOCUS',
      focus: 'GLUTEI FOCUS',
      exercises: [
        { id: 'e1', name: 'Hip Thrust Machine', sets: '4', reps: '12', rest: '90s', notes: '2s hold', video_url: EXERCISE_LIBRARY[0].video_url },
        { id: 'e2', name: 'Bulgarian Split Squat', sets: '3', reps: '12/leg', rest: '60s', notes: '', video_url: EXERCISE_LIBRARY[2].video_url },
      ]
    },
    {
      tempId: 'd2',
      day_number: 2,
      day_name: 'DAY 2 - UPPER',
      focus: 'UPPER',
      exercises: [
        { id: 'e3', name: 'Lat Pulldown Wide', sets: '4', reps: '12', rest: '75s', notes: '', video_url: EXERCISE_LIBRARY[4].video_url },
      ]
    },
  ]);
  const [activeDayIdx, setActiveDayIdx] = useState(0);

  // Derived exercises variable per spec
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

  // Plans local
  const [savedPlans, setSavedPlans] = useState<SavedPlan[]>([]);
  const [coachTab, setCoachTab] = useState<'clients' | 'builder' | 'plans' | 'checkins'>('builder');
  const [clientTab, setClientTab] = useState<'home' | 'workout' | 'checkin' | 'profile'>('workout');

  // UI states
  const [toast, setToast] = useState<string | null>(null);
  const [videoModal, setVideoModal] = useState<Exercise | null>(null);
  const [sliderPos, setSliderPos] = useState(50);
  const sliderRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const [checkInWeight, setCheckInWeight] = useState('');
  const [clientActiveDay, setClientActiveDay] = useState(0);

  // Builder Functions per spec
  const addDay = () => {
    const nextNum = days.length + 1;
    const focus = FOCUS_CYCLE[(nextNum - 1) % FOCUS_CYCLE.length];
    const newDay: Day = {
      tempId: `d${Date.now()}`,
      day_number: nextNum,
      day_name: `DAY ${nextNum} - ${focus}`,
      focus,
      exercises: []
    };
    setDays(prev => [...prev, newDay]);
    setActiveDayIdx(days.length); // go to new
  };

  const deleteDay = (idx: number) => {
    if (days.length <= 1) {
      setToast("Keep at least 1 day");
      setTimeout(() => setToast(null), 2000);
      return;
    }
    setDays(prev => {
      const filtered = prev.filter((_, i) => i !== idx);
      // reindex day_number
      return filtered.map((d, i) => ({ ...d, day_number: i + 1 }));
    });
    setActiveDayIdx(prev => {
      if (idx === prev) return Math.max(0, prev - 1);
      if (idx < prev) return prev - 1;
      return prev;
    });
  };

  const addFromLibrary = (libEx: typeof EXERCISE_LIBRARY[0]) => {
    const newEx: Exercise = {
      id: `ex_${Date.now()}_${Math.random().toString(36).slice(2,5)}`,
      ...libEx
    };
    setExercises(prev => [...prev, newEx]);
    setToast(`Added ${libEx.name} to ${days[activeDayIdx]?.day_name}`);
    setTimeout(() => setToast(null), 1800);
  };

  const removeExercise = (exId: string) => {
    setExercises(prev => prev.filter(e => e.id !== exId));
  };

  const updateExerciseField = (exId: string, field: keyof Exercise, val: string) => {
    setExercises(prev => prev.map(e => e.id === exId ? { ...e, [field]: val } : e));
  };

  // savePlan loops over days, creates workout_days for each day_number and day_name, then exercises for each day with video_url
  const savePlan = () => {
    // Simulate supabase logic locally per instructions: in-memory only
    // Loop over days, create workout_days for each day_number and day_name, then exercises for each day with video_url
    let totalEx = 0;
    const planToSave: SavedPlan = {
      id: `plan_${Date.now()}`,
      createdAt: new Date().toLocaleDateString(),
      days: days.map(d => {
        totalEx += d.exercises.length;
        // Here would be: supabase.from('workout_days').insert({ day_number: d.day_number, day_name: d.day_name, plan_id })
        // then for each ex: supabase.from('exercises').insert({ ...ex, video_url: ex.video_url, workout_day_id })
        return { ...d };
      })
    };
    setSavedPlans(prev => [planToSave, ...prev]);
    const msg = `Saved ${days.length} days, ${totalEx} exercises — ${days.map(d => d.day_name).join(' • ')}`;
    setToast(msg);
    // Also alert per spec
    setTimeout(() => {
      // using custom toast instead of window.alert for UX, but also show alert text
      console.log(`RAFIT V7: ${msg}`);
    }, 100);
    setTimeout(() => setToast(null), 4000);
  };

  // slider drag
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

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#080808] text-white flex flex-col items-center justify-center p-6 relative overflow-clip selection:bg-[#FF4D8D]/30 max-w-full">
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Space+Grotesk:wght@300;400;500;700&display=swap');
          *{font-family:"Space Grotesk",system-ui,sans-serif}
          .serif{font-family:"Instrument Serif",serif}
        `}</style>
        {/* background glow - constrained */}
        <div className="absolute -top-[20%] left-0 right-0 w-full h-[60%] bg-[radial-gradient(ellipse_at_center,_rgba(255,77,141,0.25),transparent_70%)] pointer-events-none overflow-hidden" />
        <div className="w-full max-w-[420px] relative z-10">
          <div className="text-center mb-10">
            <h1 className="serif text-[72px] leading-[0.9] tracking-[-0.04em]">RAFIT</h1>
            <p className="mt-3 text-[11px] tracking-[0.35em] text-white/50">V7 MULTI-DAY BUILDER</p>
            <div className="mt-2 h-[1px] w-12 bg-[#FF4D8D] mx-auto" />
          </div>

          <div className="bg-[#121212] rounded-[32px] p-8 border border-white/[0.06] shadow-[0_20px_80px_rgba(0,0,0,0.6)]">
            <p className="text-[13px] tracking-[0.2em] text-white/40 mb-6">SELECT PROTOCOL</p>

            <button
              type="button"
              aria-label="Enter as Coach"
              onPointerDown={(e) => {
                const t = e.currentTarget as HTMLButtonElement;
                t.textContent = 'ENTERING COACH STUDIO...';
                t.setAttribute('data-clicked','true');
              }}
              onMouseDown={(e) => {
                const t = e.currentTarget as HTMLButtonElement;
                t.textContent = 'ENTERING COACH STUDIO...';
                t.setAttribute('data-clicked','true');
              }}
              onClick={(e) => {
                const t = e.currentTarget as HTMLButtonElement;
                t.textContent = 'ENTERING COACH STUDIO...';
                t.setAttribute('data-clicked','true');
                setRole('coach');
                setIsLoggedIn(true);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  const t = e.currentTarget as HTMLButtonElement;
                  t.textContent = 'ENTERING COACH STUDIO...';
                  t.setAttribute('data-clicked','true');
                  setRole('coach');
                  setIsLoggedIn(true);
                }
              }}
              className="w-full bg-white text-black rounded-[20px] h-[64px] flex items-center justify-between px-6 mb-4 hover:bg-[#FF4D8D] hover:text-white transition-colors cursor-pointer select-none"
            >
              <span className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-full bg-black/10 flex items-center justify-center"><Dumbbell className="w-4 h-4" /></span>
                <span className="text-left">
                  <span className="block text-[15px] font-medium tracking-wide leading-none">COACH STUDIO</span>
                  <span className="block text-[10px] opacity-60 tracking-[0.15em] mt-1">BUILDER • CLIENTS • PLANS</span>
                </span>
              </span>
              <ChevronRight className="w-5 h-5 opacity-60" />
            </button>

            <button
              type="button"
              aria-label="Enter as Client"
              onPointerDown={(e) => {
                try {
                  const t = e.currentTarget as HTMLButtonElement;
                  t.setAttribute('data-clicked','true');
                  t.style.background = '#FF4D8D';
                  document.documentElement.setAttribute('data-client-login','true');
                  const n = document.createElement('div');
                  n.textContent = 'CLIENT LOGIN ACTIVE';
                  n.setAttribute('data-feedback','client');
                  n.style.position = 'fixed';
                  n.style.top = '0';
                  n.style.left = '0';
                  n.style.padding = '4px';
                  n.style.background = 'white';
                  n.style.color = 'black';
                  n.style.zIndex = '9999';
                  document.body.appendChild(n);
                  setTimeout(()=>{ try{ n.remove(); }catch{} }, 3000);
                } catch {}
                setRole('client');
                setIsLoggedIn(true);
              }}
              onClick={(e) => {
                try {
                  const t = e.currentTarget as HTMLButtonElement;
                  t.textContent = 'ENTERING CLIENT APP...';
                  t.setAttribute('data-clicked','true');
                  document.documentElement.setAttribute('data-client-login','true');
                  window.location.hash = '#client';
                } catch {}
                setRole('client');
                setIsLoggedIn(true);
              }}
              className="w-full bg-[#1E1E1E] text-white rounded-[20px] h-[64px] flex items-center justify-between px-6 border border-white/10 hover:border-[#FF4D8D]/40 transition-colors cursor-pointer select-none"
            >
              <span className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center"><User className="w-4 h-4" /></span>
                <span className="text-left">
                  <span className="block text-[15px] font-medium tracking-wide leading-none">CLIENT APP</span>
                  <span className="block text-[10px] opacity-50 tracking-[0.15em] mt-1">HOME • WORKOUT • CHECK-IN</span>
                </span>
              </span>
              <ChevronRight className="w-5 h-5 opacity-60" />
            </button>

            <div className="mt-8 pt-6 border-t border-white/[0.06] flex items-center justify-between text-[10px] tracking-[0.2em] text-white/30">
              <span>LUXURY FITNESS OS</span>
              <span className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#FF4D8D] animate-pulse" /> LIVE LOCAL DRAFT</span>
            </div>
          </div>

          <p className="text-center mt-6 text-[11px] leading-relaxed text-white/25 max-w-[320px] mx-auto">
            V7 builder stores plans in-memory for preview. No backend persistence — export or copy when ready. Supabase logic simulated locally.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080808] text-white selection:bg-[#FF4D8D]/30 overflow-x-clip overflow-clip relative max-w-full">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Space+Grotesk:wght@300;400;500;700&display=swap');
        *{font-family:"Space Grotesk",system-ui,sans-serif}
        .serif{font-family:"Instrument Serif",serif}
        ::-webkit-scrollbar{height:6px;width:6px}
        ::-webkit-scrollbar-thumb{background:#FF4D8D33;border-radius:10px}
        ::-webkit-scrollbar-track{background:transparent}
        input,textarea{background:transparent}
        html,body{overflow-x:hidden;max-width:100vw}
      `}</style>

      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#080808]/80 backdrop-blur-xl border-b border-white/[0.06] px-5 md:px-8 h-[64px] flex items-center justify-between max-w-full overflow-hidden" style={{ top: 'var(--safe-area-inset-top,0px)' } as any}>
        <div className="flex items-center gap-4">
          <h1 className="serif text-[28px] tracking-[-0.02em]">RAFIT</h1>
          <span className="hidden md:inline-flex items-center gap-2 text-[10px] tracking-[0.25em] text-white/40 border border-white/10 rounded-full px-3 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF4D8D]" /> V7 MULTI-DAY
          </span>
          <span className="md:hidden text-[10px] tracking-[0.2em] text-white/30">V7</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 text-[11px] tracking-wide bg-[#121212] border border-white/10 rounded-full px-3 py-1.5">
            <span className={`w-2 h-2 rounded-full ${role === 'coach' ? 'bg-[#FF4D8D]' : 'bg-white/40'}`} />
            {role.toUpperCase()} MODE • LOCAL DRAFT
          </div>
          <button onClick={() => setIsLoggedIn(false)} className="w-9 h-9 rounded-full bg-[#121212] border border-white/10 flex items-center justify-center hover:bg-white hover:text-black transition-colors">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="px-5 md:px-8 pb-[120px] pt-6 max-w-[1280px] mx-auto w-full overflow-x-hidden">
        {role === 'coach' ? (
          <>
            {/* Coach Tabs Content */}
            {coachTab === 'builder' && (
              <div className="space-y-6 max-w-full overflow-hidden">
                <div className="flex flex-wrap items-end justify-between gap-4 max-w-full">
                  <div className="min-w-0">
                    <h2 className="serif text-[42px] md:text-[56px] leading-[0.9] tracking-[-0.03em]">MULTI-DAY<br /><span className="text-[#FF4D8D] italic">BUILDER</span></h2>
                    <p className="mt-3 text-[12px] tracking-[0.2em] text-white/40 max-w-[420px]">Build {days.length} training days • Drag library → active day • Save loops over workout_days + exercises with video_url</p>
                  </div>
                  <button onClick={savePlan} className="h-[52px] px-7 rounded-full bg-[#FF4D8D] text-black font-medium text-[13px] tracking-[0.15em] flex items-center gap-2 hover:bg-white transition-colors">
                    <Check className="w-4 h-4" /> SAVE PLAN — {days.length} DAYS / {days.reduce((a, d) => a + d.exercises.length, 0)} EX
                  </button>
                </div>

                {/* DAY PILLS - horizontal scroll */}
                <div className="bg-[#121212] rounded-[28px] border border-white/[0.06] p-3 md:p-4 max-w-full overflow-hidden">
                  <div className="flex items-center gap-2 overflow-x-auto scrollbar-thin pb-1 px-0 max-w-full">
                    {days.map((day, idx) => (
                      <button
                        key={day.tempId}
                        onClick={() => setActiveDayIdx(idx)}
                        className={`group flex-shrink-0 relative h-[44px] pl-5 pr-10 rounded-full border text-[12px] tracking-[0.12em] font-medium flex items-center transition-all max-w-[240px] ${
                          idx === activeDayIdx
                            ? 'bg-[#FF4D8D] border-[#FF4D8D] text-black'
                            : 'bg-[#1E1E1E] border-white/10 text-white/70 hover:text-white hover:border-white/20'
                        }`}
                      >
                        <span className="truncate">{day.day_name}</span>
                        {days.length > 1 && (
                          <span
                            onClick={(e) => { e.stopPropagation(); deleteDay(idx); }}
                            className={`absolute right-1 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
                              idx === activeDayIdx ? 'bg-black/15 hover:bg-black/25 text-black' : 'bg-white/10 hover:bg-white/20 text-white'
                            }`}
                          >
                            <X className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </button>
                    ))}
                    <button
                      onClick={addDay}
                      className="flex-shrink-0 h-[44px] px-5 rounded-full bg-white text-black text-[12px] tracking-[0.12em] font-medium flex items-center gap-2 hover:bg-[#FF4D8D] hover:text-white transition-colors border border-white"
                    >
                      <Plus className="w-4 h-4" /> DAY
                    </button>
                  </div>

                  {/* Rename Active Day */}
                  <div className="mt-4 grid md:grid-cols-[1fr_auto] gap-3 items-end max-w-full">
                    <div className="space-y-2">
                      <label className="text-[10px] tracking-[0.25em] text-white/40 flex items-center gap-2"><Edit3 className="w-3 h-3" /> RENAME ACTIVE DAY — DAY {days[activeDayIdx]?.day_number}</label>
                      <div className="relative">
                        <input
                          value={days[activeDayIdx]?.day_name ?? ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setDays(prev => prev.map((d, i) => i === activeDayIdx ? { ...d, day_name: val.toUpperCase() } : d));
                          }}
                          className="w-full h-[56px] rounded-[16px] bg-[#080808] border border-white/10 px-5 text-[14px] tracking-wide font-medium focus:border-[#FF4D8D]/50 focus:outline-none transition-colors"
                          placeholder="DAY 1 - GLUTEI FOCUS"
                        />
                        <div className="absolute right-2 top-2 bottom-2 px-3 rounded-[12px] bg-[#1E1E1E] border border-white/10 flex items-center text-[10px] tracking-[0.15em] text-white/40">
                          {days[activeDayIdx]?.focus}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {FOCUS_CYCLE.slice(0, 4).map(f => (
                        <button
                          key={f}
                          onClick={() => setDays(prev => prev.map((d, i) => i === activeDayIdx ? { ...d, focus: f, day_name: d.day_name.includes('-') ? d.day_name.split('-')[0].trim() + ' - ' + f : `DAY ${d.day_number} - ${f}` } : d))}
                          className={`h-[56px] px-4 rounded-[16px] text-[10px] tracking-[0.12em] border transition-all ${days[activeDayIdx]?.focus === f ? 'bg-[#FF4D8D] text-black border-[#FF4D8D]' : 'bg-[#080808] border-white/10 text-white/50 hover:text-white'}`}
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Two column builder */}
                <div className="grid lg:grid-cols-[380px_1fr] gap-6 max-w-full">
                  {/* Library */}
                  <div className="bg-[#121212] rounded-[32px] border border-white/[0.06] p-5 md:p-6 flex flex-col max-h-[780px] max-w-full overflow-hidden">
                    <div className="flex items-center justify-between mb-5">
                      <h3 className="text-[13px] tracking-[0.25em] text-white/50">EXERCISE LIBRARY</h3>
                      <span className="text-[10px] tracking-wide bg-[#1E1E1E] border border-white/10 rounded-full px-2.5 py-1">{EXERCISE_LIBRARY.length} items</span>
                    </div>
                    <div className="space-y-2 overflow-y-auto pr-1 -mr-1 flex-1">
                      {EXERCISE_LIBRARY.map((lib, i) => (
                        <div key={i} className="group flex items-center gap-3 bg-[#080808] border border-white/[0.06] rounded-[18px] p-3 hover:border-[#FF4D8D]/30 transition-colors">
                          <div className="w-11 h-11 rounded-[12px] bg-[#1E1E1E] flex items-center justify-center flex-shrink-0 group-hover:bg-[#FF4D8D]/15 transition-colors">
                            <Dumbbell className="w-4 h-4 text-white/60 group-hover:text-[#FF4D8D]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-medium truncate">{lib.name}</p>
                            <p className="text-[10px] tracking-wide text-white/40">{lib.sets} x {lib.reps} • {lib.rest}</p>
                          </div>
                          <button onClick={() => addFromLibrary(lib)} className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center hover:bg-[#FF4D8D] hover:text-white transition-colors flex-shrink-0">
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Active Day Exercises */}
                  <div className="bg-[#121212] rounded-[32px] border border-white/[0.06] p-5 md:p-7 min-h-[600px] flex flex-col max-w-full overflow-hidden">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#FF4D8D] text-black flex items-center justify-center font-bold text-[13px]">{days[activeDayIdx]?.day_number}</div>
                        <div>
                          <h3 className="text-[18px] font-medium tracking-wide">{days[activeDayIdx]?.day_name}</h3>
                          <p className="text-[11px] tracking-[0.15em] text-white/40 -mt-1">{exercises.length} EXERCISES • FOCUS {days[activeDayIdx]?.focus}</p>
                        </div>
                      </div>
                      <div className="text-[10px] tracking-[0.2em] text-white/30">ACTIVE DAY INDEX {activeDayIdx}</div>
                    </div>

                    {exercises.length === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center py-16 border border-dashed border-white/10 rounded-[24px] bg-[#080808]/50">
                        <div className="w-14 h-14 rounded-full bg-[#1E1E1E] flex items-center justify-center mb-4"><Plus className="w-6 h-6 text-white/30" /></div>
                        <p className="text-[13px] text-white/40 tracking-wide">No exercises yet</p>
                        <p className="text-[11px] text-white/20 mt-1">Add from library to {days[activeDayIdx]?.day_name}</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {exercises.map((ex, idx) => (
                          <div key={ex.id} className="group bg-[#080808] border border-white/[0.06] rounded-[20px] p-4 md:p-5 flex gap-4 hover:border-white/15 transition-colors max-w-full overflow-hidden">
                            <div className="hidden md:flex flex-col items-center gap-2 pt-1">
                              <GripVertical className="w-4 h-4 text-white/20" />
                              <span className="text-[10px] text-white/20">{String(idx + 1).padStart(2, '0')}</span>
                            </div>
                            <div className="flex-1 grid gap-3 min-w-0">
                              <div className="flex items-start justify-between gap-3">
                                <input
                                  value={ex.name}
                                  onChange={e => updateExerciseField(ex.id, 'name', e.target.value)}
                                  className="flex-1 bg-transparent text-[15px] font-medium tracking-wide focus:outline-none focus:text-[#FF4D8D] transition-colors min-w-0"
                                />
                                <div className="flex items-center gap-1.5">
                                  <button onClick={() => setVideoModal(ex)} className="w-8 h-8 rounded-full bg-[#1E1E1E] border border-white/10 flex items-center justify-center hover:bg-[#FF4D8D] hover:text-white hover:border-[#FF4D8D] transition-colors">
                                    <Play className="w-3.5 h-3.5 ml-[1px]" />
                                  </button>
                                  <button onClick={() => removeExercise(ex.id)} className="w-8 h-8 rounded-full bg-[#1E1E1E] border border-white/10 flex items-center justify-center hover:bg-white hover:text-black transition-colors">
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                              <div className="grid grid-cols-3 gap-2">
                                <div className="bg-[#121212] rounded-[12px] border border-white/[0.06] px-3 py-2">
                                  <p className="text-[9px] tracking-[0.2em] text-white/30 mb-1">SETS</p>
                                  <input value={ex.sets} onChange={e => updateExerciseField(ex.id, 'sets', e.target.value)} className="w-full text-[13px] focus:outline-none" />
                                </div>
                                <div className="bg-[#121212] rounded-[12px] border border-white/[0.06] px-3 py-2">
                                  <p className="text-[9px] tracking-[0.2em] text-white/30 mb-1">REPS</p>
                                  <input value={ex.reps} onChange={e => updateExerciseField(ex.id, 'reps', e.target.value)} className="w-full text-[13px] focus:outline-none" />
                                </div>
                                <div className="bg-[#121212] rounded-[12px] border border-white/[0.06] px-3 py-2">
                                  <p className="text-[9px] tracking-[0.2em] text-white/30 mb-1">REST / VIDEO_URL</p>
                                  <input value={ex.rest} onChange={e => updateExerciseField(ex.id, 'rest', e.target.value)} className="w-full text-[11px] focus:outline-none truncate" placeholder="90s" />
                                </div>
                              </div>
                              <input value={ex.notes} onChange={e => updateExerciseField(ex.id, 'notes', e.target.value)} placeholder="Add cue..." className="text-[11px] text-white/50 placeholder:text-white/20 focus:outline-none focus:text-white" />
                              <div className="flex items-center gap-2 text-[10px] text-white/30 truncate">
                                <span className="px-2 py-1 rounded-full bg-[#1E1E1E] border border-white/10">VIDEO: {ex.video_url.slice(0, 42)}...</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="mt-6 p-4 rounded-[20px] bg-[#FF4D8D]/10 border border-[#FF4D8D]/20 text-[11px] leading-relaxed text-white/60">
                      <span className="text-[#FF4D8D] font-medium">SAVE LOGIC:</span> Loops days → creates <span className="text-white">workout_days</span> for each day_number + day_name, then <span className="text-white">exercises</span> for each day with video_url. Alert: saved X days, Y exercises. (Local preview — no Supabase call).
                    </div>
                  </div>
                </div>
              </div>
            )}

            {coachTab === 'clients' && (
              <div className="space-y-6">
                <h2 className="serif text-[42px] leading-[0.9]">CLIENTS</h2>
                <div className="grid md:grid-cols-3 gap-4">
                  {MOCK_CLIENTS.map(c => (
                    <div key={c.id} className="bg-[#121212] rounded-[32px] border border-white/[0.06] p-6">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-full bg-[#1E1E1E] border border-white/10 flex items-center justify-center text-[13px] font-medium">{c.avatar}</div>
                        <div>
                          <p className="font-medium">{c.name}</p>
                          <p className="text-[11px] text-white/40">{c.goal}</p>
                        </div>
                      </div>
                      <div className="flex gap-2 text-[10px]">
                        <span className="px-3 py-1 rounded-full bg-[#FF4D8D]/15 text-[#FF4D8D] border border-[#FF4D8D]/20">{c.status.toUpperCase()}</span>
                        <span className="px-3 py-1 rounded-full bg-[#1E1E1E] border border-white/10">{c.plan}</span>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Before/After & Chart */}
                <div className="grid lg:grid-cols-2 gap-6">
                  <BeforeAfterSlider sliderPos={sliderPos} setDragging={setIsDragging} sliderRef={sliderRef} setSliderPos={setSliderPos} />
                  <div className="bg-[#121212] rounded-[32px] border border-white/[0.06] p-6">
                    <h3 className="text-[13px] tracking-[0.2em] text-white/50 mb-4 flex items-center gap-2"><TrendingUp className="w-4 h-4" /> WEIGHT TREND — MOCK</h3>
                    <div className="h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={WEIGHT_DATA}>
                          <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#ffffff40' }} />
                          <YAxis hide domain={['dataMin -1', 'dataMax +1']} />
                          <Tooltip contentStyle={{ background: '#121212', border: '1px solid #ffffff15', borderRadius: 12, fontSize: 11 }} />
                          <Line type="monotone" dataKey="weight" stroke="#FF4D8D" strokeWidth={2.5} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {coachTab === 'plans' && (
              <div className="space-y-6">
                <h2 className="serif text-[42px] leading-[0.9]">SAVED PLANS <span className="text-white/30 text-[16px] align-middle tracking-[0.2em]">LOCAL DRAFTS</span></h2>
                {savedPlans.length === 0 ? (
                  <div className="bg-[#121212] rounded-[32px] border border-white/[0.06] p-12 text-center">
                    <p className="text-white/40">No plans saved yet. Use builder to save.</p>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-4">
                    {savedPlans.map(plan => (
                      <div key={plan.id} className="bg-[#121212] rounded-[32px] border border-white/[0.06] p-6">
                        <div className="flex justify-between mb-3">
                          <p className="text-[12px] tracking-[0.2em] text-white/50">{plan.createdAt}</p>
                          <span className="text-[10px] bg-[#FF4D8D] text-black px-2.5 py-1 rounded-full font-medium">{plan.days.length} DAYS / {plan.days.reduce((a,d)=>a+d.exercises.length,0)} EX</span>
                        </div>
                        <div className="space-y-2">
                          {plan.days.map(d => (
                            <div key={d.tempId} className="flex justify-between text-[13px] bg-[#080808] rounded-[14px] px-4 py-2 border border-white/[0.04]">
                              <span>{d.day_name}</span><span className="text-white/40">{d.exercises.length} ex</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {coachTab === 'checkins' && (
              <div className="space-y-6">
                <h2 className="serif text-[42px] leading-[0.9]">CHECK-INS</h2>
                <div className="bg-[#121212] rounded-[32px] border border-white/[0.06] p-6">
                  <p className="text-white/60 text-[13px]">Weekly check-ins appear here. Weight chart + photos (local preview).</p>
                  <div className="mt-6 grid md:grid-cols-3 gap-4">
                    {MOCK_CLIENTS.map(c => (
                      <div key={c.id} className="bg-[#080808] rounded-[20px] border border-white/10 p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#1E1E1E] flex items-center justify-center">{c.avatar}</div>
                        <div>
                          <p className="text-[13px]">{c.name}</p>
                          <p className="text-[11px] text-white/40">-0.7kg • glute progress</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          // CLIENT VIEW
          <>
            {clientTab === 'home' && (
              <div className="space-y-6">
                <div className="bg-[#121212] rounded-[32px] border border-white/[0.06] overflow-hidden">
                  <div className="p-7 md:p-10">
                    <p className="text-[11px] tracking-[0.3em] text-[#FF4D8D]">GOOD MORNING, SOFIA</p>
                    <h2 className="serif text-[48px] md:text-[64px] leading-[0.85] tracking-[-0.03em] mt-3">YOUR<br />TRANSFORMATION<br /><span className="italic text-[#FF4D8D]">IS LOADING.</span></h2>
                  </div>
                  <div className="px-6 pb-6">
                    <BeforeAfterSlider sliderPos={sliderPos} setDragging={setIsDragging} sliderRef={sliderRef} setSliderPos={setSliderPos} />
                  </div>
                </div>
                <div className="grid lg:grid-cols-2 gap-6">
                  <div className="bg-[#121212] rounded-[32px] border border-white/[0.06] p-6">
                    <h3 className="text-[13px] tracking-[0.2em] text-white/50 mb-4">WEIGHT CHART</h3>
                    <div className="h-[180px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={WEIGHT_DATA}>
                          <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#ffffff40' }} />
                          <YAxis hide domain={['dataMin -1', 'dataMax +1']} />
                          <Tooltip contentStyle={{ background: '#121212', border: '1px solid #ffffff15', borderRadius: 12, fontSize: 11 }} />
                          <Line type="monotone" dataKey="weight" stroke="#FF4D8D" strokeWidth={2.5} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="bg-[#FF4D8D] rounded-[32px] p-7 text-black">
                    <p className="text-[12px] tracking-[0.2em] font-medium">TODAY FOCUS</p>
                    <p className="serif text-[36px] leading-[0.9] mt-3">{days[clientActiveDay]?.day_name}</p>
                    <p className="text-[13px] mt-3 opacity-70">{days[clientActiveDay]?.exercises.length} exercises • {days[clientActiveDay]?.focus}</p>
                    <button onClick={() => setClientTab('workout')} className="mt-6 h-[44px] px-6 rounded-full bg-black text-white text-[12px] tracking-[0.15em]">START WORKOUT</button>
                  </div>
                </div>
              </div>
            )}

            {clientTab === 'workout' && (
              <div className="space-y-6">
                <h2 className="serif text-[42px] leading-[0.9]">WORKOUT</h2>
                {/* Client day pills read-only but same design */}
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {days.map((d, idx) => (
                    <button
                      key={d.tempId}
                      onClick={() => setClientActiveDay(idx)}
                      className={`flex-shrink-0 h-[44px] px-5 rounded-full border text-[12px] tracking-[0.1em] font-medium transition-all ${idx === clientActiveDay ? 'bg-white text-black border-white' : 'bg-[#121212] border-white/10 text-white/60'}`}
                    >
                      {d.day_name}
                    </button>
                  ))}
                </div>
                <div className="bg-[#121212] rounded-[32px] border border-white/[0.06] p-5 md:p-7">
                  <h3 className="text-[18px] font-medium mb-5">{days[clientActiveDay]?.day_name} • {days[clientActiveDay]?.exercises.length} EX</h3>
                  <div className="space-y-3">
                    {(days[clientActiveDay]?.exercises ?? []).map((ex, i) => (
                      <div key={ex.id} className="bg-[#080808] border border-white/[0.06] rounded-[20px] p-4 flex gap-4">
                        <div className="w-10 h-10 rounded-full bg-[#1E1E1E] flex items-center justify-center text-[11px]">{String(i + 1).padStart(2, '0')}</div>
                        <div className="flex-1">
                          <div className="flex justify-between">
                            <p className="font-medium text-[14px]">{ex.name}</p>
                            <button onClick={() => setVideoModal(ex)} className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center"><Play className="w-3.5 h-3.5 ml-[1px]" /></button>
                          </div>
                          <p className="text-[11px] text-white/40 mt-1">{ex.sets} sets × {ex.reps} • rest {ex.rest} • {ex.notes}</p>
                        </div>
                      </div>
                    ))}
                    {(!days[clientActiveDay]?.exercises?.length) && <p className="text-white/30 text-[13px] py-8 text-center">No exercises for this day</p>}
                  </div>
                </div>
              </div>
            )}

            {clientTab === 'checkin' && (
              <div className="space-y-6">
                <h2 className="serif text-[42px] leading-[0.9]">CHECK-IN</h2>
                <div className="grid lg:grid-cols-2 gap-6">
                  <div className="bg-[#121212] rounded-[32px] border border-white/[0.06] p-6">
                    <h3 className="text-[13px] tracking-[0.2em] text-white/50 mb-4">WEIGHT CHART</h3>
                    <div className="h-[220px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={WEIGHT_DATA}>
                          <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#ffffff40' }} />
                          <YAxis hide domain={['dataMin -1', 'dataMax +1']} />
                          <Tooltip contentStyle={{ background: '#121212', border: '1px solid #ffffff15', borderRadius: 12 }} />
                          <Line type="monotone" dataKey="weight" stroke="#FF4D8D" strokeWidth={2.5} dot={{ r: 3, fill: '#FF4D8D' }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="bg-[#121212] rounded-[32px] border border-white/[0.06] p-6">
                    <h3 className="text-[13px] tracking-[0.2em] text-white/50 mb-5">NEW CHECK-IN — LOCAL DRAFT</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="text-[10px] tracking-[0.2em] text-white/40">CURRENT WEIGHT</label>
                        <div className="mt-2 flex gap-2">
                          <input value={checkInWeight} onChange={e => setCheckInWeight(e.target.value)} placeholder="65.4" className="flex-1 h-[52px] rounded-[16px] bg-[#080808] border border-white/10 px-4 text-[15px] focus:border-[#FF4D8D]/40 focus:outline-none" />
                          <button onClick={() => { setToast(`Check-in draft saved: ${checkInWeight}kg`); setTimeout(()=>setToast(null),2000); }} className="h-[52px] px-6 rounded-[16px] bg-white text-black text-[12px] font-medium tracking-wide">SAVE DRAFT</button>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {['Front', 'Side', 'Back'].map(v => (
                          <div key={v} className="aspect-[3/4] rounded-[20px] bg-[#080808] border border-dashed border-white/15 flex flex-col items-center justify-center gap-2">
                            <Camera className="w-5 h-5 text-white/20" />
                            <span className="text-[10px] tracking-[0.15em] text-white/30">{v}</span>
                          </div>
                        ))}
                      </div>
                      <p className="text-[11px] text-white/30 leading-relaxed">Photos stay local in this preview. No upload.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {clientTab === 'profile' && (
              <div className="bg-[#121212] rounded-[32px] border border-white/[0.06] p-8 max-w-[560px]">
                <div className="w-20 h-20 rounded-full bg-[#FF4D8D] text-black flex items-center justify-center text-[24px] font-bold">SR</div>
                <h3 className="serif text-[32px] mt-4">Sofia R.</h3>
                <p className="text-[12px] tracking-[0.15em] text-white/40">GLUTE HYPERTROPHY • 12 WEEK PROTOCOL</p>
                <div className="mt-6 space-y-3 text-[13px]">
                  <div className="flex justify-between bg-[#080808] rounded-[14px] px-4 py-3 border border-white/5"><span className="text-white/40">Current plan</span><span>{days.length} days • {days.reduce((a,d)=>a+d.exercises.length,0)} ex</span></div>
                  <div className="flex justify-between bg-[#080808] rounded-[14px] px-4 py-3 border border-white/5"><span className="text-white/40">Coach</span><span>RAFIT Studio</span></div>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 px-4 pb-4 pt-2" style={{ paddingBottom: 'calc(16px + var(--safe-area-inset-bottom,0px))' } as any}>
        <div className="max-w-[520px] mx-auto bg-[#121212]/90 backdrop-blur-2xl border border-white/[0.08] rounded-[28px] h-[68px] flex items-center justify-around px-2 shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
          {role === 'coach' ? (
            <>
              {[
                { k: 'clients', icon: Users, label: 'CLIENTS' },
                { k: 'builder', icon: Dumbbell, label: 'BUILDER' },
                { k: 'plans', icon: ClipboardList, label: 'PLANS' },
                { k: 'checkins', icon: Activity, label: 'CHECK-INS' },
              ].map(item => (
                <button
                  key={item.k}
                  onClick={() => setCoachTab(item.k as any)}
                  className={`flex flex-col items-center justify-center gap-1 w-[72px] h-[52px] rounded-[18px] transition-all ${coachTab === item.k ? 'bg-white text-black' : 'text-white/40 hover:text-white'}`}
                >
                  <item.icon className="w-[18px] h-[18px]" />
                  <span className="text-[9px] tracking-[0.15em] font-medium">{item.label}</span>
                </button>
              ))}
            </>
          ) : (
            <>
              {[
                { k: 'home', icon: Home, label: 'HOME' },
                { k: 'workout', icon: Dumbbell, label: 'WORKOUT' },
                { k: 'checkin', icon: Activity, label: 'CHECK-IN' },
                { k: 'profile', icon: User, label: 'PROFILE' },
              ].map(item => (
                <button
                  key={item.k}
                  onClick={() => setClientTab(item.k as any)}
                  className={`flex flex-col items-center justify-center gap-1 w-[72px] h-[52px] rounded-[18px] transition-all ${clientTab === item.k ? 'bg-[#FF4D8D] text-black' : 'text-white/40 hover:text-white'}`}
                >
                  <item.icon className="w-[18px] h-[18px]" />
                  <span className="text-[9px] tracking-[0.15em] font-medium">{item.label}</span>
                </button>
              ))}
            </>
          )}
        </div>
      </nav>

      {/* Video Modal */}
      {videoModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-6" onClick={() => setVideoModal(null)}>
          <div className="bg-[#121212] rounded-[32px] border border-white/10 overflow-hidden max-w-[420px] w-full" onClick={e => e.stopPropagation()}>
            <div className="aspect-[9/16] max-h-[70vh] bg-black relative overflow-hidden">
              <video src={videoModal.video_url} autoPlay muted loop playsInline className="w-full h-full object-cover" />
              <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
                <span className="px-3 py-1 rounded-full bg-black/60 backdrop-blur text-[10px] tracking-[0.2em] text-white/80 border border-white/10">VIDEO_URL PREVIEW</span>
                <button onClick={() => setVideoModal(null)} className="w-9 h-9 rounded-full bg-black/60 backdrop-blur border border-white/10 flex items-center justify-center hover:bg-white hover:text-black transition-colors"><X className="w-4 h-4" /></button>
              </div>
            </div>
            <div className="p-6">
              <h4 className="font-medium text-[16px]">{videoModal.name}</h4>
              <p className="text-[11px] text-white/40 mt-1">{videoModal.sets} × {videoModal.reps} • {videoModal.rest} • {videoModal.notes}</p>
              <div className="mt-4 p-3 rounded-[14px] bg-[#080808] border border-white/10 text-[10px] text-white/30 break-all">video_url: {videoModal.video_url}</div>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 max-w-[90%]">
          <div className="bg-white text-black rounded-full px-5 py-3 text-[12px] font-medium tracking-wide shadow-[0_10px_40px_rgba(0,0,0,0.5)] flex items-center gap-2 border border-black/10">
            <span className="w-5 h-5 rounded-full bg-[#FF4D8D] text-white flex items-center justify-center flex-shrink-0"><Check className="w-3 h-3" /></span>
            <span className="line-clamp-2">{toast}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// Before/After Slider Component - luxury styling
function BeforeAfterSlider({ sliderPos, setSliderPos, sliderRef, setDragging }: { sliderPos: number; setSliderPos: (n:number)=>void; sliderRef: React.RefObject<HTMLDivElement>; setDragging: (b:boolean)=>void }) {
  return (
    <div className="bg-[#080808] rounded-[32px] border border-white/[0.06] p-3">
      <div className="flex items-center justify-between px-4 py-2">
        <p className="text-[11px] tracking-[0.25em] text-white/40">BEFORE / AFTER — SLIDER</p>
        <span className="text-[10px] px-2.5 py-1 rounded-full bg-[#1E1E1E] border border-white/10 text-white/50">{Math.round(sliderPos)}%</span>
      </div>
      <div
        ref={sliderRef}
        className="relative h-[320px] rounded-[24px] overflow-hidden select-none touch-none bg-[#121212] cursor-ew-resize"
        onMouseDown={() => setDragging(true)}
        onTouchStart={() => setDragging(true)}
      >
        {/* After image - right */}
        <div className="absolute inset-0">
          <div className="w-full h-full bg-[radial-gradient(ellipse_at_center,_#FF4D8D22,_#121212)] flex items-center justify-center">
            <div className="text-center">
              <p className="serif text-[28px] text-white/80">AFTER</p>
              <p className="text-[11px] tracking-[0.2em] text-white/30 mt-1">WEEK 12 • GLUTE FOCUS</p>
              <div className="mt-4 w-24 h-32 mx-auto rounded-[20px] bg-gradient-to-b from-[#FF4D8D]/30 to-[#121212] border border-white/10" />
            </div>
          </div>
        </div>
        {/* Before image - left clipped */}
        <div className="absolute inset-0 overflow-hidden" style={{ width: `${sliderPos}%` }}>
          <div className="w-full h-full bg-[#1A1A1A] flex items-center justify-center border-r border-white/10" style={{ width: `${100 / (sliderPos / 100 || 1)}%` }}>
            <div className="text-center">
              <p className="serif text-[28px] text-white/50">BEFORE</p>
              <p className="text-[11px] tracking-[0.2em] text-white/20 mt-1">WEEK 1 • BASELINE</p>
              <div className="mt-4 w-24 h-32 mx-auto rounded-[20px] bg-[#0A0A0A] border border-white/5" />
            </div>
          </div>
        </div>
        {/* Handle */}
        <div className="absolute top-0 bottom-0 w-[2px] bg-white z-10" style={{ left: `${sliderPos}%` }}>
          <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-white text-black flex items-center justify-center shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
            <div className="flex gap-[2px]"><div className="w-[1.5px] h-3 bg-black/40" /><div className="w-[1.5px] h-3 bg-black/40" /></div>
          </div>
        </div>
      </div>
    </div>
  );
}
