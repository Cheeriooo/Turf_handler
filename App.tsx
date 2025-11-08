
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import type { FightState, FightSetupData, Player, DefenderStats, AttackerStats, RoundEvent } from './types';
import FightSetup from './components/MatchSetup';
import { ShieldIcon, FistIcon, UndoIcon } from './components/icons';

type ScoringEvent = 
  | { type: 'POINTS', points: number }
  | { type: 'EXTRA', extraType: 'Penalty' | 'Foul' }
  | { type: 'OUT' }
  | { type: 'WARNING', warningType: 'FirstBounce' }
  | { type: 'UNDO' }
  | { type: 'RESET' };

const App: React.FC = () => {
  const [fightState, setFightState] = useState<FightState | null>(() => {
    try {
      const savedState = localStorage.getItem('fightResolverState');
      if (savedState) {
        const parsedState = JSON.parse(savedState) as FightState;
        parsedState.lastEvent = null; // Don't persist undo state across reloads
        return parsedState;
      }
    } catch (error) {
      console.error("Could not load fight state from local storage", error);
    }
    return null;
  });
  
  useEffect(() => {
    if (fightState) {
      localStorage.setItem('fightResolverState', JSON.stringify(fightState));
    } else {
      localStorage.removeItem('fightResolverState');
    }
  }, [fightState]);

  const getPlayerById = useCallback((id: string | null): Player | undefined => {
      if (!id || !fightState) return undefined;
      return [...fightState.team1.players, ...fightState.team2.players].find(p => p.id === id);
  }, [fightState]);


  const handleFightStart = (data: FightSetupData) => {
    const team1Players = data.team1Players.map((name, i) => ({ id: `t1p${i}`, name }));
    const team2Players = data.team2Players.map((name, i) => ({ id: `t2p${i}`, name }));
    
    const initialDefenderStats: Record<string, DefenderStats> = 
      [...team1Players, ...team2Players].reduce((acc, player) => {
        acc[player.id] = { runs: 0, balls: 0, bonus4: 0, bonus6: 0, isOut: false, strikeRate: 0 };
        return acc;
      }, {} as Record<string, DefenderStats>);

    const initialAttackerStats: Record<string, AttackerStats> = 
      [...team1Players, ...team2Players].reduce((acc, player) => {
        acc[player.id] = { rounds: 0, turnsDelivered: 0, runsConceded: 0, wickets: 0, perfectRounds: 0, economy: 0, warnings: { firstBounce: false } };
        return acc;
      }, {} as Record<string, AttackerStats>);

    setFightState({
      team1: { name: data.team1Name, players: team1Players },
      team2: { name: data.team2Name, players: team2Players },
      totalRounds: data.totalRounds,
      isFightStarted: true,
      battingTeam: 'team1',
      bowlingTeam: 'team2',
      defenderId: team1Players[0]?.id || null,
      supportId: team1Players[1]?.id || null,
      attackerId: team2Players[0]?.id || null,
      defenderStats: initialDefenderStats,
      attackerStats: initialAttackerStats,
      score: 0,
      playersOut: 0,
      currentRound: 0,
      currentTurn: 0,
      currentRoundHistory: [],
      allRoundsHistory: [],
      lastEvent: null,
      isFightOver: false,
      fightOverMessage: '',
      nextDefenderIndex: 2,
      currentRoundNumber: 1,
      firstRoundResult: null,
    });
  };
  
  const startSecondRound = () => {
    if (!fightState) return;

    setFightState(prevState => {
      if (!prevState) return null;
      
      const newBattingTeamKey = prevState.bowlingTeam;
      const newBowlingTeamKey = prevState.battingTeam;
      const newBattingTeamPlayers = prevState[newBattingTeamKey].players;
      const newBowlingTeamPlayers = prevState[newBowlingTeamKey].players;

      return {
        ...prevState,
        firstRoundResult: {
          score: prevState.score,
          playersOut: prevState.playersOut,
        },
        battingTeam: newBattingTeamKey,
        bowlingTeam: newBowlingTeamKey,
        defenderId: newBattingTeamPlayers.length > 0 ? newBattingTeamPlayers[0].id : null,
        supportId: newBattingTeamPlayers.length > 1 ? newBattingTeamPlayers[1].id : null,
        attackerId: newBowlingTeamPlayers.length > 0 ? newBowlingTeamPlayers[0].id : null,
        score: 0,
        playersOut: 0,
        currentRound: 0,
        currentTurn: 0,
        currentRoundHistory: [],
        allRoundsHistory: [],
        isFightOver: false,
        fightOverMessage: '',
        nextDefenderIndex: 2,
        currentRoundNumber: 2,
        lastEvent: null, // Clear undo state
      };
    });
  };

  const handleAttackerChange = (newAttackerId: string) => {
    if (!fightState || fightState.isFightOver) return;

    const saveStateForUndo = (state: FightState) => ({...state, lastEvent: JSON.parse(JSON.stringify(state)) });

    setFightState(prevState => {
      if (!prevState) return null;
      let newState = saveStateForUndo(prevState);
      newState.attackerId = newAttackerId;
      return newState;
    });
  };

  const handleScore = (event: ScoringEvent) => {
    if (event.type === 'RESET') {
        setFightState(null);
        return;
    }
    if (!fightState || (fightState.isFightOver && event.type !== 'UNDO')) return;

    const saveStateForUndo = (state: FightState) => ({...state, lastEvent: JSON.parse(JSON.stringify(state)) });

    setFightState(prevState => {
      if (!prevState) return null;

      if(event.type === 'UNDO') {
        return prevState.lastEvent;
      }

      let newState = saveStateForUndo(prevState);
      const { defenderId, supportId, attackerId, battingTeam, nextDefenderIndex } = newState;
      const maxPlayersOut = newState[battingTeam].players.length - 1;

      if (!defenderId || !supportId || !attackerId) return prevState;

      let eventRecord: RoundEvent = { runs: 0, isExtra: false, isWicket: false, display: '' };
      let legalTurn = true;
      let pointsInThisTurn = 0;
      let rotateDefender = false;

      switch(event.type) {
        case 'POINTS':
          pointsInThisTurn = event.points;
          eventRecord.runs = pointsInThisTurn;
          eventRecord.display = event.points.toString();
          if (event.points === 1 || event.points === 3) rotateDefender = true;
          if (event.points === 4) newState.defenderStats[defenderId].bonus4++;
          if (event.points === 6) newState.defenderStats[defenderId].bonus6++;
          break;
        case 'EXTRA':
          legalTurn = false;
          eventRecord.isExtra = true;
          pointsInThisTurn = 1;
          eventRecord.display = event.extraType.charAt(0);
          break;
        case 'OUT':
          eventRecord.isWicket = true;
          eventRecord.display = 'OUT';
          newState.playersOut++;
          newState.defenderStats[defenderId].isOut = true;
          newState.attackerStats[attackerId].wickets++;
          
          if(newState.playersOut < maxPlayersOut){
            const battingPlayers = newState[battingTeam].players;
            if(nextDefenderIndex < battingPlayers.length){
              newState.defenderId = battingPlayers[nextDefenderIndex].id;
              newState.nextDefenderIndex++;
            }
          }
          break;
        case 'WARNING':
           newState.attackerStats[attackerId].warnings.firstBounce = true;
           return newState;
      }

      newState.score += pointsInThisTurn;
      newState.defenderStats[defenderId].runs += pointsInThisTurn;
      newState.attackerStats[attackerId].runsConceded += pointsInThisTurn;

      if(legalTurn){
        newState.currentTurn++;
        newState.defenderStats[defenderId].balls++;
        newState.attackerStats[attackerId].turnsDelivered++;
      }
      
      newState.currentRoundHistory.push(eventRecord);

      if(newState.currentTurn === 6){
        if (rotateDefender) rotateDefender = false; else rotateDefender = true;
        
        const isPerfectRound = newState.currentRoundHistory.every(b => b.runs === 0 && !b.isExtra);
        if (isPerfectRound) newState.attackerStats[attackerId].perfectRounds++;

        newState.allRoundsHistory.push(newState.currentRoundHistory);
        newState.currentRound++;
        newState.currentTurn = 0;
        newState.currentRoundHistory = [];

        const bowlingTeamPlayers = newState[newState.bowlingTeam].players;
        const currentAttackerIndex = bowlingTeamPlayers.findIndex(p => p.id === attackerId);
        const nextAttackerIndex = (currentAttackerIndex + 1) % bowlingTeamPlayers.length;
        newState.attackerId = bowlingTeamPlayers[nextAttackerIndex].id;
      }
      
      if(rotateDefender){
        [newState.defenderId, newState.supportId] = [newState.supportId, newState.defenderId];
      }
      
      Object.values(newState.defenderStats).forEach(s => {
        if(s.balls > 0) s.strikeRate = parseFloat(((s.runs / s.balls) * 100).toFixed(2));
      });
      Object.values(newState.attackerStats).forEach(s => {
        const roundsFloat = Math.floor(s.turnsDelivered / 6) + (s.turnsDelivered % 6) / 10.0;
        s.rounds = roundsFloat;
        if(s.turnsDelivered > 0) s.economy = parseFloat((s.runsConceded / (s.turnsDelivered / 6)).toFixed(2));
      });

      let fightIsOver = false;
      let fightOverMsg = '';

      if (newState.currentRoundNumber === 1) {
        if (newState.playersOut >= maxPlayersOut || newState.currentRound === newState.totalRounds) {
          fightIsOver = true;
          const target = newState.score + 1;
          const opponentTeamName = newState.bowlingTeam === 'team1' ? newState.team1.name : newState.team2.name;
          fightOverMsg = `Round 1 Over. ${opponentTeamName} needs ${target} to win.`;
        }
      } else { // Round 2
        if (newState.firstRoundResult && newState.score > newState.firstRoundResult.score) {
          fightIsOver = true;
          const battingTeamName = newState.battingTeam === 'team1' ? newState.team1.name : newState.team2.name;
          const playersRemaining = maxPlayersOut - newState.playersOut;
          fightOverMsg = `${battingTeamName} won with ${playersRemaining} players remaining!`;
        } else if (newState.playersOut >= maxPlayersOut || newState.currentRound === newState.totalRounds) {
          fightIsOver = true;
          if (newState.firstRoundResult && newState.score === newState.firstRoundResult.score) {
            fightOverMsg = 'Fight Tied!';
          } else {
            const bowlingTeamName = newState.bowlingTeam === 'team1' ? newState.team1.name : newState.team2.name;
            const runsDiff = newState.firstRoundResult!.score - newState.score;
            fightOverMsg = `${bowlingTeamName} won by ${runsDiff} points!`;
          }
        }
      }
      
      if (fightIsOver) {
        newState.isFightOver = true;
        newState.fightOverMessage = fightOverMsg;
      }

      return newState;
    });
  };

  const currentDefender = useMemo(() => fightState?.defenderId ? getPlayerById(fightState.defenderId) : undefined, [fightState, getPlayerById]);
  const currentSupport = useMemo(() => fightState?.supportId ? getPlayerById(fightState.supportId) : undefined, [fightState, getPlayerById]);
  
  if (!fightState) {
    return <FightSetup onFightStart={handleFightStart} />;
  }
  
  const defenderStats = fightState.defenderId ? fightState.defenderStats[fightState.defenderId] : null;
  const supportStats = fightState.supportId ? fightState.defenderStats[fightState.supportId] : null;
  const attackerStats = fightState.attackerId ? fightState.attackerStats[fightState.attackerId] : null;
  const bowlingTeamPlayers = fightState[fightState.bowlingTeam].players;

  const handleModalAction = () => {
    if (fightState.currentRoundNumber === 1) {
      startSecondRound();
    } else {
      handleScore({ type: 'RESET' });
    }
  };
  const modalButtonText = fightState.currentRoundNumber === 1 ? 'Start 2nd Round' : 'New Fight';

  return (
    <div className="min-h-screen bg-gray-200 dark:bg-gray-900 text-gray-800 dark:text-gray-100 font-sans p-2 sm:p-4">
      <div className="max-w-7xl mx-auto space-y-4">
        <header className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl sm:text-3xl font-bold text-resolver-blue">{fightState.team1.name} vs {fightState.team2.name}</h1>
                <div className="flex items-center gap-2">
                    <button onClick={() => handleScore({type: 'UNDO'})} className="p-2 bg-amber-500 hover:bg-amber-600 text-white rounded-full disabled:opacity-50" disabled={!fightState.lastEvent} aria-label="Undo last event"><UndoIcon className="w-5 h-5"/></button>
                    <button onClick={() => handleScore({type: 'RESET'})} className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm">Reset</button>
                </div>
            </div>
            <div className="mt-4 text-center">
                <p className="text-lg"><span className="font-semibold">{fightState.battingTeam === 'team1' ? fightState.team1.name : fightState.team2.name}</span> are defending</p>
                {fightState.currentRoundNumber === 2 && fightState.firstRoundResult && (
                  <p className="text-md text-gray-500">Target: <span className="font-bold text-resolver-blue">{fightState.firstRoundResult.score + 1}</span></p>
                )}
                <p className="text-5xl font-extrabold my-2 tracking-tighter">
                    {fightState.score} - {fightState.playersOut}
                </p>
                <p className="text-2xl font-semibold">
                    Round: {fightState.currentRound}.{fightState.currentTurn} <span className="text-gray-500">({fightState.totalRounds})</span>
                </p>
            </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md flex items-center justify-between">
                <div>
                    <p className="text-sm text-gray-500">Defender</p>
                    <p className="text-xl font-bold">{currentDefender?.name}</p>
                </div>
                <div className="text-right">
                    <p className="text-2xl font-bold">{defenderStats?.runs}</p>
                    <p className="text-sm text-gray-500">{defenderStats?.balls} turns</p>
                </div>
                <ShieldIcon className="w-8 h-8 text-resolver-blue opacity-50"/>
            </div>
             <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md flex items-center justify-between">
                <div>
                    <p className="text-sm text-gray-500">Support</p>
                    <p className="text-xl font-bold">{currentSupport?.name}</p>
                </div>
                <div className="text-right">
                    <p className="text-2xl font-bold">{supportStats?.runs}</p>
                    <p className="text-sm text-gray-500">{supportStats?.balls} turns</p>
                </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md flex items-center justify-between">
                <div>
                    <p className="text-sm text-gray-500">Attacker</p>
                    <select
                        value={fightState.attackerId || ''}
                        onChange={(e) => handleAttackerChange(e.target.value)}
                        className="text-xl font-bold bg-white dark:bg-gray-800 border-none focus:ring-resolver-blue rounded-md p-1 -ml-1"
                        aria-label="Select Attacker"
                    >
                        {bowlingTeamPlayers.map(player => (
                            <option key={player.id} value={player.id}>
                                {player.name}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="text-right">
                    <p className="text-2xl font-bold">{attackerStats?.wickets}/{attackerStats?.runsConceded}</p>
                    <p className="text-sm text-gray-500">{attackerStats?.rounds.toFixed(1)} rounds</p>
                </div>
                <FistIcon className="w-8 h-8 text-action-red opacity-50"/>
            </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
            <h3 className="font-semibold mb-2">This Round:</h3>
            <div className="flex items-center gap-2 flex-wrap">
                {fightState.currentRoundHistory.map((ball, index) => (
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
                    <button key={runs} onClick={() => handleScore({type: 'POINTS', points: runs})} className={`p-4 rounded-lg font-bold text-lg transition-transform transform hover:scale-105 ${runs === 4 ? 'bg-green-500 text-white col-span-2' : ''} ${runs === 6 ? 'bg-purple-500 text-white col-span-2' : ''} ${runs < 4 ? 'bg-gray-200 dark:bg-gray-700' : ''}`}>
                        {runs}
                    </button>
                ))}
                <button onClick={() => handleScore({type: 'EXTRA', extraType: 'Penalty'})} className="p-4 rounded-lg font-bold text-lg bg-blue-500 text-white">Penalty</button>
                <button onClick={() => handleScore({type: 'EXTRA', extraType: 'Foul'})} className="p-4 rounded-lg font-bold text-lg bg-blue-500 text-white">Foul</button>
                <button onClick={() => handleScore({type: 'OUT'})} className="p-4 rounded-lg font-bold text-lg bg-red-500 text-white col-span-2">Out</button>
                <button onClick={() => handleScore({type: 'WARNING', warningType: 'FirstBounce'})} className="p-4 rounded-lg font-bold text-lg bg-yellow-500 text-white col-span-2">Bounce</button>
            </div>
        </div>
        
        {fightState.isFightOver && (
            <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" role="dialog" aria-modal="true">
                <div className="bg-white dark:bg-gray-800 p-8 rounded-lg text-center shadow-2xl max-w-sm mx-auto">
                    <h2 className="text-3xl font-bold mb-4">{fightState.currentRoundNumber === 1 && fightState.firstRoundResult === null ? 'Round Over' : 'Fight Over'}</h2>
                    <p className="text-lg mb-6">{fightState.fightOverMessage}</p>
                    <button onClick={handleModalAction} className="px-6 py-3 bg-resolver-blue text-white font-bold rounded-lg hover:bg-blue-700 transition-colors">
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