import { Card, OddsCalculation, PotOdds, ImpliedOdds } from '../types';
import { evaluateHand, compareHands } from '../game-engine/evaluator';
import { getAvailableCards, getRankValue } from '../game-engine/deck';

// Calculate hand equity using Monte Carlo simulation
export function calculateEquity(
  holeCards: Card[],
  communityCards: Card[],
  opponentHoleCards: Card[][] = [],
  numSimulations: number = 10000
): number {
  if (communityCards.length === 5) {
    // All cards dealt, calculate exactly
    return calculateExactEquity(holeCards, communityCards, opponentHoleCards);
  }

  let wins = 0;
  let ties = 0;

  const usedCards = [...holeCards, ...communityCards, ...opponentHoleCards.flat()];
  
  for (let i = 0; i < numSimulations; i++) {
    const availableCards = getAvailableCards(usedCards);
    const shuffled = shuffleArray([...availableCards]);
    
    // Complete community cards
    const fullCommunity = [...communityCards];
    const cardsNeeded = 5 - communityCards.length;
    
    for (let j = 0; j < cardsNeeded; j++) {
      fullCommunity.push(shuffled[j]);
    }
    
    // Generate random opponent hands if not specified
    const allOpponentHands = [...opponentHoleCards];
    let cardIndex = cardsNeeded;
    
    while (allOpponentHands.length < 3 && cardIndex + 1 < shuffled.length) {
      allOpponentHands.push([shuffled[cardIndex], shuffled[cardIndex + 1]]);
      cardIndex += 2;
    }
    
    // Evaluate all hands
    const playerHand = evaluateHand([...holeCards, ...fullCommunity]);
    const opponentHands = allOpponentHands.map(cards => 
      evaluateHand([...cards, ...fullCommunity])
    );
    
    // Compare with all opponents
    let playerWins = true;
    let playerTies = false;
    
    for (const opponentHand of opponentHands) {
      const comparison = compareHands(playerHand, opponentHand);
      if (comparison < 0) {
        playerWins = false;
        break;
      } else if (comparison === 0) {
        playerTies = true;
      }
    }
    
    if (playerWins && !playerTies) {
      wins++;
    } else if (playerTies) {
      ties++;
    }
  }
  
  return ((wins + ties * 0.5) / numSimulations) * 100;
}

function calculateExactEquity(
  holeCards: Card[],
  communityCards: Card[],
  opponentHoleCards: Card[][]
): number {
  const playerHand = evaluateHand([...holeCards, ...communityCards]);
  const opponentHands = opponentHoleCards.map(cards => 
    evaluateHand([...cards, ...communityCards])
  );
  
  let wins = 0;
  let ties = 0;
  
  for (const opponentHand of opponentHands) {
    const comparison = compareHands(playerHand, opponentHand);
    if (comparison > 0) {
      wins++;
    } else if (comparison === 0) {
      ties++;
    }
  }
  
  const totalOpponents = opponentHands.length;
  if (totalOpponents === 0) return 100;
  
  return ((wins + ties * 0.5) / totalOpponents) * 100;
}

// Calculate outs (cards that improve the hand)
export function calculateOuts(
  holeCards: Card[],
  communityCards: Card[]
): number {
  if (communityCards.length >= 5) return 0;
  
  const usedCards = [...holeCards, ...communityCards];
  const availableCards = getAvailableCards(usedCards);
  
  let outs = 0;
  const currentHand = evaluateHand([...holeCards, ...communityCards.slice(0, Math.min(5, holeCards.length + communityCards.length))]);
  
  for (const card of availableCards) {
    const testCards = communityCards.length < 5 
      ? [...communityCards, card]
      : communityCards;
      
    const newHand = evaluateHand([...holeCards, ...testCards.slice(0, 5)]);
    
    if (compareHands(newHand, currentHand) > 0) {
      outs++;
    }
  }
  
  return outs;
}

// Calculate odds using the rule of 4 and 2
export function calculateHandOdds(outs: number, cardsTocome: number): OddsCalculation {
  
  // More accurate calculation
  const exactTwoCard = (1 - (47 - outs) / 47 * (46 - outs) / 46) * 100;
  const exactOneCard = (outs / (52 - 5)) * 100; // Assuming 5 known cards
  
  return {
    outs,
    equity: cardsTocome === 2 ? exactTwoCard : exactOneCard,
    oneCardOdds: exactOneCard,
    twoCardOdds: exactTwoCard
  };
}

// Calculate pot odds
export function calculatePotOdds(
  potSize: number,
  betSize: number,
  callAmount: number = betSize
): PotOdds {
  const totalPot = potSize + betSize;
  const odds = totalPot / callAmount;
  const percentage = (callAmount / (totalPot + callAmount)) * 100;
  
  return {
    potSize,
    betSize,
    callAmount,
    odds,
    percentage
  };
}

// Calculate implied odds
export function calculateImpliedOdds(
  potOdds: PotOdds,
  impliedWinnings: number
): ImpliedOdds {
  const totalImpliedPot = potOdds.potSize + potOdds.betSize + impliedWinnings;
  const effectiveOdds = totalImpliedPot / potOdds.callAmount;
  
  return {
    ...potOdds,
    impliedWinnings,
    effectiveOdds
  };
}

// Pre-flop hand strength rankings
export function getPreFlopEquity(card1: Card, card2: Card): number {
  const rank1 = getRankValue(card1.rank);
  const rank2 = getRankValue(card2.rank);
  const suited = card1.suit === card2.suit;
  const isPair = rank1 === rank2;
  const isConnected = Math.abs(rank1 - rank2) <= 1 && !isPair;
  const highCard = Math.max(rank1, rank2);
  const lowCard = Math.min(rank1, rank2);
  
  // Base equity calculation (simplified)
  let equity = 50; // Starting point
  
  if (isPair) {
    // Pocket pairs
    if (highCard >= 10) equity = 70 + (highCard - 10) * 3; // TT-AA
    else if (highCard >= 6) equity = 55 + (highCard - 6) * 3; // 66-99  
    else equity = 45 + (highCard - 2) * 2; // 22-55
  } else {
    // Non-pairs
    if (highCard === 14) { // Ace
      if (lowCard >= 10) equity = suited ? 67 : 63; // AK, AQ, AJ, AT
      else if (lowCard >= 7) equity = suited ? 58 : 52; // A9-A7
      else equity = suited ? 52 : 45; // A6-A2
    } else if (highCard === 13) { // King
      if (lowCard >= 11) equity = suited ? 61 : 57; // KQ, KJ
      else if (lowCard >= 9) equity = suited ? 54 : 48; // KT, K9
      else equity = suited ? 48 : 42; // K8-K2
    } else if (highCard >= 11) { // Queen, Jack
      if (isConnected) equity = suited ? 57 : 52; // QJ, JT
      else if (lowCard >= 9) equity = suited ? 52 : 46; // QT, Q9, etc
      else equity = suited ? 46 : 40;
    } else {
      // Lower cards
      if (isConnected && suited) equity = 47 + (highCard - 6) * 2;
      else if (isConnected) equity = 42 + (highCard - 6) * 2;
      else if (suited) equity = 40 + (highCard - 6);
      else equity = 35 + (highCard - 6);
    }
  }
  
  return Math.min(95, Math.max(15, equity));
}

// Utility function to shuffle array
function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// Calculate required equity based on pot odds
export function calculateRequiredEquity(potOdds: number): number {
  return (1 / (potOdds + 1)) * 100;
}

// Determine if a call is profitable
export function isProfitableCall(
  equity: number,
  potOdds: PotOdds,
  impliedOdds?: ImpliedOdds
): boolean {
  const requiredEquity = calculateRequiredEquity(impliedOdds?.effectiveOdds || potOdds.odds);
  return equity >= requiredEquity;
}