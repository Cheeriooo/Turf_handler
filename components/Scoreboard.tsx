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

  return (
    <div className="bg-gray-800 dark:bg-black text-white rounded-lg p-4 shadow-lg flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
      <div className="text-center sm:text-left">
        <p className="text-lg font-semibold text-gray-400">{battingTeamName}</p>
        <h2 className="text-4xl sm:text-5xl font-bold tracking-tight">
          {score} / {wickets}
        </h2>
        <p className="text-lg font-mono">
          Overs: {currentOver}.{currentBall} / {totalOvers}
        </p>
      </div>

      <div className="flex gap-4 sm:gap-8 text-center">
        <div>
          <p className="text-sm text-gray-400">CRR</p>
          <p className="text-2xl font-bold">{crr}</p>
        </div>
        {currentInnings === 2 && (
          <>
            <div>
              <p className="text-sm text-gray-400">Target</p>
              <p className="text-2xl font-bold">{target}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">RRR</p>
              <p className="text-2xl font-bold">{rrr}</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Scoreboard;
