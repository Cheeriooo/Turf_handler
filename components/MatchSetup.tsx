import React, { useState, useEffect } from 'react';
import type { MatchSetupData } from '../types';
import { UsersIcon, PlusIcon, CloseIcon, BatIcon } from './icons';

interface MatchSetupProps {
  onMatchStart: (data: MatchSetupData) => void;
}

const MatchSetup: React.FC<MatchSetupProps> = ({ onMatchStart }) => {
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
    if (team === 'team1') {
      setTeam1Players(players);
    } else {
      setTeam2Players(players);
    }
  };
  
  const addPlayer = (team: 'team1' | 'team2') => {
    if (team === 'team1') {
      if (team1Players.length < 11) {
        setLastAddedPlayer({ team: 'team1', index: team1Players.length });
        setTeam1Players([...team1Players, '']);
      }
    } else {
      if (team2Players.length < 11) {
        setLastAddedPlayer({ team: 'team2', index: team2Players.length });
        setTeam2Players([...team2Players, '']);
      }
    }
  };

  const removePlayer = (team: 'team1' | 'team2', index: number) => {
    if (team === 'team1') {
      if (team1Players.length > 2) setTeam1Players(team1Players.filter((_, i) => i !== index));
    } else {
      if (team2Players.length > 2) setTeam2Players(team2Players.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onMatchStart({
      team1Name,
      team2Name,
      team1Players: team1Players.map(p => p.trim()).filter(p => p),
      team2Players: team2Players.map(p => p.trim()).filter(p => p),
      totalOvers,
    });
  };

  const isFormValid = team1Players.filter(p=>p.trim()).length >= 2 && team2Players.filter(p=>p.trim()).length >= 2;

  const renderTeamCard = (
    team: 'team1' | 'team2',
    name: string,
    setName: (name: string) => void,
    players: string[]
  ) => (
    <div className="bg-white dark:bg-[#161B22] p-5 rounded-xl space-y-4 shadow-lg border border-gray-200 dark:border-transparent">
      <h2 className="text-xl font-bold text-[#3B82F6] flex items-center gap-2">
        <UsersIcon className="w-6 h-6" /> {name || (team === 'team1' ? 'Team 1' : 'Team 2')}
      </h2>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Enter Team Name"
        className="w-full p-3 bg-gray-100 dark:bg-[#0D1117] border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-[#3B82F6] outline-none transition text-gray-800 dark:text-white"
        required
      />
      <div className="space-y-3">
        {players.map((player, index) => (
          <div key={index} className="flex items-center gap-2">
            <input
              type="text"
              value={player}
              onChange={(e) => handlePlayerChange(team, index, e.target.value)}
              placeholder={`Player ${index + 1}`}
              className="w-full p-3 bg-gray-100 dark:bg-[#0D1117] border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-[#3B82F6] outline-none transition text-gray-800 dark:text-white"
              data-team={team}
              data-index={index}
              required
            />
            <button type="button" onClick={() => removePlayer(team, index)} className="p-2 text-white bg-red-500 dark:bg-[#EF4444] rounded-full hover:bg-red-600 dark:hover:bg-red-700 disabled:opacity-50 transition flex-shrink-0" disabled={players.length <= 2}>
              <CloseIcon className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
      <button type="button" onClick={() => addPlayer(team)} className="w-full p-2 text-[#3B82F6] border-2 border-dashed border-[#3B82F6] rounded-full hover:bg-[#3B82F6]/10 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed" disabled={players.length >= 11}>
        <PlusIcon className="w-5 h-5" /> Add Player ({players.length}/11)
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0D1117] text-gray-800 dark:text-white p-4 font-sans">
      <div className="max-w-md mx-auto animate-slide-up-fade-in py-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">Match Setup</h1>
          <p className="text-gray-500 dark:text-[#9CA3AF] mt-2">Set up your teams and overs to start the game.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {renderTeamCard('team1', team1Name, setTeam1Name, team1Players)}
          {renderTeamCard('team2', team2Name, setTeam2Name, team2Players)}
          
          <div className="text-center py-4">
            <label className="block text-lg font-medium mb-2 text-gray-600 dark:text-[#9CA3AF]">Total Overs</label>
            <input
              type="number"
              value={totalOvers}
              onChange={(e) => setTotalOvers(Math.max(1, parseInt(e.target.value, 10)))}
              className="w-32 p-3 text-center text-xl font-bold bg-white dark:bg-[#161B22] border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-[#3B82F6] outline-none text-gray-800 dark:text-white"
              min="1"
              max="50"
              required
            />
          </div>

          <button
            type="submit"
            disabled={!isFormValid}
            className="w-full py-4 text-xl font-bold text-white bg-gradient-to-r from-[#F59E0B] to-[#F97316] rounded-xl hover:scale-[1.02] transition-transform duration-200 focus:outline-none focus:ring-4 focus:ring-yellow-500/50 disabled:bg-gray-500 disabled:from-gray-500 disabled:to-gray-600 dark:disabled:bg-gray-600 dark:disabled:from-gray-600 dark:disabled:to-gray-700 disabled:cursor-not-allowed disabled:scale-100 flex items-center justify-center gap-2"
          >
            <BatIcon className="w-6 h-6" /> Start Match
          </button>
          {!isFormValid && <p className="text-center text-red-500 dark:text-[#EF4444] text-sm mt-2">Each team must have at least 2 players with valid names.</p>}
        </form>
      </div>
    </div>
  );
};

export default MatchSetup;