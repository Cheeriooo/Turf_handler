import React from 'react';
import type { OverEvent } from '../types';

interface BallTrackerProps {
  currentOverHistory: OverEvent[];
  currentOver: number;
  totalOvers: number;
}

const BallTracker: React.FC<BallTrackerProps> = ({ currentOverHistory, currentOver, totalOvers }) => {
  const getLastFiveBalls = () => {
    // Show last 5 balls or fewer if in the middle of an over
    return currentOverHistory.slice(-5);
  };

  const getBallDisplay = (event: OverEvent) => {
    if (event.isWicket) {
      return 'W';
    }
    if (event.isExtra) {
      return event.display.startsWith('Wide') ? 'Wd' : 'Nb';
    }
    return event.runs.toString();
  };

  const getBallColor = (event: OverEvent) => {
    if (event.isWicket) {
      return 'bg-red-500 text-white';
    }
    if (event.isExtra) {
      return 'bg-yellow-500 text-black';
    }
    if (event.runs === 0) {
      return 'bg-gray-600 text-white';
    }
    if (event.runs >= 4) {
      return 'bg-green-500 text-white';
    }
    return 'bg-blue-500 text-white';
  };

  const lastFive = getLastFiveBalls();
  const progressPercentage = ((currentOver * 6 + currentOverHistory.length) / (totalOvers * 6)) * 100;

  return (
    <div className="space-y-4">
      {/* Current Over Balls */}
      <div className="bg-gradient-to-r from-[#161B22] to-[#0D1117] border border-gray-700 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-[#9CA3AF] uppercase tracking-wider">Current Over</h3>
          <span className="text-lg font-bold text-[#3B82F6]">{currentOver}.{currentOverHistory.length}</span>
        </div>

        {/* Ball Dots */}
        <div className="flex gap-2 mb-3 flex-wrap">
          {currentOverHistory.map((ball, idx) => (
            <div
              key={idx}
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${getBallColor(
                ball
              )} transition-transform hover:scale-110 cursor-pointer`}
              title={ball.display}
            >
              {getBallDisplay(ball)}
            </div>
          ))}
          {currentOverHistory.length < 6 && (
            <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm bg-gray-700 text-gray-500 opacity-50">
              -
            </div>
          )}
        </div>

        {/* Over Summary */}
        <div className="bg-black/30 rounded-lg p-2 text-xs">
          <p className="text-gray-400">
            {currentOverHistory.reduce((sum, b) => sum + b.runs, 0)} runs, {currentOverHistory.filter(b => b.isWicket).length} wicket(s)
          </p>
        </div>
      </div>

      {/* Match Progress Bar */}
      <div className="bg-gradient-to-r from-[#161B22] to-[#0D1117] border border-gray-700 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-bold text-[#9CA3AF] uppercase tracking-wider">Match Progress</h3>
          <span className="text-xs font-mono text-gray-400">
            {currentOver}.{currentOverHistory.length} / {totalOvers}.0
          </span>
        </div>
        
        <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
          <div
            className="bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] h-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        <div className="mt-2 text-xs text-gray-400">
          <p>{Math.round(progressPercentage)}% Complete</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-[#161B22] border border-gray-700 rounded-lg p-2">
          <p className="text-xs text-gray-400">Overs Left</p>
          <p className="text-lg font-bold text-blue-400">{Math.max(0, totalOvers - currentOver - 1)}</p>
        </div>
        <div className="bg-[#161B22] border border-gray-700 rounded-lg p-2">
          <p className="text-xs text-gray-400">Balls Left</p>
          <p className="text-lg font-bold text-blue-400">{Math.max(0, totalOvers * 6 - currentOver * 6 - currentOverHistory.length)}</p>
        </div>
        <div className="bg-[#161B22] border border-gray-700 rounded-lg p-2">
          <p className="text-xs text-gray-400">Pace</p>
          <p className="text-lg font-bold text-blue-400">{(currentOverHistory.length === 0 ? 0 : currentOverHistory.reduce((sum, b) => sum + b.runs, 0) / currentOverHistory.length).toFixed(1)}</p>
        </div>
      </div>
    </div>
  );
};

export default BallTracker;
