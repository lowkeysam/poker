import { Card, Rank, Suit } from '../types';

const SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
const RANKS: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K'];

// Unicode card symbols for display
const SUIT_SYMBOLS: Record<Suit, string> = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠'
};

export class Deck {
  private cards: Card[] = [];

  constructor() {
    this.reset();
  }

  reset(): void {
    this.cards = [];
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        this.cards.push({
          rank,
          suit,
          unicode: `${rank}${SUIT_SYMBOLS[suit]}`
        });
      }
    }
    this.shuffle();
  }

  shuffle(): void {
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
  }

  deal(): Card | null {
    return this.cards.pop() || null;
  }

  dealCards(count: number): Card[] {
    const dealtCards: Card[] = [];
    for (let i = 0; i < count; i++) {
      const card = this.deal();
      if (card) {
        dealtCards.push(card);
      }
    }
    return dealtCards;
  }

  size(): number {
    return this.cards.length;
  }

  peek(index: number): Card | null {
    return this.cards[index] || null;
  }
}

// Utility functions for cards
export function createCard(rank: Rank, suit: Suit): Card {
  return {
    rank,
    suit,
    unicode: `${rank}${SUIT_SYMBOLS[suit]}`
  };
}

export function cardToString(card: Card): string {
  return card.unicode;
}

export function cardsToString(cards: Card[]): string {
  return cards.map(cardToString).join(' ');
}

export function parseCard(cardString: string): Card | null {
  if (cardString.length !== 2) return null;
  
  const rank = cardString[0] as Rank;
  const suitChar = cardString[1];
  
  if (!RANKS.includes(rank)) return null;
  
  let suit: Suit;
  switch (suitChar.toLowerCase()) {
    case 'h': suit = 'hearts'; break;
    case 'd': suit = 'diamonds'; break;
    case 'c': suit = 'clubs'; break;
    case 's': suit = 'spades'; break;
    default: return null;
  }
  
  return createCard(rank, suit);
}

export function parseCards(cardsString: string): Card[] {
  return cardsString
    .split(/[\s,]+/)
    .filter(s => s.length > 0)
    .map(parseCard)
    .filter((card): card is Card => card !== null);
}

// Get numeric value of rank for comparison
export function getRankValue(rank: Rank): number {
  switch (rank) {
    case '2': return 2;
    case '3': return 3;
    case '4': return 4;
    case '5': return 5;
    case '6': return 6;
    case '7': return 7;
    case '8': return 8;
    case '9': return 9;
    case 'T': return 10;
    case 'J': return 11;
    case 'Q': return 12;
    case 'K': return 13;
    case 'A': return 14;
    default: return 0;
  }
}

// Check if cards are of same suit
export function isSameSuit(cards: Card[]): boolean {
  if (cards.length < 2) return true;
  const suit = cards[0].suit;
  return cards.every(card => card.suit === suit);
}

// Check if cards form a sequence
export function isSequence(cards: Card[]): boolean {
  if (cards.length < 2) return true;
  
  const values = cards.map(card => getRankValue(card.rank)).sort((a, b) => a - b);
  
  // Check for ace-low straight (A-2-3-4-5)
  if (values.length === 5 && values[4] === 14 && values[3] === 5) {
    const aceLowValues = [1, 2, 3, 4, 5];
    return aceLowValues.every((val, idx) => val === values[idx] || (idx === 4 && values[idx] === 14));
  }
  
  // Check regular sequence
  for (let i = 1; i < values.length; i++) {
    if (values[i] !== values[i-1] + 1) {
      return false;
    }
  }
  
  return true;
}

// Get cards that are not in the excluded set
export function getAvailableCards(excludedCards: Card[]): Card[] {
  const deck = new Deck();
  const allCards = deck['cards']; // Access private property for this utility
  
  return allCards.filter(card => 
    !excludedCards.some(excluded => 
      excluded.rank === card.rank && excluded.suit === card.suit
    )
  );
}