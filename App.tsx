
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import type { MatchState, MatchSetupData, Player, BatsmanStats, BowlerStats, OverBall } from './types';
import MatchSetup from './components/MatchSetup';
import { BatIcon, BallIcon, UndoIcon } from './components/icons';

type ScoringEvent = 
  | { type: 'RUNS', runs: number }
  | { type: 'EXTRA', extraType: 'Wd' | 'Nb' }
  | { type: 'WICKET' }
  | { type: 'WARNING', warningType: 'FirstBounce' }
  | { type: 'UNDO' }
  | { type: 'RESET' };

const App: React.FC = () => {
  const [matchState, setMatchState] = useState<MatchState | null>(() => {
    try {
      const savedState = localStorage.getItem('cricketMatchState');
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
      localStorage.setItem('cricketMatchState', JSON.stringify(matchState));
    } else {
      localStorage.removeItem('cricketMatchState');
    }
  }, [matchState]);

  const getPlayerById = useCallback((id: string | null): Player | undefined => {
      if (!id || !matchState) return undefined;
      return [...matchState.team1.players, ...matchState.team2.players].find(p => p.id === id);
  }, [matchState]);


  const handleMatchStart = (data: MatchSetupData) => {
    const team1Players = data.team1Players.map((name, i) => ({ id: `t1p${i}`, name }));
    const team2Players = data.team2Players.map((name, i) => ({ id: `t2p${i}`, name }));
    
    const initialBatsmenStats: Record<string, BatsmanStats> = 
      [...team1Players, ...team2Players].reduce((acc, player) => {
        acc[player.id] = { runs: 0, balls: 0, fours: 0, sixes: 0, isOut: false, strikeRate: 0 };
        return acc;
      }, {} as Record<string, BatsmanStats>);

    const initialBowlersStats: Record<string, BowlerStats> = 
      [...team1Players, ...team2Players].reduce((acc, player) => {
        acc[player.id] = { overs: 0, ballsDelivered: 0, runsConceded: 0, wickets: 0, maidens: 0, economy: 0, warnings: { firstBounce: false } };
        return acc;
      }, {} as Record<string, BowlerStats>);

    setMatchState({
      team1: { name: data.team1Name, players: team1Players },
      team2: { name: data.team2Name, players: team2Players },
      overs: data.overs,
      isMatchStarted: true,
      battingTeam: 'team1',
      bowlingTeam: 'team2',
      strikerId: team1Players[0]?.id || null,
      nonStrikerId: team1Players[1]?.id || null,
      bowlerId: team2Players[0]?.id || null,
      batsmenStats: initialBatsmenStats,
      bowlersStats: initialBowlersStats,
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
      firstInnings: null,
    });
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
        firstInnings: {
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
    if (!matchState || matchState.isMatchOver) return;

    const saveStateForUndo = (state: MatchState) => ({...state, lastEvent: JSON.parse(JSON.stringify(state)) });

    setMatchState(prevState => {
      if (!prevState) return null;
      let newState = saveStateForUndo(prevState);
      newState.bowlerId = newBowlerId;
      return newState;
    });
  };

  const handleScore = (event: ScoringEvent) => {
    if (event.type === 'RESET') {
        setMatchState(null);
        return;
    }
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

      if (!strikerId || !nonStrikerId || !bowlerId) return prevState;

      let ball: OverBall = { runs: 0, isExtra: false, isWicket: false, display: '' };
      let legalDelivery = true;
      let runsInThisBall = 0;
      let rotateStrike = false;

      switch(event.type) {
        case 'RUNS':
          runsInThisBall = event.runs;
          ball.runs = runsInThisBall;
          ball.display = event.runs.toString();
          if (event.runs === 1 || event.runs === 3) rotateStrike = true;
          if (event.runs === 4) newState.batsmenStats[strikerId].fours++;
          if (event.runs === 6) newState.batsmenStats[strikerId].sixes++;
          break;
        case 'EXTRA':
          legalDelivery = false;
          ball.isExtra = true;
          runsInThisBall = 1; // 1 run for wide/no-ball
          ball.display = event.extraType;
          break;
        case 'WICKET':
          ball.isWicket = true;
          ball.display = 'W';
          newState.wickets++;
          newState.batsmenStats[strikerId].isOut = true;
          newState.bowlersStats[bowlerId].wickets++;
          
          if(newState.wickets < maxWickets){
            const battingPlayers = newState[battingTeam].players;
            if(nextBatsmanIndex < battingPlayers.length){
              newState.strikerId = battingPlayers[nextBatsmanIndex].id;
              newState.nextBatsmanIndex++;
            }
          }
          break;
        case 'WARNING':
           newState.bowlersStats[bowlerId].warnings.firstBounce = true;
           return newState; // No state change that affects score
      }

      newState.score += runsInThisBall;
      newState.batsmenStats[strikerId].runs += runsInThisBall;
      newState.bowlersStats[bowlerId].runsConceded += runsInThisBall;

      if(legalDelivery){
        newState.currentBall++;
        newState.batsmenStats[strikerId].balls++;
        newState.bowlersStats[bowlerId].ballsDelivered++;
      }
      
      newState.currentOverHistory.push(ball);

      if(newState.currentBall === 6){
        if (rotateStrike) rotateStrike = false; else rotateStrike = true;
        
        const isMaiden = newState.currentOverHistory.every(b => b.runs === 0 && !b.isExtra);
        if (isMaiden) newState.bowlersStats[bowlerId].maidens++;

        newState.allOversHistory.push(newState.currentOverHistory);
        newState.currentOver++;
        newState.currentBall = 0;
        newState.currentOverHistory = [];

        const bowlingTeamPlayers = newState[newState.bowlingTeam].players;
        const currentBowlerIndex = bowlingTeamPlayers.findIndex(p => p.id === bowlerId);
        const nextBowlerIndex = (currentBowlerIndex + 1) % bowlingTeamPlayers.length;
        newState.bowlerId = bowlingTeamPlayers[nextBowlerIndex].id;
      }
      
      if(rotateStrike){
        [newState.strikerId, newState.nonStrikerId] = [newState.nonStrikerId, newState.strikerId];
      }
      
      Object.values(newState.batsmenStats).forEach(s => {
        if(s.balls > 0) s.strikeRate = parseFloat(((s.runs / s.balls) * 100).toFixed(2));
      });
      Object.values(newState.bowlersStats).forEach(s => {
        const oversFloat = Math.floor(s.ballsDelivered / 6) + (s.ballsDelivered % 6) / 10.0;
        s.overs = oversFloat;
        if(s.ballsDelivered > 0) s.economy = parseFloat((s.runsConceded / (s.ballsDelivered / 6)).toFixed(2));
      });

      let matchIsOver = false;
      let matchOverMsg = '';

      if (newState.currentInnings === 1) {
        if (newState.wickets >= maxWickets || newState.currentOver === newState.overs) {
          matchIsOver = true;
          const target = newState.score + 1;
          const opponentTeamName = newState.bowlingTeam === 'team1' ? newState.team1.name : newState.team2.name;
          matchOverMsg = `Innings 1 Over. ${opponentTeamName} needs ${target} to win.`;
        }
      } else { // Innings 2
        if (newState.firstInnings && newState.score > newState.firstInnings.score) {
          matchIsOver = true;
          const battingTeamName = newState.battingTeam === 'team1' ? newState.team1.name : newState.team2.name;
          const wicketsRemaining = maxWickets - newState.wickets;
          matchOverMsg = `${battingTeamName} won by ${wicketsRemaining} wickets!`;
        } else if (newState.wickets >= maxWickets || newState.currentOver === newState.overs) {
          matchIsOver = true;
          if (newState.firstInnings && newState.score === newState.firstInnings.score) {
            matchOverMsg = 'Match Tied!';
          } else {
            const bowlingTeamName = newState.bowlingTeam === 'team1' ? newState.team1.name : newState.team2.name;
            const runsDiff = newState.firstInnings!.score - newState.score;
            matchOverMsg = `${bowlingTeamName} won by ${runsDiff} runs!`;
          }
        }
      }
      
      if (matchIsOver) {
        newState.isMatchOver = true;
        newState.matchOverMessage = matchOverMsg;
      }

      return newState;
    });
  };

  const currentStriker = useMemo(() => matchState?.strikerId ? getPlayerById(matchState.strikerId) : undefined, [matchState, getPlayerById]);
  const currentNonStriker = useMemo(() => matchState?.nonStrikerId ? getPlayerById(matchState.nonStrikerId) : undefined, [matchState, getPlayerById]);
  
  if (!matchState) {
    return <MatchSetup onMatchStart={handleMatchStart} />;
  }
  
  const strikerStats = matchState.strikerId ? matchState.batsmenStats[matchState.strikerId] : null;
  const nonStrikerStats = matchState.nonStrikerId ? matchState.batsmenStats[matchState.nonStrikerId] : null;
  const bowlerStats = matchState.bowlerId ? matchState.bowlersStats[matchState.bowlerId] : null;
  const bowlingTeamPlayers = matchState[matchState.bowlingTeam].players;

  const handleModalAction = () => {
    if (matchState.currentInnings === 1) {
      startSecondInnings();
    } else {
      handleScore({ type: 'RESET' });
    }
  };
  const modalButtonText = matchState.currentInnings === 1 ? 'Start 2nd Innings' : 'New Match';

  return (
    <div className="min-h-screen bg-gray-200 dark:bg-gray-900 text-gray-800 dark:text-gray-100 font-sans p-2 sm:p-4">
      <div className="max-w-7xl mx-auto space-y-4">
        <header className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl sm:text-3xl font-bold text-cricket-green">{matchState.team1.name} vs {matchState.team2.name}</h1>
                <div className="flex items-center gap-2">
                    <button onClick={() => handleScore({type: 'UNDO'})} className="p-2 bg-amber-500 hover:bg-amber-600 text-white rounded-full disabled:opacity-50" disabled={!matchState.lastEvent} aria-label="Undo last event"><UndoIcon className="w-5 h-5"/></button>
                    <button onClick={() => handleScore({type: 'RESET'})} className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm">Reset</button>
                </div>
            </div>
            <div className="mt-4 text-center">
                <p className="text-lg"><span className="font-semibold">{matchState.battingTeam === 'team1' ? matchState.team1.name : matchState.team2.name}</span> are batting</p>
                {matchState.currentInnings === 2 && matchState.firstInnings && (
                  <p className="text-md text-gray-500">Target: <span className="font-bold text-cricket-green">{matchState.firstInnings.score + 1}</span></p>
                )}
                <p className="text-5xl font-extrabold my-2 tracking-tighter">
                    {matchState.score} - {matchState.wickets}
                </p>
                <p className="text-2xl font-semibold">
                    Overs: {matchState.currentOver}.{matchState.currentBall} <span className="text-gray-500">({matchState.overs})</span>
                </p>
            </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md flex items-center justify-between">
                <div>
                    <p className="text-sm text-gray-500">Striker</p>
                    <p className="text-xl font-bold">{currentStriker?.name}</p>
                </div>
                <div className="text-right">
                    <p className="text-2xl font-bold">{strikerStats?.runs}</p>
                    <p className="text-sm text-gray-500">{strikerStats?.balls} balls</p>
                </div>
                <BatIcon className="w-8 h-8 text-cricket-green opacity-50"/>
            </div>
             <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md flex items-center justify-between">
                <div>
                    <p className="text-sm text-gray-500">Non-Striker</p>
                    <p className="text-xl font-bold">{currentNonStriker?.name}</p>
                </div>
                <div className="text-right">
                    <p className="text-2xl font-bold">{nonStrikerStats?.runs}</p>
                    <p className="text-sm text-gray-500">{nonStrikerStats?.balls} balls</p>
                </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md flex items-center justify-between">
                <div>
                    <p className="text-sm text-gray-500">Bowler</p>
                    <select
                        value={matchState.bowlerId || ''}
                        onChange={(e) => handleBowlerChange(e.target.value)}
                        className="text-xl font-bold bg-white dark:bg-gray-800 border-none focus:ring-cricket-green rounded-md p-1 -ml-1"
                        aria-label="Select Bowler"
                    >
                        {bowlingTeamPlayers.map(player => (
                            <option key={player.id} value={player.id}>
                                {player.name}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="text-right">
                    <p className="text-2xl font-bold">{bowlerStats?.wickets}/{bowlerStats?.runsConceded}</p>
                    <p className="text-sm text-gray-500">{bowlerStats?.overs.toFixed(1)} overs</p>
                </div>
                <BallIcon className="w-8 h-8 text-ball-red opacity-50"/>
            </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
            <h3 className="font-semibold mb-2">This Over:</h3>
            <div className="flex items-center gap-2 flex-wrap">
                {matchState.currentOverHistory.map((ball, index) => (
                    <div key={index} className={`w-10 h-10 flex items-center justify-center rounded-full font-bold text-sm
                        ${ball.isWicket ? 'bg-red-500 text-white' : ''}
                        ${ball.isExtra ? 'bg-blue-500 text-white' : ''}
                        ${!ball.isWicket && !ball.isExtra ? 'bg-gray-300 dark:bg-gray-700' : ''}
                        ${ball.runs === 4 ? 'border-4 border-green-500' : ''}
                        ${ball.runs === 6 ? 'border-4 border-purple-500' : ''}
                    `}>
                        {ball.display}
                    </div>
                ))}
            </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                {[0, 1, 2, 3, 4, 6].map(runs => (
                    <button key={runs} onClick={() => handleScore({type: 'RUNS', runs})} className={`p-4 rounded-lg font-bold text-lg transition-transform transform hover:scale-105 ${runs === 4 ? 'bg-green-500 text-white col-span-2' : ''} ${runs === 6 ? 'bg-purple-500 text-white col-span-2' : ''} ${runs < 4 ? 'bg-gray-200 dark:bg-gray-700' : ''}`}>
                        {runs} {runs === 4 || runs === 6 ? '!' : ''}
                    </button>
                ))}
                <button onClick={() => handleScore({type: 'EXTRA', extraType: 'Wd'})} className="p-4 rounded-lg font-bold text-lg bg-blue-500 text-white">Wd</button>
                <button onClick={() => handleScore({type: 'EXTRA', extraType: 'Nb'})} className="p-4 rounded-lg font-bold text-lg bg-blue-500 text-white">Nb</button>
                <button onClick={() => handleScore({type: 'WICKET'})} className="p-4 rounded-lg font-bold text-lg bg-red-500 text-white col-span-2">Wicket</button>
                <button onClick={() => handleScore({type: 'WARNING', warningType: 'FirstBounce'})} className="p-4 rounded-lg font-bold text-lg bg-yellow-500 text-white col-span-2">Bounce</button>
            </div>
        </div>
        
        {matchState.isMatchOver && (
            <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" role="dialog" aria-modal="true">
                <div className="bg-white dark:bg-gray-800 p-8 rounded-lg text-center shadow-2xl max-w-sm mx-auto">
                    <h2 className="text-3xl font-bold mb-4">{matchState.currentInnings === 1 && matchState.firstInnings === null ? 'Innings Over' : 'Match Over'}</h2>
                    <p className="text-lg mb-6">{matchState.matchOverMessage}</p>
                    <button onClick={handleModalAction} className="px-6 py-3 bg-cricket-green text-white font-bold rounded-lg hover:bg-green-700 transition-colors">
                        {modalButtonText}
                    </button>
                </div>
            </div>
        )}

      </div>
    </div>
  );
};

export default App;
