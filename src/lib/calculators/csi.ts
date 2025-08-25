import { CSIInfo, Card, Rank } from '../types';
import { getRankValue } from '../game-engine/deck';

// Calculate CSI (Chip Stacks Index)
export function calculateCSI(
  chips: number,
  smallBlind: number,
  bigBlind: number,
  antes: number = 0
): number {
  const totalBlindsAndAntes = smallBlind + bigBlind + antes;
  return chips / totalBlindsAndAntes;
}

// Get CSI info and strategy recommendations
export function getCSIInfo(csi: number): CSIInfo {
  if (csi <= 2) {
    return {
      csi,
      strategy: 'Push/Fold Only',
      description: 'Very short stack - push any two cards in most situations',
      recommendedAction: 'Look for any spot to get chips in the middle'
    };
  } else if (csi <= 7) {
    return {
      csi,
      strategy: 'Primarily Push/Fold',
      description: 'Short stack - use specific push/fold ranges',
      recommendedAction: 'Follow push/fold charts strictly'
    };
  } else if (csi <= 12) {
    return {
      csi,
      strategy: 'Mixed Strategy',
      description: 'Can start playing some post-flop poker',
      recommendedAction: 'Mix between pushing and standard play'
    };
  } else {
    return {
      csi,
      strategy: 'Standard Play',
      description: 'Deep enough for normal tournament poker',
      recommendedAction: 'Use position and post-flop skills'
    };
  }
}

// Check if hand is in push range for given CSI and position
export function shouldPush(
  holeCards: Card[],
  csi: number,
  position: 'early' | 'middle' | 'late' | 'small_blind' | 'big_blind' | 'button',
  numOpponents: number = 1,
  hasAntes: boolean = false
): boolean {
  // Convert cards to standard notation
  const handString = cardsToHandString(holeCards);
  
  // Get appropriate push range
  const pushRange = getPushRange(csi, position, numOpponents, hasAntes);
  
  return isHandInRange(handString, pushRange);
}

// Check if should call an all-in push
export function shouldCallPush(
  holeCards: Card[],
  csi: number,
  position: 'small_blind' | 'big_blind',
  pusherPosition: string,
  pusherCSI: number
): boolean {
  const handString = cardsToHandString(holeCards);
  const callingRange = getCallingRange(csi, position, pusherPosition, pusherCSI);
  
  return isHandInRange(handString, callingRange);
}

// Get push range for specific situation
function getPushRange(
  csi: number,
  position: string,
  numOpponents: number,
  hasAntes: boolean
): string[] {
  // Adjust CSI for antes
  const adjustedCSI = hasAntes ? csi * 1.2 : csi;
  
  // Get base range from charts
  let range: string[] = [];
  
  if (adjustedCSI <= 2) {
    // Very wide ranges
    if (position === 'button' && numOpponents === 1) {
      range = ['22+', 'A2+', 'K2+', 'Q2+', 'J2+', 'T2+', '92+', '82+', '72+', '62+', '52+', '42+', '32+'];
    } else if (position === 'small_blind') {
      range = ['22+', 'A2+', 'K2+', 'Q2+', 'J4+', 'T6+', '96+', '86+', '76', '65'];
    } else {
      range = ['22+', 'A5+', 'K8+', 'Q9+', 'JT+'];
    }
  } else if (adjustedCSI <= 5) {
    if (position === 'late' || position === 'button') {
      range = ['22+', 'A2+', 'K4+', 'Q8+', 'J9+', 'T9+', '98+', '87+', '76+', '65+', '54+'];
    } else if (position === 'middle') {
      range = ['33+', 'A7+', 'K9+', 'QT+', 'JT+'];
    } else {
      range = ['66+', 'AT+', 'KQ'];
    }
  } else if (adjustedCSI <= 10) {
    if (position === 'late' || position === 'button') {
      range = ['22+', 'A5+', 'K7+', 'Q9+', 'JT+', 'T9+', '98+', '87+'];
    } else if (position === 'middle') {
      range = ['55+', 'A9+', 'KT+', 'QJ+'];
    } else {
      range = ['77+', 'AJ+', 'KQ'];
    }
  } else {
    // Standard opening ranges
    if (position === 'late' || position === 'button') {
      range = ['22+', 'A2+', 'K5+', 'Q8+', 'J9+', 'T9+', '98+', '87+', '76+', '65+'];
    } else if (position === 'middle') {
      range = ['44+', 'A9+', 'KT+', 'QJ+', 'JT+'];
    } else {
      range = ['88+', 'AQ+', 'KQ'];
    }
  }
  
  return range;
}

// Get calling range against a push
function getCallingRange(
  csi: number,
  position: 'small_blind' | 'big_blind',
  pusherPosition: string,
  pusherCSI: number
): string[] {
  // Tighter ranges for calling than pushing
  const baseCSI = Math.max(csi, pusherCSI) * 0.8; // Adjust based on stack sizes
  
  let range: string[] = [];
  
  if (baseCSI <= 3) {
    if (position === 'big_blind') {
      range = ['66+', 'AT+', 'KJ+'];
    } else {
      range = ['77+', 'AJ+', 'KQ'];
    }
  } else if (baseCSI <= 7) {
    if (position === 'big_blind') {
      range = ['44+', 'A9+', 'KT+', 'QJ+'];
    } else {
      range = ['55+', 'AT+', 'KJ+'];
    }
  } else {
    if (position === 'big_blind') {
      range = ['33+', 'A8+', 'K9+', 'QT+', 'JT+'];
    } else {
      range = ['44+', 'A9+', 'KT+', 'QJ+'];
    }
  }
  
  return range;
}

// Convert cards to hand string notation
function cardsToHandString(cards: Card[]): string {
  if (cards.length !== 2) return '';
  
  const card1 = cards[0];
  const card2 = cards[1];
  const rank1 = card1.rank;
  const rank2 = card2.rank;
  const suited = card1.suit === card2.suit;
  
  // Handle pairs
  if (rank1 === rank2) {
    return `${rank1}${rank2}`;
  }
  
  // Order by rank (higher first)
  const val1 = getRankValue(rank1);
  const val2 = getRankValue(rank2);
  const highRank = val1 > val2 ? rank1 : rank2;
  const lowRank = val1 > val2 ? rank2 : rank1;
  
  return `${highRank}${lowRank}${suited ? 's' : 'o'}`;
}

// Check if hand is in range
function isHandInRange(handString: string, range: string[]): boolean {
  for (const rangeItem of range) {
    if (matchesRange(handString, rangeItem)) {
      return true;
    }
  }
  return false;
}

// Check if hand matches a range item (e.g., "77+" or "ATs")
function matchesRange(handString: string, rangeItem: string): boolean {
  // Handle specific hands
  if (handString === rangeItem) {
    return true;
  }
  
  // Handle ranges like "77+" or "A9+"
  if (rangeItem.endsWith('+')) {
    const baseHand = rangeItem.slice(0, -1);
    return handInRangeOrBetter(handString, baseHand);
  }
  
  return false;
}

// Check if hand is in range or better
function handInRangeOrBetter(handString: string, baseHand: string): boolean {
  // Handle pairs
  if (baseHand.length === 2 && baseHand[0] === baseHand[1]) {
    if (handString.length === 2 && handString[0] === handString[1]) {
      const handRank = getRankValue(handString[0] as Rank);
      const baseRank = getRankValue(baseHand[0] as Rank);
      return handRank >= baseRank;
    }
    return false;
  }
  
  // Handle suited/offsuit hands
  if (handString.length === 3 && baseHand.length === 3) {
    const handSuited = handString[2] === 's';
    const baseSuited = baseHand[2] === 's';
    
    // Must match suit preference
    if (handSuited !== baseSuited) return false;
    
    const handRank1 = getRankValue(handString[0] as Rank);
    const handRank2 = getRankValue(handString[1] as Rank);
    const baseRank1 = getRankValue(baseHand[0] as Rank);
    const baseRank2 = getRankValue(baseHand[1] as Rank);
    
    // For Ax hands
    if (baseRank1 === 14) {
      return handRank1 === 14 && handRank2 >= baseRank2;
    }
    
    // For other hands - check if higher or equal
    return (handRank1 >= baseRank1 && handRank2 >= baseRank2) || 
           (handRank1 >= baseRank2 && handRank2 >= baseRank1);
  }
  
  return false;
}

// Get recommended action based on CSI and situation
export function getRecommendedAction(
  holeCards: Card[],
  csi: number,
  position: string,
  facingAction: 'none' | 'call' | 'raise' | 'all-in'
): string {
  if (csi <= 2) {
    if (facingAction === 'none') {
      return 'Push any two cards from late position, fold marginal hands from early position';
    } else {
      return 'Call very tight - only premium hands';
    }
  }
  
  if (csi <= 7) {
    const inPushRange = shouldPush(holeCards, csi, (position === 'unknown' ? 'button' : position) as 'early' | 'middle' | 'late' | 'small_blind' | 'big_blind' | 'button');
    
    if (facingAction === 'none') {
      return inPushRange ? 'Push (all-in)' : 'Fold';
    } else if (facingAction === 'all-in') {
      const shouldCall = shouldCallPush(holeCards, csi, (position === 'unknown' ? 'big_blind' : position) as 'small_blind' | 'big_blind', 'unknown', csi);
      return shouldCall ? 'Call' : 'Fold';
    }
  }
  
  if (csi <= 12) {
    return 'Mixed strategy - can play some post-flop poker with strong hands';
  }
  
  return 'Standard tournament play - use position and post-flop skills';
}

// Export strategy tips for current CSI level
export function getCSIStrategyTips(csi: number): string[] {
  if (csi <= 2) {
    return [
      'Push any two cards from small blind vs big blind',
      'Look for any reasonable spot to get chips in',
      'Don\'t fold in small blind unless facing a call',
      'Survival mode - need to double up quickly'
    ];
  } else if (csi <= 5) {
    return [
      'Push/fold is still primary strategy',
      'Widen pushing ranges from late position',
      'Avoid calling raises without very strong hands',
      'Use detailed push/fold charts'
    ];
  } else if (csi <= 10) {
    return [
      'Can occasionally call raises with strong hands',
      'Still primarily push/fold but with tighter ranges',
      'Look for spots to 3-bet shove',
      'Position becomes more important'
    ];
  } else if (csi <= 15) {
    return [
      'Can start playing some post-flop poker',
      'Still avoid marginal spots without good odds',
      'Mix between pushing and raising',
      'Use position more aggressively'
    ];
  } else {
    return [
      'Can play more standard poker',
      'Use position and post-flop skills',
      'Still be aware of CSI for key decisions',
      'Look for accumulation opportunities'
    ];
  }
}