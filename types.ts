
export interface Player {
  id: string;
  name: string;
}

export interface DefenderStats {
  runs: number;
  balls: number;
  bonus4: number;
  bonus6: number;
  isOut: boolean;
  strikeRate: number;
}

export interface AttackerStats {
  rounds: number;
  turnsDelivered: number;
  runsConceded: number;
  wickets: number;
  perfectRounds: number;
  economy: number;
  warnings: {
    firstBounce: boolean;
  };
}

export interface RoundEvent {
  runs: number;
  isExtra: boolean;
  isWicket: boolean;
  display: string;
}

export interface FightState {
  team1: { name: string; players: Player[] };
  team2: { name: string; players: Player[] };
  totalRounds: number;
  isFightStarted: boolean;

  battingTeam: 'team1' | 'team2';
  bowlingTeam: 'team1' | 'team2';

  defenderId: string | null;
  supportId: string | null;
  attackerId: string | null;

  defenderStats: Record<string, DefenderStats>;
  attackerStats: Record<string, AttackerStats>;
  
  score: number;
  playersOut: number;
  currentRound: number;
  currentTurn: number;
  
  currentRoundHistory: RoundEvent[];
  allRoundsHistory: RoundEvent[][];
  
  lastEvent: FightState | null; // For undo
  
  isFightOver: boolean;
  fightOverMessage: string;
  
  nextDefenderIndex: number;

  currentRoundNumber: 1 | 2;
  firstRoundResult: {
    score: number;
    playersOut: number;
  } | null;
}

export interface FightSetupData {
  team1Name: string;
  team2Name: string;
  team1Players: string[];
  team2Players: string[];
  totalRounds: number;
}