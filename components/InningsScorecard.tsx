import React from 'react';
import type { Player, BatsmanStats, BowlerStats } from '../types';

const InningsScorecard: React.FC<{
  title: string;
  players: Player[];
  batsmanStats: Record<string, BatsmanStats>;
  bowlerStats: Record<string, BowlerStats>;
  teamScore: number;
  teamWickets: number;
}> = ({ title, players, batsmanStats, bowlerStats, teamScore, teamWickets }) => {
  const bowlers = Object.keys(bowlerStats)
    .map(playerId => players.find(p => p.id === playerId))
    .filter((player): player is Player => !!player && bowlerStats[player.id]?.ballsDelivered > 0);

  const batsmen = players.filter(p => batsmanStats[p.id]?.balls > 0 || batsmanStats[p.id]?.isOut);
  const didNotBat = players.filter(p => !batsmanStats[p.id] || (batsmanStats[p.id].balls === 0 && !batsmanStats[p.id].isOut));

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
              {batsmen.map(player => {
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
        {didNotBat.length > 0 && (
          <div className="mt-2 px-4 text-xs text-gray-400">
            <span className="font-semibold">Did not bat:</span> {didNotBat.map(p => p.name).join(', ')}
          </div>
        )}
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

export default InningsScorecard;
