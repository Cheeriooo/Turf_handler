import React, { useState, useMemo, useCallback, useEffect } from 'react';
import type { MatchState, MatchSetupData, Player, BatsmanStats, BowlerStats, OverEvent } from './types';
import MatchSetup from './components/MatchSetup';
import Scoreboard from './components/Scoreboard';
import PlayerCard from './components/PlayerCard';
import ScoringControls from './components/ScoringControls';
import { UndoIcon } from './components/icons';

type ScoringEvent = 
  | { type: 'RUNS', runs: number }
  | { type: 'EXTRA', extraType: 'Wide' | 'No Ball' }
  | { type: 'OUT' }
  | { type: 'UNDO' };

const App: React.FC = () => {
  const [matchState, setMatchState] = useState<MatchState | null>(() => {
    try {
      const savedState = localStorage.getItem('cricketResolverState');
      if (savedState) {
        const parsedState = JSON.parse(savedState) as MatchState;
        parsedState.lastEvent = null; // Don't persist undo state across reloads
        return parsedState;
      }
    } catch (error) {
      console.error("Could not load match state from local storage", error);
    }
    return null;
  });

  useEffect(() => {
    if (matchState) {
      localStorage.setItem('cricketResolverState', JSON.stringify(matchState));
    } else {
      localStorage.removeItem('cricketResolverState');
    }
  }, [matchState]);

  const getPlayerById = useCallback((id: string | null): Player | undefined => {
      if (!id || !matchState) return undefined;
      return [...matchState.team1.players, ...matchState.team2.players].find(p => p.id === id);
  }, [matchState]);


  const handleMatchStart = (data: MatchSetupData) => {
    const team1Players = data.team1Players.map((name, i) => ({ id: `t1p${i}`, name }));
    const team2Players = data.team2Players.map((name, i) => ({ id: `t2p${i}`, name }));
    
    const initialBatsmanStats: Record<string, BatsmanStats> = 
      [...team1Players, ...team2Players].reduce((acc, player) => {
        acc[player.id] = { runs: 0, balls: 0, bonus4: 0, bonus6: 0, isOut: false, strikeRate: 0 };
        return acc;
      }, {} as Record<string, BatsmanStats>);

    const initialBowlerStats: Record<string, BowlerStats> = 
      [...team1Players, ...team2Players].reduce((acc, player) => {
        acc[player.id] = { overs: 0, ballsDelivered: 0, runsConceded: 0, wickets: 0, maidenOvers: 0, economy: 0 };
        return acc;
      }, {} as Record<string, BowlerStats>);

    setMatchState({
      team1: { name: data.team1Name, players: team1Players },
      team2: { name: data.team2Name, players: team2Players },
      totalOvers: data.totalOvers,
      isMatchStarted: true,
      battingTeam: 'team1',
      bowlingTeam: 'team2',
      strikerId: team1Players[0]?.id || null,
      nonStrikerId: team1Players[1]?.id || null,
      bowlerId: team2Players[0]?.id || null,
      batsmanStats: initialBatsmanStats,
      bowlerStats: initialBowlerStats,
      score: 0,
      wickets: 0,
      currentOver: 0,
      currentBall: 0,
      currentOverHistory: [],
      allOversHistory: [],
      lastEvent: null,
      isMatchOver: false,
      matchOverMessage: '',
      nextBatsmanIndex: 2,
      currentInnings: 1,
      firstInningsResult: null,
    });
  };

  const handleResetMatch = () => {
    if (window.confirm('Are you sure you want to reset the entire match?')) {
      setMatchState(null);
    }
  };
  
  const startSecondInnings = () => {
    if (!matchState) return;

    setMatchState(prevState => {
      if (!prevState) return null;
      
      const newBattingTeamKey = prevState.bowlingTeam;
      const newBowlingTeamKey = prevState.battingTeam;
      const newBattingTeamPlayers = prevState[newBattingTeamKey].players;
      const newBowlingTeamPlayers = prevState[newBowlingTeamKey].players;

      return {
        ...prevState,
        firstInningsResult: {
          score: prevState.score,
          wickets: prevState.wickets,
        },
        battingTeam: newBattingTeamKey,
        bowlingTeam: newBowlingTeamKey,
        strikerId: newBattingTeamPlayers.length > 0 ? newBattingTeamPlayers[0].id : null,
        nonStrikerId: newBattingTeamPlayers.length > 1 ? newBattingTeamPlayers[1].id : null,
        bowlerId: newBowlingTeamPlayers.length > 0 ? newBowlingTeamPlayers[0].id : null,
        score: 0,
        wickets: 0,
        currentOver: 0,
        currentBall: 0,
        currentOverHistory: [],
        allOversHistory: [],
        isMatchOver: false,
        matchOverMessage: '',
        nextBatsmanIndex: 2,
        currentInnings: 2,
        lastEvent: null, // Clear undo state
      };
    });
  };

  const handleBowlerChange = (newBowlerId: string) => {
    if (!matchState || matchState.isMatchOver || matchState.bowlerId === newBowlerId) return;

    const saveStateForUndo = (state: MatchState) => ({...state, lastEvent: JSON.parse(JSON.stringify(state)) });

    setMatchState(prevState => {
      if (!prevState) return null;
      let newState = saveStateForUndo(prevState);
      newState.bowlerId = newBowlerId;
      return newState;
    });
  };

  const handleStrikerChange = (newStrikerId: string) => {
    if (!matchState || !newStrikerId) return;
    const saveStateForUndo = (state: MatchState) => ({...state, lastEvent: JSON.parse(JSON.stringify(state)) });
    setMatchState(prevState => {
        if (!prevState || prevState.isMatchOver || prevState.strikerId === newStrikerId) return prevState;

        let newState = saveStateForUndo(prevState);
        if (newStrikerId === newState.nonStrikerId) {
            // Swap if selecting the non-striker
            newState.nonStrikerId = newState.strikerId;
        }
        newState.strikerId = newStrikerId;
        return newState;
    });
  };

  const handleNonStrikerChange = (newNonStrikerId: string) => {
      if (!matchState || !newNonStrikerId) return;
      const saveStateForUndo = (state: MatchState) => ({...state, lastEvent: JSON.parse(JSON.stringify(state)) });
      setMatchState(prevState => {
          if (!prevState || prevState.isMatchOver || prevState.nonStrikerId === newNonStrikerId) return prevState;
          
          let newState = saveStateForUndo(prevState);
          if (newNonStrikerId === newState.strikerId) {
              // Swap if selecting the striker
              newState.strikerId = newState.nonStrikerId;
          }
          newState.nonStrikerId = newNonStrikerId;
          return newState;
      });
  };

  const handleScore = (event: ScoringEvent) => {
    if (!matchState || (matchState.isMatchOver && event.type !== 'UNDO')) return;

    const saveStateForUndo = (state: MatchState) => ({...state, lastEvent: JSON.parse(JSON.stringify(state)) });

    setMatchState(prevState => {
      if (!prevState) return null;

      if(event.type === 'UNDO') {
        return prevState.lastEvent;
      }

      let newState = saveStateForUndo(prevState);
      const { strikerId, nonStrikerId, bowlerId, battingTeam, nextBatsmanIndex } = newState;
      const maxWickets = newState[battingTeam].players.length - 1;

      if (!strikerId || !bowlerId) return prevState;
      
      let eventRecord: OverEvent = { runs: 0, isExtra: false, isWicket: false, display: '' };
      let legalBall = true;
      let runsInThisBall = 0;
      let rotateStrike = false;

      switch(event.type) {
        case 'RUNS': {
          runsInThisBall = event.runs;
          eventRecord.runs = event.runs;
          eventRecord.display = event.runs.toString();
          newState.score += event.runs;

          newState.batsmanStats[strikerId].runs += event.runs;
          if (event.runs === 4) newState.batsmanStats[strikerId].bonus4 += 1;
          if (event.runs === 6) newState.batsmanStats[strikerId].bonus6 += 1;
          
          rotateStrike = event.runs % 2 !== 0;
          break;
        }

        case 'EXTRA': {
          legalBall = false;
          eventRecord.isExtra = true;
          runsInThisBall = 1; // Assuming 1 run for wide/no ball
          newState.score += 1;
          eventRecord.runs = 1;

          if (event.extraType === 'Wide') {
            eventRecord.display = 'Wd';
          } else { // No Ball
            eventRecord.display = 'Nb';
          }
          break;
        }
        
        case 'OUT': {
          eventRecord.isWicket = true;
          eventRecord.display = 'W';
          newState.wickets += 1;
          
          newState.batsmanStats[strikerId].isOut = true;
          newState.bowlerStats[bowlerId].wickets += 1;
          
          if (newState.wickets < maxWickets) {
            const battingTeamPlayers = newState[newState.battingTeam].players;
            if (nextBatsmanIndex < battingTeamPlayers.length) {
              const newBatsmanId = battingTeamPlayers[nextBatsmanIndex].id;
              newState.strikerId = newBatsmanId;
              newState.nextBatsmanIndex += 1;
            } else {
              newState.strikerId = null;
            }
          }
          break;
        }
      }

      // Update stats
      if (!newState.batsmanStats[strikerId].isOut) {
        newState.batsmanStats[strikerId].balls += 1;
        const { runs, balls } = newState.batsmanStats[strikerId];
        newState.batsmanStats[strikerId].strikeRate = balls > 0 ? parseFloat(((runs / balls) * 100).toFixed(2)) : 0;
      }
      
      newState.bowlerStats[bowlerId].runsConceded += runsInThisBall;
      
      newState.currentOverHistory.push(eventRecord);
      
      if (legalBall) {
        newState.currentBall += 1;
        newState.bowlerStats[bowlerId].ballsDelivered += 1;
      }
      
      const bowlerBalls = newState.bowlerStats[bowlerId].ballsDelivered;
      newState.bowlerStats[bowlerId].economy = bowlerBalls > 0 ? parseFloat(((newState.bowlerStats[bowlerId].runsConceded / bowlerBalls) * 6).toFixed(2)) : 0;

      const isOverEnd = newState.currentBall === 6;

      if (isOverEnd) {
        rotateStrike = !rotateStrike;
        
        newState.allOversHistory.push([...newState.currentOverHistory]);

        const isMaiden = newState.currentOverHistory.every(e => e.runs === 0 && !e.isExtra) && newState.currentOverHistory.length > 0;
        if (isMaiden) {
          newState.bowlerStats[bowlerId].maidenOvers += 1;
        }

        newState.currentOver += 1;
        newState.currentBall = 0;
        newState.currentOverHistory = [];
      }
      
      if (rotateStrike && newState.nonStrikerId) {
        [newState.strikerId, newState.nonStrikerId] = [newState.nonStrikerId, newState.strikerId];
      }

      const inningsOverByOvers = newState.currentOver >= newState.totalOvers;
      const inningsOverByWickets = newState.wickets >= maxWickets;
      let targetChased = false;

      if (newState.currentInnings === 2 && newState.firstInningsResult) {
        targetChased = newState.score > newState.firstInningsResult.score;
      }

      if (inningsOverByOvers || inningsOverByWickets || targetChased) {
        if (newState.currentInnings === 1) {
          // End of first innings, handled by isFirstInningsOver memo
        } else {
          newState.isMatchOver = true;
          const score1 = newState.firstInningsResult!.score;
          const score2 = newState.score;
          if (score2 > score1) {
            const wicketsRemaining = maxWickets - newState.wickets;
            newState.matchOverMessage = `${newState[battingTeam].name} won by ${wicketsRemaining} wicket${wicketsRemaining !== 1 ? 's' : ''}!`;
          } else if (score1 > score2) {
            const runsMargin = score1 - score2;
            newState.matchOverMessage = `${newState[newState.bowlingTeam].name} won by ${runsMargin} run${runsMargin !== 1 ? 's' : ''}!`;
          } else {
            newState.matchOverMessage = "It's a tie!";
          }
        }
      }

      return newState;
    });
  };
  
  const isFirstInningsOver = useMemo(() => {
    if (!matchState) return false;
    const { currentInnings, currentOver, totalOvers, wickets, battingTeam } = matchState;
    if (currentInnings !== 1) return false;
    
    const maxWickets = matchState[battingTeam].players.length - 1;
    return currentOver >= totalOvers || wickets >= maxWickets;
  }, [matchState]);

  if (!matchState) {
    return <MatchSetup onMatchStart={handleMatchStart} />;
  }
  
  const { 
    battingTeam, bowlingTeam, strikerId, nonStrikerId, bowlerId,
    score, wickets, currentOver, currentBall, totalOvers, currentOverHistory,
    batsmanStats, bowlerStats, lastEvent, isMatchOver, matchOverMessage,
    currentInnings, firstInningsResult
  } = matchState;

  const striker = getPlayerById(strikerId);
  const nonStriker = getPlayerById(nonStrikerId);
  const bowler = getPlayerById(bowlerId);

  const bowlingTeamPlayers = matchState[bowlingTeam].players;
  const availableBatsmen = matchState[battingTeam].players.filter(p => !batsmanStats[p.id].isOut);


  const canUndo = !!lastEvent;

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 p-2 sm:p-4 font-sans">
      <div className="max-w-7xl mx-auto bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-4 space-y-4">
        <Scoreboard 
          score={score}
          wickets={wickets}
          currentOver={currentOver}
          currentBall={currentBall}
          totalOvers={totalOvers}
          battingTeamName={matchState[battingTeam].name}
          firstInningsResult={firstInningsResult}
          currentInnings={currentInnings}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <PlayerCard
                title="Batsmen"
                players={availableBatsmen}
                stats={batsmanStats}
                isBattingCard
                strikerId={strikerId}
                nonStrikerId={nonStrikerId}
                onStrikerChange={handleStrikerChange}
                onNonStrikerChange={handleNonStrikerChange}
                isMatchOver={isMatchOver}
              />
              <PlayerCard 
                title="Bowler"
                players={bowlingTeamPlayers}
                stats={bowlerStats}
                activePlayerId={bowlerId}
                onPlayerSelect={handleBowlerChange}
                isOverStarting={currentBall === 0 && currentOver < totalOvers}
              />
            </div>
            
            {!isMatchOver && !isFirstInningsOver && (
              <ScoringControls onScore={handleScore} isMatchOver={isMatchOver} />
            )}

            {isFirstInningsOver && !isMatchOver && (
              <div className="flex justify-center items-center p-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <button 
                  onClick={startSecondInnings}
                  className="px-8 py-4 text-xl font-bold text-white bg-resolver-blue rounded-lg hover:bg-blue-700 transition-colors duration-300"
                >
                  Start 2nd Innings
                </button>
              </div>
            )}
            
            {isMatchOver && (
              <div className="text-center p-8 bg-green-100 dark:bg-green-900 rounded-lg">
                <h2 className="text-3xl font-bold text-green-700 dark:text-green-300">Match Over</h2>
                <p className="text-xl mt-2">{matchOverMessage}</p>
              </div>
            )}

          </div>

          <div className="space-y-4">
             <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                <h3 className="text-lg font-semibold mb-2 border-b pb-2 dark:border-gray-700">This Over</h3>
                <div className="flex flex-wrap gap-2">
                  {currentOverHistory.map((event, i) => (
                    <span key={i} className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                      event.isWicket ? 'bg-red-500 text-white' : 
                      event.runs === 4 || event.runs === 6 ? 'bg-blue-500 text-white' :
                      event.isExtra ? 'bg-yellow-400 text-gray-800' : 'bg-gray-200 dark:bg-gray-700'
                    }`}>
                      {event.display}
                    </span>
                  ))}
                </div>
             </div>
             <div className="flex gap-2 mt-4">
                <button 
                    onClick={() => handleScore({ type: 'UNDO' })} 
                    disabled={!canUndo || isMatchOver}
                    className="flex-1 flex items-center justify-center gap-2 p-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                    <UndoIcon className="w-5 h-5" /> Undo
                </button>
                <button
                    onClick={handleResetMatch}
                    className="flex-1 p-2 bg-action-red text-white rounded-lg hover:bg-red-700 transition"
                >
                    Reset Match
                </button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;