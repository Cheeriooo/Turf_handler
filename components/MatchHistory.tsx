import React, { useState, useEffect } from 'react';
import type { MatchState, Player } from '../types';
import { HistoryIcon, DownloadIcon, ChevronDownIcon } from './icons';
import InningsScorecard from './InningsScorecard';

const MatchHistory: React.FC<{ onBack: () => void; }> = ({ onBack }) => {
  const [history, setHistory] = useState<MatchState[]>([]);
  const [expandedMatchId, setExpandedMatchId] = useState<string | null>(null);

  useEffect(() => {
    try {
        const historyJSON = localStorage.getItem('cricketMatchHistory');
        if (historyJSON) {
          setHistory(JSON.parse(historyJSON));
        }
    } catch(e) { console.error(e); }
  }, []);

  const toggleExpand = (id: string) => {
    setExpandedMatchId(expandedMatchId === id ? null : id);
  };

  const downloadCSV = (match: MatchState, e: React.MouseEvent) => {
    e.stopPropagation();
    const headers = ['Player Name', 'Team', 'Runs', 'Balls', '4s', '6s', 'SR', 'Overs', 'Maidens', 'Runs Conceded', 'Wickets', 'Economy'];
    let csvContent = "data:text/csv;charset=utf-8,";
    
    // Meta data
    csvContent += `Match,${match.team1.name} vs ${match.team2.name}\n`;
    csvContent += `Date,${new Date(match.completedAt || '').toLocaleDateString()}\n`;
    csvContent += `Result,${match.matchOverMessage}\n\n`;
    
    csvContent += headers.join(",") + "\n";

    const processPlayer = (p: Player, teamName: string) => {
        const bat = match.batsmanStats[p.id];
        const bowl = match.bowlerStats[p.id];
        
        // Only include if they did something
        if ((bat && (bat.balls > 0 || bat.isOut)) || (bowl && bowl.ballsDelivered > 0)) {
             const row = [
                 `"${p.name}"`,
                 `"${teamName}"`,
                 bat ? bat.runs : 0,
                 bat ? bat.balls : 0,
                 bat ? bat.bonus4 : 0,
                 bat ? bat.bonus6 : 0,
                 bat ? (typeof bat.strikeRate === 'number' ? bat.strikeRate : 0) : 0,
                 bowl ? (bowl.ballsDelivered / 6).toFixed(1) : 0,
                 bowl ? bowl.maidenOvers : 0,
                 bowl ? bowl.runsConceded : 0,
                 bowl ? bowl.wickets : 0,
                 bowl ? (typeof bowl.economy === 'number' ? bowl.economy : 0) : 0
             ];
             csvContent += row.join(",") + "\n";
        }
    };

    match.team1.players.forEach(p => processPlayer(p, match.team1.name));
    match.team2.players.forEach(p => processPlayer(p, match.team2.name));

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `match_${match.id || 'report'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-3xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
            <button onClick={onBack} className="p-2 rounded-full hover:bg-white/10"><ChevronDownIcon className="w-6 h-6 rotate-90" /></button>
            <h1 className="text-2xl font-bold">Match History</h1>
        </div>

        {history.length === 0 ? (
            <div className="glass-card p-12 rounded-2xl text-center text-gray-500">No matches recorded yet.</div>
        ) : (
            <div className="space-y-4">
                {history.map((match, i) => {
                    const isExpanded = expandedMatchId === match.id;
                    // Determine innings teams based on final match state
                    const innings2TeamKey = match.battingTeam;
                    const innings1TeamKey = match.battingTeam === 'team1' ? 'team2' : 'team1';
                    const innings1Team = match[innings1TeamKey];
                    const innings2Team = match[innings2TeamKey];

                    return (
                        <div key={i} className="glass-card p-5 rounded-xl border-l-4 border-indigo-500 transition-all">
                            <div 
                                className="cursor-pointer"
                                onClick={() => toggleExpand(match.id || '')}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h3 className="font-bold text-lg">{match.team1.name} <span className="text-gray-500 text-sm">vs</span> {match.team2.name}</h3>
                                        <div className="text-xs text-gray-500">{new Date(match.completedAt!).toLocaleDateString()}</div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={(e) => downloadCSV(match, e)} 
                                            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition"
                                            title="Export CSV"
                                        >
                                            <DownloadIcon className="w-5 h-5" />
                                        </button>
                                        <button 
                                            className={`p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition ${isExpanded ? 'rotate-180' : ''}`}
                                        >
                                            <ChevronDownIcon className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                                <div className="text-emerald-400 font-bold text-sm uppercase tracking-wide mb-3">{match.matchOverMessage}</div>
                                <div className="flex gap-4 text-sm font-mono text-gray-400">
                                    <span>1st: {match.firstInningsResult?.score}/{match.firstInningsResult?.wickets}</span>
                                    <span>2nd: {match.score}/{match.wickets}</span>
                                </div>
                            </div>

                            {isExpanded && (
                                <div className="mt-6 pt-6 border-t border-white/10 space-y-8 animate-slide-up">
                                    {/* Innings 1 Report */}
                                    <InningsScorecard 
                                        title={`${innings1Team.name} Innings`}
                                        players={innings1Team.players}
                                        batsmanStats={match.batsmanStats}
                                        bowlerStats={match.bowlerStats}
                                        teamScore={match.firstInningsResult?.score || 0}
                                        teamWickets={match.firstInningsResult?.wickets || 0}
                                    />

                                    {/* Innings 2 Report */}
                                    <InningsScorecard 
                                        title={`${innings2Team.name} Innings`}
                                        players={innings2Team.players}
                                        batsmanStats={match.batsmanStats}
                                        bowlerStats={match.bowlerStats}
                                        teamScore={match.score}
                                        teamWickets={match.wickets}
                                    />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        )}
    </div>
  );
};

export default MatchHistory;