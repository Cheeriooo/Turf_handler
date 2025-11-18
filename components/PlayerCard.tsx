import React from 'react';
import type { Player, BatsmanStats, BowlerStats } from '../types';
import { BatIcon, BallIcon } from './icons';

interface PlayerCardProps {
  title: string;
  players: Player[];
  stats: Record<string, BatsmanStats | BowlerStats>;
  isMatchOver?: boolean;
  isBattingCard?: boolean;
  strikerId?: string | null;
  nonStrikerId?: string | null;
  onStrikerChange?: (id: string) => void;
  onNonStrikerChange?: (id: string) => void;
  activePlayerId?: string | null;
  onPlayerSelect?: (id: string) => void;
  isOverStarting?: boolean;
}

const PlayerCard: React.FC<PlayerCardProps> = ({
  title, players, stats, isMatchOver, isBattingCard,
  strikerId, nonStrikerId, onStrikerChange, onNonStrikerChange,
  activePlayerId, onPlayerSelect, isOverStarting,
}) => {

  const PlayerRow = ({ label, id, onChange, disabledId, isActive }: any) => {
     const s = id ? (stats[id] as BatsmanStats) : null;
     return (
       <div className={`p-3 rounded-lg border transition-all ${isActive ? 'bg-indigo-500/10 border-indigo-500/50' : 'bg-slate-800/50 border-transparent'}`}>
          <div className="flex justify-between text-xs text-gray-400 mb-1 uppercase tracking-wider font-semibold">
             <span>{label}</span>
             {s && <span className="font-mono text-white">{s.runs} <span className="text-gray-500">({s.balls})</span></span>}
          </div>
          {onChange ? (
             <select 
                value={id || ''} 
                onChange={(e) => onChange(e.target.value)}
                disabled={isMatchOver}
                className="w-full bg-transparent text-white font-semibold focus:outline-none cursor-pointer text-sm appearance-none py-2"
             >
                <option value="" className="bg-slate-900 text-gray-500">Select Player...</option>
                {players.map(p => (
                    <option key={p.id} value={p.id} disabled={p.id === disabledId} className="bg-slate-900">
                        {p.name}
                    </option>
                ))}
             </select>
          ) : (
             <div className="font-semibold text-sm text-gray-500">{id ? players.find(p=>p.id===id)?.name : 'None'}</div>
          )}
       </div>
     )
  }

  // Check if we should show the Bowler Selection dropdown
  // Show it if explicitly requested (isOverStarting) OR if there is no active bowler currently set.
  const showBowlerSelect = onPlayerSelect && (isOverStarting || !activePlayerId);

  return (
    <div className="glass-card rounded-xl p-4">
      <h3 className="text-sm font-bold text-gray-400 mb-3 flex items-center gap-2 uppercase tracking-wider">
        {isBattingCard ? <BatIcon className="w-4 h-4" /> : <BallIcon className="w-4 h-4" />} {title}
      </h3>
      
      {isBattingCard ? (
        <div className="flex flex-col gap-3">
          <PlayerRow 
             label="Striker" 
             id={strikerId} 
             onChange={onStrikerChange} 
             disabledId={nonStrikerId} 
             isActive={true} 
          />
          {/* LMS: Hide non-striker row if playing alone (nonStrikerId is null but striker exists) */}
          <PlayerRow 
             label="Non-Striker" 
             id={nonStrikerId} 
             onChange={onNonStrikerChange} 
             disabledId={strikerId} 
             isActive={false} 
          />
        </div>
      ) : (
        <div className="space-y-3">
           {showBowlerSelect ? (
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                 <label className="block text-amber-400 text-xs font-bold uppercase mb-2">Select Next Bowler</label>
                 <select 
                    value={activePlayerId || ''}
                    onChange={(e) => onPlayerSelect && onPlayerSelect(e.target.value)}
                    className="w-full bg-slate-900 p-3 rounded border border-slate-700 text-white focus:border-amber-500 focus:outline-none appearance-none"
                 >
                    <option value="">Choose...</option>
                    {players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                 </select>
              </div>
           ) : activePlayerId ? (
              <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg border border-white/5">
                 <div>
                    <div className="text-xs text-gray-500 uppercase">Bowling</div>
                    <div className="font-bold">{players.find(p=>p.id === activePlayerId)?.name}</div>
                 </div>
                 <div className="text-right font-mono text-sm">
                    {(stats[activePlayerId] as BowlerStats).wickets} <span className="text-gray-500">for</span> {(stats[activePlayerId] as BowlerStats).runsConceded}
                    <div className="text-xs text-gray-500">
                        {(stats[activePlayerId] as BowlerStats).ballsDelivered % 6 === 0 && (stats[activePlayerId] as BowlerStats).ballsDelivered > 0
                            ? `${(stats[activePlayerId] as BowlerStats).ballsDelivered / 6}.0`
                            : `${Math.floor((stats[activePlayerId] as BowlerStats).ballsDelivered / 6)}.${(stats[activePlayerId] as BowlerStats).ballsDelivered % 6}`
                        } overs
                    </div>
                 </div>
              </div>
           ) : <div className="text-gray-500 text-sm italic">No active bowler</div>}
        </div>
      )}
    </div>
  );
};

export default PlayerCard;