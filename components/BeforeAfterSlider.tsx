'use client'
import { useState, useRef, useEffect } from 'react';

export function BeforeAfterSlider({ pos, setPos, isDragging, setIsDragging }: any) {
  const sliderRef = useRef<HTMLDivElement>(null);
  
  useEffect(()=>{
    const move=(e:any)=>{
      if(!isDragging||!sliderRef.current) return;
      const rect=sliderRef.current.getBoundingClientRect();
      const cx='touches' in e?e.touches[0].clientX:e.clientX;
      const x=((cx-rect.left)/rect.width)*100;
      setPos(Math.min(100,Math.max(0,x)));
    }
    const up=()=>setIsDragging(false);
    if(isDragging){
      window.addEventListener('mousemove',move);
      window.addEventListener('touchmove',move);
      window.addEventListener('mouseup',up);
      window.addEventListener('touchend',up);
    }
    return()=>{ 
      window.removeEventListener('mousemove',move); 
      window.removeEventListener('touchmove',move); 
      window.removeEventListener('mouseup',up); 
      window.removeEventListener('touchend',up); 
    }
  },[isDragging]);

  return (
    <div className="bg-[#080808] rounded-[32px] border border-white/[0.06] p-3">
      <div className="flex items-center justify-between px-4 py-2">
        <p className="text-[11px] tracking-[0.25em] text-white/40">BEFORE / AFTER — FULL LUXURY</p>
        <span className="text-[10px] px-2.5 py-1 rounded-full bg-[#1E1E1E] border border-white/10">{Math.round(pos)}%</span>
      </div>
      <div ref={sliderRef} className="relative h-[320px] rounded-[24px] overflow-hidden bg-[#121212] cursor-ew-resize" onMouseDown={()=>setIsDragging(true)} onTouchStart={()=>setIsDragging(true)}>
        <div className="absolute inset-0 flex items-center justify-center bg-[radial-gradient(ellipse_at_center,_#FF4D8D22,_#121212)]">
          <p className="font-serif text-[28px] text-white/80">AFTER REAL</p>
        </div>
        <div className="absolute inset-0 overflow-hidden bg-[#1A1A1A] flex items-center justify-center border-r border-white/10" style={{width:pos+'%'}}>
          <div style={{width:100/(pos/100||1)+'%'}}>
            <p className="font-serif text-[28px] text-white/50 text-center">BEFORE REAL</p>
          </div>
        </div>
        <div className="absolute top-0 bottom-0 w-[2px] bg-white z-10" style={{left:pos+'%'}}>
          <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-white text-black flex items-center justify-center">
            <div className="flex gap-[2px]"><div className="w-[1.5px] h-3 bg-black/40"/><div className="w-[1.5px] h-3 bg-black/40"/></div>
          </div>
        </div>
      </div>
    </div>
  );
}
