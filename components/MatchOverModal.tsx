import React from 'react';
import type { MatchState } from '../types';
import { BatIcon, BallIcon, TrophyIcon } from './icons';

interface MatchOverModalProps {
  matchState: MatchState;
  onNewMatch: () => void;
}

const MatchOverModal: React.FC<MatchOverModalProps> = ({ matchState, onNewMatch }) => {
  const { matchOverMessage, matchSummary } = matchState;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="glass-card w-full max-w-sm rounded-3xl p-8 text-center border-t-4 border-emerald-500 animate-slide-up shadow-2xl">
        <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6 ring-4 ring-emerald-500/10">
            <TrophyIcon className="w-10 h-10 text-emerald-400" />
        </div>
        
        <h2 className="text-3xl font-black text-white mb-2 uppercase leading-tight">{matchOverMessage}</h2>
        <p className="text-gray-400 text-sm mb-8">Match Completed</p>

        {matchSummary && (
            <div className="grid grid-cols-2 gap-4 mb-8">
               {matchSummary.topScorer && (
                  <div className="bg-slate-800/50 p-3 rounded-xl">
                     <div className="flex items-center justify-center gap-1 text-xs text-indigo-400 font-bold uppercase mb-1"><BatIcon className="w-3 h-3"/> MVP Bat</div>
                     <div className="font-bold truncate">{matchSummary.topScorer.name}</div>
                     <div className="font-mono text-sm text-gray-400">{matchSummary.topScorer.runs} runs</div>
                  </div>
               )}
               {matchSummary.bestBowler && (
                  <div className="bg-slate-800/50 p-3 rounded-xl">
                     <div className="flex items-center justify-center gap-1 text-xs text-emerald-400 font-bold uppercase mb-1"><BallIcon className="w-3 h-3"/> MVP Bowl</div>
                     <div className="font-bold truncate">{matchSummary.bestBowler.name}</div>
                     <div className="font-mono text-sm text-gray-400">{matchSummary.bestBowler.wickets}/{matchSummary.bestBowler.runs}</div>
                  </div>
               )}
            </div>
        )}

        <button onClick={onNewMatch} className="w-full py-4 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-colors">
            START NEW MATCH
        </button>
      </div>
    </div>
  );
};

export default MatchOverModal;