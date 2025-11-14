
export interface Player {
  id: string;
  name: string;
}

export interface BatsmanStats {
  runs: number;
  balls: number;
  bonus4: number;
  bonus6: number;
  isOut: boolean;
  strikeRate: number;
}

export interface BowlerStats {
  overs: number;
  ballsDelivered: number;
  runsConceded: number;
  wickets: number;
  maidenOvers: number;
  economy: number;
}

export interface OverEvent {
  runs: number;
  isExtra: boolean;
  isWicket: boolean;
  display: string;
}

export interface MatchState {
  team1: { name: string; players: Player[] };
  team2: { name: string; players: Player[] };
  totalOvers: number;
  isMatchStarted: boolean;

  battingTeam: 'team1' | 'team2';
  bowlingTeam: 'team1' | 'team2';

  strikerId: string | null;
  nonStrikerId: string | null;
  bowlerId: string | null;

  batsmanStats: Record<string, BatsmanStats>;
  bowlerStats: Record<string, BowlerStats>;
  
  score: number;
  wickets: number;
  currentOver: number;
  currentBall: number;
  
  currentOverHistory: OverEvent[];
  allOversHistory: OverEvent[][];
  
  lastEvent: MatchState | null; // For undo
  
  isMatchOver: boolean;
  matchOverMessage: string;
  
  nextBatsmanIndex: number;

  currentInnings: 1 | 2;
  firstInningsResult: {
    score: number;
    wickets: number;
  } | null;
}

export interface MatchSetupData {
  team1Name: string;
  team2Name: string;
  team1Players: string[];
  team2Players: string[];
  totalOvers: number;
}