"use client";

import { useState } from 'react';
import { GameState, Player } from '@/lib/types';

interface CSICalculatorProps {
  gameState: GameState;
  humanPlayer: Player;
  onComplete: (calculatedCSI: number) => void;
  onClose: () => void;
}

interface CalculationStep {
  id: string;
  question: string;
  correctAnswer: number;
  explanation: string;
  hint?: string;
}

export default function CSICalculator({ gameState, humanPlayer, onComplete, onClose }: CSICalculatorProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [userInput, setUserInput] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  // Calculate the actual CSI for verification
  const actualCSI = humanPlayer.chips / (gameState.smallBlind + gameState.bigBlind);

  const steps: CalculationStep[] = [
    {
      id: 'chips',
      question: 'How many chips do you currently have?',
      correctAnswer: humanPlayer.chips,
      explanation: `You have ${humanPlayer.chips.toLocaleString()} chips.`,
      hint: 'Look at your chip count displayed on your player seat.'
    },
    {
      id: 'small_blind',
      question: 'What is the current small blind amount?',
      correctAnswer: gameState.smallBlind,
      explanation: `The small blind is ${gameState.smallBlind}.`,
      hint: 'Check the blinds info shown on the table (e.g., "Blinds: 25/50").'
    },
    {
      id: 'big_blind',
      question: 'What is the current big blind amount?',
      correctAnswer: gameState.bigBlind,
      explanation: `The big blind is ${gameState.bigBlind}.`,
      hint: 'The big blind is the second number in the blinds display.'
    },
    {
      id: 'total_blinds',
      question: 'What is the total of the small blind + big blind?',
      correctAnswer: gameState.smallBlind + gameState.bigBlind,
      explanation: `Small blind (${gameState.smallBlind}) + Big blind (${gameState.bigBlind}) = ${gameState.smallBlind + gameState.bigBlind}`,
      hint: 'Add the small blind and big blind together.'
    },
    {
      id: 'csi_calculation',
      question: 'Now calculate your CSI: Total Chips ÷ (Small Blind + Big Blind)',
      correctAnswer: Math.round(actualCSI * 10) / 10,
      explanation: `CSI = ${humanPlayer.chips} ÷ ${gameState.smallBlind + gameState.bigBlind} = ${actualCSI.toFixed(1)}`,
      hint: 'Divide your total chips by the sum of the blinds. Round to one decimal place.'
    }
  ];

  const currentStepData = steps[currentStep];

  const handleSubmit = () => {
    const userAnswer = parseFloat(userInput);
    const correct = Math.abs(userAnswer - currentStepData.correctAnswer) < 0.1;

    if (correct) {
      const newAnswers = [...answers, userAnswer];
      setAnswers(newAnswers);
      
      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1);
        setUserInput('');
        setShowHint(false);
      } else {
        // Completed all steps
        setIsComplete(true);
        onComplete(actualCSI);
      }
    } else {
      // Show hint or correction
      setShowHint(true);
    }
  };

  const getCSIStrategy = (csi: number): {strategy: string, color: string, description: string} => {
    if (csi <= 2) {
      return {
        strategy: 'EMERGENCY MODE',
        color: 'text-red-600 bg-red-100',
        description: 'Push any two cards in most situations. Need to double up immediately!'
      };
    } else if (csi <= 7) {
      return {
        strategy: 'PUSH/FOLD PRIMARY',
        color: 'text-orange-600 bg-orange-100',
        description: 'Use push/fold charts strictly. Avoid post-flop play.'
      };
    } else if (csi <= 12) {
      return {
        strategy: 'MIXED STRATEGY',
        color: 'text-yellow-600 bg-yellow-100',
        description: 'Can play some post-flop poker, but still primarily push/fold.'
      };
    } else {
      return {
        strategy: 'STANDARD PLAY',
        color: 'text-green-600 bg-green-100',
        description: 'Can use full range of poker skills. Deep stack play.'
      };
    }
  };

  if (isComplete) {
    const strategyInfo = getCSIStrategy(actualCSI);
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full">
          <div className="bg-green-600 text-white p-4 rounded-t-xl">
            <h2 className="text-xl font-bold">✅ CSI Calculation Complete!</h2>
          </div>
          
          <div className="p-6">
            <div className="text-center mb-6">
              <div className="text-4xl font-bold text-gray-800 mb-2">
                CSI: {actualCSI.toFixed(1)}
              </div>
              <div className={`inline-block px-4 py-2 rounded-full font-bold ${strategyInfo.color}`}>
                {strategyInfo.strategy}
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <h3 className="font-bold text-blue-800 mb-2">What This Means:</h3>
              <p className="text-blue-900">{strategyInfo.description}</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-bold text-gray-800 mb-3">Your Calculation Steps:</h3>
              <div className="space-y-2 text-sm">
                <div>1. Chips: {humanPlayer.chips.toLocaleString()}</div>
                <div>2. Small Blind: {gameState.smallBlind}</div>
                <div>3. Big Blind: {gameState.bigBlind}</div>
                <div>4. Total Blinds: {gameState.smallBlind + gameState.bigBlind}</div>
                <div className="font-bold">5. CSI = {humanPlayer.chips} ÷ {gameState.smallBlind + gameState.bigBlind} = {actualCSI.toFixed(1)}</div>
              </div>
            </div>

            <div className="text-center">
              <button
                onClick={onClose}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
              >
                Continue Playing
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full">
        <div className="bg-blue-600 text-white p-4 rounded-t-xl flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold">🧮 Learn to Calculate CSI</h2>
            <p className="text-blue-100 text-sm">Step {currentStep + 1} of {steps.length}</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-300 text-xl font-bold w-8 h-8 flex items-center justify-center rounded hover:bg-blue-700"
          >
            ×
          </button>
        </div>

        <div className="p-6">
          {/* Progress bar */}
          <div className="mb-6">
            <div className="bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / steps.length) * 100}%` }}
              />
            </div>
            <div className="text-sm text-gray-600 mt-1">
              Progress: {currentStep} of {steps.length} steps complete
            </div>
          </div>

          {/* Current step */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              {currentStepData.question}
            </h3>

            <input
              type="number"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              className="w-full p-3 border-2 border-gray-300 rounded-lg text-lg text-center mb-4"
              placeholder="Enter your answer"
              step="0.1"
            />

            {showHint && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="text-red-800 font-semibold mb-2">
                  ❌ Not quite right. Let me help:
                </div>
                <div className="text-red-700 text-sm mb-2">
                  {currentStepData.hint}
                </div>
                <div className="text-red-900 font-medium">
                  Correct answer: {currentStepData.correctAnswer}
                </div>
                <div className="text-red-800 text-sm mt-2">
                  {currentStepData.explanation}
                </div>
              </div>
            )}
          </div>

          {/* Previous answers */}
          {answers.length > 0 && (
            <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-3">
              <h4 className="font-semibold text-green-800 mb-2">Previous Steps:</h4>
              <div className="text-sm space-y-1">
                {answers.map((answer, index) => (
                  <div key={index} className="text-green-700">
                    ✅ Step {index + 1}: {answer} - {steps[index].explanation}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex space-x-3">
            <button
              onClick={handleSubmit}
              disabled={!userInput}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-lg transition-colors"
            >
              {showHint ? 'Try Again' : 'Submit Answer'}
            </button>
            
            {!showHint && currentStepData.hint && (
              <button
                onClick={() => setShowHint(true)}
                className="px-4 py-3 bg-yellow-500 hover:bg-yellow-600 text-white font-bold rounded-lg transition-colors"
              >
                💡 Hint
              </button>
            )}
          </div>

          {/* CSI Reference */}
          <div className="mt-6 text-xs text-gray-600 bg-gray-50 p-3 rounded">
            <p><strong>CSI (Chip Stacks Index)</strong> tells you how many "rounds" you can survive before being blinded out. It's the most important number for tournament strategy!</p>
          </div>
        </div>
      </div>
    </div>
  );
}