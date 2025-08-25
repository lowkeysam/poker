import { GameState, Player, Action, GameAction, HandResult, GameSettings } from '../types';
import { Deck } from './deck';
import { evaluateHand, compareHands } from './evaluator';
import { AIPlayerDecision, AI_PERSONALITIES } from './ai-player';

export class PokerGame {
  private gameState: GameState;
  private deck: Deck;
  private settings: GameSettings;
  private aiPlayers: Map<string, AIPlayerDecision> = new Map();
  private aiActionTimer: NodeJS.Timeout | null = null;

  constructor(settings: GameSettings) {
    this.settings = settings;
    this.deck = new Deck();
    this.gameState = this.initializeGame();
    this.initializeAIPlayers();
  }

  private initializeGame(): GameState {
    const players: Player[] = [];
    
    // Create players
    for (let i = 0; i < this.settings.numPlayers; i++) {
      players.push({
        id: `player_${i}`,
        name: i === 0 ? 'You' : `Player ${i + 1}`,
        chips: this.settings.startingChips,
        position: i,
        holeCards: [],
        isActive: true,
        hasActed: false,
        currentBet: 0,
        isAllIn: false,
        isFolded: false,
        isHuman: i === 0, // First player is human
        showCards: false
      });
    }

    return {
      stage: 'preflop',
      pot: 0,
      communityCards: [],
      players,
      dealer: 0,
      smallBlind: this.settings.smallBlind,
      bigBlind: this.settings.bigBlind,
      currentPlayerIndex: 0,
      gameActions: [],
      minRaise: this.settings.bigBlind,
      sidePots: []
    };
  }

  private initializeAIPlayers(): void {
    // Assign AI personalities to non-human players
    const personalityTypes = Object.keys(AI_PERSONALITIES);
    
    for (const player of this.gameState.players) {
      if (!player.isHuman) {
        // Assign a random personality, but ensure variety
        const personalityType = personalityTypes[Math.floor(Math.random() * personalityTypes.length)];
        this.aiPlayers.set(player.id, new AIPlayerDecision(personalityType));
        
        // Update player name to include personality hint
        const personality = AI_PERSONALITIES[personalityType];
        player.name = `${player.name} (${personality.name})`;
      }
    }
  }

  startNewHand(): void {
    // Stop any pending AI actions
    this.stopAIActions();
    
    this.deck.reset();
    this.gameState.stage = 'preflop';
    this.gameState.pot = 0;
    this.gameState.communityCards = [];
    this.gameState.gameActions = [];
    this.gameState.sidePots = [];
    this.gameState.minRaise = this.gameState.bigBlind;

    // Reset player states
    for (const player of this.gameState.players) {
      player.holeCards = [];
      player.hasActed = false;
      player.currentBet = 0;
      player.isAllIn = false;
      player.isFolded = false;
      player.showCards = false;
      player.isActive = player.chips > 0;
    }

    // Move dealer button
    this.gameState.dealer = (this.gameState.dealer + 1) % this.gameState.players.length;

    // Post blinds
    this.postBlinds();

    // Deal hole cards
    this.dealHoleCards();

    // Set first player to act (left of big blind)
    this.gameState.currentPlayerIndex = this.getNextPlayerIndex((this.gameState.dealer + 3) % this.gameState.players.length);
    
    // Start AI actions if needed
    this.scheduleAIAction();
  }

  private postBlinds(): void {
    const activePlayers = this.gameState.players.filter(p => p.isActive);
    if (activePlayers.length < 2) return;

    const smallBlindPos = (this.gameState.dealer + 1) % this.gameState.players.length;
    const bigBlindPos = (this.gameState.dealer + 2) % this.gameState.players.length;

    const smallBlindPlayer = this.gameState.players[smallBlindPos];
    const bigBlindPlayer = this.gameState.players[bigBlindPos];

    // Post small blind
    const smallBlindAmount = Math.min(smallBlindPlayer.chips, this.gameState.smallBlind);
    smallBlindPlayer.chips -= smallBlindAmount;
    smallBlindPlayer.currentBet = smallBlindAmount;
    this.gameState.pot += smallBlindAmount;

    if (smallBlindAmount < this.gameState.smallBlind) {
      smallBlindPlayer.isAllIn = true;
    }

    // Post big blind
    const bigBlindAmount = Math.min(bigBlindPlayer.chips, this.gameState.bigBlind);
    bigBlindPlayer.chips -= bigBlindAmount;
    bigBlindPlayer.currentBet = bigBlindAmount;
    this.gameState.pot += bigBlindAmount;

    if (bigBlindAmount < this.gameState.bigBlind) {
      bigBlindPlayer.isAllIn = true;
    }
  }

  private dealHoleCards(): void {
    // Deal 2 cards to each active player
    for (let round = 0; round < 2; round++) {
      for (const player of this.gameState.players) {
        if (player.isActive) {
          const card = this.deck.deal();
          if (card) {
            player.holeCards.push(card);
          }
        }
      }
    }

    // Don't show opponent cards during initial deal - only after flop
    // Reset all showCards flags during new hand
    this.gameState.players.forEach(p => {
      p.showCards = false;
    });
  }

  private maybeShowOpponentCards(): void {
    const opponents = this.gameState.players.filter(p => !p.isHuman && p.isActive && !p.isFolded);
    const numToShow = Math.min(2, Math.floor(Math.random() * opponents.length + 1));
    
    for (let i = 0; i < numToShow; i++) {
      const randomIndex = Math.floor(Math.random() * opponents.length);
      opponents[randomIndex].showCards = true;
    }
  }

  private maybeShowOpponentCardsPostFlop(): void {
    // Only show opponent cards after flop for players who are still active
    if (this.settings.showOpponentCards === 'sometimes') {
      const opponents = this.gameState.players.filter(p => !p.isHuman && p.isActive && !p.isFolded);
      const numToShow = Math.min(2, Math.floor(Math.random() * opponents.length + 1));
      
      for (let i = 0; i < numToShow; i++) {
        const randomIndex = Math.floor(Math.random() * opponents.length);
        opponents[randomIndex].showCards = true;
      }
    } else if (this.settings.showOpponentCards === 'always') {
      this.gameState.players.forEach(p => {
        if (!p.isHuman && p.isActive && !p.isFolded) {
          p.showCards = true;
        }
      });
    }
  }

  playerAction(action: Action, amount?: number): boolean {
    const currentPlayer = this.gameState.players[this.gameState.currentPlayerIndex];
    if (!currentPlayer || !currentPlayer.isActive || currentPlayer.isFolded) {
      return false;
    }

    const gameAction: GameAction = {
      playerId: currentPlayer.id,
      action,
      amount: amount || 0,
      timestamp: new Date()
    };

    let success = false;

    switch (action) {
      case 'fold':
        success = this.handleFold(currentPlayer);
        break;
      case 'check':
        success = this.handleCheck(currentPlayer);
        break;
      case 'call':
        success = this.handleCall(currentPlayer);
        break;
      case 'bet':
      case 'raise':
        success = this.handleBetRaise(currentPlayer, amount || 0);
        gameAction.amount = amount || 0;
        break;
      case 'all-in':
        success = this.handleAllIn(currentPlayer);
        gameAction.amount = currentPlayer.chips;
        break;
    }

    if (success) {
      this.gameState.gameActions.push(gameAction);
      currentPlayer.hasActed = true;
      
      // Move to next player or next stage
      if (this.isBettingRoundComplete()) {
        this.advanceStage();
      } else {
        this.gameState.currentPlayerIndex = this.getNextPlayerIndex(this.gameState.currentPlayerIndex);
        // After moving to next player, check if it's an AI player and schedule their action
        this.scheduleAIAction();
      }
    }

    return success;
  }

  private handleFold(player: Player): boolean {
    player.isFolded = true;
    return true;
  }

  private handleCheck(player: Player): boolean {
    const maxBet = Math.max(...this.gameState.players.map(p => p.currentBet));
    return player.currentBet === maxBet;
  }

  private handleCall(player: Player): boolean {
    const maxBet = Math.max(...this.gameState.players.map(p => p.currentBet));
    const callAmount = maxBet - player.currentBet;
    
    if (callAmount <= 0) return false;
    
    const actualCall = Math.min(callAmount, player.chips);
    player.chips -= actualCall;
    player.currentBet += actualCall;
    this.gameState.pot += actualCall;
    
    if (actualCall < callAmount) {
      player.isAllIn = true;
    }
    
    return true;
  }

  private handleBetRaise(player: Player, amount: number): boolean {
    const maxBet = Math.max(...this.gameState.players.map(p => p.currentBet));
    const totalBet = maxBet + amount;
    const requiredChips = totalBet - player.currentBet;
    
    if (requiredChips > player.chips || amount < this.gameState.minRaise) {
      return false;
    }
    
    player.chips -= requiredChips;
    this.gameState.pot += requiredChips;
    player.currentBet = totalBet;
    this.gameState.minRaise = amount;
    
    return true;
  }

  private handleAllIn(player: Player): boolean {
    const allInAmount = player.chips;
    this.gameState.pot += allInAmount;
    player.currentBet += allInAmount;
    player.chips = 0;
    player.isAllIn = true;
    return true;
  }

  private isBettingRoundComplete(): boolean {
    const activePlayers = this.gameState.players.filter(p => p.isActive && !p.isFolded);
    
    if (activePlayers.length <= 1) return true;
    
    const maxBet = Math.max(...this.gameState.players.map(p => p.currentBet));
    const playersCanAct = activePlayers.filter(p => !p.isAllIn && (!p.hasActed || p.currentBet < maxBet));
    
    return playersCanAct.length === 0;
  }

  private advanceStage(): void {
    // Reset for next betting round
    this.gameState.players.forEach(p => {
      p.hasActed = false;
      p.currentBet = 0;
    });

    this.gameState.minRaise = this.gameState.bigBlind;
    
    switch (this.gameState.stage) {
      case 'preflop':
        this.dealFlop();
        this.gameState.stage = 'flop';
        // Now show some opponent cards for learning (they've "stayed in" past preflop)
        this.maybeShowOpponentCardsPostFlop();
        break;
      case 'flop':
        this.dealTurn();
        this.gameState.stage = 'turn';
        break;
      case 'turn':
        this.dealRiver();
        this.gameState.stage = 'river';
        break;
      case 'river':
        this.gameState.stage = 'showdown';
        this.determineWinners();
        return;
    }

    // Set first player to act (left of dealer)
    this.gameState.currentPlayerIndex = this.getNextPlayerIndex((this.gameState.dealer + 1) % this.gameState.players.length);
    
    // Schedule AI action for new betting round
    this.scheduleAIAction();
  }

  private dealFlop(): void {
    this.deck.deal(); // Burn card
    for (let i = 0; i < 3; i++) {
      const card = this.deck.deal();
      if (card) {
        this.gameState.communityCards.push(card);
      }
    }
  }

  private dealTurn(): void {
    this.deck.deal(); // Burn card
    const card = this.deck.deal();
    if (card) {
      this.gameState.communityCards.push(card);
    }
  }

  private dealRiver(): void {
    this.deck.deal(); // Burn card
    const card = this.deck.deal();
    if (card) {
      this.gameState.communityCards.push(card);
    }
  }

  private determineWinners(): HandResult[] {
    const activePlayers = this.gameState.players.filter(p => p.isActive && !p.isFolded);
    
    if (activePlayers.length === 1) {
      // Only one player left
      const winner = activePlayers[0];
      winner.chips += this.gameState.pot;
      return [{
        playerId: winner.id,
        hand: [...winner.holeCards, ...this.gameState.communityCards],
        handRank: 0,
        handName: 'Winner by default',
        winnings: this.gameState.pot
      }];
    }

    // Evaluate all hands
    const handEvaluations = activePlayers.map(player => ({
      player,
      evaluation: evaluateHand([...player.holeCards, ...this.gameState.communityCards])
    }));

    // Sort by hand strength
    handEvaluations.sort((a, b) => compareHands(b.evaluation, a.evaluation));

    // Determine winners (might be multiple in case of tie)
    const winners = [handEvaluations[0]];
    for (let i = 1; i < handEvaluations.length; i++) {
      if (compareHands(handEvaluations[i].evaluation, winners[0].evaluation) === 0) {
        winners.push(handEvaluations[i]);
      } else {
        break;
      }
    }

    // Distribute pot
    const winningsPerPlayer = Math.floor(this.gameState.pot / winners.length);
    const results: HandResult[] = [];

    for (const winner of winners) {
      winner.player.chips += winningsPerPlayer;
      results.push({
        playerId: winner.player.id,
        hand: winner.evaluation.cards,
        handRank: winner.evaluation.rank,
        handName: winner.evaluation.name,
        winnings: winningsPerPlayer
      });
    }

    return results;
  }

  private getNextPlayerIndex(startIndex: number): number {
    let index = (startIndex + 1) % this.gameState.players.length;
    while (index !== startIndex) {
      const player = this.gameState.players[index];
      if (player.isActive && !player.isFolded && !player.isAllIn) {
        return index;
      }
      index = (index + 1) % this.gameState.players.length;
    }
    return startIndex; // Fallback
  }

  // Public getters
  getGameState(): GameState {
    return { ...this.gameState };
  }

  getCurrentPlayer(): Player | null {
    return this.gameState.players[this.gameState.currentPlayerIndex] || null;
  }

  getHumanPlayer(): Player | null {
    return this.gameState.players.find(p => p.isHuman) || null;
  }

  isHandComplete(): boolean {
    return this.gameState.stage === 'showdown';
  }

  getValidActions(): Action[] {
    const currentPlayer = this.getCurrentPlayer();
    if (!currentPlayer || currentPlayer.isFolded || currentPlayer.isAllIn) {
      return [];
    }

    const actions: Action[] = ['fold'];
    const maxBet = Math.max(...this.gameState.players.map(p => p.currentBet));
    const callAmount = maxBet - currentPlayer.currentBet;

    if (callAmount === 0) {
      actions.push('check');
    } else {
      actions.push('call');
    }

    if (currentPlayer.chips >= this.gameState.minRaise) {
      actions.push('raise');
    }

    actions.push('all-in');

    return actions;
  }

  // Calculate CSI for a player
  calculateCSI(player: Player): number {
    const totalBlinds = this.gameState.smallBlind + this.gameState.bigBlind;
    return player.chips / totalBlinds;
  }

  // AI Player methods
  private scheduleAIAction(): void {
    // Clear any existing timer
    if (this.aiActionTimer) {
      clearTimeout(this.aiActionTimer);
      this.aiActionTimer = null;
    }

    const currentPlayer = this.getCurrentPlayer();
    if (!currentPlayer || currentPlayer.isHuman || currentPlayer.isFolded || currentPlayer.isAllIn) {
      return;
    }

    // Add realistic thinking time (0.5 to 3 seconds)
    const thinkingTime = Math.random() * 2500 + 500;
    
    this.aiActionTimer = setTimeout(() => {
      this.processAIAction();
    }, thinkingTime);
  }

  private processAIAction(): void {
    const currentPlayer = this.getCurrentPlayer();
    if (!currentPlayer || currentPlayer.isHuman || currentPlayer.isFolded || currentPlayer.isAllIn) {
      return;
    }

    const aiPlayer = this.aiPlayers.get(currentPlayer.id);
    if (!aiPlayer) {
      // Fallback - fold if no AI player found
      this.playerAction('fold');
      return;
    }

    try {
      const validActions = this.getValidActions();
      const decision = aiPlayer.makeDecision(currentPlayer, this.gameState, validActions);
      
      // Execute the AI decision
      console.log(`${currentPlayer.name}: ${decision.reasoning}`);
      this.playerAction(decision.action, decision.amount);
      
    } catch (error) {
      console.error(`AI player ${currentPlayer.name} decision error:`, error);
      // Fallback to safe action
      const validActions = this.getValidActions();
      if (validActions.includes('check')) {
        this.playerAction('check');
      } else if (validActions.includes('fold')) {
        this.playerAction('fold');
      } else if (validActions.length > 0) {
        this.playerAction(validActions[0]);
      }
    }
  }

  // Start AI actions after dealing
  public startAIActions(): void {
    this.scheduleAIAction();
  }

  // Stop AI timer (useful for cleanup)
  public stopAIActions(): void {
    if (this.aiActionTimer) {
      clearTimeout(this.aiActionTimer);
      this.aiActionTimer = null;
    }
  }

  // Get AI player stats for debugging
  public getAIPlayerStats(playerId: string): { personality: Record<string, unknown>; decisionHistory: unknown[]; stats: Record<string, unknown> } | null {
    const aiPlayer = this.aiPlayers.get(playerId);
    return aiPlayer ? {
      personality: aiPlayer.getPersonality(),
      decisionHistory: [], // AI player decision history would go here
      stats: aiPlayer.getStats()
    } : null;
  }
}