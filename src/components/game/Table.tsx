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

  // Calculate blind positions
  const getBlindPositions = (dealerIndex: number, totalPlayers: number) => {
    const smallBlindIndex = (dealerIndex + 1) % totalPlayers;
    const bigBlindIndex = (dealerIndex + 2) % totalPlayers;
    return { smallBlindIndex, bigBlindIndex };
  };

  const { smallBlindIndex, bigBlindIndex } = getBlindPositions(gameState.dealer, gameState.players.length);

  // Calculate positions for circular table layout
  const getPlayerPosition = (playerIndex: number, totalPlayers: number) => {
    const angle = (playerIndex * 2 * Math.PI) / totalPlayers - Math.PI / 2;
    const radius = 200;
    
    // Adjust positioning based on angle to avoid pot overlap while keeping side players visible
    let xMultiplier = 0.35;
    let yMultiplier = 0.25;
    
    // For bottom players (around 90 degrees), push them further away from pot
    const degrees = (angle * 180) / Math.PI;
    if (degrees > 45 && degrees < 135) { // Bottom area
      yMultiplier = 0.32;
    }
    
    const x = 50 + (Math.cos(angle) * radius * xMultiplier);
    const y = 50 + (Math.sin(angle) * radius * yMultiplier);
    
    return { x: `${x}%`, y: `${y}%` };
  };

  return (
    <div className="relative bg-green-700 rounded-full h-96 w-full max-w-4xl mx-auto border-8 border-green-900 shadow-2xl min-h-[400px]">
      {/* Community cards and pot in center */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
        <div className="text-center space-y-2">
          <CommunityCards 
            cards={gameState.communityCards}
            stage={gameState.stage}
          />
          {/* Make pot very prominent */}
          <div className="flex justify-center">
            <PotDisplay 
              pot={gameState.pot}
              stage={gameState.stage}
              smallBlind={gameState.smallBlind}
              bigBlind={gameState.bigBlind}
            />
          </div>
        </div>
      </div>

      {/* Player seats */}
      {gameState.players.map((player, index) => {
        const position = getPlayerPosition(index, gameState.players.length);
        const csi = calculateCSI(player.chips, gameState.smallBlind, gameState.bigBlind);
        const csiInfo = getCSIInfo(csi);
        const isDealer = index === gameState.dealer;
        const isCurrentPlayer = index === gameState.currentPlayerIndex;
        const isSmallBlind = index === smallBlindIndex;
        const isBigBlind = index === bigBlindIndex;

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
              isSmallBlind={isSmallBlind}
              isBigBlind={isBigBlind}
            />
          </div>
        );
      })}

      {/* Game stage indicator */}
      <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded">
        Stage: {gameState.stage.charAt(0).toUpperCase() + gameState.stage.slice(1)}
      </div>

      {/* Blinds info moved to pot display */}

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
        <div className="absolute bottom-4 right-4 bg-blue-600 text-white px-3 py-1 rounded">
          {currentPlayer.isHuman ? 'Your Turn' : `${currentPlayer.name}'s Turn`}
        </div>
      )}
    </div>
  );
}