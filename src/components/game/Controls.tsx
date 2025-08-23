"use client";

import { useState } from 'react';
import { GameState, Action } from '@/lib/types';
import { calculateCSI, getRecommendedAction, getCSIStrategyTips } from '@/lib/calculators/csi';
import { calculateEquity, calculatePotOdds } from '@/lib/calculators/odds';

interface GameControlsProps {
  gameState: GameState;
  onAction: (action: string, amount?: number) => void;
  validActions: Action[];
}

export default function GameControls({ gameState, onAction, validActions }: GameControlsProps) {
  const [raiseAmount, setRaiseAmount] = useState(gameState.bigBlind * 2);
  const [showStrategy, setShowStrategy] = useState(false);

  const humanPlayer = gameState.players.find(p => p.isHuman);
  if (!humanPlayer) return null;

  const currentBet = Math.max(...gameState.players.map(p => p.currentBet));
  const callAmount = currentBet - humanPlayer.currentBet;
  const csi = calculateCSI(humanPlayer.chips, gameState.smallBlind, gameState.bigBlind);
  
  // Calculate pot odds if facing a bet
  const potOdds = callAmount > 0 ? calculatePotOdds(gameState.pot, callAmount) : null;

  // Get strategy recommendation
  const facingAction = callAmount > 0 ? (callAmount >= humanPlayer.chips ? 'all-in' : 'call') : 'none';
  const recommendation = getRecommendedAction(
    humanPlayer.holeCards,
    csi,
    'unknown', // We'd need to track position better
    facingAction as any
  );

  const handleAction = (action: string) => {
    if (action === 'raise') {
      onAction(action, raiseAmount);
    } else {
      onAction(action);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 space-y-4">
      {/* Player info */}
      <div className="text-center pb-4 border-b">
        <h3 className="text-lg font-bold text-gray-800">Your Turn</h3>
        <div className="text-sm text-gray-600 mt-1">
          Chips: ${humanPlayer.chips.toLocaleString()}
        </div>
        <div className="text-sm font-semibold text-blue-600">
          CSI: {csi.toFixed(1)}
        </div>
      </div>

      {/* Pot odds info */}
      {potOdds && (
        <div className="bg-blue-50 p-3 rounded border">
          <h4 className="font-semibold text-blue-800 mb-2">Pot Odds</h4>
          <div className="text-sm space-y-1">
            <div>Call: ${callAmount} to win ${gameState.pot + callAmount}</div>
            <div>Odds: {potOdds.odds.toFixed(1)}:1</div>
            <div>Need: {potOdds.percentage.toFixed(1)}% equity</div>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="space-y-2">
        {validActions.includes('fold') && (
          <button
            onClick={() => handleAction('fold')}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition-colors"
          >
            Fold
          </button>
        )}

        {validActions.includes('check') && (
          <button
            onClick={() => handleAction('check')}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition-colors"
          >
            Check
          </button>
        )}

        {validActions.includes('call') && (
          <button
            onClick={() => handleAction('call')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors"
          >
            Call ${callAmount}
          </button>
        )}

        {validActions.includes('raise') && (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Raise to:</label>
              <input
                type="number"
                value={raiseAmount}
                onChange={(e) => setRaiseAmount(Math.max(gameState.minRaise, parseInt(e.target.value) || 0))}
                min={gameState.minRaise}
                max={humanPlayer.chips}
                className="flex-1 px-3 py-1 border border-gray-300 rounded text-sm"
              />
            </div>
            <button
              onClick={() => handleAction('raise')}
              disabled={raiseAmount < gameState.minRaise || raiseAmount > humanPlayer.chips}
              className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded transition-colors"
            >
              Raise to ${raiseAmount}
            </button>
          </div>
        )}

        {validActions.includes('all-in') && (
          <button
            onClick={() => handleAction('all-in')}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded transition-colors animate-pulse"
          >
            All-In (${humanPlayer.chips})
          </button>
        )}
      </div>

      {/* Strategy advice toggle */}
      <button
        onClick={() => setShowStrategy(!showStrategy)}
        className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2 px-4 rounded border transition-colors"
      >
        {showStrategy ? '🙈 Hide' : '💡 Show'} Strategy Tips
      </button>

      {/* Strategy advice */}
      {showStrategy && (
        <div className="bg-white border-2 border-blue-200 rounded-lg p-4 shadow-sm">
          <h4 className="font-bold text-blue-900 mb-3 text-base">💡 Strategy Advice</h4>
          
          <div className="space-y-4">
            <div className="bg-blue-50 p-3 rounded">
              <div className="text-sm font-semibold text-blue-800 mb-1">Recommendation:</div>
              <div className="text-sm text-blue-900">{recommendation}</div>
            </div>
            
            <div className="bg-green-50 p-3 rounded">
              <div className="text-sm font-semibold text-green-800 mb-2">CSI Strategy (CSI: {csi.toFixed(1)}):</div>
              <ul className="text-sm text-green-900 space-y-1">
                {getCSIStrategyTips(csi).slice(0, 2).map((tip, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-green-600 mr-2 font-bold">•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>

            {potOdds && (
              <div className="bg-orange-50 p-3 rounded">
                <div className="text-sm font-semibold text-orange-800 mb-1">Math:</div>
                <div className="text-sm text-orange-900">
                  You need <span className="font-bold">{potOdds.percentage.toFixed(1)}%</span> equity to call profitably.
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick action buttons for common scenarios */}
      {csi <= 7 && (
        <div className="bg-red-50 border border-red-200 rounded p-3">
          <div className="text-xs text-red-700 font-semibold mb-2">
            ⚠️ Short Stack Mode (CSI {csi.toFixed(1)})
          </div>
          <div className="text-xs text-red-600">
            Primary strategy: Push/Fold. Avoid calling unless you have a premium hand.
          </div>
        </div>
      )}
    </div>
  );
}