import React from 'react';

interface EnhancedScoreboardProps {
  score: number;
  wickets: number;
  currentOver: number;
  currentBall: number;
  totalOvers: number;
  battingTeamName: string;
  firstInningsResult: { score: number; wickets: number } | null;
  currentInnings: 1 | 2;
  animationKey: number;
  team1Color?: string;
  team2Color?: string;
  team1Name?: string;
  team2Name?: string;
  team1Score?: number;
  team1Wickets?: number;
  team2Score?: number;
  team2Wickets?: number;
}

const EnhancedScoreboard: React.FC<EnhancedScoreboardProps> = ({
  score,
  wickets,
  currentOver,
  currentBall,
  totalOvers,
  battingTeamName,
  firstInningsResult,
  currentInnings,
  animationKey,
  team1Color = '#3B82F6',
  team2Color = '#EF4444',
  team1Name = 'Team 1',
  team2Name = 'Team 2',
  team1Score = 0,
  team1Wickets = 0,
  team2Score = 0,
  team2Wickets = 0,
}) => {
  const totalBallsBowled = currentOver * 6 + currentBall;
  const crr = totalBallsBowled > 0 ? (score / totalBallsBowled * 6).toFixed(2) : '0.00';

  let rrr = 'N/A';
  let target = 0;
  if (currentInnings === 2 && firstInningsResult) {
    target = firstInningsResult.score + 1;
    const runsNeeded = target - score;
    const ballsRemaining = totalOvers * 6 - totalBallsBowled;
    if (runsNeeded > 0 && ballsRemaining > 0) {
      rrr = (runsNeeded / ballsRemaining * 6).toFixed(2);
    } else if (runsNeeded <= 0) {
      rrr = '0.00';
    }
  }

  const renderStat = (label: string, value: string | number) => (
    <div className="bg-black/20 p-2 rounded-lg text-center">
      <p className="text-xs text-[#9CA3AF] uppercase tracking-wider">{label}</p>
      <p className="text-xl font-bold font-mono">{value}</p>
    </div>
  );

  // 2nd Innings: Show both team scores
  if (currentInnings === 2 && firstInningsResult) {
    return (
      <div className="space-y-3">
        {/* Main Batting Team Score */}
        <div
          className="border-l-4 border-t border-r border-b border-gray-700 text-white rounded-xl p-4 shadow-lg"
          style={{ borderLeftColor: team1Color }}
        >
          <div className="flex justify-between items-start mb-3">
            <div>
              <p className="text-sm font-semibold text-[#9CA3AF]">{battingTeamName}</p>
              <h2
                key={animationKey}
                className="text-5xl font-bold tracking-tight animate-score-flash"
              >
                {score}
                <span className="text-4xl text-gray-400">/{wickets}</span>
              </h2>
              <p className="text-lg font-mono text-gray-400 mt-1">
                Overs: {currentOver}.{currentBall} ({totalOvers})
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-center">
              {renderStat('CRR', crr)}
              {renderStat('Target', target)}
              {renderStat('RRR', rrr)}
              {renderStat('Need', Math.max(0, target - score))}
            </div>
          </div>

          {/* Target Progress */}
          <div className="mt-3 pt-3 border-t border-gray-700">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>Progress to Target</span>
              <span>{score} / {target}</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-green-500 to-emerald-400 h-full transition-all duration-300"
                style={{ width: `${Math.min(100, (score / target) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Innings Comparison */}
        <div className="grid grid-cols-2 gap-2">
          <div
            className="border-l-4 rounded-lg p-3 text-white bg-black/30"
            style={{ borderLeftColor: team1Color }}
          >
            <p className="text-xs text-gray-400 uppercase tracking-wider">1st Innings ({team1Name})</p>
            <p className="text-2xl font-bold">
              {firstInningsResult.score}
              <span className="text-lg text-gray-400">/{firstInningsResult.wickets}</span>
            </p>
          </div>
          <div
            className="border-l-4 rounded-lg p-3 text-white bg-black/30"
            style={{ borderLeftColor: team2Color }}
          >
            <p className="text-xs text-gray-400 uppercase tracking-wider">2nd Innings ({team2Name})</p>
            <p className="text-2xl font-bold">
              {score}
              <span className="text-lg text-gray-400">/{wickets}</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 1st Innings: Single score display
  return (
    <div
      className="border-l-4 border-t border-r border-b border-gray-700 text-white rounded-xl p-4 shadow-lg flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0"
      style={{ borderLeftColor: team1Color }}
    >
      <div className="text-center sm:text-left">
        <p className="text-lg font-semibold text-[#9CA3AF]">{battingTeamName}</p>
        <h2 key={animationKey} className="text-5xl font-bold tracking-tight animate-score-flash">
          {score}<span className="text-4xl text-gray-400">/{wickets}</span>
        </h2>
        <p className="text-lg font-mono text-gray-400 mt-1">
          Overs: {currentOver}.{currentBall} ({totalOvers})
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center w-full sm:w-auto">
        {renderStat('CRR', crr)}
        <div className="col-span-2"></div>
      </div>
    </div>
  );
};

export default EnhancedScoreboard;
