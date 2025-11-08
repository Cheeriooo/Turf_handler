
export interface Player {
  id: string;
  name: string;
}

export interface BatsmanStats {
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  isOut: boolean;
  strikeRate: number;
}

export interface BowlerStats {
  overs: number;
  ballsDelivered: number;
  runsConceded: number;
  wickets: number;
  maidens: number;
  economy: number;
  warnings: {
    firstBounce: boolean;
  };
}

export interface OverBall {
  runs: number;
  isExtra: boolean;
  isWicket: boolean;
  display: string;
}

export interface MatchState {
  team1: { name: string; players: Player[] };
  team2: { name: string; players: Player[] };
  overs: number;
  isMatchStarted: boolean;

  battingTeam: 'team1' | 'team2';
  bowlingTeam: 'team1' | 'team2';

  strikerId: string | null;
  nonStrikerId: string | null;
  bowlerId: string | null;

  batsmenStats: Record<string, BatsmanStats>;
  bowlersStats: Record<string, BowlerStats>;
  
  score: number;
  wickets: number;
  currentOver: number;
  currentBall: number;
  
  currentOverHistory: OverBall[];
  allOversHistory: OverBall[][];
  
  lastEvent: MatchState | null; // For undo
  
  isMatchOver: boolean;
  matchOverMessage: string;
  
  nextBatsmanIndex: number; // to track who is next to bat for simplicity

  // New fields for multiple innings
  currentInnings: 1 | 2;
  firstInnings: {
    score: number;
    wickets: number;
  } | null;
}

export interface MatchSetupData {
  team1Name: string;
  team2Name: string;
  team1Players: string[];
  team2Players: string[];
  overs: number;
}
