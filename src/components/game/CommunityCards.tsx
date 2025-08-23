"use client";

import { Card, GameStage } from '@/lib/types';
import { cardToString } from '@/lib/game-engine/deck';

interface CommunityCardsProps {
  cards: Card[];
  stage: GameStage;
}

export default function CommunityCards({ cards, stage }: CommunityCardsProps) {
  const renderCard = (card: Card | null, index: number, isNew: boolean = false) => {
    if (!card) {
      return (
        <div
          key={index}
          className="w-12 h-18 border-2 border-dashed border-gray-400 rounded-lg flex items-center justify-center bg-green-600"
        >
          <div className="text-gray-400 text-xs">?</div>
        </div>
      );
    }

    return (
      <div
        key={index}
        className={`
          w-12 h-18 bg-white rounded-lg border-2 border-gray-300 flex items-center justify-center font-bold text-sm shadow-lg
          ${isNew ? 'animate-pulse ring-2 ring-yellow-400' : ''}
        `}
        style={{
          color: card.suit === 'hearts' || card.suit === 'diamonds' ? 'red' : 'black'
        }}
      >
        <div className="text-center">
          <div className="text-lg font-bold">{card.rank}</div>
          <div className="text-xl leading-none">
            {card.suit === 'hearts' && '♥'}
            {card.suit === 'diamonds' && '♦'}
            {card.suit === 'clubs' && '♣'}
            {card.suit === 'spades' && '♠'}
          </div>
        </div>
      </div>
    );
  };

  const getStageInfo = () => {
    switch (stage) {
      case 'preflop':
        return { name: 'Pre-Flop', description: 'Betting before community cards' };
      case 'flop':
        return { name: 'Flop', description: 'First 3 community cards' };
      case 'turn':
        return { name: 'Turn', description: '4th community card' };
      case 'river':
        return { name: 'River', description: '5th community card' };
      case 'showdown':
        return { name: 'Showdown', description: 'Compare hands' };
      default:
        return { name: '', description: '' };
    }
  };

  const stageInfo = getStageInfo();
  const isNewCard = (index: number) => {
    if (stage === 'flop' && index < 3) return true;
    if (stage === 'turn' && index === 3) return true;
    if (stage === 'river' && index === 4) return true;
    return false;
  };

  return (
    <div className="flex flex-col items-center space-y-3">
      {/* Stage indicator */}
      <div className="text-white text-sm font-semibold bg-black bg-opacity-50 px-3 py-1 rounded">
        {stageInfo.name}
      </div>

      {/* Community cards */}
      <div className="flex space-x-2">
        {/* Flop cards */}
        {[0, 1, 2].map(index => 
          renderCard(cards[index] || null, index, isNewCard(index))
        )}
        
        {/* Turn card */}
        <div className="mx-1">
          {renderCard(cards[3] || null, 3, isNewCard(3))}
        </div>
        
        {/* River card */}
        {renderCard(cards[4] || null, 4, isNewCard(4))}
      </div>

      {/* Stage description */}
      <div className="text-white text-xs text-center bg-black bg-opacity-30 px-2 py-1 rounded">
        {stageInfo.description}
      </div>

      {/* Board texture hints */}
      {cards.length >= 3 && (
        <div className="text-white text-xs text-center">
          <BoardAnalysis cards={cards} />
        </div>
      )}
    </div>
  );
}

// Simple board texture analysis
function BoardAnalysis({ cards }: { cards: Card[] }) {
  if (cards.length < 3) return null;

  const suits = cards.map(c => c.suit);
  const ranks = cards.map(c => c.rank);
  
  const isFlushDraw = suits.some(suit => 
    suits.filter(s => s === suit).length >= 3
  );

  const isStraightDraw = () => {
    // Simplified straight draw detection
    const rankValues = ranks.map(rank => {
      switch (rank) {
        case 'A': return 14;
        case 'K': return 13;
        case 'Q': return 12;
        case 'J': return 11;
        case 'T': return 10;
        default: return parseInt(rank);
      }
    }).sort((a, b) => a - b);

    // Check for potential straights
    for (let i = 0; i < rankValues.length - 1; i++) {
      if (rankValues[i + 1] - rankValues[i] === 1) {
        return true;
      }
    }
    return false;
  };

  const isPaired = ranks.some(rank => 
    ranks.filter(r => r === rank).length >= 2
  );

  const warnings = [];
  if (isFlushDraw) warnings.push('🟦 Flush Draw');
  if (isStraightDraw()) warnings.push('📏 Straight Draw');
  if (isPaired) warnings.push('👥 Paired Board');

  if (warnings.length === 0) {
    warnings.push('🌈 Rainbow Board');
  }

  return (
    <div className="text-xs bg-black bg-opacity-40 px-2 py-1 rounded">
      {warnings.join(' • ')}
    </div>
  );
}