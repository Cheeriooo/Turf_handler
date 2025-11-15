import React, { useState, useEffect } from 'react';
import { BatIcon, BallIcon, CoinIcon, HeadsIcon, TailsIcon } from './icons';

interface TossProps {
  team1Name: string;
  team2Name: string;
  onTossComplete: (winner: 'team1' | 'team2', decision: 'bat' | 'bowl') => void;
  onBack: () => void;
}

const Coin = ({ result, isFlipping }: { result: 'heads' | 'tails' | null, isFlipping: boolean }) => {
  const coinClasses = `coin ${isFlipping ? 'flipping' : ''} ${result || ''}`;
  return (
    <div className="coin-container">
      <div className={coinClasses}>
        <div className="coin-face coin-front">
          <HeadsIcon className="w-16 h-16 text-amber-900" />
        </div>
        <div className="coin-face coin-back">
          <TailsIcon className="w-16 h-16 text-amber-900" />
        </div>
      </div>
    </div>
  );
};


const Toss: React.FC<TossProps> = ({ team1Name, team2Name, onTossComplete, onBack }) => {
  type TossStage = 'selection' | 'flipping' | 'result' | 'decision';
  const [tossStage, setTossStage] = useState<TossStage>('selection');
  const [team1Call, setTeam1Call] = useState<'heads' | 'tails' | null>(null);
  const [flipResult, setFlipResult] = useState<'heads' | 'tails' | null>(null);
  const [tossWinner, setTossWinner] = useState<'team1' | 'team2' | null>(null);
  const [winnerChoice, setWinnerChoice] = useState<'bat' | 'bowl' | null>(null);
  const [showWinner, setShowWinner] = useState(false);

  const handleCall = (call: 'heads' | 'tails') => {
    setTeam1Call(call);
  };

  const handleFlip = () => {
    if (!team1Call) return;
    setTossStage('flipping');
    setShowWinner(false);

    setTimeout(() => {
      const result = Math.random() < 0.5 ? 'heads' : 'tails';
      setFlipResult(result);
      setTossWinner(result === team1Call ? 'team1' : 'team2');
      setTossStage('result');
    }, 2500); // Animation duration
  };
  
  useEffect(() => {
    if (tossStage === 'result') {
      const winnerTimer = setTimeout(() => setShowWinner(true), 750);
      const decisionTimer = setTimeout(() => setTossStage('decision'), 3000);
      return () => {
        clearTimeout(winnerTimer);
        clearTimeout(decisionTimer);
      };
    }
  }, [tossStage]);

  const handleStartMatch = () => {
    if (tossWinner && winnerChoice) {
      onTossComplete(tossWinner, winnerChoice);
    }
  };
  
  const getWinnerText = () => {
      if (!tossWinner) return '';
      return tossWinner === 'team1' ? team1Name : team2Name;
  }

  const selectionButtonClasses = "w-full p-4 text-lg font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-4 transform";
  const selectedClasses = "bg-[#3B82F6] text-white ring-[#3B82F6]/50 scale-105";
  const unselectedClasses = "bg-[#0D1117] text-white hover:bg-gray-800 ring-transparent hover:scale-105";

  return (
    <div className="min-h-screen bg-[#0D1117] text-white p-4 font-sans flex items-center justify-center">
      <div className="max-w-md w-full mx-auto animate-slide-up-fade-in space-y-6 text-center">
        <div>
          <h1 className="text-3xl font-bold">Coin Toss</h1>
          <p className="text-[#9CA3AF] mt-2">The virtual coin awaits your call.</p>
        </div>

        {/* Coin Area */}
        <div className="bg-[#161B22] p-6 rounded-xl shadow-lg h-56 flex flex-col items-center justify-center relative overflow-hidden">
            {tossStage === 'selection' && (
                <div className="w-full animate-result-fade-in">
                    <p className="font-semibold text-lg mb-3">{team1Name}, make your call:</p>
                    <div className="grid grid-cols-2 gap-4">
                        <button onClick={() => handleCall('heads')} className={`${selectionButtonClasses} ${team1Call === 'heads' ? selectedClasses : unselectedClasses}`}>Heads</button>
                        <button onClick={() => handleCall('tails')} className={`${selectionButtonClasses} ${team1Call === 'tails' ? selectedClasses : unselectedClasses}`}>Tails</button>
                    </div>
                </div>
            )}

            {(tossStage === 'flipping' || tossStage === 'result' || tossStage === 'decision') && (
                <Coin isFlipping={tossStage === 'flipping'} result={flipResult} />
            )}

            {tossStage === 'result' && (
                <div className="absolute bottom-4 text-center w-full">
                    <p className="text-2xl font-bold text-yellow-400 animate-result-fade-in capitalize">It's {flipResult}!</p>
                    {showWinner && <p className="text-lg text-gray-300 animate-result-fade-in mt-1">{getWinnerText()} won the toss!</p>}
                </div>
            )}
            {tossStage === 'flipping' && <p className="text-lg text-gray-400 mt-4">Flipping...</p>}
        </div>

        {/* Action Area */}
        {tossStage === 'selection' && (
            <button onClick={handleFlip} disabled={!team1Call} className="w-full py-4 text-xl font-bold text-white bg-gradient-to-r from-[#16A34A] to-[#15803D] rounded-xl hover:scale-[1.03] transition-transform duration-200 focus:outline-none focus:ring-4 focus:ring-green-500/50 flex items-center justify-center gap-3 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed disabled:scale-100">
                <CoinIcon className="w-6 h-6" /> Flip Coin
            </button>
        )}
        
        {tossStage === 'decision' && (
          <div className="animate-result-fade-in">
            <div className="bg-[#161B22] p-5 rounded-xl space-y-4 shadow-lg">
                <h2 className="text-xl font-bold text-[#9CA3AF]">{getWinnerText()}'s Choice</h2>
                <div className="grid grid-cols-2 gap-4">
                    <button 
                        onClick={() => setWinnerChoice('bat')}
                        className={`${selectionButtonClasses} ${winnerChoice === 'bat' ? selectedClasses : unselectedClasses} flex items-center justify-center gap-2`}
                    >
                        <BatIcon className="w-5 h-5" /> Bat
                    </button>
                    <button 
                        onClick={() => setWinnerChoice('bowl')}
                        className={`${selectionButtonClasses} ${winnerChoice === 'bowl' ? selectedClasses : unselectedClasses} flex items-center justify-center gap-2`}
                    >
                        <BallIcon className="w-5 h-5" /> Bowl
                    </button>
                </div>
            </div>
          </div>
        )}
        
        <div className="flex gap-4 pt-4">
          <button
              onClick={onBack}
              className="w-1/3 py-4 text-lg font-bold text-white bg-gray-600 rounded-xl hover:bg-gray-700 transition-colors duration-200 focus:outline-none focus:ring-4 focus:ring-gray-500/50"
          >
            Back
          </button>
          <button
            onClick={handleStartMatch}
            disabled={!tossWinner || !winnerChoice}
            className="w-2/3 py-4 text-xl font-bold text-white bg-gradient-to-r from-[#F59E0B] to-[#F97316] rounded-xl hover:scale-[1.02] transition-transform duration-200 focus:outline-none focus:ring-4 focus:ring-yellow-500/50 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed disabled:scale-100"
          >
            Start Match
          </button>
        </div>
      </div>
    </div>
  );
};

export default Toss;
