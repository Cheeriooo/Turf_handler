import React from 'react';
import type { Player, BatsmanStats, BowlerStats } from '../types';
import { BatIcon, BallIcon } from './icons';

interface PlayerCardProps {
  title: string;
  players: Player[];
  stats: Record<string, BatsmanStats | BowlerStats>;
  isMatchOver?: boolean;

  // Batting specific
  isBattingCard?: boolean;
  strikerId?: string | null;
  nonStrikerId?: string | null;
  onStrikerChange?: (id: string) => void;
  onNonStrikerChange?: (id: string) => void;

  // Bowling specific
  activePlayerId?: string | null;
  onPlayerSelect?: (id: string) => void;
  isOverStarting?: boolean;
}

const PlayerCard: React.FC<PlayerCardProps> = ({
  title,
  players,
  stats,
  isMatchOver,
  isBattingCard,
  strikerId,
  nonStrikerId,
  onStrikerChange,
  onNonStrikerChange,
  activePlayerId,
  onPlayerSelect,
  isOverStarting,
}) => {
  const renderBatsmanSelector = (
    label: string,
    selectedId: string | null,
    onChange: ((id: string) => void) | undefined,
    otherBatsmanId: string | null
  ) => {
    if (!onChange) return null;
    const s = selectedId ? (stats[selectedId] as BatsmanStats) : null;
    const selectedPlayer = players.find(p => p.id === selectedId);
    return (
      <div>
        <div className="flex justify-between items-center mb-1">
          <label className="font-semibold text-[#9CA3AF]">{label}</label>
          {s && <span className="font-mono text-sm whitespace-nowrap">{s.runs}<span className="text-gray-500">({s.balls})</span></span>}
        </div>
        <select
          value={selectedId || ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={isMatchOver}
          className="w-full p-3 bg-[#0D1117] border border-gray-700 rounded-lg focus:ring-2 focus:ring-[#3B82F6] outline-none transition disabled:opacity-50"
          aria-label={`Select ${label}`}
        >
          <option value="" disabled>{selectedPlayer ? selectedPlayer.name : 'Select...'}</option>
          {players.map(p => (
            <option key={p.id} value={p.id} disabled={p.id === otherBatsmanId}>
              {p.name}
            </option>
          ))}
        </select>
      </div>
    );
  };

  const renderBowler = (player: Player) => {
    const s = stats[player.id] as BowlerStats;
    const overs = Math.floor(s.ballsDelivered / 6);
    const balls = s.ballsDelivered % 6;
    return (
      <div key={player.id} className="flex justify-between items-center bg-[#0D1117] p-3 rounded-lg">
        <span className="font-semibold truncate">{player.name}</span>
        <span className="font-mono text-sm">{overs}.{balls}-{s.maidenOvers}-{s.runsConceded}-{s.wickets}</span>
      </div>
    );
  }

  const activePlayer = players.find(p => p.id === activePlayerId);

  return (
    <div className="bg-[#161B22] rounded-xl p-4 h-full">
      <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-[#3B82F6]">
        {isBattingCard ? <BatIcon className="w-6 h-6" /> : <BallIcon className="w-6 h-6" />} {title}
      </h3>
      
      {isBattingCard ? (
        <div className="space-y-4">
          {renderBatsmanSelector('Striker', strikerId, onStrikerChange, nonStrikerId)}
          {renderBatsmanSelector('Non-Striker', nonStrikerId, onNonStrikerChange, strikerId)}
        </div>
      ) : onPlayerSelect ? (
        <div className="space-y-3">
          {isOverStarting && activePlayerId ? (
             <select 
               value={activePlayerId} 
               onChange={(e) => onPlayerSelect(e.target.value)}
               className="w-full p-3 bg-[#0D1117] border border-gray-700 rounded-lg focus:ring-2 focus:ring-[#3B82F6] outline-none transition"
             >
              {players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
             </select>
          ) : activePlayer ? renderBowler(activePlayer) : <p className="text-gray-400">Select bowler</p>}
          {activePlayer && (
            <div className="text-right text-sm text-[#9CA3AF] pt-2">
              Eco: <span className="font-mono">{(stats[activePlayerId] as BowlerStats).economy}</span>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
};

export default PlayerCard;
