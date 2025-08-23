"use client";

import { GameState, GameSettings, Player } from '@/lib/types';
import PlayerSeat from './PlayerSeat';
import CommunityCards from './CommunityCards';
import PotDisplay from './PotDisplay';
import { calculateCSI, getCSIInfo } from '@/lib/calculators/csi';

interface TableProps {
  gameState: GameState;
  onAction: (action: string, amount?: number) => void;
  settings: GameSettings;
}

export default function PokerTable({ gameState, onAction, settings }: TableProps) {
  const humanPlayer = gameState.players.find(p => p.isHuman);
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];

  // Calculate positions for circular table layout
  const getPlayerPosition = (playerIndex: number, totalPlayers: number) => {
    const angle = (playerIndex * 2 * Math.PI) / totalPlayers - Math.PI / 2;
    const radius = 200;
    const x = 50 + (Math.cos(angle) * radius * 0.3);
    const y = 50 + (Math.sin(angle) * radius * 0.2);
    return { x: `${x}%`, y: `${y}%` };
  };

  return (
    <div className="relative bg-green-700 rounded-full h-96 w-full max-w-4xl mx-auto border-8 border-green-900 shadow-2xl">
      {/* Community cards in center */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <div className="text-center">
          <CommunityCards 
            cards={gameState.communityCards}
            stage={gameState.stage}
          />
          <PotDisplay 
            pot={gameState.pot}
            stage={gameState.stage}
          />
        </div>
      </div>

      {/* Player seats */}
      {gameState.players.map((player, index) => {
        const position = getPlayerPosition(index, gameState.players.length);
        const csi = calculateCSI(player.chips, gameState.smallBlind, gameState.bigBlind);
        const csiInfo = getCSIInfo(csi);
        const isDealer = index === gameState.dealer;
        const isCurrentPlayer = index === gameState.currentPlayerIndex;

        return (
          <div
            key={player.id}
            className="absolute transform -translate-x-1/2 -translate-y-1/2"
            style={{ left: position.x, top: position.y }}
          >
            <PlayerSeat
              player={player}
              isDealer={isDealer}
              isCurrentPlayer={isCurrentPlayer}
              isHuman={player.isHuman}
              csiInfo={csiInfo}
              gameStage={gameState.stage}
              showCards={player.showCards || player.isHuman}
              onAction={onAction}
            />
          </div>
        );
      })}

      {/* Game stage indicator */}
      <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded">
        Stage: {gameState.stage.charAt(0).toUpperCase() + gameState.stage.slice(1)}
      </div>

      {/* Blinds info */}
      <div className="absolute top-4 right-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded">
        Blinds: {gameState.smallBlind}/{gameState.bigBlind}
      </div>

      {/* Human player CSI info */}
      {humanPlayer && (
        <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white px-3 py-2 rounded">
          <div className="text-sm">
            CSI: {calculateCSI(humanPlayer.chips, gameState.smallBlind, gameState.bigBlind).toFixed(1)}
          </div>
          <div className="text-xs text-gray-300">
            {getCSIInfo(calculateCSI(humanPlayer.chips, gameState.smallBlind, gameState.bigBlind)).strategy}
          </div>
        </div>
      )}

      {/* Current action indicator */}
      {currentPlayer && (
        <div className="absolute bottom-4 right-4 bg-blue-600 text-white px-3 py-1 rounded animate-pulse">
          {currentPlayer.isHuman ? 'Your Turn' : `${currentPlayer.name}'s Turn`}
        </div>
      )}
    </div>
  );
}