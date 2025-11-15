import React, { useState, useEffect } from 'react';
import type { MatchState, Player, BatsmanStats, BowlerStats } from '../types';
import { HistoryIcon, DownloadIcon, ChevronDownIcon } from './icons';

const InningsScorecard: React.FC<{
  title: string;
  players: Player[];
  batsmanStats: Record<string, BatsmanStats>;
  bowlerStats: Record<string, BowlerStats>;
  teamScore: number;
  teamWickets: number;
}> = ({ title, players, batsmanStats, bowlerStats, teamScore, teamWickets }) => {
  const bowlers = players.filter(p => bowlerStats[p.id] && bowlerStats[p.id].ballsDelivered > 0);

  return (
    <div className="space-y-6">
      <h4 className="text-xl font-bold text-center text-gray-300">{title} - {teamScore}/{teamWickets}</h4>
      {/* Batting Scorecard */}
      <div>
        <h5 className="font-semibold mb-2 text-[#3B82F6]">Batting</h5>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-[#0D1117] text-xs text-gray-400 uppercase">
              <tr>
                <th className="px-4 py-2">Batsman</th>
                <th className="px-2 py-2 text-right">R</th>
                <th className="px-2 py-2 text-right">B</th>
                <th className="px-2 py-2 text-right">4s</th>
                <th className="px-2 py-2 text-right">6s</th>
                <th className="px-2 py-2 text-right">SR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {players.map(player => {
                const stats = batsmanStats[player.id];
                if (!stats) return null;
                return (
                  <tr key={player.id}>
                    <td className="px-4 py-2 font-medium truncate">{player.name} {!stats.isOut && stats.balls > 0 ? <span className="text-green-400">*</span> : ''}</td>
                    <td className="px-2 py-2 text-right font-mono">{stats.runs}</td>
                    <td className="px-2 py-2 text-right font-mono">{stats.balls}</td>
                    <td className="px-2 py-2 text-right font-mono">{stats.bonus4}</td>
                    <td className="px-2 py-2 text-right font-mono">{stats.bonus6}</td>
                    <td className="px-2 py-2 text-right font-mono">{typeof stats.strikeRate === 'number' ? stats.strikeRate.toFixed(2) : '0.00'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bowling Scorecard */}
      {bowlers.length > 0 && (
        <div>
          <h5 className="font-semibold mb-2 text-[#F59E0B]">Bowling</h5>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-[#0D1117] text-xs text-gray-400 uppercase">
                <tr>
                  <th className="px-4 py-2">Bowler</th>
                  <th className="px-2 py-2 text-right">O</th>
                  <th className="px-2 py-2 text-right">M</th>
                  <th className="px-2 py-2 text-right">R</th>
                  <th className="px-2 py-2 text-right">W</th>
                  <th className="px-2 py-2 text-right">Econ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {bowlers.map(player => {
                  const stats = bowlerStats[player.id];
                  if (!stats) return null;
                  const overs = Math.floor(stats.ballsDelivered / 6);
                  const balls = stats.ballsDelivered % 6;
                  return (
                    <tr key={player.id}>
                      <td className="px-4 py-2 font-medium truncate">{player.name}</td>
                      <td className="px-2 py-2 text-right font-mono">{overs}.{balls}</td>
                      <td className="px-2 py-2 text-right font-mono">{stats.maidenOvers}</td>
                      <td className="px-2 py-2 text-right font-mono">{stats.runsConceded}</td>
                      <td className="px-2 py-2 text-right font-mono">{stats.wickets}</td>
                      <td className="px-2 py-2 text-right font-mono">{(typeof stats.economy === 'number' ? stats.economy : 0).toFixed(2)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};


const MatchHistory: React.FC<{ onBack: () => void; }> = ({ onBack }) => {
  const [history, setHistory] = useState<MatchState[]>([]);
  const [expandedMatchId, setExpandedMatchId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState<string | null>(null);

  useEffect(() => {
    try {
        const historyJSON = localStorage.getItem('cricketMatchHistory');
        if (historyJSON) {
          const parsedHistory = JSON.parse(historyJSON);
          // Basic validation to prevent crash on malformed data
          if (Array.isArray(parsedHistory)) {
            setHistory(parsedHistory.filter(match => match && typeof match === 'object' && match.team1 && match.team2));
          }
        }
    } catch(e) {
        console.error("Failed to load match history:", e);
        // If parsing fails, clear corrupted data
        localStorage.removeItem('cricketMatchHistory');
    }
  }, []);

  const handleClearHistory = () => {
    if (window.confirm("Are you sure you want to clear all match history? This cannot be undone.")) {
      localStorage.removeItem('cricketMatchHistory');
      setHistory([]);
    }
  };

  const toggleDetails = (matchId: string) => {
    setExpandedMatchId(prevId => (prevId === matchId ? null : matchId));
  };
  
  const toCSVRow = (data: (string | number)[]) => {
    return data.map(val => {
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    }).join(',') + '\r\n';
  };
  
  const generateCSVContent = (match: MatchState): string => {
    let csvContent = '';
  
    // Match Summary
    csvContent += toCSVRow([`Match: ${match.team1.name} vs ${match.team2.name}`]);
    csvContent += toCSVRow([`Result: ${match.matchOverMessage}`]);
    csvContent += '\r\n';
  
    const generateInningsCSV = (
      teamName: string, 
      battingPlayers: Player[], 
      bowlingPlayers: Player[],
      batsmanStats: Record<string, BatsmanStats>,
      bowlerStats: Record<string, BowlerStats>
    ) => {
      let inningsContent = '';
      // Batting
      inningsContent += toCSVRow([`${teamName} Innings - Batting`]);
      inningsContent += toCSVRow(['Batsman', 'Status', 'Runs', 'Balls', '4s', '6s', 'SR']);
      battingPlayers.forEach(player => {
        const stats = batsmanStats[player.id];
        if (stats) {
          const status = !stats.isOut && stats.balls > 0 ? 'Not Out' : (stats.balls > 0 || stats.isOut ? 'Out' : 'Did not bat');
          inningsContent += toCSVRow([
            player.name,
            status,
            stats.runs,
            stats.balls,
            stats.bonus4,
            stats.bonus6,
            (typeof stats.strikeRate === 'number' ? stats.strikeRate.toFixed(2) : '0.00')
          ]);
        }
      });
      inningsContent += '\r\n';
  
      // Bowling
      inningsContent += toCSVRow([`Bowling`]);
      inningsContent += toCSVRow(['Bowler', 'Overs', 'Maidens', 'Runs', 'Wickets', 'Economy']);
      bowlingPlayers.forEach(player => {
        const stats = bowlerStats[player.id];
        if (stats && stats.ballsDelivered > 0) {
          const overs = `${Math.floor(stats.ballsDelivered / 6)}.${stats.ballsDelivered % 6}`;
          inningsContent += toCSVRow([
            player.name,
            overs,
            stats.maidenOvers,
            stats.runsConceded,
            stats.wickets,
            (typeof stats.economy === 'number' ? stats.economy.toFixed(2) : '0.00')
          ]);
        }
      });
      return inningsContent;
    };
  
    const firstInningsTeamKey = match.currentInnings === 2 ? match.bowlingTeam : match.battingTeam;
    const secondInningsTeamKey = match.currentInnings === 2 ? match.battingTeam : match.bowlingTeam;
  
    // First Innings
    csvContent += generateInningsCSV(
      match[firstInningsTeamKey].name,
      match[firstInningsTeamKey].players,
      match[secondInningsTeamKey].players,
      match.batsmanStats,
      match.bowlerStats
    );
  
    // Second Innings
    if (match.firstInningsResult) {
      csvContent += '\r\n';
      csvContent += generateInningsCSV(
        match[secondInningsTeamKey].name,
        match[secondInningsTeamKey].players,
        match[firstInningsTeamKey].players,
        match.batsmanStats,
        match.bowlerStats
      );
    }
  
    return csvContent;
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  const handleExportMatch = (match: MatchState) => {
    if (!match.id) return;
    setIsExporting(match.id);
    try {
      const csvContent = generateCSVContent(match);
      downloadFile(csvContent, `${match.team1.name}-vs-${match.team2.name}-summary.csv`, 'text/csv;charset=utf-8;');
    } catch (error) {
      console.error("Error generating CSV export:", error);
      alert("Could not generate match export.");
    } finally {
      setIsExporting(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#0D1117] text-white p-4 font-sans">
      <div className="max-w-3xl mx-auto animate-slide-up-fade-in py-6">
        <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold flex items-center gap-3">
                <HistoryIcon className="w-8 h-8"/> Match History
            </h1>
          <div>
            <button onClick={onBack} className="mr-4 px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition">Back</button>
            {history.length > 0 && (
                <button onClick={handleClearHistory} className="px-4 py-2 bg-[#EF4444] text-white rounded-lg hover:bg-red-600 transition">Clear All</button>
            )}
          </div>
        </div>

        {history.length === 0 ? (
          <div className="text-center py-20 bg-[#161B22] rounded-xl">
            <h2 className="text-2xl font-semibold text-gray-400">No Completed Matches</h2>
            <p className="text-gray-500 mt-2">Finish a match to see it here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {history.map((match) => {
              const isExpanded = expandedMatchId === match.id;
              
              const firstInningsTeamKey = match.currentInnings === 2 ? match.bowlingTeam : match.battingTeam;
              const secondInningsTeamKey = match.currentInnings === 2 ? match.battingTeam : match.bowlingTeam;
              
              const firstInningsTeam = match[firstInningsTeamKey];
              const secondInningsTeam = match[secondInningsTeamKey];
              
              const firstInningsScore = match.firstInningsResult ? match.firstInningsResult.score : match.score;
              const firstInningsWickets = match.firstInningsResult ? match.firstInningsResult.wickets : match.wickets;

              return (
              <div key={match.id} className="bg-[#161B22] rounded-xl shadow-lg border border-transparent hover:border-[#3B82F6]/50 transition-all duration-300">
                <button onClick={() => toggleDetails(match.id!)} className="w-full text-left p-5 focus:outline-none">
                    <div className="flex justify-between items-start">
                    <div>
                        <p className="font-bold text-lg">{match.team1.name} vs {match.team2.name}</p>
                        <p className="text-sm text-gray-400">{match.completedAt ? new Date(match.completedAt).toLocaleString() : ''}</p>
                    </div>
                    <div className="text-right flex-shrink-0 ml-4 flex items-center gap-4">
                        <p className="font-semibold text-green-400">{match.matchOverMessage}</p>
                        <ChevronDownIcon className={`w-6 h-6 text-gray-400 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </div>
                    </div>
                    <div className="mt-4 border-t border-gray-700 pt-4 flex space-x-4 text-center">
                        <div className="flex-1">
                            <p className="text-xs text-gray-500 uppercase">{firstInningsTeam.name}</p>
                            <p className="font-mono text-lg">{firstInningsScore}/{firstInningsWickets}</p>
                        </div>
                        {match.firstInningsResult && (
                            <div className="flex-1">
                                <p className="text-xs text-gray-500 uppercase">{secondInningsTeam.name}</p>
                                <p className="font-mono text-lg">{match.score}/{match.wickets}</p>
                            </div>
                        )}
                    </div>
                </button>
                {isExpanded && (
                  <div className="px-5 pb-5 pt-2 border-t border-gray-700/50 space-y-6">
                    <InningsScorecard 
                      title={`${firstInningsTeam.name} Innings`}
                      players={firstInningsTeam.players}
                      batsmanStats={match.batsmanStats}
                      bowlerStats={match.bowlerStats}
                      teamScore={firstInningsScore}
                      teamWickets={firstInningsWickets}
                    />
                    {match.firstInningsResult && (
                      <InningsScorecard 
                        title={`${secondInningsTeam.name} Innings`}
                        players={secondInningsTeam.players}
                        batsmanStats={match.batsmanStats}
                        bowlerStats={match.bowlerStats}
                        teamScore={match.score}
                        teamWickets={match.wickets}
                      />
                    )}
                    <div className="pt-4 border-t border-gray-700/50">
                      <button 
                        onClick={() => handleExportMatch(match)} 
                        disabled={isExporting === match.id}
                        className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-[#3B82F6] text-white font-semibold rounded-lg hover:bg-blue-500 transition disabled:bg-gray-600 disabled:cursor-wait"
                      >
                        {isExporting === match.id ? (
                            <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Exporting...
                            </>
                        ) : (
                            <>
                            <DownloadIcon className="w-5 h-5"/> Export as CSV
                            </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )})}
          </div>
        )}
      </div>
    </div>
  );
};

export default MatchHistory;