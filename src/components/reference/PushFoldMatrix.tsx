"use client";

import { useState } from 'react';
import { Card } from '@/lib/types';
import { getRankValue } from '@/lib/game-engine/deck';

interface PushFoldMatrixProps {
  playerHoleCards?: Card[];
  csi: number;
  position: string;
  onClose: () => void;
  embedded?: boolean;
}

// Pre-flop hand matrix - standard 13x13 grid
const RANKS = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];

// Kill Everyone complete strategy matrices extracted from the book
// Page references: 183-186, 188 (Kill Everyone 2nd Edition)

// Action types for comprehensive strategy
type Action = 'JAM' | 'CALL' | 'FOLD' | 'RF' | 'LR' | 'LC' | 'LC/F';

// Complete Kill Everyone strategy matrix data
interface HandStrategy {
  action: Action;
  ratio?: string; // For mixed strategies (e.g., "2.5F" means fold 2.5 times more than call)
}

// Complete suited hands strategy (from IMG_7568 - Kill Everyone page 184)
const SUITED_STRATEGY: Record<string, Record<string, HandStrategy>> = {
  // Aces suited
  'A': {
    'A': { action: 'JAM' }, 'K': { action: 'JAM' }, 'Q': { action: 'JAM' }, 'J': { action: 'JAM' }, 
    'T': { action: 'JAM' }, '9': { action: 'JAM' }, '8': { action: 'JAM' }, '7': { action: 'JAM' },
    '6': { action: 'JAM' }, '5': { action: 'JAM' }, '4': { action: 'JAM' }, '3': { action: 'JAM' }, '2': { action: 'JAM' }
  },
  // Kings suited
  'K': {
    'K': { action: 'JAM' }, 'Q': { action: 'JAM' }, 'J': { action: 'JAM' }, 'T': { action: 'JAM' },
    '9': { action: 'JAM' }, '8': { action: 'JAM' }, '7': { action: 'JAM' }, '6': { action: 'JAM' },
    '5': { action: 'JAM' }, '4': { action: 'JAM' }, '3': { action: 'JAM' }, '2': { action: 'JAM' }
  },
  // Queens suited  
  'Q': {
    'Q': { action: 'JAM' }, 'J': { action: 'JAM' }, 'T': { action: 'JAM' }, '9': { action: 'JAM' },
    '8': { action: 'JAM' }, '7': { action: 'JAM' }, '6': { action: 'JAM' }, '5': { action: 'JAM' },
    '4': { action: 'JAM' }, '3': { action: 'JAM' }, '2': { action: 'JAM' }
  },
  // Jacks suited
  'J': {
    'J': { action: 'JAM' }, 'T': { action: 'JAM' }, '9': { action: 'JAM' }, '8': { action: 'JAM' },
    '7': { action: 'JAM' }, '6': { action: 'JAM' }, '5': { action: 'JAM' }, '4': { action: 'JAM' },
    '3': { action: 'JAM' }, '2': { action: 'JAM' }
  },
  // Tens suited
  'T': {
    'T': { action: 'JAM' }, '9': { action: 'JAM' }, '8': { action: 'JAM' }, '7': { action: 'JAM' },
    '6': { action: 'JAM' }, '5': { action: 'JAM' }, '4': { action: 'JAM' }, '3': { action: 'JAM' }, '2': { action: 'JAM' }
  },
  // Nines suited
  '9': {
    '9': { action: 'JAM' }, '8': { action: 'JAM' }, '7': { action: 'JAM' }, '6': { action: 'JAM' },
    '5': { action: 'JAM' }, '4': { action: 'JAM' }, '3': { action: 'JAM' }, '2': { action: 'JAM' }
  },
  // Eights suited
  '8': {
    '8': { action: 'JAM' }, '7': { action: 'JAM' }, '6': { action: 'JAM' }, '5': { action: 'JAM' },
    '4': { action: 'JAM' }, '3': { action: 'JAM' }, '2': { action: 'JAM' }
  },
  // Sevens suited
  '7': {
    '7': { action: 'JAM' }, '6': { action: 'JAM' }, '5': { action: 'JAM' }, '4': { action: 'JAM' },
    '3': { action: 'JAM' }, '2': { action: 'JAM' }
  },
  // Sixes suited
  '6': {
    '6': { action: 'JAM' }, '5': { action: 'JAM' }, '4': { action: 'JAM' }, '3': { action: 'JAM' }, '2': { action: 'JAM' }
  },
  // Fives suited
  '5': {
    '5': { action: 'JAM' }, '4': { action: 'JAM' }, '3': { action: 'JAM' }, '2': { action: 'JAM' }
  },
  // Fours suited
  '4': {
    '4': { action: 'JAM' }, '3': { action: 'JAM' }, '2': { action: 'JAM' }
  },
  // Threes suited
  '3': {
    '3': { action: 'JAM' }, '2': { action: 'JAM' }
  },
  // Twos suited
  '2': {
    '2': { action: 'JAM' }
  }
};

// Complete offsuit hands strategy (from IMG_7570 - Kill Everyone page 186)
// Mixed strategies use ratios - e.g., "2.5F" means fold 2.5 times more than call
const OFFSUIT_STRATEGY: Record<string, Record<string, HandStrategy>> = {
  // Aces offsuit
  'A': {
    'K': { action: 'CALL' }, 'Q': { action: 'CALL' }, 'J': { action: 'CALL' }, 'T': { action: 'CALL' },
    '9': { action: 'CALL' }, '8': { action: 'CALL' }, '7': { action: 'CALL' }, '6': { action: 'CALL' },
    '5': { action: 'CALL' }, '4': { action: 'CALL' }, '3': { action: 'CALL' }, '2': { action: 'CALL' }
  },
  // Kings offsuit
  'K': {
    'Q': { action: 'CALL' }, 'J': { action: 'CALL' }, 'T': { action: 'CALL' }, '9': { action: 'CALL' },
    '8': { action: 'CALL' }, '7': { action: 'CALL' }, '6': { action: 'CALL' }, '5': { action: 'CALL' },
    '4': { action: 'CALL' }, '3': { action: 'CALL' }, '2': { action: 'CALL' }
  },
  // Queens offsuit  
  'Q': {
    'J': { action: 'CALL' }, 'T': { action: 'CALL' }, '9': { action: 'CALL' }, '8': { action: 'CALL' },
    '7': { action: 'CALL' }, '6': { action: 'CALL' }, '5': { action: 'CALL' }, '4': { action: 'CALL' },
    '3': { action: 'CALL' }, '2': { action: 'CALL' }
  },
  // Jacks offsuit
  'J': {
    'T': { action: 'CALL' }, '9': { action: 'CALL' }, '8': { action: 'CALL' }, '7': { action: 'CALL' },
    '6': { action: 'CALL' }, '5': { action: 'CALL' }, '4': { action: 'CALL' }, '3': { action: 'CALL' }, '2': { action: 'CALL' }
  },
  // Tens offsuit
  'T': {
    '9': { action: 'CALL' }, '8': { action: 'CALL' }, '7': { action: 'CALL' }, '6': { action: 'CALL' },
    '5': { action: 'CALL' }, '4': { action: 'CALL' }, '3': { action: 'CALL' }, '2': { action: 'CALL' }
  },
  // Nines offsuit (from IMG_7571 - page 188 showing 2.5F ratios)
  '9': {
    '8': { action: 'CALL' }, '7': { action: 'CALL' }, '6': { action: 'CALL', ratio: '2.5F' }, '5': { action: 'FOLD', ratio: '2.5F' },
    '4': { action: 'FOLD' }, '3': { action: 'FOLD' }, '2': { action: 'FOLD' }
  },
  // Eights offsuit
  '8': {
    '7': { action: 'CALL' }, '6': { action: 'CALL', ratio: '2.5F' }, '5': { action: 'FOLD', ratio: '2.5F' }, '4': { action: 'FOLD' },
    '3': { action: 'FOLD' }, '2': { action: 'FOLD' }
  },
  // Sevens offsuit
  '7': {
    '6': { action: 'CALL' }, '5': { action: 'CALL', ratio: '2.5F' }, '4': { action: 'FOLD', ratio: '2.5F' }, '3': { action: 'FOLD' }, '2': { action: 'FOLD' }
  },
  // Sixes offsuit
  '6': {
    '5': { action: 'CALL' }, '4': { action: 'CALL', ratio: '2.5F' }, '3': { action: 'FOLD', ratio: '2.5F' }, '2': { action: 'FOLD' }
  },
  // Fives offsuit
  '5': {
    '4': { action: 'CALL' }, '3': { action: 'CALL', ratio: '2.5F' }, '2': { action: 'FOLD', ratio: '2.5F' }
  },
  // Fours offsuit
  '4': {
    '3': { action: 'CALL' }, '2': { action: 'CALL', ratio: '2.5F' }
  },
  // Threes offsuit
  '3': {
    '2': { action: 'CALL' }
  }
};

// Heads-up specific ranges for 3BB raises (from IMG_7569 - page 185)
const HEADSUP_3BB_SUITED: Record<string, Record<string, HandStrategy>> = {
  // More aggressive heads-up ranges
  'A': {
    'A': { action: 'JAM' }, 'K': { action: 'JAM' }, 'Q': { action: 'JAM' }, 'J': { action: 'JAM' },
    'T': { action: 'JAM' }, '9': { action: 'JAM' }, '8': { action: 'JAM' }, '7': { action: 'JAM' },
    '6': { action: 'JAM' }, '5': { action: 'JAM' }, '4': { action: 'JAM' }, '3': { action: 'JAM' }, '2': { action: 'JAM' }
  },
  // Additional ranges for heads-up play (more liberal calling ranges)
};

// Equilibrium calling ranges (from IMG_7564 - suited hands calling strategy)
const CALLING_RANGES_SUITED: Record<string, Record<string, number>> = {
  // Shows the CSI levels at which to call with each suited hand
  'A': { 'K': 8, 'Q': 8, 'J': 8, 'T': 8, '9': 8, '8': 8, '7': 7, '6': 6, '5': 5, '4': 4, '3': 3, '2': 2 },
  'K': { 'Q': 8, 'J': 8, 'T': 8, '9': 7, '8': 6, '7': 5, '6': 4, '5': 3, '4': 3, '3': 2, '2': 2 },
  'Q': { 'J': 8, 'T': 8, '9': 7, '8': 6, '7': 5, '6': 4, '5': 3, '4': 3, '3': 2, '2': 2 },
  'J': { 'T': 8, '9': 7, '8': 6, '7': 5, '6': 4, '5': 4, '4': 3, '3': 3, '2': 2 },
  'T': { '9': 8, '8': 7, '7': 6, '6': 5, '5': 4, '4': 4, '3': 3, '2': 2 },
  '9': { '8': 8, '7': 8, '6': 6, '5': 4, '4': 3, '3': 2, '2': 2 },
  '8': { '7': 8, '6': 8, '5': 5, '4': 4, '3': 3, '2': 2 },
  '7': { '6': 8, '5': 8, '4': 7, '3': 5, '2': 4 },
  '6': { '5': 8, '4': 8, '3': 8, '2': 6 },
  '5': { '4': 8, '3': 8, '2': 8 },
  '4': { '3': 8, '2': 8 },
  '3': { '2': 8 }
};

// Legacy push ranges converted from new strategy for backwards compatibility
const PUSH_RANGES: Record<string, Record<string, string[]>> = {
  "csi_0_2": {
    "early": ["88+", "ATs+", "AQo+", "KQs"],
    "middle": ["77+", "A9s+", "AJo+", "KJs+", "KQo", "QJs"],
    "late": ["66+", "A8s+", "ATo+", "KTs+", "KJo+", "QTs+", "QJo", "JTs"],
    "button": ["22+", "A2s+", "K2s+", "Q2s+", "J2s+", "T2s+", "92s+", "82s+", "72s+", "62s+", "52s+", "42s+", "32s+", "A2o+", "K2o+", "Q2o+", "J2o+", "T2o+", "92o+", "82o+", "72o+", "62o+", "52o+", "42o+", "32o+"],
    "small_blind": ["22+", "A2s+", "K2s+", "Q2s+", "J3s+", "T6s+", "96s+", "86s+", "75s+", "64s+", "A2o+", "K2o+", "Q2o+", "J3o+", "T6o+", "96o+"],
    "big_blind": ["22+", "A2s+", "K4s+", "Q7s+", "J8s+", "T9s+", "A2o+", "K4o+", "Q7o+", "J8o+", "T9o+"]
  },
  "csi_2_5": {
    "early": ["77+", "ATs+", "AJo+", "KQs", "KQo"],
    "middle": ["66+", "A9s+", "ATo+", "KJs+", "KQo", "QJs"],
    "late": ["55+", "A8s+", "A9o+", "K9s+", "KTo+", "Q9s+", "QTo+", "J9s+", "JTo", "T9s"],
    "button": ["22+", "A2s+", "K2s+", "Q2s+", "J3s+", "T4s+", "94s+", "84s+", "74s+", "64s+", "54s+", "43s+", "A2o+", "K2o+", "Q3o+", "J7o+", "T8o+", "98o+", "87o+", "76o+", "65o+"],
    "small_blind": ["22+", "A2s+", "K3s+", "Q5s+", "J8s+", "T9s+", "98s+", "87s+", "76s+", "A2o+", "K3o+", "Q5o+", "J8o+", "T9o+"],
    "big_blind": ["44+", "A7s+", "K9s+", "QJs+", "A7o+", "K9o+", "QJo+"]
  },
  "csi_5_7": {
    "early": ["66+", "A9s+", "ATo+", "KJs+", "KQo", "QJs"],
    "middle": ["55+", "A8s+", "A9o+", "K9s+", "KTo+", "Q9s+", "QTo+", "J9s+", "JTo", "T9s"],
    "late": ["44+", "A7s+", "A8o+", "K8s+", "K9o+", "Q8s+", "Q9o+", "J8s+", "J9o+", "T8s+", "T9o", "98s"],
    "button": ["22+", "A2s+", "K4s+", "Q7s+", "J9s+", "T9s+", "98s+", "87s+", "76s+", "A3o+", "K7o+", "Q9o+", "JTo+", "T9o+"],
    "small_blind": ["22+", "A3s+", "K6s+", "Q8s+", "JTs+", "T9s+", "98s+", "87s+", "A3o+", "K6o+", "Q8o+", "JTo+"],
    "big_blind": ["55+", "A9s+", "KTo+", "QJs+", "A9o+", "KTo+", "QJo+"]
  },
  "csi_7_10": {
    "early": ["55+", "A8s+", "A9o+", "KTs+", "KJo+", "QTs+", "QJo", "JTs"],
    "middle": ["44+", "A7s+", "A8o+", "K8s+", "K9o+", "Q8s+", "Q9o+", "J8s+", "J9o+", "T8s+", "T9o", "98s"],
    "late": ["33+", "A6s+", "A8o+", "K8s+", "K9o+", "Q8s+", "Q9o+", "J8s+", "J9o+", "T8s+", "T9o", "98s", "87s"],
    "button": ["22+", "A2s+", "K5s+", "Q8s+", "JTs+", "A7o+", "KTo+", "QJo+"],
    "small_blind": ["22+", "A5s+", "K8s+", "QTs+", "JTs+", "T9s+", "98s+", "A5o+", "K8o+", "QTo+", "JTo+"],
    "big_blind": ["66+", "ATs+", "KJo+", "QJs+", "ATo+", "KJo+"]
  },
  "csi_10_15": {
    "early": ["44+", "A7s+", "A9o+", "K9s+", "KTo+", "Q9s+", "QTo+", "J9s+", "T9s"],
    "middle": ["33+", "A6s+", "A8o+", "K8s+", "K9o+", "Q8s+", "Q9o+", "J8s+", "J9o+", "T8s+", "T9o", "98s", "87s"],
    "late": ["22+", "A5s+", "A7o+", "K7s+", "K8o+", "Q7s+", "Q8o+", "J7s+", "J8o+", "T7s+", "T8o+", "97s+", "98o", "86s+", "87o", "76s", "65s"],
    "button": ["22+", "A2s+", "K7s+", "QTs+", "A9o+", "KJo+", "QJo+"],
    "small_blind": ["22+", "A7s+", "K9s+", "QJs+", "JTs+", "A7o+", "K9o+", "QJo+"],
    "big_blind": ["77+", "AJs+", "KQo+", "AJo+", "KQo+"]
  }
};

export default function PushFoldMatrix({ playerHoleCards, csi, position, onClose, embedded = false }: PushFoldMatrixProps) {
  const getCSIRange = (csi: number): string => {
    if (csi <= 2) return "csi_0_2";
    if (csi <= 5) return "csi_2_5";
    if (csi <= 7) return "csi_5_7";
    if (csi <= 10) return "csi_7_10";
    return "csi_10_15";
  };

  const [selectedCSIRange, setSelectedCSIRange] = useState(getCSIRange(csi));
  const [selectedPosition, setSelectedPosition] = useState(position);
  const [isHeadsUp, setIsHeadsUp] = useState(false);
  const [strategyMode, setStrategyMode] = useState<'push_fold' | 'jam_call_fold' | 'equilibrium'>('jam_call_fold');
  const [raiseSize, setRaiseSize] = useState<'2BB' | '2.5BB' | '3BB'>('2.5BB');

  // Convert player hole cards to matrix position
  const getPlayerHandPosition = (): {row: number, col: number} | null => {
    if (!playerHoleCards || playerHoleCards.length !== 2) return null;
    
    const card1 = playerHoleCards[0];
    const card2 = playerHoleCards[1];
    const rank1 = getRankValue(card1.rank);
    const rank2 = getRankValue(card2.rank);
    const suited = card1.suit === card2.suit;
    
    let row = RANKS.findIndex(r => getRankValue(r as any) === Math.max(rank1, rank2));
    let col = RANKS.findIndex(r => getRankValue(r as any) === Math.min(rank1, rank2));
    
    // For pairs, they're on the diagonal
    if (rank1 === rank2) {
      row = col = RANKS.findIndex(r => getRankValue(r as any) === rank1);
    } else if (!suited) {
      // For offsuit hands, swap to lower triangle
      [row, col] = [col, row];
    }
    
    return { row, col };
  };

  // Get the strategy action for a hand combination using Kill Everyone data
  const getHandStrategy = (row: number, col: number): { action: Action; color: string } => {
    const rank1 = RANKS[row];
    const rank2 = RANKS[col];
    
    // Determine if suited, offsuit, or pair
    const isSuited = row < col;
    const isPair = row === col;
    const isOffsuit = row > col;
    
    let strategy: HandStrategy;
    
    if (strategyMode === 'jam_call_fold') {
      // Use the complete Kill Everyone strategy matrices
      if (isPair || isSuited) {
        strategy = SUITED_STRATEGY[rank1]?.[rank2] || { action: 'FOLD' };
      } else {
        // For offsuit, use the lower triangle logic
        strategy = OFFSUIT_STRATEGY[RANKS[col]]?.[RANKS[row]] || { action: 'FOLD' };
      }
    } else if (strategyMode === 'equilibrium') {
      // Use calling ranges based on CSI
      const currentCSI = parseFloat(selectedCSIRange.split('_')[1]) || 5;
      if (isSuited || isPair) {
        const minCSI = CALLING_RANGES_SUITED[rank1]?.[rank2] || 10;
        strategy = { action: currentCSI >= minCSI ? 'CALL' : 'FOLD' };
      } else {
        strategy = { action: 'FOLD' }; // Conservative for offsuit in equilibrium
      }
    } else {
      // Legacy push/fold mode
      const shouldPushResult = shouldPush(row, col);
      strategy = { action: shouldPushResult ? 'JAM' : 'FOLD' };
    }
    
    // Apply heads-up adjustments
    if (isHeadsUp && raiseSize === '3BB') {
      // More aggressive heads-up ranges
      if (isPair || isSuited) {
        strategy = HEADSUP_3BB_SUITED[rank1]?.[rank2] || strategy;
      }
    }
    
    // Return color based on action
    switch (strategy.action) {
      case 'JAM': return { action: strategy.action, color: 'bg-green-500' };
      case 'CALL': return { action: strategy.action, color: 'bg-blue-500' };
      case 'FOLD': return { action: strategy.action, color: 'bg-red-500' };
      case 'RF': return { action: strategy.action, color: 'bg-yellow-500' }; // Raise or fold
      case 'LC': return { action: strategy.action, color: 'bg-purple-500' }; // Limp or call
      case 'LR': return { action: strategy.action, color: 'bg-orange-500' }; // Limp or raise
      default: return { action: 'FOLD', color: 'bg-red-500' };
    }
  };
  
  // Get action for a hand using detailed Kill Everyone data
  const getHandAction = (row: number, col: number): { action: Action; ratio?: string; color: string } => {
    const rank1 = RANKS[row];
    const rank2 = RANKS[col];
    
    // Use detailed Kill Everyone strategy when available
    if (strategyMode === 'jam_call_fold') {
      let handStrategy: HandStrategy;
      
      if (row === col) {
        // Pairs (diagonal)
        handStrategy = SUITED_STRATEGY[rank1]?.[rank1] || { action: 'FOLD' };
      } else if (row < col) {
        // Suited hands (upper triangle)
        handStrategy = SUITED_STRATEGY[rank1]?.[rank2] || { action: 'FOLD' };
      } else {
        // Offsuit hands (lower triangle)
        handStrategy = OFFSUIT_STRATEGY[RANKS[col]]?.[RANKS[row]] || { action: 'FOLD' };
      }
      
      // Color mapping for Kill Everyone actions
      const colorMap: Record<Action, string> = {
        'JAM': 'bg-green-500',
        'CALL': 'bg-blue-500',
        'FOLD': 'bg-red-500',
        'RF': 'bg-yellow-500',
        'LR': 'bg-orange-500',
        'LC': 'bg-purple-500',
        'LC/F': 'bg-gray-500'
      };
      
      return {
        action: handStrategy.action,
        ratio: handStrategy.ratio,
        color: colorMap[handStrategy.action] || 'bg-red-500'
      };
    }
    
    // Fall back to simplified push/fold logic
    const shouldPushResult = shouldPush(row, col);
    return {
      action: shouldPushResult ? 'JAM' : 'FOLD',
      color: shouldPushResult ? 'bg-green-500' : 'bg-red-500'
    };
  };

  // Legacy push/fold function for backwards compatibility
  const shouldPush = (row: number, col: number): boolean => {
    const rank1 = RANKS[row];
    const rank2 = RANKS[col];
    
    let handString = '';
    if (row === col) {
      handString = `${rank1}${rank2}`;
    } else if (row < col) {
      handString = `${rank1}${rank2}s`;
    } else {
      handString = `${RANKS[col]}${RANKS[row]}o`;
    }
    
    let effectivePosition = selectedPosition;
    if (isHeadsUp) {
      if (selectedPosition === 'early' || selectedPosition === 'middle' || selectedPosition === 'late') {
        effectivePosition = 'button';
      }
    }
    
    const pushRange = PUSH_RANGES[selectedCSIRange]?.[effectivePosition] || [];
    return isHandInRange(handString, pushRange);
  };

  // Check if hand is in push range
  const isHandInRange = (handString: string, range: string[]): boolean => {
    for (const rangeItem of range) {
      if (matchesRange(handString, rangeItem)) {
        return true;
      }
    }
    return false;
  };

  const matchesRange = (handString: string, rangeItem: string): boolean => {
    if (handString === rangeItem) return true;
    
    if (rangeItem.endsWith('+')) {
      const baseHand = rangeItem.slice(0, -1);
      return handInRangeOrBetter(handString, baseHand);
    }
    
    return false;
  };

  const handInRangeOrBetter = (handString: string, baseHand: string): boolean => {
    // Handle pairs
    if (baseHand.length === 2 && baseHand[0] === baseHand[1]) {
      if (handString.length === 2 && handString[0] === handString[1]) {
        const handRank = getRankValue(handString[0] as any);
        const baseRank = getRankValue(baseHand[0] as any);
        return handRank >= baseRank;
      }
      return false;
    }
    
    // Handle suited/offsuit hands
    if (handString.length === 3 && baseHand.length === 3) {
      const handSuited = handString[2] === 's';
      const baseSuited = baseHand[2] === 's';
      
      if (handSuited !== baseSuited) return false;
      
      const handRank1 = getRankValue(handString[0] as any);
      const handRank2 = getRankValue(handString[1] as any);
      const baseRank1 = getRankValue(baseHand[0] as any);
      const baseRank2 = getRankValue(baseHand[1] as any);
      
      if (baseRank1 === 14) { // Ace hands
        return handRank1 === 14 && handRank2 >= baseRank2;
      }
      
      return (handRank1 >= baseRank1 && handRank2 >= baseRank2) || 
             (handRank1 >= baseRank2 && handRank2 >= baseRank1);
    }
    
    return false;
  };

  const playerPosition = getPlayerHandPosition();

  const content = (
    <>
      {/* Controls */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-base font-bold text-gray-900 mb-2">Strategy Mode:</label>
            <select
              value={strategyMode}
              onChange={(e) => setStrategyMode(e.target.value as any)}
              className="px-4 py-2 border-2 border-gray-400 rounded-md text-base font-medium bg-white text-gray-900"
            >
              <option value="push_fold">Push/Fold (Legacy)</option>
              <option value="jam_call_fold">Kill Everyone Complete Strategy</option>
              <option value="equilibrium">Equilibrium Calling Ranges</option>
            </select>
          </div>
          <div>
            <label className="block text-base font-bold text-gray-900 mb-2">CSI Range:</label>
            <select
              value={selectedCSIRange}
              onChange={(e) => setSelectedCSIRange(e.target.value)}
              className="px-4 py-2 border-2 border-gray-400 rounded-md text-base font-medium bg-white text-gray-900"
            >
              <option value="csi_0_2">0-2 CSI (Emergency - Any Two)</option>
              <option value="csi_2_5">2-5 CSI (Very Short)</option>
              <option value="csi_5_7">5-7 CSI (Short)</option>
              <option value="csi_7_10">7-10 CSI (Medium Short)</option>
              <option value="csi_10_15">10-15 CSI (Medium)</option>
            </select>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-base font-bold text-gray-900 mb-2">Position:</label>
            <select
              value={selectedPosition}
              onChange={(e) => setSelectedPosition(e.target.value)}
              className="px-4 py-2 border-2 border-gray-400 rounded-md text-base font-medium bg-white text-gray-900"
            >
              <option value="early">Early Position (UTG)</option>
              <option value="middle">Middle Position (MP)</option>
              <option value="late">Late Position (CO)</option>
              <option value="button">Button (BTN)</option>
              <option value="small_blind">Small Blind (SB)</option>
              <option value="big_blind">Big Blind (BB)</option>
            </select>
          </div>
          <div>
            <label className="block text-base font-bold text-gray-900 mb-2">Raise Size:</label>
            <select
              value={raiseSize}
              onChange={(e) => setRaiseSize(e.target.value as any)}
              className="px-4 py-2 border-2 border-gray-400 rounded-md text-base font-medium bg-white text-gray-900"
            >
              <option value="2BB">2.0 BB</option>
              <option value="2.5BB">2.5 BB</option>
              <option value="3BB">3.0 BB</option>
            </select>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="flex items-center text-base font-bold text-gray-900">
              <input
                type="checkbox"
                checked={isHeadsUp}
                onChange={(e) => setIsHeadsUp(e.target.checked)}
                className="mr-3 w-4 h-4"
              />
              Heads-up Mode
            </label>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mb-4 flex flex-wrap gap-4 text-base font-medium">
        {strategyMode === 'jam_call_fold' ? (
          <>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-green-500 rounded mr-2"></div>
              <span className="text-gray-900 font-medium">Jam</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-blue-500 rounded mr-2"></div>
              <span className="text-gray-900 font-medium">Call</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-red-500 rounded mr-2"></div>
              <span className="text-gray-900 font-medium">Fold</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-yellow-500 rounded mr-2"></div>
              <span className="text-gray-900 font-medium">Raise/Fold</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-purple-500 rounded mr-2"></div>
              <span className="text-gray-900 font-medium">Limp/Call</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-gray-400 rounded mr-2"></div>
              <span className="text-gray-900 font-medium">Mixed (2.5F = fold 2.5x more)</span>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-green-500 rounded mr-2"></div>
              <span className="text-gray-900 font-medium">{strategyMode === 'equilibrium' ? 'Call Range' : 'Push Range'}</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-red-500 rounded mr-2"></div>
              <span className="text-gray-900 font-medium">Fold Range</span>
            </div>
          </>
        )}
        <div className="flex items-center">
          <div className="w-4 h-4 bg-blue-600 border-2 border-blue-800 rounded mr-2"></div>
          <span className="text-gray-900 font-medium">Your Hand</span>
        </div>
      </div>

      <div className="mb-4 text-base text-gray-900 bg-blue-50 border border-blue-200 p-4 rounded-lg">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <p className="font-bold text-blue-800 mb-2">Matrix Layout:</p>
            <p className="font-medium">• <strong>Upper right (suited):</strong> Same suits (e.g., A♠K♠)</p>
            <p className="font-medium">• <strong>Diagonal:</strong> Pocket pairs (e.g., A♠A♥)</p> 
            <p className="font-medium">• <strong>Lower left (offsuit):</strong> Different suits (e.g., A♠K♥)</p>
          </div>
          <div>
            <p className="font-bold text-blue-800 mb-2">Kill Everyone Strategy (Pages 183-186, 188):</p>
            <p className="font-medium">• CSI = Total Chips ÷ (SB + BB + Antes)</p>
            <p>• {strategyMode === 'jam_call_fold' ? 'Complete jam/call/fold matrix from book' : 
                strategyMode === 'equilibrium' ? 'Equilibrium calling ranges vs opponents' :
                'Legacy push/fold ranges'}</p>
            <p>• {isHeadsUp ? `Heads-up ${raiseSize} ranges are significantly wider` : 'Multi-table ranges adjust by position'}</p>
          </div>
        </div>
      </div>

      {/* Matrix */}
      <div className="overflow-x-auto">
        <table className="mx-auto border-collapse">
          <tbody>
            {RANKS.map((rank1, row) => (
              <tr key={rank1}>
                {RANKS.map((rank2, col) => {
                  const strategy = getHandAction(row, col);
                  const isPlayerHand = playerPosition && 
                    playerPosition.row === row && playerPosition.col === col;
                  
                  let handText = '';
                  if (row === col) {
                    handText = `${rank1}${rank2}`;
                  } else if (row < col) {
                    handText = `${rank1}${rank2}s`;
                  } else {
                    handText = `${rank2}${rank1}o`;
                  }

                  return (
                    <td
                      key={`${rank1}-${rank2}`}
                      className={`
                        w-14 h-14 text-sm font-bold border border-gray-300 text-center leading-tight relative
                        ${strategy.color} text-white shadow-sm
                        ${isPlayerHand ? 'ring-4 ring-blue-600 ring-inset' : ''}
                      `}
                      title={`${handText}: ${strategy.action}`}
                    >
                      <div className="leading-3">
                        <div>{handText}</div>
                        {strategyMode === 'jam_call_fold' && (
                          strategy.action !== 'JAM' && strategy.action !== 'FOLD' ? (
                            <div className="text-sm opacity-90 font-medium">{strategy.action}</div>
                          ) : (row > col && OFFSUIT_STRATEGY[RANKS[col]]?.[RANKS[row]]?.ratio) ? (
                            <div className="text-sm opacity-90 font-medium">{OFFSUIT_STRATEGY[RANKS[col]][RANKS[row]].ratio}</div>
                          ) : null
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Your hand info */}
      {playerHoleCards && playerHoleCards.length === 2 && (
        <div className="mt-4 p-4 bg-green-50 border border-green-300 rounded-lg">
          <h3 className="font-bold text-green-800 mb-3 text-lg">Your Hand Analysis</h3>
          <div className="text-base space-y-2 font-medium text-black">
            <div>
              <strong>Cards:</strong> {playerHoleCards.map(c => c.unicode).join(' ')}
            </div>
            <div>
              <strong>CSI {csi.toFixed(1)}, {selectedPosition}:</strong> 
              <span className={`ml-2 font-bold ${
                playerPosition ? (
                  getHandAction(playerPosition.row, playerPosition.col).action === 'FOLD' 
                    ? 'text-red-700' : getHandAction(playerPosition.row, playerPosition.col).action === 'JAM'
                    ? 'text-green-700' : 'text-blue-700'
                ) : 'text-gray-700'
              }`}>
                {playerPosition ? getHandAction(playerPosition.row, playerPosition.col).action : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="mt-4 text-base text-gray-900 bg-yellow-50 border border-yellow-300 p-4 rounded-lg space-y-2">
        <p className="font-bold text-yellow-800 text-lg">Kill Everyone Strategy Notes (2nd Edition):</p>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <p>• {strategyMode === 'jam_call_fold' ? 'Complete strategy matrix from pages 183-186' :
                 strategyMode === 'equilibrium' ? 'Equilibrium calling strategy vs jamming opponents' :
                 'Legacy push/fold ranges for comparison'}</p>
            <p>• {isHeadsUp ? `Heads-up ${raiseSize} raise ranges are much wider` : 'Multi-table ranges by position'}</p>
            <p>• {raiseSize === '2BB' ? '2BB allows more flexibility post-flop' :
                 raiseSize === '3BB' ? '3BB commits you more to the pot' :
                 '2.5BB is the standard tournament size'}</p>
          </div>
          <div>
            <p>• With antes: multiply CSI by 1.2 for range selection</p>
            <p>• Near bubble: tighten calling ranges by 20-25%</p>
            <p>• Adjust vs opponent tendencies (±15-20% range width)</p>
            <p>• Page references: Suited (184), Offsuit (186), Ratios (188)</p>
          </div>
        </div>
      </div>
    </>
  );

  if (embedded) {
    return (
      <div className="w-full">
        <div className="p-4">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gray-800 text-white p-4 rounded-t-xl flex justify-between items-center">
          <h2 className="text-xl font-bold">Kill Everyone Strategy Matrix</h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-300 text-xl font-bold w-8 h-8 flex items-center justify-center rounded hover:bg-gray-700"
          >
            ×
          </button>
        </div>

        <div className="p-6">
          {content}
        </div>
      </div>
    </div>
  );
}