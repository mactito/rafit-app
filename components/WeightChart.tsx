'use client'
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { TrendingUp } from 'lucide-react';

export function WeightChart({ data }: { data: any[] }) {
  return (
    <div className="bg-[#121212] rounded-[32px] border border-white/[0.06] p-6">
      <h3 className="text-[13px] tracking-[0.2em] text-white/50 mb-4 flex items-center gap-2">
        <TrendingUp className="w-4 h-4"/> WEIGHT TREND REAL FULL LUXURY
      </h3>
      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize:10,fill:'#ffffff40'}}/>
            <YAxis hide domain={['dataMin -1','dataMax +1']}/>
            <Tooltip contentStyle={{background:'#121212',border:'1px solid #ffffff15',borderRadius:12,fontSize:11}}/>
            <Line type="monotone" dataKey="weight" stroke="#FF4D8D" strokeWidth={2.5} dot={{r:3,fill:'#FF4D8D'}}/>
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
