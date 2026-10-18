'use client'
import { X } from 'lucide-react';
import { getYoutubeId } from '@/lib/youtube';

export function VideoModal({ exercise, onClose }: { exercise: any, onClose: () => void }) {
  if(!exercise) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-6" onClick={onClose}>
      <div className="bg-[#121212] rounded-[32px] border border-white/10 overflow-hidden max-w-[420px] w-full" onClick={e=>e.stopPropagation()}>
        <div className="aspect-[9/16] max-h-[70vh] bg-black relative">
          {getYoutubeId(exercise.video_url) ? (
            <iframe className="w-full h-full" src={'https://www.youtube.com/embed/'+getYoutubeId(exercise.video_url)+'?autoplay=1'} allowFullScreen/>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white/40">No video REAL</div>
          )}
          <button onClick={onClose} className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/60 backdrop-blur border border-white/10 flex items-center justify-center">
            <X className="w-4 h-4"/>
          </button>
        </div>
        <div className="p-6">
          <h4 className="font-medium text-[16px]">{exercise.name} REAL</h4>
          <p className="text-[11px] text-white/40 mt-1">{exercise.sets} x {exercise.reps} • REAL SUPABASE</p>
        </div>
      </div>
    </div>
  );
}
