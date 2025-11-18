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
  const crr = totalBallsBowled > 0 ? (score / totalBallsBowled * 6).toFixed(2) : '0.0';

  let rrr = '-';
  let target = 0;
  let runsNeeded = 0;
  let ballsRemaining = 0;

  if (currentInnings === 2 && firstInningsResult) {
    target = firstInningsResult.score + 1;
    runsNeeded = target - score;
    ballsRemaining = totalOvers * 6 - totalBallsBowled;
    if (runsNeeded > 0 && ballsRemaining > 0) {
      rrr = (runsNeeded / ballsRemaining * 6).toFixed(2);
    }
  }

  return (
    <div className="glass-card rounded-3xl p-6 relative overflow-hidden">
      {/* Ambient Glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
      
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-2">
           <span className="text-sm font-bold tracking-widest text-indigo-400 uppercase">{battingTeamName}</span>
           <span className="px-2 py-1 rounded bg-white/5 border border-white/10 text-xs font-mono text-gray-400">
             {currentInnings === 1 ? '1st Innings' : '2nd Innings'}
           </span>
        </div>

        <div key={animationKey} className="flex items-baseline gap-1 animate-score-flash">
            <h1 className="text-7xl font-black text-white tracking-tighter leading-none">
                {score}<span className="text-5xl text-gray-500 font-bold">/{wickets}</span>
            </h1>
        </div>
        
        <div className="mt-2 flex items-center gap-2 text-gray-400 font-mono text-sm">
           <span className="px-2 py-1 bg-slate-800/50 rounded">Ov {currentOver}.{currentBall}</span>
           <span className="text-gray-600">/</span>
           <span>{totalOvers}</span>
        </div>

        <div className="grid grid-cols-3 gap-2 mt-6 pt-6 border-t border-white/10">
            <div className="text-center">
                <div className="text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-1">Run Rate</div>
                <div className="text-lg font-mono font-bold text-white">{crr}</div>
            </div>
            
            {currentInnings === 2 ? (
                <>
                 <div className="text-center border-l border-white/5">
                    <div className="text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-1">Target</div>
                    <div className="text-lg font-mono font-bold text-emerald-400">{target}</div>
                 </div>
                 <div className="text-center border-l border-white/5">
                    <div className="text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-1">Need</div>
                    <div className="text-lg font-mono font-bold text-white">{runsNeeded} <span className="text-[10px] text-gray-500">off {ballsRemaining}</span></div>
                 </div>
                </>
            ) : (
                <>
                 <div className="text-center border-l border-white/5">
                    <div className="text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-1">Proj. Score</div>
                    <div className="text-lg font-mono font-bold text-gray-400">{Math.round(parseFloat(crr) * totalOvers) || 0}</div>
                 </div>
                 <div className="text-center border-l border-white/5 opacity-50">
                    <div className="text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-1">Target</div>
                    <div className="text-lg font-mono font-bold text-gray-400">-</div>
                 </div>
                </>
            )}
        </div>
      </div>
    </div>
  );
};

export default Scoreboard;