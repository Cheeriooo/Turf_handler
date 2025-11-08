
import React, { useState } from 'react';
import type { MatchSetupData } from '../types';
import { UsersIcon } from './icons';

interface MatchSetupProps {
  onMatchStart: (data: MatchSetupData) => void;
}

const MatchSetup: React.FC<MatchSetupProps> = ({ onMatchStart }) => {
  const [team1Name, setTeam1Name] = useState('Team A');
  const [team2Name, setTeam2Name] = useState('Team B');
  const [team1Players, setTeam1Players] = useState<string[]>(['A Player 1', 'A Player 2']);
  const [team2Players, setTeam2Players] = useState<string[]>(['B Player 1', 'B Player 2']);
  const [overs, setOvers] = useState(20);

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
      if (team1Players.length < 11) setTeam1Players([...team1Players, `A Player ${team1Players.length + 1}`]);
    } else {
      if (team2Players.length < 11) setTeam2Players([...team2Players, `B Player ${team2Players.length + 1}`]);
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
      overs,
    });
  };

  const isFormValid = team1Players.filter(p=>p.trim()).length >= 2 && team2Players.filter(p=>p.trim()).length >= 2;

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-cricket-green">Cricket Scorer Setup</h1>
          <p className="text-gray-500 mt-2">Configure your match details to get started.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Team 1 */}
            <div className="space-y-4 p-4 border rounded-lg dark:border-gray-700">
              <h2 className="text-2xl font-semibold text-cricket-green flex items-center gap-2"><UsersIcon /> Team 1</h2>
              <input
                type="text"
                value={team1Name}
                onChange={(e) => setTeam1Name(e.target.value)}
                placeholder="Team 1 Name"
                className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-800 dark:border-gray-600 focus:ring-2 focus:ring-cricket-green outline-none"
                required
              />
              <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
                {team1Players.map((player, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={player}
                      onChange={(e) => handlePlayerChange('team1', index, e.target.value)}
                      placeholder={`Player ${index + 1}`}
                      className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-800 dark:border-gray-600 focus:ring-2 focus:ring-cricket-green outline-none"
                      required
                    />
                    <button type="button" onClick={() => removePlayer('team1', index)} className="p-2 text-red-500 hover:text-red-700 disabled:opacity-50" disabled={team1Players.length <= 2}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                  </div>
                ))}
              </div>
              <button type="button" onClick={() => addPlayer('team1')} className="w-full p-2 text-cricket-green border-2 border-dashed border-cricket-green rounded-lg hover:bg-green-50 dark:hover:bg-gray-800 transition" disabled={team1Players.length >= 11}>
                Add Player ({team1Players.length}/11)
              </button>
            </div>

            {/* Team 2 */}
            <div className="space-y-4 p-4 border rounded-lg dark:border-gray-700">
              <h2 className="text-2xl font-semibold text-cricket-green flex items-center gap-2"><UsersIcon /> Team 2</h2>
              <input
                type="text"
                value={team2Name}
                onChange={(e) => setTeam2Name(e.target.value)}
                placeholder="Team 2 Name"
                className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-800 dark:border-gray-600 focus:ring-2 focus:ring-cricket-green outline-none"
                required
              />
              <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
                {team2Players.map((player, index) => (
                   <div key={index} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={player}
                      onChange={(e) => handlePlayerChange('team2', index, e.target.value)}
                      placeholder={`Player ${index + 1}`}
                      className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-800 dark:border-gray-600 focus:ring-2 focus:ring-cricket-green outline-none"
                      required
                    />
                    <button type="button" onClick={() => removePlayer('team2', index)} className="p-2 text-red-500 hover:text-red-700 disabled:opacity-50" disabled={team2Players.length <= 2}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                  </div>
                ))}
              </div>
              <button type="button" onClick={() => addPlayer('team2')} className="w-full p-2 text-cricket-green border-2 border-dashed border-cricket-green rounded-lg hover:bg-green-50 dark:hover:bg-gray-800 transition" disabled={team2Players.length >= 11}>
                Add Player ({team2Players.length}/11)
              </button>
            </div>
          </div>

          <div className="text-center">
            <label className="block text-lg font-medium mb-2">Total Overs</label>
            <input
              type="number"
              value={overs}
              onChange={(e) => setOvers(Math.max(1, parseInt(e.target.value, 10)))}
              className="w-32 p-2 border rounded text-center text-xl font-bold bg-gray-50 dark:bg-gray-800 dark:border-gray-600 focus:ring-2 focus:ring-cricket-green outline-none"
              min="1"
              required
            />
          </div>

          <button
            type="submit"
            disabled={!isFormValid}
            className="w-full py-4 text-xl font-bold text-white bg-cricket-green rounded-lg hover:bg-green-700 transition-colors duration-300 focus:outline-none focus:ring-4 focus:ring-green-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Start Match
          </button>
          {!isFormValid && <p className="text-center text-red-500 text-sm mt-2">Each team must have at least 2 players with valid names.</p>}
        </form>
      </div>
    </div>
  );
};

export default MatchSetup;
