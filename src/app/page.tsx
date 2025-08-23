"use client";

import { useState, useEffect } from 'react';
import { GameSettings, GameState, Player, QuizQuestion } from '@/lib/types';
import { PokerGame } from '@/lib/game-engine/game';
import PokerTable from '@/components/game/Table';
import GameControls from '@/components/game/Controls';
import QuizModal from '@/components/quiz/QuizModal';
import CSICalculator from '@/components/quiz/CSICalculator';
import OddsCalculator from '@/components/quiz/OddsCalculator';
import HandRankings from '@/components/reference/HandRankings';
import PushFoldMatrix from '@/components/reference/PushFoldMatrix';
import { calculateCSI } from '@/lib/calculators/csi';

const defaultSettings: GameSettings = {
  numPlayers: 6,
  startingChips: 1500,
  smallBlind: 25,
  bigBlind: 50,
  showOpponentCards: 'sometimes',
  quizFrequency: 'medium',
  difficulty: 'intermediate',
  enableHints: true
};

export default function PokerTrainer() {
  const [game, setGame] = useState<PokerGame | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [currentQuiz, setCurrentQuiz] = useState<QuizQuestion | null>(null);
  const [showHandRankings, setShowHandRankings] = useState(false);
  const [showPushFoldMatrix, setShowPushFoldMatrix] = useState(false);
  const [showCSICalculator, setShowCSICalculator] = useState(false);
  const [showOddsCalculator, setShowOddsCalculator] = useState(false);
  const [calculateBeforeBet, setCalculateBeforeBet] = useState(false);
  const [pendingAction, setPendingAction] = useState<{action: string, amount?: number} | null>(null);
  const [settings, setSettings] = useState<GameSettings>(defaultSettings);

  // Initialize game
  useEffect(() => {
    const newGame = new PokerGame(settings);
    setGame(newGame);
    newGame.startNewHand();
    setGameState(newGame.getGameState());
  }, []);

  // Handle player actions
  const handleAction = (action: string, amount?: number) => {
    if (!game || !gameState) return;

    // If "calculate and then bet" is enabled, show appropriate calculator first
    if (calculateBeforeBet && (action === 'call' || action === 'bet' || action === 'raise')) {
      const humanPlayer = gameState.players.find(p => p.isHuman);
      if (humanPlayer) {
        const maxBet = Math.max(...gameState.players.map(p => p.currentBet));
        const callAmount = maxBet - humanPlayer.currentBet;
        
        setPendingAction({ action, amount });
        
        if (action === 'call' && callAmount > 0) {
          // Show odds calculator for call decisions
          setShowOddsCalculator(true);
          return;
        } else if (action === 'bet' || action === 'raise') {
          // Show CSI calculator for betting decisions
          setShowCSICalculator(true);
          return;
        }
      }
    }

    // Execute the action
    executeAction(action, amount);
  };

  const executeAction = (action: string, amount?: number) => {
    if (!game) return;

    const actionMap: { [key: string]: any } = {
      'fold': 'fold',
      'check': 'check', 
      'call': 'call',
      'bet': 'bet',
      'raise': 'raise',
      'all-in': 'all-in'
    };

    const success = game.playerAction(actionMap[action], amount);
    
    if (success) {
      setGameState(game.getGameState());
      
      // Maybe show a quiz
      if (shouldShowQuiz()) {
        setCurrentQuiz(generateQuiz());
      }
      
      // Check if hand is complete
      if (game.isHandComplete()) {
        setTimeout(() => {
          game.startNewHand();
          setGameState(game.getGameState());
        }, 3000);
      }
    }
  };

  // Quiz system
  const shouldShowQuiz = (): boolean => {
    const frequency = settings.quizFrequency;
    const random = Math.random();
    
    switch (frequency) {
      case 'low': return random < 0.1;
      case 'medium': return random < 0.25;
      case 'high': return random < 0.4;
      default: return false;
    }
  };

  const generateQuiz = (): QuizQuestion => {
    // Simple quiz for now - we'll make this more sophisticated later
    const humanPlayer = gameState?.players.find(p => p.isHuman);
    if (!humanPlayer || !gameState) {
      return {
        id: 'default',
        question: 'What is the strongest possible hand in Texas Hold\'em?',
        type: 'multiple_choice',
        answer: 0,
        options: ['Royal Flush', 'Straight Flush', 'Four of a Kind', 'Full House'],
        explanation: 'A Royal Flush (A-K-Q-J-T all same suit) is the strongest possible hand.',
        difficulty: 'beginner',
        category: 'hand_rankings'
      };
    }

    const csi = calculateCSI(humanPlayer.chips, gameState.smallBlind, gameState.bigBlind);
    
    return {
      id: 'csi_calc',
      question: `You have ${humanPlayer.chips} chips. Blinds are ${gameState.smallBlind}/${gameState.bigBlind}. What is your CSI?`,
      type: 'numeric',
      answer: Math.round(csi * 10) / 10,
      explanation: `CSI = Total Chips ÷ (Small Blind + Big Blind) = ${humanPlayer.chips} ÷ (${gameState.smallBlind} + ${gameState.bigBlind}) = ${csi.toFixed(1)}`,
      difficulty: 'intermediate',
      category: 'csi'
    };
  };

  const handleQuizAnswer = (answer: any) => {
    // Handle quiz answer here
    console.log('Quiz answer:', answer);
    setCurrentQuiz(null);
  };

  const startNewGame = () => {
    if (game) {
      game.startNewHand();
      setGameState(game.getGameState());
    }
  };

  if (!gameState || !game) {
    return (
      <div className="min-h-screen bg-green-800 flex items-center justify-center">
        <div className="text-white text-xl">Loading poker table...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-green-800 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold text-white">Texas Hold&apos;em Trainer</h1>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowHandRankings(!showHandRankings)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm"
            >
              📊 Hand Rankings
            </button>
            <button
              onClick={() => setShowPushFoldMatrix(!showPushFoldMatrix)}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded text-sm"
            >
              📈 Push/Fold Matrix
            </button>
            <button
              onClick={() => setShowCSICalculator(!showCSICalculator)}
              className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded text-sm"
            >
              🧮 CSI Calculator
            </button>
            <label className="flex items-center space-x-2 bg-gray-700 px-3 py-2 rounded text-white text-sm">
              <input
                type="checkbox"
                checked={calculateBeforeBet}
                onChange={(e) => setCalculateBeforeBet(e.target.checked)}
                className="rounded"
              />
              <span>Calculate & Bet</span>
            </label>
            <button
              onClick={startNewGame}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm"
            >
              🔄 New Hand
            </button>
          </div>
        </div>

        {/* Main game area */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Poker table */}
          <div className="lg:col-span-3">
            <PokerTable 
              gameState={gameState}
              onAction={handleAction}
              settings={settings}
            />
          </div>

          {/* Side panel */}
          <div className="space-y-4">
            <GameControls
              gameState={gameState}
              onAction={handleAction}
              validActions={game.getValidActions()}
            />
            
            {showHandRankings && (
              <HandRankings onClose={() => setShowHandRankings(false)} />
            )}
          </div>
        </div>
      </div>

      {/* Quiz modal */}
      {currentQuiz && (
        <QuizModal
          question={currentQuiz}
          onAnswer={handleQuizAnswer}
          onClose={() => setCurrentQuiz(null)}
        />
      )}

      {/* Push/Fold Matrix */}
      {showPushFoldMatrix && gameState && (
        <PushFoldMatrix
          playerHoleCards={gameState.players.find(p => p.isHuman)?.holeCards}
          csi={gameState.players.find(p => p.isHuman) ? calculateCSI(
            gameState.players.find(p => p.isHuman)!.chips, 
            gameState.smallBlind, 
            gameState.bigBlind
          ) : 10}
          position="button"
          onClose={() => setShowPushFoldMatrix(false)}
        />
      )}

      {/* CSI Calculator */}
      {showCSICalculator && gameState && gameState.players.find(p => p.isHuman) && (
        <CSICalculator
          gameState={gameState}
          humanPlayer={gameState.players.find(p => p.isHuman)!}
          onComplete={(csi) => {
            setShowCSICalculator(false);
            if (pendingAction) {
              executeAction(pendingAction.action, pendingAction.amount);
              setPendingAction(null);
            }
          }}
          onClose={() => {
            setShowCSICalculator(false);
            setPendingAction(null);
          }}
        />
      )}

      {/* Odds Calculator */}
      {showOddsCalculator && gameState && gameState.players.find(p => p.isHuman) && (
        <OddsCalculator
          gameState={gameState}
          humanPlayer={gameState.players.find(p => p.isHuman)!}
          callAmount={Math.max(...gameState.players.map(p => p.currentBet)) - gameState.players.find(p => p.isHuman)!.currentBet}
          onComplete={(shouldCall) => {
            setShowOddsCalculator(false);
            if (pendingAction && shouldCall) {
              executeAction(pendingAction.action, pendingAction.amount);
            }
            setPendingAction(null);
          }}
          onClose={() => {
            setShowOddsCalculator(false);
            setPendingAction(null);
          }}
        />
      )}
    </div>
  );
}