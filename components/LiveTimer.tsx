
import React, { useState, useEffect } from 'react';

interface LiveTimerProps {
  startTime?: string;
}

const LiveTimer: React.FC<LiveTimerProps> = ({ startTime }) => {
  const [elapsed, setElapsed] = useState('');

  useEffect(() => {
    if (!startTime) return;

    const interval = setInterval(() => {
      const start = new Date(startTime).getTime();
      const now = new Date().getTime();
      const diff = Math.floor((now - start) / 1000);
      
      const mm = Math.floor(diff / 60).toString().padStart(2, '0');
      const ss = (diff % 60).toString().padStart(2, '0');
      setElapsed(`${mm}:${ss}`);
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  return (
    <div className="flex items-center gap-3">
      <div className="px-3 py-1.5 bg-indigo-50 text-indigo-700 font-mono text-xl font-bold rounded-lg border border-indigo-100 flex items-center">
        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse mr-2"></span>
        {elapsed || '00:00'}
      </div>
      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Elapsed</span>
    </div>
  );
};

export default LiveTimer;
