"use client";

import { Player, GameStage, CSIInfo } from '@/lib/types';
import { cardToString } from '@/lib/game-engine/deck';

interface PlayerSeatProps {
  player: Player;
  isDealer: boolean;
  isCurrentPlayer: boolean;
  isHuman: boolean;
  csiInfo: CSIInfo;
  gameStage: GameStage;
  showCards: boolean;
  onAction: (action: string, amount?: number) => void;
}

export default function PlayerSeat({
  player,
  isDealer,
  isCurrentPlayer,
  isHuman,
  csiInfo,
  gameStage,
  showCards,
  onAction
}: PlayerSeatProps) {

  const getCSIColor = (csi: number) => {
    if (csi <= 2) return 'text-red-500';
    if (csi <= 7) return 'text-orange-500';
    if (csi <= 12) return 'text-yellow-500';
    return 'text-green-500';
  };

  const renderCards = () => {
    if (player.isFolded) {
      return (
        <div className="flex gap-1">
          <div className="w-8 h-12 bg-gray-600 rounded border opacity-50"></div>
          <div className="w-8 h-12 bg-gray-600 rounded border opacity-50"></div>
        </div>
      );
    }

    if (showCards && player.holeCards.length === 2) {
      return (
        <div className="flex gap-1">
          {player.holeCards.map((card, index) => (
            <div
              key={index}
              className="w-8 h-12 bg-white rounded border border-gray-300 flex items-center justify-center text-xs font-bold"
              style={{
                color: card.suit === 'hearts' || card.suit === 'diamonds' ? 'red' : 'black'
              }}
            >
              {cardToString(card)}
            </div>
          ))}
        </div>
      );
    }

    // Hidden cards (card backs)
    return (
      <div className="flex gap-1">
        <div className="w-8 h-12 bg-blue-600 rounded border border-blue-800 flex items-center justify-center">
          <div className="w-6 h-8 border-2 border-white rounded-sm"></div>
        </div>
        <div className="w-8 h-12 bg-blue-600 rounded border border-blue-800 flex items-center justify-center">
          <div className="w-6 h-8 border-2 border-white rounded-sm"></div>
        </div>
      </div>
    );
  };

  return (
    <div className={`relative ${isCurrentPlayer ? 'ring-2 ring-yellow-400' : ''}`}>
      {/* Player info card */}
      <div className={`
        bg-white rounded-lg p-3 shadow-lg min-w-32 text-center
        ${isHuman ? 'border-2 border-blue-500' : ''}
        ${player.isFolded ? 'opacity-60' : ''}
        ${player.isAllIn ? 'border-red-500 border-2' : ''}
      `}>
        {/* Player name */}
        <div className="font-semibold text-sm mb-1 text-gray-800">
          {player.name}
          {isDealer && (
            <span className="ml-1 bg-yellow-500 text-white text-xs px-1 rounded">D</span>
          )}
        </div>

        {/* Cards */}
        <div className="mb-2 flex justify-center">
          {renderCards()}
        </div>

        {/* Chip stack */}
        <div className="text-sm font-bold text-gray-700 mb-1">
          ${player.chips.toLocaleString()}
        </div>

        {/* Current bet */}
        {player.currentBet > 0 && (
          <div className="text-xs text-blue-600 font-semibold">
            Bet: ${player.currentBet}
          </div>
        )}

        {/* CSI info for human player */}
        {isHuman && (
          <div className="text-xs mt-1">
            <div className={`font-semibold ${getCSIColor(csiInfo.csi)}`}>
              CSI: {csiInfo.csi.toFixed(1)}
            </div>
            <div className="text-gray-500">
              {csiInfo.strategy}
            </div>
          </div>
        )}

        {/* Player status */}
        {player.isAllIn && (
          <div className="text-xs text-red-600 font-bold mt-1">
            ALL-IN
          </div>
        )}
        {player.isFolded && (
          <div className="text-xs text-gray-500 font-bold mt-1">
            FOLDED
          </div>
        )}
      </div>

      {/* Bet chips display */}
      {player.currentBet > 0 && !player.isFolded && (
        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-2 py-1 rounded-full text-xs font-bold">
          ${player.currentBet}
        </div>
      )}

      {/* Action indicator */}
      {isCurrentPlayer && !player.isFolded && (
        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-yellow-400 text-black px-2 py-1 rounded text-xs font-bold animate-bounce">
          {isHuman ? 'YOUR TURN' : 'THINKING...'}
        </div>
      )}

      {/* Learning hint for opponent cards */}
      {showCards && !isHuman && player.holeCards.length > 0 && (
        <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-2 py-1 rounded text-xs">
          📚 Learning
        </div>
      )}
    </div>
  );
}