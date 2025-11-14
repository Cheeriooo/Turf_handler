import React from 'react';

interface ScoreboardProps {
  score: number;
  wickets: number;
  currentOver: number;
  currentBall: number;
  totalOvers: number;
  battingTeamName: string;
  firstInningsResult: { score: number; wickets: number } | null;
  currentInnings: 1 | 2;
  animationKey: number;
}

const Scoreboard: React.FC<ScoreboardProps> = ({
  score,
  wickets,
  currentOver,
  currentBall,
  totalOvers,
  battingTeamName,
  firstInningsResult,
  currentInnings,
  animationKey,
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
    <div className="bg-black/10 dark:bg-black/20 p-2 rounded-lg text-center">
      <p className="text-xs text-gray-500 dark:text-[#9CA3AF] uppercase tracking-wider">{label}</p>
      <p className="text-xl font-bold font-mono">{value}</p>
    </div>
  );

  return (
    <div className="bg-white dark:bg-gradient-to-b dark:from-[#161B22] dark:to-[#0D1117] border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white rounded-xl p-4 shadow-lg flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
      <div className="text-center sm:text-left">
        <p className="text-lg font-semibold text-gray-500 dark:text-[#9CA3AF]">{battingTeamName}</p>
        <h2 key={animationKey} className="text-5xl font-bold tracking-tight animate-score-flash">
          {score}<span className="text-4xl text-gray-400 dark:text-gray-400">/{wickets}</span>
        </h2>
        <p className="text-lg font-mono text-gray-500 dark:text-gray-400 mt-1">
          Overs: {currentOver}.{currentBall} ({totalOvers})
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center w-full sm:w-auto">
        {renderStat('CRR', crr)}
        {currentInnings === 2 ? (
          <>
            {renderStat('Target', target)}
            {renderStat('RRR', rrr)}
          </>
        ) : (
          <div className="col-span-2"></div>
        )}
      </div>
    </div>
  );
};

export default Scoreboard;