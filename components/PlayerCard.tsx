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
    return (
      <div className="grid grid-cols-2 gap-2 items-center">
        <label className="font-semibold text-gray-600 dark:text-gray-400">{label}:</label>
        <div className="flex items-center gap-2">
          <select
            value={selectedId || ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={isMatchOver}
            className="w-full p-2 border rounded bg-white dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-resolver-blue outline-none disabled:bg-gray-200 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
            aria-label={`Select ${label}`}
          >
            <option value="" disabled>Select...</option>
            {players.map(p => (
              <option key={p.id} value={p.id} disabled={p.id === otherBatsmanId}>
                {p.name}
              </option>
            ))}
          </select>
          {s && <span className="font-mono text-sm whitespace-nowrap">{s.runs}&nbsp;({s.balls})</span>}
        </div>
      </div>
    );
  };

  const renderBowler = (player: Player) => {
    const s = stats[player.id] as BowlerStats;
    const overs = Math.floor(s.ballsDelivered / 6);
    const balls = s.ballsDelivered % 6;
    return (
      <div key={player.id} className="flex justify-between items-center">
        <span className="font-semibold truncate">{player.name}</span>
        <span className="font-mono text-sm">{overs}.{balls}-{s.maidenOvers}-{s.runsConceded}-{s.wickets}</span>
      </div>
    );
  }

  const activePlayer = players.find(p => p.id === activePlayerId);

  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 h-full">
      <h3 className="text-xl font-bold mb-3 flex items-center gap-2 text-resolver-blue">
        {isBattingCard ? <BatIcon /> : <BallIcon />} {title}
      </h3>
      
      {isBattingCard ? (
        <div className="space-y-3">
          {renderBatsmanSelector('Striker', strikerId, onStrikerChange, nonStrikerId)}
          {renderBatsmanSelector('Non-Striker', nonStrikerId, onNonStrikerChange, strikerId)}
        </div>
      ) : onPlayerSelect ? (
        <div className="space-y-2">
          {isOverStarting && activePlayerId ? (
             <select 
               value={activePlayerId} 
               onChange={(e) => onPlayerSelect(e.target.value)}
               className="w-full p-2 border rounded bg-white dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-resolver-blue outline-none"
             >
              {players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
             </select>
          ) : activePlayer ? renderBowler(activePlayer) : <p>Select bowler</p>}
          {activePlayer && (
            <div className="text-xs text-gray-500 dark:text-gray-400 pt-2 border-t dark:border-gray-700 mt-2">
              Eco: {(stats[activePlayerId] as BowlerStats).economy}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
};

export default PlayerCard;
