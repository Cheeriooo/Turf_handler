import React from 'react';

type ScoringEvent = 
  | { type: 'RUNS', runs: number }
  | { type: 'EXTRA', extraType: 'Wide' | 'No Ball' }
  | { type: 'OUT' };

interface ScoringControlsProps {
  onScore: (event: ScoringEvent) => void;
  isMatchOver: boolean;
}

const ScoringControls: React.FC<ScoringControlsProps> = ({ onScore, isMatchOver }) => {
  const handleScore = (runs: number) => onScore({ type: 'RUNS', runs });
  
  const Btn = ({ children, onClick, className, variant = 'neutral' }: any) => {
     const baseStyle = "h-14 rounded-xl font-bold text-lg transition-all active:scale-95 flex items-center justify-center shadow-lg border border-b-4";
     const variants = {
         neutral: "bg-slate-800 border-slate-950 hover:bg-slate-700 text-white",
         primary: "bg-indigo-600 border-indigo-900 hover:bg-indigo-500 text-white",
         success: "bg-emerald-600 border-emerald-900 hover:bg-emerald-500 text-white",
         warning: "bg-amber-600 border-amber-900 hover:bg-amber-500 text-white",
         danger:  "bg-rose-600 border-rose-900 hover:bg-rose-500 text-white",
     }
     // @ts-ignore
     return <button onClick={onClick} disabled={isMatchOver} className={`${baseStyle} ${variants[variant]} ${className} disabled:opacity-50 disabled:cursor-not-allowed`}>{children}</button>
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Main Runs */}
      <div className="grid grid-cols-4 gap-3">
        <Btn onClick={() => handleScore(0)}>0</Btn>
        <Btn onClick={() => handleScore(1)}>1</Btn>
        <Btn onClick={() => handleScore(2)}>2</Btn>
        <Btn onClick={() => handleScore(3)}>3</Btn>
      </div>
      
      {/* Boundaries and Extras */}
      <div className="grid grid-cols-4 gap-3">
        <Btn variant="primary" onClick={() => handleScore(4)}>4</Btn>
        <Btn variant="success" onClick={() => handleScore(6)}>6</Btn>
        <Btn variant="warning" onClick={() => onScore({ type: 'EXTRA', extraType: 'Wide' })} className="text-sm">WD</Btn>
        <Btn variant="warning" onClick={() => onScore({ type: 'EXTRA', extraType: 'No Ball' })} className="text-sm">NB</Btn>
      </div>

      {/* Wicket Button */}
      <div className="grid grid-cols-1">
         <Btn variant="danger" onClick={() => onScore({ type: 'OUT' })}>WICKET</Btn>
      </div>
    </div>
  );
};

export default ScoringControls;