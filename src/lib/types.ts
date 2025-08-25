// Core poker types and interfaces

export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | 'T' | 'J' | 'Q' | 'K';

export interface Card {
  rank: Rank;
  suit: Suit;
  unicode: string; // For display
}

export interface Player {
  id: string;
  name: string;
  chips: number;
  position: number;
  holeCards: Card[];
  isActive: boolean;
  hasActed: boolean;
  currentBet: number;
  isAllIn: boolean;
  isFolded: boolean;
  isHuman: boolean;
  showCards?: boolean; // For learning - show opponent cards sometimes
}

export type GameStage = 'preflop' | 'flop' | 'turn' | 'river' | 'showdown';

export type Action = 'fold' | 'check' | 'call' | 'bet' | 'raise' | 'all-in';

export interface GameAction {
  playerId: string;
  action: Action;
  amount: number;
  timestamp: Date;
}

export interface GameState {
  stage: GameStage;
  pot: number;
  communityCards: Card[];
  players: Player[];
  dealer: number; // dealer position
  smallBlind: number;
  bigBlind: number;
  currentPlayerIndex: number;
  gameActions: GameAction[];
  minRaise: number;
  sidePots: SidePot[];
}

export interface SidePot {
  amount: number;
  eligiblePlayers: string[];
}

export interface HandResult {
  playerId: string;
  hand: Card[];
  handRank: number;
  handName: string;
  winnings: number;
}

// Quiz types
export type QuizQuestionType = 'numeric' | 'percentage' | 'ratio' | 'boolean' | 'multiple_choice';

export interface QuizQuestion {
  id: string;
  question: string;
  type: QuizQuestionType;
  answer: string | number | boolean;
  options?: string[]; // for multiple choice
  explanation: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  category: string;
}

export interface QuizResult {
  questionId: string;
  userAnswer: string | number | boolean;
  correct: boolean;
  timeSpent: number;
}

// Calculator types
export interface OddsCalculation {
  outs: number;
  equity: number; // percentage
  oneCardOdds: number; // percentage with 1 card to come
  twoCardOdds: number; // percentage with 2 cards to come
}

export interface PotOdds {
  potSize: number;
  betSize: number;
  callAmount: number;
  odds: number; // ratio (e.g., 3 for 3:1)
  percentage: number; // equity needed as percentage
}

export interface ImpliedOdds extends PotOdds {
  impliedWinnings: number;
  effectiveOdds: number;
}

// CSI (Chip Stacks Index) types
export interface CSIInfo {
  csi: number;
  strategy: string;
  description: string;
  recommendedAction?: string;
}

// Hand evaluation types
export interface HandEvaluation {
  rank: number; // 1 = high card, 2 = pair, etc.
  name: string;
  cards: Card[]; // the 5-card hand
  kickers: Card[]; // relevant kicker cards
}

// Learning system types
export interface LearningScenario {
  id: string;
  title: string;
  description: string;
  gameState: Partial<GameState>;
  questions: QuizQuestion[];
  tips: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export interface UserProgress {
  totalGames: number;
  correctAnswers: number;
  totalQuestions: number;
  categoryScores: Record<string, { correct: number; total: number }>;
  averageResponseTime: number;
  lastPlayed: Date;
}

// Game settings
export interface GameSettings {
  numPlayers: number;
  startingChips: number;
  smallBlind: number;
  bigBlind: number;
  showOpponentCards: 'never' | 'sometimes' | 'always';
  quizFrequency: 'low' | 'medium' | 'high';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  enableHints: boolean;
}

// UI component props
export interface TableProps {
  gameState: GameState;
  onAction: (action: Action, amount?: number) => void;
  settings: GameSettings;
}

export interface PlayerProps {
  player: Player;
  isCurrentPlayer: boolean;
  gameStage: GameStage;
  showCards: boolean;
}

export interface QuizModalProps {
  question: QuizQuestion;
  onAnswer: (answer: string | number | boolean) => void;
  onClose: () => void;
  timeLimit?: number;
}