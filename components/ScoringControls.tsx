import React from 'react';

type ScoringEvent = 
  | { type: 'RUNS', runs: number }
  | { type: 'EXTRA', extraType: 'Wide' | 'No Ball' }
  | { type: 'OUT' };

interface ScoringControlsProps {
  onScore: (event: ScoringEvent) => void;
  isMatchOver: boolean;
}

const ScoringControls: React.FC<ScoringControlsProps> = ({ onScore, isMatchOver }) => {
  const runButtons = [0, 1, 2, 3, 4, 6];

  const handleScore = (runs: number) => onScore({ type: 'RUNS', runs });
  const handleExtra = (type: 'Wide' | 'No Ball') => onScore({ type: 'EXTRA', extraType: type });
  const handleOut = () => onScore({ type: 'OUT' });

  return (
    <div>
      <div className="grid grid-cols-6 gap-2 mb-3">
        {runButtons.map(runs => (
          <button
            key={runs}
            onClick={() => handleScore(runs)}
            disabled={isMatchOver}
            className="py-3 text-lg font-bold text-white bg-blue-600 dark:bg-[#3B82F6] rounded-lg hover:bg-blue-700 dark:hover:bg-blue-500 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
          >
            {runs}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2">
        <button onClick={() => handleExtra('Wide')} disabled={isMatchOver} className="py-2 font-semibold text-black bg-yellow-400 dark:bg-[#F59E0B] rounded-lg hover:bg-yellow-500 dark:hover:bg-yellow-400 transition disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed">Wide</button>
        <button onClick={() => handleExtra('No Ball')} disabled={isMatchOver} className="py-2 font-semibold text-black bg-yellow-400 dark:bg-[#F59E0B] rounded-lg hover:bg-yellow-500 dark:hover:bg-yellow-400 transition disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed">No Ball</button>
        <button onClick={handleOut} disabled={isMatchOver} className="py-2 font-semibold text-white bg-red-600 dark:bg-[#EF4444] rounded-lg hover:bg-red-700 dark:hover:bg-red-600 transition disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed">OUT</button>
      </div>
    </div>
  );
};

export default ScoringControls;