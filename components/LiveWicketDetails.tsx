import React from 'react';
import type { MatchState, BatsmanStats, BowlerStats, Player } from '../types';

interface LiveWicketDetailsProps {
  matchState: MatchState;
  getPlayerById: (id: string | null) => Player | undefined;
}

const LiveWicketDetails: React.FC<LiveWicketDetailsProps> = ({ matchState, getPlayerById }) => {
  const striker = getPlayerById(matchState.strikerId);
  const nonStriker = getPlayerById(matchState.nonStrikerId);
  const bowler = getPlayerById(matchState.bowlerId);

  const strikerStats = striker ? matchState.batsmanStats[striker.id] : undefined;
  const nonStrikerStats = nonStriker ? matchState.batsmanStats[nonStriker.id] : undefined;
  const bowlerStats = bowler ? matchState.bowlerStats[bowler.id] : undefined;

  const getStrikeRate = (stats?: BatsmanStats) => {
    if (!stats || stats.balls === 0) return '0.00';
    return ((stats.runs / stats.balls) * 100).toFixed(2);
  };

  const getEconomy = (stats?: BowlerStats) => {
    if (!stats || stats.ballsDelivered === 0) return '0.00';
    return ((stats.runsConceded / stats.ballsDelivered) * 6).toFixed(2);
  };

  const getPartnershipRuns = () => {
    if (!striker || !nonStriker) return 0;
    // Calculate runs scored by this partnership
    // This is a simplified version - in production you'd track this more carefully
    return (strikerStats?.runs || 0) + (nonStrikerStats?.runs || 0) - (matchState.firstInningsResult?.score || 0);
  };

  return (
    <div className="bg-gradient-to-br from-[#161B22] to-[#0D1117] border border-gray-700 rounded-xl p-4 text-white space-y-4">
      <h3 className="text-lg font-bold text-center text-[#3B82F6]">Live Details</h3>

      {/* Batting Partnership */}
      <div className="space-y-3">
        {/* Striker */}
        <div className="bg-black/30 rounded-lg p-3 border-l-4 border-yellow-400">
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider">Striker</p>
              <p className="text-lg font-bold text-yellow-300">{striker?.name || 'N/A'}</p>
            </div>
            {strikerStats && (
              <div className="text-right">
                <p className="text-2xl font-bold">{strikerStats.runs}</p>
                <p className="text-xs text-gray-400">({strikerStats.balls}b)</p>
              </div>
            )}
          </div>
          {strikerStats && (
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="bg-white/10 p-1 rounded">
                <p className="text-gray-400">4s</p>
                <p className="font-bold">{strikerStats.bonus4}</p>
              </div>
              <div className="bg-white/10 p-1 rounded">
                <p className="text-gray-400">6s</p>
                <p className="font-bold">{strikerStats.bonus6}</p>
              </div>
              <div className="bg-white/10 p-1 rounded">
                <p className="text-gray-400">SR</p>
                <p className="font-bold">{getStrikeRate(strikerStats)}</p>
              </div>
            </div>
          )}
        </div>

        {/* Non-Striker */}
        <div className="bg-black/20 rounded-lg p-3 border-l-4 border-gray-500">
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider">Non-Striker</p>
              <p className="text-lg font-bold text-gray-300">{nonStriker?.name || 'N/A'}</p>
            </div>
            {nonStrikerStats && (
              <div className="text-right">
                <p className="text-2xl font-bold">{nonStrikerStats.runs}</p>
                <p className="text-xs text-gray-400">({nonStrikerStats.balls}b)</p>
              </div>
            )}
          </div>
          {nonStrikerStats && (
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="bg-white/10 p-1 rounded">
                <p className="text-gray-400">4s</p>
                <p className="font-bold">{nonStrikerStats.bonus4}</p>
              </div>
              <div className="bg-white/10 p-1 rounded">
                <p className="text-gray-400">6s</p>
                <p className="font-bold">{nonStrikerStats.bonus6}</p>
              </div>
              <div className="bg-white/10 p-1 rounded">
                <p className="text-gray-400">SR</p>
                <p className="font-bold">{getStrikeRate(nonStrikerStats)}</p>
              </div>
            </div>
          )}
        </div>

        {/* Partnership Info */}
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 text-center">
          <p className="text-xs text-gray-400 uppercase tracking-wider">Partnership</p>
          <p className="text-2xl font-bold text-green-400">{getPartnershipRuns()} runs</p>
        </div>
      </div>

      {/* Bowling Stats */}
      <div className="bg-black/30 rounded-lg p-3 border-l-4 border-red-400">
        <div className="flex justify-between items-start mb-2">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider">Bowler</p>
            <p className="text-lg font-bold text-red-300">{bowler?.name || 'N/A'}</p>
          </div>
          {bowlerStats && (
            <div className="text-right">
              <p className="text-xs text-gray-400">This Over</p>
              <p className="text-lg font-bold">{bowlerStats.runsConceded - (matchState.allOversHistory[matchState.currentOver - 1]?.reduce((sum, e) => sum + e.runs, 0) || 0)}</p>
            </div>
          )}
        </div>
        {bowlerStats && (
          <div className="grid grid-cols-4 gap-2 text-xs">
            <div className="bg-white/10 p-1 rounded">
              <p className="text-gray-400">Wkts</p>
              <p className="font-bold">{bowlerStats.wickets}</p>
            </div>
            <div className="bg-white/10 p-1 rounded">
              <p className="text-gray-400">Runs</p>
              <p className="font-bold">{bowlerStats.runsConceded}</p>
            </div>
            <div className="bg-white/10 p-1 rounded">
              <p className="text-gray-400">Econ</p>
              <p className="font-bold">{getEconomy(bowlerStats)}</p>
            </div>
            <div className="bg-white/10 p-1 rounded">
              <p className="text-gray-400">Ovrs</p>
              <p className="font-bold">{bowlerStats.overs}.{bowlerStats.ballsDelivered % 6}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveWicketDetails;
