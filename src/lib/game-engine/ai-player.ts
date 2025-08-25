import { Player, Action, GameState, Card, GameStage } from '../types';
import { evaluateHand } from './evaluator';
import { calculateCSI, shouldPush, shouldCallPush } from '../calculators/csi';
import { getRankValue } from './deck';

// AI Player personality types that affect decision making
export type AIPersonality = {
  name: string;
  aggression: number;      // 0.1-0.9 (higher = more aggressive)
  tightness: number;       // 0.1-0.9 (higher = tighter ranges)
  bluffFrequency: number;  // 0.0-0.3 (how often they bluff)
  adaptability: number;    // 0.1-0.9 (how much they adjust to opponents)
  patience: number;        // 0.1-0.9 (willingness to fold marginal hands)
  riskTolerance: number;   // 0.1-0.9 (tolerance for variance)
};

// Predefined AI personalities
export const AI_PERSONALITIES: Record<string, AIPersonality> = {
  TIGHT_PASSIVE: {
    name: 'Tight Passive',
    aggression: 0.2,
    tightness: 0.8,
    bluffFrequency: 0.05,
    adaptability: 0.3,
    patience: 0.9,
    riskTolerance: 0.2
  },
  TIGHT_AGGRESSIVE: {
    name: 'Tight Aggressive',
    aggression: 0.7,
    tightness: 0.7,
    bluffFrequency: 0.15,
    adaptability: 0.6,
    patience: 0.8,
    riskTolerance: 0.4
  },
  LOOSE_AGGRESSIVE: {
    name: 'Loose Aggressive',
    aggression: 0.8,
    tightness: 0.3,
    bluffFrequency: 0.25,
    adaptability: 0.7,
    patience: 0.3,
    riskTolerance: 0.8
  },
  LOOSE_PASSIVE: {
    name: 'Loose Passive',
    aggression: 0.3,
    tightness: 0.3,
    bluffFrequency: 0.1,
    adaptability: 0.4,
    patience: 0.4,
    riskTolerance: 0.6
  },
  MANIAC: {
    name: 'Maniac',
    aggression: 0.9,
    tightness: 0.1,
    bluffFrequency: 0.3,
    adaptability: 0.5,
    patience: 0.1,
    riskTolerance: 0.9
  },
  ROCK: {
    name: 'Rock',
    aggression: 0.4,
    tightness: 0.9,
    bluffFrequency: 0.02,
    adaptability: 0.2,
    patience: 0.95,
    riskTolerance: 0.1
  }
};

// Hand strength evaluation for AI decision making
export interface HandStrength {
  rawStrength: number;     // 0-1 (based on hand ranking)
  relativeStrength: number; // 0-1 (adjusted for board texture)
  drawPotential: number;   // 0-1 (potential to improve)
  nutPotential: number;    // 0-1 (potential to make nuts)
}

// AI Player decision maker class
export class AIPlayerDecision {
  private personality: AIPersonality;
  private recentActions: Action[] = [];
  private handsPlayed: number = 0;
  private vpip: number = 0; // Voluntarily Put In Pot percentage
  private pfr: number = 0;  // PreFlop Raise percentage

  constructor(personalityType: string) {
    const personalityKeys = Object.keys(AI_PERSONALITIES);
    const selectedPersonality = personalityType in AI_PERSONALITIES 
      ? personalityType 
      : personalityKeys[Math.floor(Math.random() * personalityKeys.length)];
    
    this.personality = { ...AI_PERSONALITIES[selectedPersonality] };
    
    // Add some randomization to personality traits (±10%)
    this.randomizePersonality();
  }

  private randomizePersonality(): void {
    const variance = 0.1;
    Object.keys(this.personality).forEach(key => {
      if (key !== 'name' && typeof this.personality[key as keyof AIPersonality] === 'number') {
        const current = this.personality[key as keyof AIPersonality] as number;
        const adjustment = (Math.random() - 0.5) * variance;
        (this.personality as Record<string, unknown>)[key] = Math.max(0, Math.min(1, current + adjustment));
      }
    });
  }

  // Main decision entry point
  public makeDecision(
    player: Player,
    gameState: GameState,
    validActions: Action[]
  ): { action: Action; amount?: number; reasoning: string } {
    // Update hand stats
    this.handsPlayed++;

    const csi = calculateCSI(player.chips, gameState.smallBlind, gameState.bigBlind);
    const position = this.getPosition(player.position, gameState.players.length, gameState.dealer);
    const handStrength = this.evaluateHandStrength(player.holeCards, gameState.communityCards, gameState.stage);
    
    // Get betting information
    const maxBet = Math.max(...gameState.players.map(p => p.currentBet));
    const callAmount = maxBet - player.currentBet;
    const activePlayers = gameState.players.filter(p => p.isActive && !p.isFolded).length;
    const potOdds = callAmount > 0 ? gameState.pot / callAmount : 0;

    // Apply CSI-based strategy first (this is fundamental)
    if (csi <= 7) {
      return this.makeShortStackDecision(
        player, gameState, validActions, csi, position, handStrength, callAmount, maxBet
      );
    }

    // For deeper stacks, use more complex strategy
    return this.makeDeepStackDecision(
      player, gameState, validActions, csi, position, handStrength, callAmount, maxBet, potOdds, activePlayers
    );
  }

  private makeShortStackDecision(
    player: Player,
    gameState: GameState,
    validActions: Action[],
    csi: number,
    position: string,
    handStrength: HandStrength,
    callAmount: number,
    maxBet: number
  ): { action: Action; amount?: number; reasoning: string } {
    
    // Use CSI push/fold strategy as base
    const shouldPushHand = shouldPush(
      player.holeCards,
      csi,
      (position === 'unknown' ? 'button' : position) as 'early' | 'middle' | 'late' | 'small_blind' | 'big_blind' | 'button',
      gameState.players.filter(p => p.isActive && !p.isFolded).length - 1
    );

    // If facing a call
    if (callAmount > 0) {
      const shouldCallHand = shouldCallPush(
        player.holeCards,
        csi,
        (position === 'unknown' ? 'big_blind' : position) as 'small_blind' | 'big_blind',
        'unknown',
        csi
      );

      // Add personality-based adjustments
      const personalityAdjustment = this.getPersonalityAdjustment(handStrength, 'call');
      const finalShouldCall = shouldCallHand && personalityAdjustment > 0.3;

      if (finalShouldCall && validActions.includes('call')) {
        return {
          action: 'call',
          reasoning: `Short stack call with ${this.getHandDescription(player.holeCards)} (CSI: ${csi.toFixed(1)})`
        };
      } else if (validActions.includes('fold')) {
        return {
          action: 'fold',
          reasoning: `Short stack fold with ${this.getHandDescription(player.holeCards)} (CSI: ${csi.toFixed(1)})`
        };
      }
    }

    // If no one has bet yet
    if (maxBet === 0 || maxBet <= gameState.bigBlind) {
      const personalityAdjustment = this.getPersonalityAdjustment(handStrength, 'push');
      const finalShouldPush = shouldPushHand && personalityAdjustment > 0.2;

      if (finalShouldPush && validActions.includes('all-in')) {
        return {
          action: 'all-in',
          reasoning: `Short stack push with ${this.getHandDescription(player.holeCards)} (CSI: ${csi.toFixed(1)})`
        };
      } else if (validActions.includes('check')) {
        return {
          action: 'check',
          reasoning: `Short stack check with marginal hand (CSI: ${csi.toFixed(1)})`
        };
      } else if (validActions.includes('fold')) {
        return {
          action: 'fold',
          reasoning: `Short stack fold with weak hand (CSI: ${csi.toFixed(1)})`
        };
      }
    }

    // Fallback to fold
    return {
      action: validActions.includes('fold') ? 'fold' : validActions[0],
      reasoning: 'Short stack conservative play'
    };
  }

  private makeDeepStackDecision(
    player: Player,
    gameState: GameState,
    validActions: Action[],
    csi: number,
    position: string,
    handStrength: HandStrength,
    callAmount: number,
    maxBet: number,
    potOdds: number,
    activePlayers: number
  ): { action: Action; amount?: number; reasoning: string } {
    
    // Calculate base decision factors
    const handValue = this.calculateHandValue(handStrength, gameState.stage);
    const positionValue = this.getPositionValue(position);
    const personalityModifier = this.getPersonalityAdjustment(handStrength, 'general');
    
    // Bluffing consideration
    const shouldBluff = this.shouldBluff(gameState, position, activePlayers);
    const bluffValue = shouldBluff ? this.personality.bluffFrequency * 0.3 : 0;
    
    // Combined decision score
    const decisionScore = handValue + positionValue * 0.2 + personalityModifier * 0.3 + bluffValue;

    // If facing a bet
    if (callAmount > 0) {
      const potOddsNeeded = this.calculateRequiredEquity(potOdds, handStrength.drawPotential);
      
      if (decisionScore > 0.8 && validActions.includes('raise')) {
        const raiseAmount = this.calculateRaiseSize(gameState.pot, maxBet, this.personality.aggression);
        return {
          action: 'raise',
          amount: raiseAmount,
          reasoning: `Strong hand raise with ${this.getHandDescription(player.holeCards)} (${handStrength.rawStrength.toFixed(2)} strength)`
        };
      } else if (decisionScore > 0.4 || handStrength.rawStrength > potOddsNeeded) {
        return {
          action: 'call',
          reasoning: `Call with decent hand/pot odds (${potOddsNeeded.toFixed(2)} needed, ${handStrength.rawStrength.toFixed(2)} have)`
        };
      } else {
        return {
          action: 'fold',
          reasoning: `Fold weak hand against bet (${handStrength.rawStrength.toFixed(2)} strength)`
        };
      }
    }

    // No bet to us - decide whether to bet/check
    if (decisionScore > 0.7 && validActions.includes('bet')) {
      const betAmount = this.calculateBetSize(gameState.pot, this.personality.aggression);
      return {
        action: 'bet',
        amount: betAmount,
        reasoning: shouldBluff ? `Bluff bet with position` : `Value bet with strong hand`
      };
    } else if (validActions.includes('check')) {
      return {
        action: 'check',
        reasoning: `Check with marginal hand (${handStrength.rawStrength.toFixed(2)} strength)`
      };
    }

    // Fallback
    return {
      action: validActions.includes('fold') ? 'fold' : validActions[0],
      reasoning: 'Conservative fallback decision'
    };
  }

  // Calculate how strong our hand is (0-1 scale)
  private evaluateHandStrength(holeCards: Card[], communityCards: Card[], stage: GameStage): HandStrength {
    const allCards = [...holeCards, ...communityCards];
    
    if (allCards.length >= 5) {
      const evaluation = evaluateHand(allCards);
      const rawStrength = evaluation.rank / 10; // Normalize to 0-1
      
      // Adjust for board texture and position
      const relativeStrength = this.adjustForBoardTexture(rawStrength, communityCards);
      
      // Calculate draw potential (simplified)
      const drawPotential = this.calculateDrawPotential(holeCards, communityCards, stage);
      
      // Calculate nut potential
      const nutPotential = this.calculateNutPotential(evaluation);
      
      return {
        rawStrength,
        relativeStrength,
        drawPotential,
        nutPotential
      };
    }
    
    // Pre-flop evaluation
    return this.evaluatePreflopStrength(holeCards);
  }

  private evaluatePreflopStrength(holeCards: Card[]): HandStrength {
    if (holeCards.length !== 2) {
      return { rawStrength: 0, relativeStrength: 0, drawPotential: 0, nutPotential: 0 };
    }

    const card1 = holeCards[0];
    const card2 = holeCards[1];
    const rank1 = getRankValue(card1.rank);
    const rank2 = getRankValue(card2.rank);
    const suited = card1.suit === card2.suit;
    const isPair = rank1 === rank2;
    const isConnected = Math.abs(rank1 - rank2) <= 1;
    const highCard = Math.max(rank1, rank2);

    let strength = 0;

    // Pair evaluation
    if (isPair) {
      if (rank1 >= 10) strength = 0.9; // TT+
      else if (rank1 >= 7) strength = 0.7; // 77-99
      else if (rank1 >= 5) strength = 0.5; // 55-66
      else strength = 0.3; // 22-44
    }
    // High card evaluation  
    else if (highCard === 14) { // Ace
      const lowCard = Math.min(rank1, rank2);
      if (lowCard >= 10) strength = suited ? 0.8 : 0.75; // AK, AQ, AJ, AT
      else if (lowCard >= 7) strength = suited ? 0.6 : 0.5; // A9-A7
      else strength = suited ? 0.4 : 0.2; // A6-A2
    }
    else if (highCard >= 11) { // King, Queen
      const lowCard = Math.min(rank1, rank2);
      if (lowCard >= 10) strength = suited ? 0.7 : 0.6; // KQ, KJ, QJ
      else if (lowCard >= 7) strength = suited ? 0.5 : 0.3;
      else strength = suited ? 0.3 : 0.15;
    }
    // Connected cards
    else if (isConnected && suited) {
      strength = 0.4;
    }
    else if (isConnected) {
      strength = 0.25;
    }
    else {
      strength = 0.1;
    }

    return {
      rawStrength: strength,
      relativeStrength: strength,
      drawPotential: suited || isConnected ? 0.3 : 0.1,
      nutPotential: isPair || highCard >= 12 ? 0.5 : 0.2
    };
  }

  private adjustForBoardTexture(rawStrength: number, communityCards: Card[]): number {
    if (communityCards.length < 3) return rawStrength;
    
    // Check for flush draws, straight draws, etc.
    const suits = communityCards.map(c => c.suit);
    const ranks = communityCards.map(c => getRankValue(c.rank)).sort((a, b) => b - a);
    
    // Dangerous board (flush possible, straight possible)
    const flushPossible = suits.some(suit => 
      suits.filter(s => s === suit).length >= 3
    );
    
    const straightPossible = this.checkStraightPossible(ranks);
    
    // Reduce strength on dangerous boards for medium hands
    if ((flushPossible || straightPossible) && rawStrength < 0.7 && rawStrength > 0.3) {
      return rawStrength * 0.8;
    }
    
    return rawStrength;
  }

  private checkStraightPossible(ranks: number[]): boolean {
    // Simplified straight detection
    for (let i = 0; i < ranks.length - 2; i++) {
      if (ranks[i] - ranks[i + 2] <= 4) {
        return true;
      }
    }
    return false;
  }

  private calculateDrawPotential(holeCards: Card[], communityCards: Card[], stage: GameStage): number {
    if (stage === 'preflop' || communityCards.length === 0) return 0;
    
    // Simplified draw calculation
    const allCards = [...holeCards, ...communityCards];
    const suits = allCards.map(c => c.suit);
    const ranks = allCards.map(c => getRankValue(c.rank));
    
    let drawPotential = 0;
    
    // Flush draw
    const suitCounts = suits.reduce((acc, suit) => {
      acc[suit] = (acc[suit] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const maxSuitCount = Math.max(...Object.values(suitCounts));
    if (maxSuitCount === 4) drawPotential += 0.4; // Flush draw
    else if (maxSuitCount === 3) drawPotential += 0.2; // Backdoor flush
    
    // Straight draw (simplified)
    const sortedRanks = [...new Set(ranks)].sort((a, b) => b - a);
    let consecutiveCount = 1;
    let maxConsecutive = 1;
    
    for (let i = 1; i < sortedRanks.length; i++) {
      if (sortedRanks[i-1] - sortedRanks[i] === 1) {
        consecutiveCount++;
      } else {
        maxConsecutive = Math.max(maxConsecutive, consecutiveCount);
        consecutiveCount = 1;
      }
    }
    maxConsecutive = Math.max(maxConsecutive, consecutiveCount);
    
    if (maxConsecutive >= 4) drawPotential += 0.3; // Open-ended straight draw
    else if (maxConsecutive >= 3) drawPotential += 0.15; // Gutshot
    
    return Math.min(drawPotential, 0.8);
  }

  private calculateNutPotential(evaluation: { rank: number; name: string; cards: Card[]; kickers: Card[] }): number {
    // Simplified nut potential calculation
    if (evaluation.rank >= 8) return 0.9; // Four of a kind or better
    if (evaluation.rank >= 6) return 0.7; // Flush or full house
    if (evaluation.rank >= 4) return 0.5; // Three of a kind or straight
    return 0.2;
  }

  private getPosition(playerPos: number, totalPlayers: number, dealer: number): string {
    const relativePosition = (playerPos - dealer + totalPlayers) % totalPlayers;
    
    if (totalPlayers <= 3) {
      if (relativePosition === 0) return 'button';
      if (relativePosition === 1) return 'small_blind';
      return 'big_blind';
    }
    
    if (relativePosition === 0) return 'button';
    if (relativePosition === 1) return 'small_blind';
    if (relativePosition === 2) return 'big_blind';
    if (relativePosition <= 3) return 'early';
    if (relativePosition <= 5) return 'middle';
    return 'late';
  }

  private getPositionValue(position: string): number {
    const values = {
      'early': 0.0,
      'middle': 0.3,
      'late': 0.6,
      'button': 0.8,
      'small_blind': 0.1,
      'big_blind': 0.2
    };
    return values[position as keyof typeof values] || 0.0;
  }

  private getPersonalityAdjustment(handStrength: HandStrength, actionType: string): number {
    let adjustment = 0;
    
    // Aggression affects betting/raising
    if (actionType === 'push' || actionType === 'bet' || actionType === 'raise') {
      adjustment += (this.personality.aggression - 0.5) * 0.4;
    }
    
    // Tightness affects calling/playing marginal hands
    if (actionType === 'call' || actionType === 'general') {
      adjustment -= (this.personality.tightness - 0.5) * 0.3;
    }
    
    // Risk tolerance affects all-in decisions
    if (actionType === 'push' || actionType === 'all-in') {
      adjustment += (this.personality.riskTolerance - 0.5) * 0.3;
    }
    
    // Patience affects folding decisions
    if (handStrength.rawStrength < 0.4) {
      adjustment += (this.personality.patience - 0.5) * 0.2;
    }
    
    return adjustment;
  }

  private shouldBluff(gameState: GameState, position: string, activePlayers: number): boolean {
    // More likely to bluff in late position with fewer opponents
    const positionFactor = position === 'button' || position === 'late' ? 1.5 : 1.0;
    const playerFactor = activePlayers <= 3 ? 1.5 : activePlayers <= 4 ? 1.2 : 0.8;
    
    const bluffChance = this.personality.bluffFrequency * positionFactor * playerFactor;
    return Math.random() < bluffChance;
  }

  private calculateHandValue(handStrength: HandStrength, stage: GameStage): number {
    let value = handStrength.rawStrength;
    
    // Add draw value on earlier streets
    if (stage !== 'river') {
      value += handStrength.drawPotential * 0.3;
    }
    
    // Add nut potential
    value += handStrength.nutPotential * 0.1;
    
    return Math.min(value, 1.0);
  }

  private calculateRequiredEquity(potOdds: number, drawPotential: number): number {
    if (potOdds <= 0) return 0.9; // No pot odds means we need a very strong hand
    
    const baseEquity = 1 / (1 + potOdds);
    
    // Adjust for draw potential
    return Math.max(0.1, baseEquity - drawPotential * 0.1);
  }

  private calculateRaiseSize(pot: number, currentBet: number, aggression: number): number {
    const baseBet = Math.max(currentBet * 2, pot * 0.5);
    const aggressionMultiplier = 0.5 + (aggression * 1.5); // 0.5x to 2x pot based on aggression
    
    return Math.round(baseBet * aggressionMultiplier);
  }

  private calculateBetSize(pot: number, aggression: number): number {
    const baseSize = pot * (0.3 + aggression * 0.4); // 30% to 70% pot based on aggression
    return Math.round(Math.max(baseSize, 10)); // Minimum bet of 10
  }

  private getHandDescription(holeCards: Card[]): string {
    if (holeCards.length !== 2) return 'unknown';
    
    const card1 = holeCards[0];
    const card2 = holeCards[1];
    const suited = card1.suit === card2.suit ? 's' : 'o';
    
    if (card1.rank === card2.rank) {
      return `${card1.rank}${card2.rank}`;
    }
    
    const ranks = [card1.rank, card2.rank].sort((a, b) => getRankValue(b) - getRankValue(a));
    return `${ranks[0]}${ranks[1]}${suited}`;
  }

  // Public getters for debugging/analysis
  public getPersonality(): AIPersonality {
    return { ...this.personality };
  }

  public getStats(): { handsPlayed: number; vpip: number; pfr: number } {
    return {
      handsPlayed: this.handsPlayed,
      vpip: this.vpip,
      pfr: this.pfr
    };
  }
}