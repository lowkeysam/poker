import { Card, Rank, Suit, HandEvaluation } from '../types';
import { getRankValue } from './deck';

// Hand ranking constants
export const HAND_RANKINGS = {
  HIGH_CARD: 1,
  PAIR: 2,
  TWO_PAIR: 3,
  THREE_OF_A_KIND: 4,
  STRAIGHT: 5,
  FLUSH: 6,
  FULL_HOUSE: 7,
  FOUR_OF_A_KIND: 8,
  STRAIGHT_FLUSH: 9,
  ROYAL_FLUSH: 10
} as const;

export const HAND_NAMES = {
  1: 'High Card',
  2: 'Pair',
  3: 'Two Pair', 
  4: 'Three of a Kind',
  5: 'Straight',
  6: 'Flush',
  7: 'Full House',
  8: 'Four of a Kind',
  9: 'Straight Flush',
  10: 'Royal Flush'
} as const;

export function evaluateHand(cards: Card[]): HandEvaluation {
  if (cards.length < 5) {
    throw new Error('Need at least 5 cards to evaluate hand');
  }

  // Get all possible 5-card combinations if more than 5 cards
  const combinations = cards.length === 5 ? [cards] : getCombinations(cards, 5);
  
  let bestHand: HandEvaluation = {
    rank: 1,
    name: 'High Card',
    cards: [],
    kickers: []
  };

  for (const combo of combinations) {
    const evaluation = evaluateFiveCards(combo);
    if (isHandBetter(evaluation, bestHand)) {
      bestHand = evaluation;
    }
  }

  return bestHand;
}

function evaluateFiveCards(cards: Card[]): HandEvaluation {
  const sortedCards = [...cards].sort((a, b) => getRankValue(b.rank) - getRankValue(a.rank));
  
  // Check for flush
  const isFlush = cards.every(card => card.suit === cards[0].suit);
  
  // Check for straight
  const straightResult = checkStraight(sortedCards);
  const isStraight = straightResult.isStraight;
  
  // Get rank counts for pairs/trips/quads
  const rankCounts = getRankCounts(sortedCards);
  const countValues = Object.values(rankCounts).sort((a, b) => b - a);
  
  // Determine hand type
  if (isFlush && isStraight) {
    if (straightResult.highCard === 14) { // Ace high straight flush
      return {
        rank: HAND_RANKINGS.ROYAL_FLUSH,
        name: HAND_NAMES[HAND_RANKINGS.ROYAL_FLUSH],
        cards: straightResult.cards,
        kickers: []
      };
    } else {
      return {
        rank: HAND_RANKINGS.STRAIGHT_FLUSH,
        name: HAND_NAMES[HAND_RANKINGS.STRAIGHT_FLUSH],
        cards: straightResult.cards,
        kickers: []
      };
    }
  }
  
  if (countValues[0] === 4) {
    return makeFourOfAKindHand(sortedCards, rankCounts);
  }
  
  if (countValues[0] === 3 && countValues[1] === 2) {
    return makeFullHouseHand(sortedCards, rankCounts);
  }
  
  if (isFlush) {
    return {
      rank: HAND_RANKINGS.FLUSH,
      name: HAND_NAMES[HAND_RANKINGS.FLUSH],
      cards: sortedCards,
      kickers: []
    };
  }
  
  if (isStraight) {
    return {
      rank: HAND_RANKINGS.STRAIGHT,
      name: HAND_NAMES[HAND_RANKINGS.STRAIGHT],
      cards: straightResult.cards,
      kickers: []
    };
  }
  
  if (countValues[0] === 3) {
    return makeThreeOfAKindHand(sortedCards, rankCounts);
  }
  
  if (countValues[0] === 2 && countValues[1] === 2) {
    return makeTwoPairHand(sortedCards, rankCounts);
  }
  
  if (countValues[0] === 2) {
    return makePairHand(sortedCards, rankCounts);
  }
  
  return {
    rank: HAND_RANKINGS.HIGH_CARD,
    name: HAND_NAMES[HAND_RANKINGS.HIGH_CARD],
    cards: sortedCards,
    kickers: []
  };
}

function checkStraight(sortedCards: Card[]): { isStraight: boolean; highCard: number; cards: Card[] } {
  const values = sortedCards.map(card => getRankValue(card.rank));
  
  // Check for ace-low straight (A-2-3-4-5)
  if (values[0] === 14 && values[1] === 5 && values[2] === 4 && values[3] === 3 && values[4] === 2) {
    return {
      isStraight: true,
      highCard: 5, // 5-high straight
      cards: [sortedCards[1], sortedCards[2], sortedCards[3], sortedCards[4], sortedCards[0]] // 5-4-3-2-A order
    };
  }
  
  // Check for regular straight
  let consecutive = true;
  for (let i = 1; i < values.length; i++) {
    if (values[i] !== values[i-1] - 1) {
      consecutive = false;
      break;
    }
  }
  
  return {
    isStraight: consecutive,
    highCard: consecutive ? values[0] : 0,
    cards: consecutive ? sortedCards : []
  };
}

function getRankCounts(cards: Card[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const card of cards) {
    counts[card.rank] = (counts[card.rank] || 0) + 1;
  }
  return counts;
}

function makeFourOfAKindHand(sortedCards: Card[], rankCounts: Record<string, number>): HandEvaluation {
  const quadRank = Object.keys(rankCounts).find(rank => rankCounts[rank] === 4)!;
  const kicker = Object.keys(rankCounts).find(rank => rankCounts[rank] === 1)!;
  
  const quadCards = sortedCards.filter(card => card.rank === quadRank);
  const kickerCard = sortedCards.filter(card => card.rank === kicker);
  
  return {
    rank: HAND_RANKINGS.FOUR_OF_A_KIND,
    name: HAND_NAMES[HAND_RANKINGS.FOUR_OF_A_KIND],
    cards: [...quadCards, ...kickerCard],
    kickers: kickerCard
  };
}

function makeFullHouseHand(sortedCards: Card[], rankCounts: Record<string, number>): HandEvaluation {
  const tripRank = Object.keys(rankCounts).find(rank => rankCounts[rank] === 3)!;
  const pairRank = Object.keys(rankCounts).find(rank => rankCounts[rank] === 2)!;
  
  const tripCards = sortedCards.filter(card => card.rank === tripRank);
  const pairCards = sortedCards.filter(card => card.rank === pairRank);
  
  return {
    rank: HAND_RANKINGS.FULL_HOUSE,
    name: HAND_NAMES[HAND_RANKINGS.FULL_HOUSE],
    cards: [...tripCards, ...pairCards],
    kickers: []
  };
}

function makeThreeOfAKindHand(sortedCards: Card[], rankCounts: Record<string, number>): HandEvaluation {
  const tripRank = Object.keys(rankCounts).find(rank => rankCounts[rank] === 3)!;
  const kickers = Object.keys(rankCounts)
    .filter(rank => rankCounts[rank] === 1)
    .sort((a, b) => getRankValue(b as Rank) - getRankValue(a as Rank));
  
  const tripCards = sortedCards.filter(card => card.rank === tripRank);
  const kickerCards = sortedCards.filter(card => kickers.includes(card.rank));
  
  return {
    rank: HAND_RANKINGS.THREE_OF_A_KIND,
    name: HAND_NAMES[HAND_RANKINGS.THREE_OF_A_KIND],
    cards: [...tripCards, ...kickerCards],
    kickers: kickerCards
  };
}

function makeTwoPairHand(sortedCards: Card[], rankCounts: Record<string, number>): HandEvaluation {
  const pairs = Object.keys(rankCounts)
    .filter(rank => rankCounts[rank] === 2)
    .sort((a, b) => getRankValue(b as Rank) - getRankValue(a as Rank));
  const kicker = Object.keys(rankCounts).find(rank => rankCounts[rank] === 1)!;
  
  const pairCards = sortedCards.filter(card => pairs.includes(card.rank));
  const kickerCard = sortedCards.filter(card => card.rank === kicker);
  
  return {
    rank: HAND_RANKINGS.TWO_PAIR,
    name: HAND_NAMES[HAND_RANKINGS.TWO_PAIR],
    cards: [...pairCards, ...kickerCard],
    kickers: kickerCard
  };
}

function makePairHand(sortedCards: Card[], rankCounts: Record<string, number>): HandEvaluation {
  const pairRank = Object.keys(rankCounts).find(rank => rankCounts[rank] === 2)!;
  const kickers = Object.keys(rankCounts)
    .filter(rank => rankCounts[rank] === 1)
    .sort((a, b) => getRankValue(b as Rank) - getRankValue(a as Rank));
  
  const pairCards = sortedCards.filter(card => card.rank === pairRank);
  const kickerCards = sortedCards.filter(card => kickers.includes(card.rank));
  
  return {
    rank: HAND_RANKINGS.PAIR,
    name: HAND_NAMES[HAND_RANKINGS.PAIR],
    cards: [...pairCards, ...kickerCards],
    kickers: kickerCards
  };
}

function isHandBetter(hand1: HandEvaluation, hand2: HandEvaluation): boolean {
  if (hand1.rank > hand2.rank) return true;
  if (hand1.rank < hand2.rank) return false;
  
  // Same rank - compare by high cards
  return compareByHighCards(hand1.cards, hand2.cards);
}

function compareByHighCards(cards1: Card[], cards2: Card[]): boolean {
  for (let i = 0; i < Math.min(cards1.length, cards2.length); i++) {
    const value1 = getRankValue(cards1[i].rank);
    const value2 = getRankValue(cards2[i].rank);
    if (value1 > value2) return true;
    if (value1 < value2) return false;
  }
  return false;
}

function getCombinations(cards: Card[], size: number): Card[][] {
  if (size === 1) return cards.map(card => [card]);
  if (size === cards.length) return [cards];
  
  const combinations: Card[][] = [];
  for (let i = 0; i <= cards.length - size; i++) {
    const head = cards[i];
    const tailCombinations = getCombinations(cards.slice(i + 1), size - 1);
    for (const tail of tailCombinations) {
      combinations.push([head, ...tail]);
    }
  }
  return combinations;
}

// Utility function to compare two hands and determine winner
export function compareHands(hand1: HandEvaluation, hand2: HandEvaluation): number {
  if (hand1.rank > hand2.rank) return 1;
  if (hand1.rank < hand2.rank) return -1;
  
  // Same rank - compare by high cards
  for (let i = 0; i < Math.min(hand1.cards.length, hand2.cards.length); i++) {
    const value1 = getRankValue(hand1.cards[i].rank);
    const value2 = getRankValue(hand2.cards[i].rank);
    if (value1 > value2) return 1;
    if (value1 < value2) return -1;
  }
  
  return 0; // Tie
}