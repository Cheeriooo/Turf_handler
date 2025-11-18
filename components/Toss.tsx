import React, { useState, useEffect } from 'react';
import { BatIcon, BallIcon, CoinIcon, HeadsIcon, TailsIcon } from './icons';

interface TossProps {
  team1Name: string;
  team2Name: string;
  onTossComplete: (winner: 'team1' | 'team2', decision: 'bat' | 'bowl') => void;
  onBack: () => void;
}

const Toss: React.FC<TossProps> = ({ team1Name, team2Name, onTossComplete, onBack }) => {
  const [stage, setStage] = useState<'call' | 'flip' | 'result' | 'decision'>('call');
  const [team1Call, setTeam1Call] = useState<'heads' | 'tails' | null>(null);
  const [winner, setWinner] = useState<'team1' | 'team2' | null>(null);
  const [flipResult, setFlipResult] = useState<'heads' | 'tails' | null>(null);

  const handleFlip = () => {
    if (!team1Call) return;
    setStage('flip');
    setTimeout(() => {
      const result = Math.random() < 0.5 ? 'heads' : 'tails';
      setFlipResult(result);
      setWinner(result === team1Call ? 'team1' : 'team2');
      setStage('result');
      setTimeout(() => setStage('decision'), 2000);
    }, 2000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="glass-card max-w-md w-full rounded-3xl p-8 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 to-emerald-500"></div>
        
        <h1 className="text-3xl font-black mb-2">COIN TOSS</h1>
        <p className="text-gray-400 mb-8">{team1Name} vs {team2Name}</p>

        <div className="h-48 flex items-center justify-center mb-8">
           {stage === 'flip' ? (
              <div className="coin-container"><div className="coin flipping"><div className="coin-face"><HeadsIcon /></div><div className="coin-face coin-back"><TailsIcon /></div></div></div>
           ) : stage === 'result' || stage === 'decision' ? (
              <div className={`coin-container transform transition-all scale-125`}>
                 <div className={`coin ${flipResult}`}>
                    <div className="coin-face"><HeadsIcon className="w-20 h-20 text-amber-900"/></div>
                    <div className="coin-face coin-back"><TailsIcon className="w-20 h-20 text-amber-900"/></div>
                 </div>
              </div>
           ) : (
              <CoinIcon className="w-32 h-32 text-amber-400 opacity-80" />
           )}
        </div>

        {stage === 'call' && (
           <div className="space-y-4">
              <p className="font-bold text-lg">{team1Name}, call it:</p>
              <div className="flex gap-4">
                 <button onClick={() => setTeam1Call('heads')} className={`flex-1 py-4 rounded-xl font-bold border-2 transition-all ${team1Call === 'heads' ? 'border-amber-400 bg-amber-400/10 text-amber-400' : 'border-slate-700 hover:border-slate-500'}`}>HEADS</button>
                 <button onClick={() => setTeam1Call('tails')} className={`flex-1 py-4 rounded-xl font-bold border-2 transition-all ${team1Call === 'tails' ? 'border-amber-400 bg-amber-400/10 text-amber-400' : 'border-slate-700 hover:border-slate-500'}`}>TAILS</button>
              </div>
              <button onClick={handleFlip} disabled={!team1Call} className="w-full py-4 mt-4 bg-indigo-600 rounded-xl font-bold disabled:opacity-50 disabled:grayscale">FLIP COIN</button>
           </div>
        )}

        {stage === 'decision' && winner && (
           <div className="animate-slide-up space-y-4">
              <h2 className="text-2xl font-bold text-emerald-400">{winner === 'team1' ? team1Name : team2Name} Won!</h2>
              <p className="text-gray-400">Choose to:</p>
              <div className="flex gap-4">
                 <button onClick={() => onTossComplete(winner, 'bat')} className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 rounded-xl font-bold flex flex-col items-center gap-2 border border-slate-600">
                    <BatIcon className="w-6 h-6" /> BAT
                 </button>
                 <button onClick={() => onTossComplete(winner, 'bowl')} className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 rounded-xl font-bold flex flex-col items-center gap-2 border border-slate-600">
                    <BallIcon className="w-6 h-6" /> BOWL
                 </button>
              </div>
           </div>
        )}

        {stage === 'call' && (
            <button onClick={onBack} className="mt-6 text-sm text-gray-500 hover:text-white">Cancel Setup</button>
        )}
      </div>
    </div>
  );
};

export default Toss;