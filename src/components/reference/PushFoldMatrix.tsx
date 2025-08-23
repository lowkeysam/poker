"use client";

import { useState } from 'react';
import { Card } from '@/lib/types';
import { getRankValue } from '@/lib/game-engine/deck';

interface PushFoldMatrixProps {
  playerHoleCards?: Card[];
  csi: number;
  position: string;
  onClose: () => void;
}

// Pre-flop hand matrix - standard 13x13 grid
const RANKS = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];

// Push/fold ranges by CSI and position
const PUSH_RANGES: Record<string, Record<string, string[]>> = {
  "csi_0_3": {
    "button": ["22+", "A2+", "K2+", "Q2+", "J2+", "T2+", "92+", "82+", "72+", "62+", "52+", "42+", "32+"],
    "cutoff": ["22+", "A2+", "K4+", "Q8+", "J9+", "T9+", "98+", "87+", "76+"],
    "middle": ["44+", "A7+", "K9+", "QT+", "JT+"],
    "early": ["77+", "AT+", "KQ"]
  },
  "csi_3_7": {
    "button": ["22+", "A2+", "K3+", "Q6+", "J8+", "T9+", "98+", "87+", "76+", "65+"],
    "cutoff": ["33+", "A5+", "K7+", "Q9+", "JT+", "T9+", "98+", "87+"],
    "middle": ["55+", "A8+", "KT+", "QJ+", "JT+"],
    "early": ["88+", "AJ+", "KQ"]
  },
  "csi_7_12": {
    "button": ["22+", "A2+", "K5+", "Q8+", "J9+", "T9+", "98+", "87+", "76+"],
    "cutoff": ["33+", "A6+", "K8+", "Q9+", "JT+", "T9+", "98+"],
    "middle": ["66+", "A9+", "KJ+", "QJ+"],
    "early": ["99+", "AQ+", "KQ"]
  }
};

export default function PushFoldMatrix({ playerHoleCards, csi, position, onClose }: PushFoldMatrixProps) {
  const [selectedCSIRange, setSelectedCSIRange] = useState(
    csi <= 3 ? "csi_0_3" : csi <= 7 ? "csi_3_7" : "csi_7_12"
  );
  const [selectedPosition, setSelectedPosition] = useState(position);

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

  // Check if a hand combination should be pushed
  const shouldPush = (row: number, col: number): boolean => {
    const rank1 = RANKS[row];
    const rank2 = RANKS[col];
    
    let handString = '';
    if (row === col) {
      // Pair
      handString = `${rank1}${rank2}`;
    } else if (row < col) {
      // Suited (upper triangle)
      handString = `${rank1}${rank2}s`;
    } else {
      // Offsuit (lower triangle)  
      handString = `${RANKS[col]}${RANKS[row]}o`;
    }
    
    const pushRange = PUSH_RANGES[selectedCSIRange]?.[selectedPosition] || [];
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gray-800 text-white p-4 rounded-t-xl flex justify-between items-center">
          <h2 className="text-xl font-bold">Push/Fold Matrix</h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-300 text-xl font-bold w-8 h-8 flex items-center justify-center rounded hover:bg-gray-700"
          >
            ×
          </button>
        </div>

        <div className="p-6">
          {/* Controls */}
          <div className="mb-6 flex flex-wrap gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">CSI Range:</label>
              <select
                value={selectedCSIRange}
                onChange={(e) => setSelectedCSIRange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="csi_0_3">0-3 CSI (Very Short)</option>
                <option value="csi_3_7">3-7 CSI (Short)</option>
                <option value="csi_7_12">7-12 CSI (Medium)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Position:</label>
              <select
                value={selectedPosition}
                onChange={(e) => setSelectedPosition(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="early">Early Position</option>
                <option value="middle">Middle Position</option>
                <option value="cutoff">Cutoff</option>
                <option value="button">Button</option>
              </select>
            </div>
          </div>

          {/* Legend */}
          <div className="mb-4 flex flex-wrap gap-4 text-sm">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-green-500 rounded mr-2"></div>
              <span>Push Range</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-red-500 rounded mr-2"></div>
              <span>Fold Range</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-blue-600 border-2 border-blue-800 rounded mr-2"></div>
              <span>Your Hand</span>
            </div>
          </div>

          <div className="mb-4 text-sm text-gray-600">
            <p><strong>Upper right (suited):</strong> Same suits (e.g., A♠K♠)</p>
            <p><strong>Diagonal:</strong> Pocket pairs (e.g., A♠A♥)</p> 
            <p><strong>Lower left (offsuit):</strong> Different suits (e.g., A♠K♥)</p>
          </div>

          {/* Matrix */}
          <div className="overflow-x-auto">
            <table className="mx-auto border-collapse">
              <tbody>
                {RANKS.map((rank1, row) => (
                  <tr key={rank1}>
                    {RANKS.map((rank2, col) => {
                      const isPush = shouldPush(row, col);
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
                            w-8 h-8 text-xs font-bold border border-gray-300 text-center
                            ${isPush ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}
                            ${isPlayerHand ? 'ring-4 ring-blue-600 ring-inset' : ''}
                          `}
                        >
                          {handText}
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
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-bold text-blue-800 mb-2">Your Hand Analysis</h3>
              <div className="text-sm space-y-1">
                <div>
                  <strong>Cards:</strong> {playerHoleCards.map(c => c.unicode).join(' ')}
                </div>
                <div>
                  <strong>CSI {csi.toFixed(1)}, {selectedPosition}:</strong> 
                  <span className={`ml-2 font-bold ${
                    playerPosition && shouldPush(playerPosition.row, playerPosition.col) 
                      ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {playerPosition && shouldPush(playerPosition.row, playerPosition.col) 
                      ? 'PUSH' : 'FOLD'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Tips */}
          <div className="mt-4 text-xs text-gray-600 bg-gray-50 p-3 rounded">
            <p><strong>Tip:</strong> These ranges assume optimal play from opponents. Adjust based on their tendencies - push wider against tight players, tighter against loose callers.</p>
          </div>
        </div>
      </div>
    </div>
  );
}