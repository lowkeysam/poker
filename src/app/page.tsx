"use client";

import { useState, useEffect } from 'react';
import { GameSettings, GameState, Player, QuizQuestion } from '@/lib/types';
import { PokerGame } from '@/lib/game-engine/game';
import PokerTable from '@/components/game/Table';
import GameControls from '@/components/game/Controls';
import QuizModal from '@/components/quiz/QuizModal';
import CSICalculatorSimple from '@/components/quiz/CSICalculatorSimple';
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
  const [showCSICalculatorModal, setShowCSICalculatorModal] = useState(false);
  const [showOddsCalculator, setShowOddsCalculator] = useState(false);
  const [showPotOddsCalculator, setShowPotOddsCalculator] = useState(false);
  const [calculateBeforeBet, setCalculateBeforeBet] = useState(false);
  const [pendingAction, setPendingAction] = useState<{action: string, amount?: number} | null>(null);
  const [settings, setSettings] = useState<GameSettings>(defaultSettings);
  
  // Polling to update game state when AI players act
  useEffect(() => {
    if (!game) return;
    
    const pollGameState = setInterval(() => {
      const currentState = game.getGameState();
      // Only update if the game state has actually changed
      if (JSON.stringify(currentState) !== JSON.stringify(gameState)) {
        setGameState(currentState);
        
        // Check if we need to trigger more AI actions
        triggerAIPlayerIfNeeded();
      }
    }, 500); // Check every 500ms
    
    return () => clearInterval(pollGameState);
  }, [game, gameState]);

  // Initialize game
  useEffect(() => {
    const newGame = new PokerGame(settings);
    setGame(newGame);
    newGame.startNewHand();
    setGameState(newGame.getGameState());
    
    // Trigger AI players if needed after game starts
    setTimeout(() => {
      const currentPlayer = newGame.getCurrentPlayer();
      if (currentPlayer && !currentPlayer.isHuman) {
        newGame.startAIActions();
      }
    }, 500);
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
          setShowCSICalculatorModal(true);
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
          // Trigger AI players after new hand
          triggerAIPlayerIfNeeded();
        }, 3000);
      } else {
        // Trigger AI player turn after human action
        triggerAIPlayerIfNeeded();
      }
    }
  };

  // AI player automation
  const triggerAIPlayerIfNeeded = () => {
    if (!game || !gameState) return;
    
    const currentPlayer = game.getCurrentPlayer();
    if (currentPlayer && !currentPlayer.isHuman && !currentPlayer.isFolded && !currentPlayer.isAllIn) {
      // It's an AI player's turn - trigger automatic play
      game.startAIActions();
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
      
      // Trigger AI players after new hand starts
      setTimeout(() => {
        const currentPlayer = game.getCurrentPlayer();
        if (currentPlayer && !currentPlayer.isHuman) {
          game.startAIActions();
        }
      }, 500);
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
      <div className="w-full px-4">
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
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded text-sm"
            >
              📈 Push/Fold Matrix
            </button>
            <button
              onClick={() => setShowCSICalculator(!showCSICalculator)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded text-sm"
            >
              🧮 CSI Calculator
            </button>
            <button
              onClick={() => setShowPotOddsCalculator(!showPotOddsCalculator)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded text-sm"
            >
              📊 Pot Odds
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
              className="bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded text-sm"
            >
              🔄 New Hand
            </button>
          </div>
        </div>

        {/* Main game area */}
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-4 min-h-[600px]">
          {/* Poker table */}
          <div className="lg:col-span-4 flex flex-col">
            {/* Table container with flexible height */}
            <div className="flex-1 min-h-[450px] flex items-center justify-center">
              <PokerTable 
                gameState={gameState}
                onAction={handleAction}
                settings={settings}
              />
            </div>
            
            {/* Bottom table area for Push/Fold Matrix only */}
            {showPushFoldMatrix && (
              <div className="bg-gray-800 rounded-lg p-4 mt-4">
                <div className="bg-white rounded-lg p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-gray-800">Push/Fold Matrix</h3>
                    <button
                      onClick={() => setShowPushFoldMatrix(false)}
                      className="text-gray-500 hover:text-gray-700 text-xl font-bold"
                    >
                      ×
                    </button>
                  </div>
                  <PushFoldMatrix
                    playerHoleCards={gameState.players.find(p => p.isHuman)?.holeCards}
                    csi={gameState.players.find(p => p.isHuman) ? calculateCSI(
                      gameState.players.find(p => p.isHuman)!.chips, 
                      gameState.smallBlind, 
                      gameState.bigBlind
                    ) : 10}
                    position="button"
                    onClose={() => setShowPushFoldMatrix(false)}
                    embedded={true}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Side panel */}
          <div className="lg:col-span-2 space-y-4">
            <GameControls
              gameState={gameState}
              onAction={handleAction}
              validActions={game.getValidActions()}
            />
            
            {/* CSI Calculator in side panel */}
            {showCSICalculator && gameState && gameState.players.find(p => p.isHuman) && (
              <div className="bg-white rounded-lg p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-gray-800">CSI Calculator</h3>
                  <button
                    onClick={() => setShowCSICalculator(false)}
                    className="text-gray-500 hover:text-gray-700 text-xl font-bold"
                  >
                    ×
                  </button>
                </div>
                <CSICalculatorSimple
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
                  embedded={true}
                />
              </div>
            )}
            
            {/* Pot Odds Calculator in side panel */}
            {showPotOddsCalculator && gameState && gameState.players.find(p => p.isHuman) && (
              <div className="bg-white rounded-lg p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-gray-800">Pot Odds Calculator</h3>
                  <button
                    onClick={() => setShowPotOddsCalculator(false)}
                    className="text-gray-500 hover:text-gray-700 text-xl font-bold"
                  >
                    ×
                  </button>
                </div>
                <OddsCalculator
                  gameState={gameState}
                  humanPlayer={gameState.players.find(p => p.isHuman)!}
                  callAmount={Math.max(...gameState.players.map(p => p.currentBet)) - gameState.players.find(p => p.isHuman)!.currentBet}
                  onComplete={(shouldCall) => {
                    setShowPotOddsCalculator(false);
                    if (pendingAction && shouldCall) {
                      executeAction(pendingAction.action, pendingAction.amount);
                      setPendingAction(null);
                    }
                  }}
                  onClose={() => {
                    setShowPotOddsCalculator(false);
                    setPendingAction(null);
                  }}
                  embedded={true}
                />
              </div>
            )}
            
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

      {/* CSI Calculator Modal */}
      {showCSICalculatorModal && gameState && gameState.players.find(p => p.isHuman) && (
        <CSICalculatorSimple
          gameState={gameState}
          humanPlayer={gameState.players.find(p => p.isHuman)!}
          onComplete={(csi) => {
            setShowCSICalculatorModal(false);
            if (pendingAction) {
              executeAction(pendingAction.action, pendingAction.amount);
              setPendingAction(null);
            }
          }}
          onClose={() => {
            setShowCSICalculatorModal(false);
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