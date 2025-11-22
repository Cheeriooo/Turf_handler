import React, { useState, useEffect } from 'react';
import type { MatchSetupData } from '../types';
import { UsersIcon, PlusIcon, CloseIcon, BatIcon, HistoryIcon } from './icons';

interface MatchSetupProps {
  onMatchStart: (data: MatchSetupData) => void;
  onShowHistory: () => void;
}

const MatchSetup: React.FC<MatchSetupProps> = ({ onMatchStart, onShowHistory }) => {
  const [team1Name, setTeam1Name] = useState('Team A');
  const [team2Name, setTeam2Name] = useState('Team B');
  const [team1Players, setTeam1Players] = useState<string[]>(['Player 1', 'Player 2', 'Player 3']);
  const [team2Players, setTeam2Players] = useState<string[]>(['Player 1', 'Player 2', 'Player 3']);
  const [totalOvers, setTotalOvers] = useState(5);
  const [lastAddedPlayer, setLastAddedPlayer] = useState<{ team: 'team1' | 'team2', index: number } | null>(null);

  useEffect(() => {
    if (lastAddedPlayer) {
      const input = document.querySelector(`[data-team='${lastAddedPlayer.team}'][data-index='${lastAddedPlayer.index}']`) as HTMLInputElement;
      input?.focus();
      setLastAddedPlayer(null);
    }
  }, [lastAddedPlayer]);

  const handlePlayerChange = (team: 'team1' | 'team2', index: number, value: string) => {
    const players = team === 'team1' ? [...team1Players] : [...team2Players];
    players[index] = value;
    team === 'team1' ? setTeam1Players(players) : setTeam2Players(players);
  };
  
  const addPlayer = (team: 'team1' | 'team2') => {
    if (team === 'team1' && team1Players.length < 11) {
      setLastAddedPlayer({ team: 'team1', index: team1Players.length });
      setTeam1Players([...team1Players, '']);
    } else if (team === 'team2' && team2Players.length < 11) {
      setLastAddedPlayer({ team: 'team2', index: team2Players.length });
      setTeam2Players([...team2Players, '']);
    }
  };

  const removePlayer = (team: 'team1' | 'team2', index: number) => {
    if (team === 'team1' && team1Players.length > 2) setTeam1Players(team1Players.filter((_, i) => i !== index));
    else if (team === 'team2' && team2Players.length > 2) setTeam2Players(team2Players.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onMatchStart({
      team1Name, team2Name,
      team1Players: team1Players.map(p => p.trim()).filter(p => p),
      team2Players: team2Players.map(p => p.trim()).filter(p => p),
      totalOvers,
    });
  };

  const isFormValid = team1Players.filter(p=>p.trim()).length >= 2 && team2Players.filter(p=>p.trim()).length >= 2;

  return (
    <div className="min-h-screen p-4 md:p-8 flex items-center justify-center">
      <div className="max-w-4xl w-full animate-slide-up">
        
        <div className="flex justify-between items-center mb-8">
           <div>
             <h1 className="text-4xl font-black tracking-tight">NEW MATCH</h1>
             <p className="text-gray-400">Setup teams and configurations</p>
           </div>
           <button onClick={onShowHistory} className="p-3 glass-card rounded-full hover:bg-white/10 transition">
              <HistoryIcon className="w-6 h-6" />
           </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <TeamSection 
                team="team1" 
                name={team1Name} 
                setName={setTeam1Name} 
                players={team1Players} 
                onPlayerChange={(idx, val) => handlePlayerChange('team1', idx, val)}
                onRemovePlayer={(idx) => removePlayer('team1', idx)}
                onAddPlayer={() => addPlayer('team1')}
             />
             <TeamSection 
                team="team2" 
                name={team2Name} 
                setName={setTeam2Name} 
                players={team2Players} 
                onPlayerChange={(idx, val) => handlePlayerChange('team2', idx, val)}
                onRemovePlayer={(idx) => removePlayer('team2', idx)}
                onAddPlayer={() => addPlayer('team2')}
             />
          </div>
          
          <div className="glass-card p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6">
             <div className="text-center md:text-left">
                <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Overs per Innings</label>
                <p className="text-xs text-gray-500">Standard T20 is 20 overs</p>
             </div>
             <div className="flex items-center gap-4">
                <button type="button" onClick={() => setTotalOvers(Math.max(1, totalOvers - 1))} className="w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center font-bold text-xl">-</button>
                <span className="text-3xl font-black font-mono w-16 text-center">{totalOvers}</span>
                <button type="button" onClick={() => setTotalOvers(Math.min(50, totalOvers + 1))} className="w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center font-bold text-xl">+</button>
             </div>
          </div>

          <button
            type="submit"
            disabled={!isFormValid}
            className="w-full py-5 text-xl font-bold text-white bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl shadow-xl shadow-indigo-900/30 hover:scale-[1.01] transition-all disabled:opacity-50 disabled:grayscale flex items-center justify-center gap-3"
          >
            <BatIcon className="w-6 h-6" /> START MATCH
          </button>
        </form>
      </div>
    </div>
  );
};

export default MatchSetup;

interface TeamSectionProps {
  team: 'team1' | 'team2';
  name: string;
  setName: (name: string) => void;
  players: string[];
  onPlayerChange: (index: number, value: string) => void;
  onRemovePlayer: (index: number) => void;
  onAddPlayer: () => void;
}

const TeamSection: React.FC<TeamSectionProps> = ({ team, name, setName, players, onPlayerChange, onRemovePlayer, onAddPlayer }) => (
  <div className="glass-card p-6 rounded-2xl space-y-4">
    <div className="flex items-center gap-3 mb-2">
       <div className={`w-10 h-10 rounded-full flex items-center justify-center ${team === 'team1' ? 'bg-indigo-600' : 'bg-emerald-600'}`}>
          <UsersIcon className="w-5 h-5 text-white" />
       </div>
       <input
         type="text" value={name} onChange={(e) => setName(e.target.value)}
         className="bg-transparent text-xl font-bold text-white placeholder-gray-500 focus:outline-none w-full border-b border-transparent focus:border-gray-600 transition-colors"
         placeholder="Team Name"
       />
    </div>
    
    <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
      {players.map((player: string, index: number) => (
        <div key={index} className="flex items-center gap-2 group">
          <span className="text-xs font-mono text-gray-600 w-4">{index + 1}</span>
          <input
            type="text" value={player} onChange={(e) => onPlayerChange(index, e.target.value)}
            placeholder={`Player Name`}
            className="flex-1 bg-slate-900/50 border border-white/5 rounded-lg px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none text-white"
            data-team={team} data-index={index}
          />
          <button type="button" onClick={() => onRemovePlayer(index)} disabled={players.length <= 2} className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition p-1">
            <CloseIcon className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
    <button type="button" onClick={onAddPlayer} disabled={players.length >= 11} className="w-full py-2 text-sm font-semibold text-gray-400 border border-dashed border-gray-700 rounded-lg hover:bg-white/5 hover:text-white transition disabled:opacity-30">
      + Add Player
    </button>
  </div>
);