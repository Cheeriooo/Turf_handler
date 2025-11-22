import React, { useMemo } from 'react';
import type { MatchState, Player } from '../types';

interface QuickStatsPanelProps {
  matchState: MatchState;
  getPlayerById: (id: string | null) => Player | undefined;
}

const QuickStatsPanel: React.FC<QuickStatsPanelProps> = ({ matchState, getPlayerById }) => {
  const stats = useMemo(() => {
    const striker = getPlayerById(matchState.strikerId);
    const nonStriker = getPlayerById(matchState.nonStrikerId);

    const strikerStats = striker ? matchState.batsmanStats[striker.id] : undefined;
    const nonStrikerStats = nonStriker ? matchState.batsmanStats[nonStriker.id] : undefined;

    // Find milestones
    const strikerMilestone = strikerStats?.runs === 50 ? '50!' : strikerStats?.runs === 100 ? '100!' : null;
    const nonStrikerMilestone = nonStrikerStats?.runs === 50 ? '50!' : nonStrikerStats?.runs === 100 ? '100!' : null;

    // Partnership calculation
    const partnershipRuns = (strikerStats?.runs || 0) + (nonStrikerStats?.runs || 0);

    // Boundaries in current partnership
    const boundariesInPartnership = (strikerStats?.bonus4 || 0) + (strikerStats?.bonus6 || 0) + (nonStrikerStats?.bonus4 || 0) + (nonStrikerStats?.bonus6 || 0);

    // Current over runs
    const currentOverRuns = matchState.currentOverHistory.reduce((sum, event) => sum + event.runs, 0);

    return {
      strikerMilestone,
      nonStrikerMilestone,
      partnershipRuns,
      boundariesInPartnership,
      currentOverRuns,
    };
  }, [matchState, getPlayerById]);

  return (
    <div className="space-y-3">
      {/* Milestones */}
      <div className="space-y-2">
        {stats.strikerMilestone && (
          <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-lg p-3 text-center font-bold text-lg animate-pulse">
            🎉 {getPlayerById(matchState.strikerId)?.name} {stats.strikerMilestone}
          </div>
        )}
        {stats.nonStrikerMilestone && (
          <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-lg p-3 text-center font-bold text-lg animate-pulse">
            🎉 {getPlayerById(matchState.nonStrikerId)?.name} {stats.nonStrikerMilestone}
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-2">
        {/* Partnership */}
        <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/40 rounded-lg p-3">
          <p className="text-xs text-gray-400 uppercase tracking-wider">Partnership</p>
          <p className="text-2xl font-bold text-green-400">{stats.partnershipRuns}</p>
          <p className="text-xs text-green-300 mt-1">{stats.boundariesInPartnership} boundaries</p>
        </div>

        {/* Current Over */}
        <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/40 rounded-lg p-3">
          <p className="text-xs text-gray-400 uppercase tracking-wider">Current Over</p>
          <p className="text-2xl font-bold text-blue-400">{stats.currentOverRuns}</p>
          <p className="text-xs text-blue-300 mt-1">{matchState.currentOverHistory.length} balls bowled</p>
        </div>

        {/* Match Status */}
        <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/40 rounded-lg p-3">
          <p className="text-xs text-gray-400 uppercase tracking-wider">Wickets</p>
          <p className="text-2xl font-bold text-purple-400">{matchState.wickets}</p>
          <p className="text-xs text-purple-300 mt-1">{11 - matchState.wickets} remaining</p>
        </div>

        {/* Overs Summary */}
        <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/40 rounded-lg p-3">
          <p className="text-xs text-gray-400 uppercase tracking-wider">Overs</p>
          <p className="text-2xl font-bold text-orange-400">
            {matchState.currentOver}.{matchState.currentBall}
          </p>
          <p className="text-xs text-orange-300 mt-1">of {matchState.totalOvers}</p>
        </div>
      </div>

      {/* 2nd Innings Info */}
      {matchState.currentInnings === 2 && matchState.firstInningsResult && (
        <div className="bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/40 rounded-lg p-3">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">2nd Innings Target</p>
          <div className="grid grid-cols-3 gap-2 text-center text-sm">
            <div>
              <p className="text-gray-400">Target</p>
              <p className="font-bold text-indigo-300">{matchState.firstInningsResult.score + 1}</p>
            </div>
            <div>
              <p className="text-gray-400">Current</p>
              <p className="font-bold text-indigo-300">{matchState.score}</p>
            </div>
            <div>
              <p className="text-gray-400">Need</p>
              <p className="font-bold text-indigo-300">{Math.max(0, matchState.firstInningsResult.score + 1 - matchState.score)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuickStatsPanel;
