import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LandingPage from './components/LandingPage';
import { ToastProvider, useToast } from './components/ToastContext';
import type { MatchState, MatchSetupData, Player, BatsmanStats, BowlerStats, OverEvent } from './types';
import MatchSetup from './components/MatchSetup';
import MatchHistory from './components/MatchHistory';
import Toss from './components/Toss';
import Scoreboard from './components/Scoreboard';
import PlayerCard from './components/PlayerCard';
import ScoringControls from './components/ScoringControls';
import MatchOverModal from './components/MatchOverModal';
import { UndoIcon, TrophyIcon } from './components/icons';
import { saveMatchToSupabase } from './services/matchService';
import ErrorBoundary from './components/ErrorBoundary';
import Toast from './components/Toast';

type ScoringEvent =
  | { type: 'RUNS', runs: number }
  | { type: 'EXTRA', extraType: 'Wide' | 'No Ball' }
  | { type: 'OUT' }
  | { type: 'UNDO' };

const Game: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [view, setView] = useState<'main' | 'history'>('main');
  const [matchState, setMatchState] = useState<MatchState | null>(null);
  const [setupData, setSetupData] = useState<MatchSetupData | null>(null);
  const [scoreAnimationKey, setScoreAnimationKey] = useState(0);

  // --- Persistence Logic ---
  useEffect(() => {
    try {
      const savedState = localStorage.getItem('cricketResolverState');
      if (savedState) {
        const parsedState = JSON.parse(savedState) as MatchState;
        if (!parsedState.isMatchOver) {
          parsedState.lastEvent = null; // Don't persist undo history heavily
          setMatchState(parsedState);
        } else {
          localStorage.removeItem('cricketResolverState');
        }
      }
    } catch (error) {
      console.error("Could not load match state", error);
    }
  }, []);

  useEffect(() => {
    if (matchState && !matchState.isMatchOver) {
      const stateToSave = { ...matchState };
      delete stateToSave.lastEvent;
      localStorage.setItem('cricketResolverState', JSON.stringify(stateToSave));
    } else if (!matchState) {
      localStorage.removeItem('cricketResolverState');
    }
  }, [matchState]);

  useEffect(() => {
    if (matchState?.isMatchOver) {
      const historyJSON = localStorage.getItem('cricketMatchHistory');
      const history: MatchState[] = historyJSON ? JSON.parse(historyJSON) : [];

      const completedMatch = {
        ...matchState,
        id: matchState.id || new Date().toISOString(),
        completedAt: new Date().toISOString(),
      };

      if (!history.some(m => m.id === completedMatch.id)) {
        const newHistory = [completedMatch, ...history];
        localStorage.setItem('cricketMatchHistory', JSON.stringify(newHistory));

        // Save to Supabase if user is logged in
        if (user) {
          showToast('Saving match to cloud...', 'info');
          saveMatchToSupabase(completedMatch, user.id).then((result) => {
            if (result.success) {
              showToast('Match saved to cloud!', 'success');
            } else {
              console.error('Save failed:', result.error);
              showToast('Failed to save to cloud. Check console.', 'error');
            }
          });
        }
      }
      localStorage.removeItem('cricketResolverState');
    }
  }, [matchState?.isMatchOver, user]);

  // --- Handlers ---

  const handleSetupComplete = (data: MatchSetupData) => {
    setSetupData(data);
  };

  const handleTossResult = (winnerTeamKey: 'team1' | 'team2', decision: 'bat' | 'bowl') => {
    if (!setupData) return;
    const battingTeamKey = decision === 'bat' ? winnerTeamKey : (winnerTeamKey === 'team1' ? 'team2' : 'team1');
    const bowlingTeamKey = decision === 'bowl' ? winnerTeamKey : (winnerTeamKey === 'team1' ? 'team2' : 'team1');

    const team1Players = setupData.team1Players.map((name, i) => ({ id: `t1p${i}`, name }));
    const team2Players = setupData.team2Players.map((name, i) => ({ id: `t2p${i}`, name }));

    const allPlayers = [...team1Players, ...team2Players];
    const initialBatsmanStats: Record<string, BatsmanStats> = allPlayers.reduce((acc, p) => ({
      ...acc, [p.id]: { runs: 0, balls: 0, bonus4: 0, bonus6: 0, isOut: false, strikeRate: 0 }
    }), {});
    const initialBowlerStats: Record<string, BowlerStats> = allPlayers.reduce((acc, p) => ({
      ...acc, [p.id]: { overs: 0, ballsDelivered: 0, runsConceded: 0, wickets: 0, maidenOvers: 0, economy: 0 }
    }), {});

    const battingTeamPlayers = battingTeamKey === 'team1' ? team1Players : team2Players;
    const bowlingTeamPlayers = bowlingTeamKey === 'team1' ? team1Players : team2Players;

    setMatchState({
      id: new Date().toISOString(),
      team1: { name: setupData.team1Name, players: team1Players },
      team2: { name: setupData.team2Name, players: team2Players },
      totalOvers: setupData.totalOvers,
      isMatchStarted: true,
      battingTeam: battingTeamKey,
      bowlingTeam: bowlingTeamKey,
      strikerId: battingTeamPlayers[0]?.id || null,
      nonStrikerId: battingTeamPlayers[1]?.id || null,
      bowlerId: bowlingTeamPlayers[0]?.id || null,
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
    setSetupData(null);
  };

  const handleResetMatch = () => {
    if (window.confirm("Start a new match? Current progress will be discarded.")) {
      localStorage.removeItem('cricketResolverState');
      setMatchState(null);
      setSetupData(null);
      setView('main');
    }
  };

  const startSecondInnings = () => {
    if (!matchState) return;
    setMatchState(prevState => {
      if (!prevState) return null;
      const newBattingTeamKey = prevState.bowlingTeam;
      const newBowlingTeamKey = prevState.battingTeam;
      const newBattingTeamPlayers = prevState[newBattingTeamKey].players;

      return {
        ...prevState,
        firstInningsResult: { score: prevState.score, wickets: prevState.wickets },
        battingTeam: newBattingTeamKey,
        bowlingTeam: newBowlingTeamKey,
        strikerId: newBattingTeamPlayers[0]?.id || null,
        nonStrikerId: newBattingTeamPlayers[1]?.id || null,
        bowlerId: null,
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
        lastEvent: null,
      };
    });
  };

  const handlePlayerChange = (type: 'bowler' | 'striker' | 'nonStriker', newId: string) => {
    if (!matchState || matchState.isMatchOver) return;
    setMatchState(prevState => {
      if (!prevState) return null;
      const saveStateForUndo = (state: MatchState) => ({ ...state, lastEvent: JSON.parse(JSON.stringify(state)) });
      let newState = saveStateForUndo(prevState);

      // Handle "Choose..." selection (empty string) as null
      const idToSet = newId === '' ? null : newId;

      if (type === 'bowler') newState.bowlerId = idToSet;
      if (type === 'striker') {
        if (idToSet && idToSet === newState.nonStrikerId) newState.nonStrikerId = newState.strikerId;
        newState.strikerId = idToSet;
      }
      if (type === 'nonStriker') {
        if (idToSet && idToSet === newState.strikerId) newState.strikerId = newState.nonStrikerId;
        newState.nonStrikerId = idToSet;
      }
      return newState;
    });
  };

  const handleScore = (event: ScoringEvent) => {
    if (!matchState || (matchState.isMatchOver && event.type !== 'UNDO')) return;

    if (event.type === 'RUNS') setScoreAnimationKey(k => k + 1);

    setMatchState(prevState => {
      if (!prevState) return null;
      if (event.type === 'UNDO') return prevState.lastEvent;

      // Deep clone for undo history
      const saveStateForUndo = (state: MatchState) => ({ ...state, lastEvent: JSON.parse(JSON.stringify(state)) });
      let newState = saveStateForUndo(prevState);

      const { strikerId, nonStrikerId, bowlerId, battingTeam, nextBatsmanIndex } = newState;

      // Validation: need bowler and striker to proceed with scoring
      if (!strikerId || !bowlerId) {
        return prevState;
      }

      let eventRecord: OverEvent = { runs: 0, isExtra: false, isWicket: false, display: '' };
      let legalBall = true, runsInThisBall = 0, rotateStrike = false;

      // LAST MAN STANDING LOGIC: Max Wickets = Total Players
      const maxWickets = newState[battingTeam].players.length;

      // Ensure stats objects exist (deep clone safety)
      newState.batsmanStats = { ...newState.batsmanStats };
      newState.bowlerStats = { ...newState.bowlerStats };
      newState.batsmanStats[strikerId] = { ...newState.batsmanStats[strikerId] };
      newState.bowlerStats[bowlerId] = { ...newState.bowlerStats[bowlerId] };

      // Deep clone history arrays to avoid mutation bugs
      newState.currentOverHistory = [...newState.currentOverHistory];
      newState.allOversHistory = [...newState.allOversHistory];

      switch (event.type) {
        case 'RUNS':
          runsInThisBall = event.runs;
          eventRecord = { ...eventRecord, runs: event.runs, display: event.runs.toString() };
          newState.score += event.runs;
          newState.batsmanStats[strikerId].runs += event.runs;
          if (event.runs === 4) newState.batsmanStats[strikerId].bonus4 += 1;
          if (event.runs === 6) newState.batsmanStats[strikerId].bonus6 += 1;
          rotateStrike = event.runs % 2 !== 0;
          break;
        case 'EXTRA':
          legalBall = false;
          runsInThisBall = 1;
          newState.score += 1;
          eventRecord = { ...eventRecord, isExtra: true, runs: 1, display: event.extraType === 'Wide' ? 'Wd' : 'Nb' };
          break;
        case 'OUT':
          eventRecord = { ...eventRecord, isWicket: true, display: 'W' };
          newState.wickets += 1;
          newState.batsmanStats[strikerId].isOut = true;
          newState.bowlerStats[bowlerId].wickets += 1;

          // -- LAST MAN STANDING LOGIC --
          if (newState.wickets < maxWickets) {
            const newBatsmanId = newState[battingTeam].players[nextBatsmanIndex]?.id;
            if (newBatsmanId) {
              // Standard case: new batsman comes to crease
              newState.strikerId = newBatsmanId;
              newState.nextBatsmanIndex += 1;
            } else {
              // No new batsman available. 
              // If there is a non-striker, they become the striker and play alone (LMS).
              // The current striker is out, so the spot becomes empty initially.
              if (newState.nonStrikerId) {
                newState.strikerId = newState.nonStrikerId;
                newState.nonStrikerId = null; // Empty non-striker end
              }
              // If no non-striker, game proceeds to check All Out condition below
            }
          }
          break;
      }

      // Update stats
      if (legalBall) {
        newState.batsmanStats[strikerId].balls += 1;
        const { runs, balls } = newState.batsmanStats[strikerId];
        newState.batsmanStats[strikerId].strikeRate = balls > 0 ? parseFloat(((runs / balls) * 100).toFixed(2)) : 0;
        newState.currentBall += 1;
        newState.bowlerStats[bowlerId].ballsDelivered += 1;
      }

      newState.bowlerStats[bowlerId].runsConceded += runsInThisBall;
      const bowlerBalls = newState.bowlerStats[bowlerId].ballsDelivered;
      newState.bowlerStats[bowlerId].economy = bowlerBalls > 0 ? parseFloat(((newState.bowlerStats[bowlerId].runsConceded / bowlerBalls) * 6).toFixed(2)) : 0;

      newState.currentOverHistory.push(eventRecord);

      // Over completion logic
      if (newState.currentBall === 6) {
        // Only rotate strike if there is a partner
        if (newState.nonStrikerId) {
          // If run was odd, they swapped already. End of over means swap again (so back to original if odd, or swap if even).
          // Actually simpler: If runs were odd, they are at opposite ends. End of over means Strike changes.
          // So we just invert the boolean logic? No, end of over physically swaps who faces.
          // The correct logic is: Rotate strike at end of over implies the non-striker takes strike.
          rotateStrike = !rotateStrike;
        } else {
          // LMS: No strike rotation at end of over if batting alone
          rotateStrike = false;
        }

        newState.allOversHistory.push([...newState.currentOverHistory]);
        if (newState.currentOverHistory.every(e => e.runs === 0 && !e.isExtra) && newState.currentOverHistory.length > 0) {
          newState.bowlerStats[bowlerId].maidenOvers += 1;
        }

        // Prepare for next over
        newState.currentOver += 1;
        newState.currentBall = 0;
        newState.currentOverHistory = [];
        newState.bowlerId = null; // Force change for next over
      }

      // Perform Rotation if needed
      if (rotateStrike && newState.nonStrikerId) {
        [newState.strikerId, newState.nonStrikerId] = [newState.nonStrikerId, newState.strikerId];
      }

      // Match Status Check
      const inningsOverByOvers = newState.currentOver >= newState.totalOvers;
      const inningsOverByWickets = newState.wickets >= maxWickets;
      const targetChased = newState.currentInnings === 2 && newState.firstInningsResult && newState.score > newState.firstInningsResult.score;

      if (inningsOverByOvers || inningsOverByWickets || targetChased) {
        if (newState.currentInnings === 2 || targetChased) {
          newState.isMatchOver = true;

          // Defensive check for firstInningsResult
          const firstInningsScore = newState.firstInningsResult?.score || 0;
          const score1 = firstInningsScore;
          const score2 = newState.score;

          if (score2 > score1) {
            const wicketsRemaining = maxWickets - newState.wickets;
            newState.matchOverMessage = `${newState[battingTeam].name} WON!`;
          } else if (score1 > score2) {
            const runsMargin = score1 - score2;
            newState.matchOverMessage = `${newState[newState.bowlingTeam].name} WON!`;
          } else {
            newState.matchOverMessage = "MATCH TIED!";
          }

          // Summary Stats Calculation
          const allMatchPlayers = [...newState.team1.players, ...newState.team2.players];
          const getPlayer = (id: string) => allMatchPlayers.find(p => p.id === id);

          let bestBat = { name: '', runs: -1 };
          let bestBowl = { name: '', wickets: -1, runs: 999 };

          Object.keys(newState.batsmanStats).forEach(pid => {
            const s = newState.batsmanStats[pid];
            if (s.runs > bestBat.runs) bestBat = { name: getPlayer(pid)?.name || '', runs: s.runs };
          });

          Object.keys(newState.bowlerStats).forEach(pid => {
            const s = newState.bowlerStats[pid];
            if (s.ballsDelivered > 0) {
              if (s.wickets > bestBowl.wickets || (s.wickets === bestBowl.wickets && s.runsConceded < bestBowl.runs)) {
                bestBowl = { name: getPlayer(pid)?.name || '', wickets: s.wickets, runs: s.runsConceded };
              }
            }
          });

          newState.matchSummary = {
            topScorer: bestBat.runs > -1 ? bestBat : null,
            bestBowler: bestBowl.wickets > -1 ? bestBowl : null
          };
        }
      }
      return newState;
    });
  };

  const isFirstInningsOver = useMemo(() => {
    if (!matchState || matchState.currentInnings !== 1) return false;
    const maxWickets = matchState[matchState.battingTeam].players.length;
    return matchState.currentOver >= matchState.totalOvers || matchState.wickets >= maxWickets;
  }, [matchState]);

  // --- Render Helpers ---

  if (view === 'history') return <MatchHistory onBack={() => setView('main')} />;
  if (!matchState && setupData) return <Toss team1Name={setupData.team1Name} team2Name={setupData.team2Name} onTossComplete={handleTossResult} onBack={() => setSetupData(null)} />;
  if (!matchState) return <MatchSetup onMatchStart={handleSetupComplete} onShowHistory={() => setView('history')} />;

  // Derived state to help UI render correctly
  const isOverStarting = (matchState.currentBall === 0 && matchState.currentOver < matchState.totalOvers && !matchState.bowlerId) || false;

  return (
    <div className="min-h-screen pb-80 md:pb-0">

      {/* Header */}
      <header className="sticky top-0 z-40 glass-card border-b border-white/10 px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <TrophyIcon className="w-5 h-5 text-yellow-400" />
          <h1 className="font-bold text-lg tracking-tight">FIGHT<span className="text-indigo-400">RESOLVER</span></h1>
        </div>
        <div className="flex items-center gap-2">
          {!matchState.isMatchOver && (
            <button
              onClick={() => handleScore({ type: 'UNDO' })}
              disabled={!matchState.lastEvent}
              className="p-2 rounded-full hover:bg-white/10 disabled:opacity-30 transition-colors text-amber-400"
              aria-label="Undo"
            >
              <UndoIcon className="w-5 h-5" />
            </button>
          )}
          <button onClick={handleResetMatch} className="text-xs bg-white/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 px-3 py-1.5 rounded-full transition-all border border-white/5">
            END MATCH
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4 space-y-6">
        {/* Scoreboard */}
        <Scoreboard
          {...matchState}
          battingTeamName={matchState[matchState.battingTeam].name}
          animationKey={scoreAnimationKey}
        />

        {matchState.isMatchOver && (
          <MatchOverModal matchState={matchState} onNewMatch={handleResetMatch} />
        )}

        {/* Action Cards */}
        <div className="grid grid-cols-1 gap-4">
          {/* Batsmen Card */}
          <PlayerCard
            title="Batting"
            players={matchState[matchState.battingTeam].players.filter(p => !matchState.batsmanStats[p.id].isOut)}
            stats={matchState.batsmanStats}
            isBattingCard
            strikerId={matchState.strikerId}
            nonStrikerId={matchState.nonStrikerId}
            onStrikerChange={(id) => handlePlayerChange('striker', id)}
            onNonStrikerChange={(id) => handlePlayerChange('nonStriker', id)}
            isMatchOver={matchState.isMatchOver}
          />

          {/* Bowler Card */}
          <PlayerCard
            title="Bowling"
            players={matchState[matchState.bowlingTeam].players}
            stats={matchState.bowlerStats}
            activePlayerId={matchState.bowlerId}
            onPlayerSelect={(id) => handlePlayerChange('bowler', id)}
            isOverStarting={isOverStarting || isFirstInningsOver}
            isMatchOver={matchState.isMatchOver}
          />
        </div>

        {/* Current Over Strip */}
        <div className="glass-panel rounded-xl p-4 flex items-center gap-4 overflow-x-auto no-scrollbar">
          <span className="text-xs font-bold text-gray-400 uppercase whitespace-nowrap">This Over</span>
          <div className="flex gap-2">
            {matchState.currentOverHistory.length === 0 && <span className="text-gray-600 text-sm">-</span>}
            {matchState.currentOverHistory.map((event, i) => (
              <div key={i} className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border border-white/5 shadow-sm
                    ${event.isWicket ? 'bg-red-500 text-white' :
                  event.runs === 4 ? 'bg-indigo-500 text-white' :
                    event.runs === 6 ? 'bg-emerald-500 text-white' :
                      event.isExtra ? 'bg-amber-500 text-black' : 'bg-slate-800 text-white'}
                  `}>
                {event.display}
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Controls Footer */}
      {!matchState.isMatchOver && (
        <div className="fixed bottom-0 left-0 right-0 bg-[#020617]/90 backdrop-blur-xl border-t border-white/10 z-50 pb-safe">
          <div className="max-w-2xl mx-auto p-4">
            {isFirstInningsOver ? (
              <button onClick={startSecondInnings} className="w-full py-4 text-lg font-bold text-white bg-gradient-to-r from-indigo-600 to-blue-600 rounded-xl shadow-lg shadow-indigo-900/20 animate-pulse-glow">
                START 2ND INNINGS
              </button>
            ) : (
              <ScoringControls onScore={handleScore} isMatchOver={matchState.isMatchOver} />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const [guestMode, setGuestMode] = useState(false);

  if (loading) return <div className="min-h-screen bg-[#020617] flex items-center justify-center text-white">Loading...</div>;

  if (!user && !guestMode) {
    return <LandingPage onGuestMode={() => setGuestMode(true)} />;
  }

  return <Game />;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <ToastProvider>
        <Toast />
        <ErrorBoundary>
          <AppContent />
        </ErrorBoundary>
      </ToastProvider>
    </AuthProvider>
  );
};

export default App;