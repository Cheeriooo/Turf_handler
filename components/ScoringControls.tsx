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
    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
      <h3 className="text-xl font-bold mb-4 text-center">Scoring</h3>
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-4">
        {runButtons.map(runs => (
          <button
            key={runs}
            onClick={() => handleScore(runs)}
            disabled={isMatchOver}
            className="py-4 text-xl font-bold text-white bg-resolver-blue rounded-lg hover:bg-blue-700 transition-colors duration-300 focus:outline-none focus:ring-4 focus:ring-blue-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {runs}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2">
        <button onClick={() => handleExtra('Wide')} disabled={isMatchOver} className="py-3 font-semibold text-gray-800 bg-yellow-400 rounded-lg hover:bg-yellow-500 transition disabled:bg-gray-400 disabled:cursor-not-allowed">Wide</button>
        <button onClick={() => handleExtra('No Ball')} disabled={isMatchOver} className="py-3 font-semibold text-gray-800 bg-yellow-400 rounded-lg hover:bg-yellow-500 transition disabled:bg-gray-400 disabled:cursor-not-allowed">No Ball</button>
        <button onClick={handleOut} disabled={isMatchOver} className="py-3 font-semibold text-white bg-action-red rounded-lg hover:bg-red-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed">OUT</button>
      </div>
    </div>
  );
};

export default ScoringControls;
