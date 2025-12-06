import React, { useEffect, useState } from 'react';
import type { MatchState } from '../types';
import { getLiveMatch, subscribeLiveMatch, unsubscribeLiveMatch } from '../services/liveMatchService';
import { BallIcon, UsersIcon } from './icons';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface LiveScoreViewProps {
    shareCode: string;
    onClose: () => void;
}

const LiveScoreView: React.FC<LiveScoreViewProps> = ({ shareCode, onClose }) => {
    const [matchState, setMatchState] = useState<MatchState | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let channel: RealtimeChannel | null = null;
        let pollInterval: NodeJS.Timeout | null = null;

        const fetchMatch = async () => {
            const result = await getLiveMatch(shareCode);
            if (result.success && result.match) {
                setMatchState(result.match.match_state);
                setLoading(false);

                // Subscribe to real-time updates
                channel = subscribeLiveMatch(shareCode, (newState) => {
                    setMatchState(newState);
                });

                // Polling fallback: fetch every 3 seconds in case realtime doesn't work
                pollInterval = setInterval(async () => {
                    const pollResult = await getLiveMatch(shareCode);
                    if (pollResult.success && pollResult.match) {
                        setMatchState(pollResult.match.match_state);
                    }
                }, 3000);
            } else {
                setError('Match not found or has ended');
                setLoading(false);
            }
        };

        fetchMatch();

        return () => {
            if (channel) {
                unsubscribeLiveMatch(channel);
            }
            if (pollInterval) {
                clearInterval(pollInterval);
            }
        };
    }, [shareCode]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#020617] text-white">
                <div className="text-center">
                    <div className="animate-spin w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-400">Loading live score...</p>
                </div>
            </div>
        );
    }

    if (error || !matchState) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#020617] text-white">
                <div className="text-center glass-card p-8 rounded-2xl max-w-md">
                    <div className="w-16 h-16 bg-red-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <BallIcon className="w-8 h-8 text-red-400" />
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Match Not Found</h2>
                    <p className="text-gray-400 mb-6">{error || 'This match may have ended or the link is invalid.'}</p>
                    <button
                        onClick={onClose}
                        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-xl font-bold transition"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    const battingTeam = matchState[matchState.battingTeam];
    const bowlingTeam = matchState[matchState.bowlingTeam];
    const striker = battingTeam.players.find(p => p.id === matchState.strikerId);
    const nonStriker = battingTeam.players.find(p => p.id === matchState.nonStrikerId);
    const bowler = bowlingTeam.players.find(p => p.id === matchState.bowlerId);

    const strikerStats = striker ? matchState.batsmanStats[striker.id] : null;
    const nonStrikerStats = nonStriker ? matchState.batsmanStats[nonStriker.id] : null;
    const bowlerStats = bowler ? matchState.bowlerStats[bowler.id] : null;

    const displayOvers = `${matchState.currentOver}.${matchState.currentBall}`;
    const target = matchState.firstInningsResult ? matchState.firstInningsResult.score + 1 : null;
    const runsNeeded = target ? target - matchState.score : null;
    const ballsRemaining = matchState.totalOvers * 6 - (matchState.currentOver * 6 + matchState.currentBall);

    return (
        <div className="min-h-screen bg-[#020617] text-white p-4 md:p-8">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                        <span className="text-sm font-bold text-red-400 uppercase tracking-wider">LIVE</span>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white text-sm">
                        ✕ Close
                    </button>
                </div>

                {/* Match Title */}
                <div className="text-center mb-8">
                    <h1 className="text-2xl md:text-3xl font-black mb-2">
                        {matchState.team1.name} vs {matchState.team2.name}
                    </h1>
                    <p className="text-gray-400">
                        {matchState.currentInnings === 1 ? '1st Innings' : '2nd Innings'} • {matchState.totalOvers} Overs Match
                    </p>
                </div>

                {/* Score Card */}
                <div className="glass-card rounded-2xl p-6 mb-6">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${matchState.battingTeam === 'team1' ? 'bg-indigo-600' : 'bg-emerald-600'}`}>
                            <UsersIcon className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-lg font-bold">{battingTeam.name}</span>
                    </div>

                    <div className="text-center">
                        <div className="text-6xl md:text-7xl font-black mb-2">
                            {matchState.score}/{matchState.wickets}
                        </div>
                        <div className="text-2xl text-gray-400">
                            ({displayOvers} overs)
                        </div>
                    </div>

                    {/* Target Info */}
                    {target && (
                        <div className="mt-4 pt-4 border-t border-white/10 text-center">
                            <p className="text-lg">
                                <span className="text-gray-400">Need </span>
                                <span className="font-bold text-yellow-400">{runsNeeded}</span>
                                <span className="text-gray-400"> runs from </span>
                                <span className="font-bold text-yellow-400">{ballsRemaining}</span>
                                <span className="text-gray-400"> balls</span>
                            </p>
                        </div>
                    )}

                    {/* First Innings Info */}
                    {matchState.firstInningsResult && (
                        <div className="mt-4 pt-4 border-t border-white/10 text-center text-gray-400">
                            <p>1st Innings: {bowlingTeam.name} - {matchState.firstInningsResult.score}/{matchState.firstInningsResult.wickets}</p>
                        </div>
                    )}
                </div>

                {/* Current Players */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    {/* Batsmen */}
                    <div className="glass-card rounded-xl p-4">
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Batting</p>
                        {striker && strikerStats && (
                            <div className="mb-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm">🏏</span>
                                    <span className="font-bold">{striker.name}*</span>
                                </div>
                                <p className="text-sm text-gray-400">
                                    {strikerStats.runs} ({strikerStats.balls})
                                </p>
                            </div>
                        )}
                        {nonStriker && nonStrikerStats && (
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm opacity-50">🏏</span>
                                    <span className="text-gray-300">{nonStriker.name}</span>
                                </div>
                                <p className="text-sm text-gray-500">
                                    {nonStrikerStats.runs} ({nonStrikerStats.balls})
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Bowler */}
                    <div className="glass-card rounded-xl p-4">
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Bowling</p>
                        {bowler && bowlerStats && (
                            <div>
                                <div className="flex items-center gap-2">
                                    <BallIcon className="w-4 h-4" />
                                    <span className="font-bold">{bowler.name}</span>
                                </div>
                                <p className="text-sm text-gray-400">
                                    {bowlerStats.wickets}/{bowlerStats.runsConceded} ({Math.floor(bowlerStats.ballsDelivered / 6)}.{bowlerStats.ballsDelivered % 6})
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Current Over */}
                {matchState.currentOverHistory.length > 0 && (
                    <div className="glass-card rounded-xl p-4">
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">This Over</p>
                        <div className="flex gap-2 flex-wrap">
                            {matchState.currentOverHistory.map((event, idx) => (
                                <span
                                    key={idx}
                                    className={`px-3 py-1 rounded-full text-sm font-bold ${event.isWicket ? 'bg-red-600' :
                                        event.isExtra ? 'bg-yellow-600' :
                                            event.runs === 4 ? 'bg-blue-600' :
                                                event.runs === 6 ? 'bg-purple-600' :
                                                    'bg-slate-700'
                                        }`}
                                >
                                    {event.isWicket ? 'W' : event.isExtra ? 'E' : event.runs}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Match Over Message */}
                {matchState.isMatchOver && (
                    <div className="mt-6 glass-card rounded-2xl p-6 text-center bg-gradient-to-r from-indigo-600/20 to-purple-600/20 border border-indigo-500/30">
                        <h2 className="text-2xl font-black">{matchState.matchOverMessage}</h2>
                    </div>
                )}

                {/* Footer */}
                <div className="mt-8 text-center text-gray-600 text-sm">
                    <p>Share Code: <span className="font-mono font-bold text-gray-400">{shareCode}</span></p>
                    <p className="mt-1">This page updates automatically</p>
                </div>
            </div>
        </div>
    );
};

export default LiveScoreView;
