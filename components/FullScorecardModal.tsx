import React from 'react';
import type { MatchState, BatsmanStats, BowlerStats } from '../types';
import InningsScorecard from './InningsScorecard';
import { CloseIcon } from './icons';

interface FullScorecardModalProps {
  isOpen: boolean;
  onClose: () => void;
  matchState: MatchState;
}

const FullScorecardModal: React.FC<FullScorecardModalProps> = ({ isOpen, onClose, matchState }) => {
  if (!isOpen) return null;

  const {
    team1,
    team2,
    battingTeam,
    currentInnings,
    firstInningsResult,
  } = matchState;
  
  const firstInningsTeamKey = firstInningsResult ? (battingTeam === 'team1' ? 'team2' : 'team1') : battingTeam;
  const firstInningsTeam = matchState[firstInningsTeamKey];

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-[70] p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="scorecard-title"
    >
      <div
        className="bg-[#161B22] text-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-700 animate-slide-up-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-[#161B22]/80 backdrop-blur-sm z-10 p-4 border-b border-gray-700 flex justify-between items-center">
          <h2 id="scorecard-title" className="text-2xl font-bold">Full Scorecard</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-700" aria-label="Close scorecard">
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-8">
          {firstInningsResult ? (
            <InningsScorecard
              title={`${firstInningsTeam.name} Innings`}
              players={firstInningsTeam.players}
              // FIX: Use batsmanStats from the main matchState object, as firstInningsResult only contains score and wickets.
              batsmanStats={matchState.batsmanStats}
              // FIX: Use bowlerStats from the main matchState object.
              bowlerStats={matchState.bowlerStats}
              teamScore={firstInningsResult.score}
              teamWickets={firstInningsResult.wickets}
            />
          ) : (
             <InningsScorecard
              title={`${firstInningsTeam.name} Innings`}
              players={firstInningsTeam.players}
              batsmanStats={matchState.batsmanStats}
              bowlerStats={matchState.bowlerStats}
              teamScore={matchState.score}
              teamWickets={matchState.wickets}
            />
          )}

          {currentInnings === 2 && (
            <InningsScorecard
              title={`${matchState[battingTeam].name} Innings`}
              players={matchState[battingTeam].players}
              batsmanStats={matchState.batsmanStats}
              bowlerStats={matchState.bowlerStats}
              teamScore={matchState.score}
              teamWickets={matchState.wickets}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default FullScorecardModal;