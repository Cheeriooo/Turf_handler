import React, { useState, useEffect } from 'react';
import type { MatchSetupData } from '../types';
import { UsersIcon, CloseIcon, BatIcon, HistoryIcon, SaveIcon, FolderIcon, ChevronDownIcon } from './icons';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from './ToastContext';
import { getSavedTeams, saveTeam, deleteTeam, type SavedTeam } from '../services/teamService';

interface MatchSetupProps {
  onMatchStart: (data: MatchSetupData) => void;
  onShowHistory: () => void;
}

const MatchSetup: React.FC<MatchSetupProps> = ({ onMatchStart, onShowHistory }) => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [team1Name, setTeam1Name] = useState('Team A');
  const [team2Name, setTeam2Name] = useState('Team B');
  const [team1Players, setTeam1Players] = useState<string[]>(['Player 1', 'Player 2', 'Player 3']);
  const [team2Players, setTeam2Players] = useState<string[]>(['Player 1', 'Player 2', 'Player 3']);
  const [totalOvers, setTotalOvers] = useState(5);
  const [lastAddedPlayer, setLastAddedPlayer] = useState<{ team: 'team1' | 'team2', index: number } | null>(null);

  // Saved teams state
  const [savedTeams, setSavedTeams] = useState<SavedTeam[]>([]);
  const [showTeam1Dropdown, setShowTeam1Dropdown] = useState(false);
  const [showTeam2Dropdown, setShowTeam2Dropdown] = useState(false);
  const [loadingTeams, setLoadingTeams] = useState(false);

  // Fetch saved teams on mount
  useEffect(() => {
    if (user) {
      setLoadingTeams(true);
      getSavedTeams(user.id).then(teams => {
        setSavedTeams(teams);
        setLoadingTeams(false);
      });
    }
  }, [user]);

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

  const handleSaveTeam = async (teamNum: 1 | 2) => {
    if (!user) {
      showToast('Login required to save teams', 'error');
      return;
    }

    const teamName = teamNum === 1 ? team1Name : team2Name;
    const players = teamNum === 1 ? team1Players : team2Players;
    const validPlayers = players.filter(p => p.trim());

    if (validPlayers.length < 2) {
      showToast('Add at least 2 players first', 'error');
      return;
    }

    const result = await saveTeam(user.id, teamName, validPlayers);
    if (result.success && result.team) {
      setSavedTeams([result.team, ...savedTeams]);
      showToast(`"${teamName}" saved!`, 'success');
    } else {
      showToast('Failed to save team', 'error');
    }
  };

  const handleLoadTeam = (team: SavedTeam, targetTeam: 1 | 2) => {
    if (targetTeam === 1) {
      setTeam1Name(team.team_name);
      setTeam1Players(team.player_names);
      setShowTeam1Dropdown(false);
    } else {
      setTeam2Name(team.team_name);
      setTeam2Players(team.player_names);
      setShowTeam2Dropdown(false);
    }
    showToast(`Loaded "${team.team_name}"`, 'success');
  };

  const handleDeleteTeam = async (teamId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const result = await deleteTeam(teamId);
    if (result.success) {
      setSavedTeams(savedTeams.filter(t => t.id !== teamId));
      showToast('Team deleted', 'success');
    }
  };

  const isFormValid = team1Players.filter(p => p.trim()).length >= 2 && team2Players.filter(p => p.trim()).length >= 2;

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
              savedTeams={savedTeams}
              showDropdown={showTeam1Dropdown}
              setShowDropdown={setShowTeam1Dropdown}
              onLoadTeam={(team) => handleLoadTeam(team, 1)}
              onSaveTeam={() => handleSaveTeam(1)}
              onDeleteTeam={handleDeleteTeam}
              isLoggedIn={!!user}
              loadingTeams={loadingTeams}
            />
            <TeamSection
              team="team2"
              name={team2Name}
              setName={setTeam2Name}
              players={team2Players}
              onPlayerChange={(idx, val) => handlePlayerChange('team2', idx, val)}
              onRemovePlayer={(idx) => removePlayer('team2', idx)}
              onAddPlayer={() => addPlayer('team2')}
              savedTeams={savedTeams}
              showDropdown={showTeam2Dropdown}
              setShowDropdown={setShowTeam2Dropdown}
              onLoadTeam={(team) => handleLoadTeam(team, 2)}
              onSaveTeam={() => handleSaveTeam(2)}
              onDeleteTeam={handleDeleteTeam}
              isLoggedIn={!!user}
              loadingTeams={loadingTeams}
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
  savedTeams: SavedTeam[];
  showDropdown: boolean;
  setShowDropdown: (show: boolean) => void;
  onLoadTeam: (team: SavedTeam) => void;
  onSaveTeam: () => void;
  onDeleteTeam: (teamId: string, e: React.MouseEvent) => void;
  isLoggedIn: boolean;
  loadingTeams: boolean;
}

const TeamSection: React.FC<TeamSectionProps> = ({
  team, name, setName, players, onPlayerChange, onRemovePlayer, onAddPlayer,
  savedTeams, showDropdown, setShowDropdown, onLoadTeam, onSaveTeam, onDeleteTeam,
  isLoggedIn, loadingTeams
}) => (
  <div className="glass-card p-6 rounded-2xl space-y-4">
    {/* Team name header with load button */}
    <div className="flex items-center gap-3 mb-2">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${team === 'team1' ? 'bg-indigo-600' : 'bg-emerald-600'}`}>
        <UsersIcon className="w-5 h-5 text-white" />
      </div>
      <input
        type="text" value={name} onChange={(e) => setName(e.target.value)}
        className="bg-transparent text-xl font-bold text-white placeholder-gray-500 focus:outline-none flex-1 border-b border-transparent focus:border-gray-600 transition-colors"
        placeholder="Team Name"
      />
      {isLoggedIn && (
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowDropdown(!showDropdown)}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition flex items-center gap-1"
            title="Load saved team"
          >
            <FolderIcon className="w-4 h-4" />
            <ChevronDownIcon className="w-3 h-3" />
          </button>

          {showDropdown && (
            <div className="absolute top-full right-0 mt-2 w-56 bg-slate-800 border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
              <div className="p-2 border-b border-white/10">
                <p className="text-xs text-gray-400 uppercase font-bold">Load Saved Team</p>
              </div>
              {loadingTeams ? (
                <div className="p-4 text-center text-gray-400 text-sm">Loading...</div>
              ) : savedTeams.length === 0 ? (
                <div className="p-4 text-center text-gray-500 text-sm">No saved teams yet</div>
              ) : (
                <div className="max-h-48 overflow-y-auto">
                  {savedTeams.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => onLoadTeam(t)}
                      className="px-3 py-2 hover:bg-white/5 cursor-pointer flex items-center justify-between group"
                    >
                      <div>
                        <p className="text-sm font-medium text-white">{t.team_name}</p>
                        <p className="text-xs text-gray-500">{t.player_names.length} players</p>
                      </div>
                      <button
                        onClick={(e) => onDeleteTeam(t.id, e)}
                        className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 p-1"
                      >
                        <CloseIcon className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>

    {/* Player list */}
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

    {/* Action buttons */}
    <div className="flex gap-2">
      <button type="button" onClick={onAddPlayer} disabled={players.length >= 11} className="flex-1 py-2 text-sm font-semibold text-gray-400 border border-dashed border-gray-700 rounded-lg hover:bg-white/5 hover:text-white transition disabled:opacity-30">
        + Add Player
      </button>
      {isLoggedIn && (
        <button type="button" onClick={onSaveTeam} className="px-4 py-2 text-sm font-semibold text-indigo-400 border border-indigo-600/50 rounded-lg hover:bg-indigo-600/20 transition flex items-center gap-2" title="Save this team">
          <SaveIcon className="w-4 h-4" />
          Save
        </button>
      )}
    </div>
  </div>
);