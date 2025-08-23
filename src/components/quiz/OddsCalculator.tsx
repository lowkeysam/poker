"use client";

import { useState } from 'react';
import { GameState, Player, Card } from '@/lib/types';
import { calculateEquity, calculateOuts } from '@/lib/calculators/odds';

interface OddsCalculatorProps {
  gameState: GameState;
  humanPlayer: Player;
  callAmount: number;
  onComplete: (shouldCall: boolean) => void;
  onClose: () => void;
}

interface CalculationStep {
  id: string;
  question: string;
  correctAnswer: number;
  explanation: string;
  hint?: string;
  type: 'number' | 'percentage';
}

export default function OddsCalculator({ 
  gameState, 
  humanPlayer, 
  callAmount, 
  onComplete, 
  onClose 
}: OddsCalculatorProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [userInput, setUserInput] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const totalPot = gameState.pot + callAmount;
  const potOdds = totalPot / callAmount;
  const equityNeeded = (callAmount / (totalPot + callAmount)) * 100;
  
  // For demonstration, assume we have some equity (in real game, this would be calculated)
  const estimatedEquity = humanPlayer.holeCards.length === 2 && gameState.communityCards.length >= 3
    ? calculateEquity(humanPlayer.holeCards, gameState.communityCards)
    : 45; // Default assumption for demonstration

  const steps: CalculationStep[] = [
    {
      id: 'current_pot',
      question: 'What is the current pot size?',
      correctAnswer: gameState.pot,
      explanation: `The current pot is $${gameState.pot}.`,
      hint: 'Look at the pot display in the center of the table.',
      type: 'number'
    },
    {
      id: 'call_amount',
      question: 'How much do you need to call?',
      correctAnswer: callAmount,
      explanation: `You need to call $${callAmount}.`,
      hint: 'This is the amount shown on the "Call" button.',
      type: 'number'
    },
    {
      id: 'total_pot_after_call',
      question: 'What will the total pot be after your call?',
      correctAnswer: totalPot,
      explanation: `Total pot = Current pot ($${gameState.pot}) + Your call ($${callAmount}) = $${totalPot}`,
      hint: 'Add the current pot size to your call amount.',
      type: 'number'
    },
    {
      id: 'pot_odds_ratio',
      question: 'What pot odds are you getting? (How many dollars will you win for each dollar you risk?)',
      correctAnswer: Math.round(potOdds * 10) / 10,
      explanation: `Pot odds = Total pot after call ÷ Call amount = $${totalPot} ÷ $${callAmount} = ${potOdds.toFixed(1)}:1`,
      hint: 'Divide the total pot by your call amount.',
      type: 'number'
    },
    {
      id: 'equity_needed',
      question: 'What percentage equity do you need to break even on this call?',
      correctAnswer: Math.round(equityNeeded * 10) / 10,
      explanation: `Equity needed = Call amount ÷ (Total pot + Call amount) = $${callAmount} ÷ $${totalPot + callAmount} = ${equityNeeded.toFixed(1)}%`,
      hint: 'Formula: Call amount ÷ (Pot after call) × 100',
      type: 'percentage'
    }
  ];

  const currentStepData = steps[currentStep];

  const handleSubmit = () => {
    const userAnswer = parseFloat(userInput);
    const tolerance = currentStepData.type === 'percentage' ? 2 : (callAmount > 100 ? 10 : 1);
    const correct = Math.abs(userAnswer - currentStepData.correctAnswer) <= tolerance;

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
        const shouldCall = estimatedEquity >= equityNeeded;
        onComplete(shouldCall);
      }
    } else {
      setShowHint(true);
    }
  };

  if (isComplete) {
    const shouldCall = estimatedEquity >= equityNeeded;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full">
          <div className="bg-green-600 text-white p-4 rounded-t-xl">
            <h2 className="text-xl font-bold">✅ Odds Calculation Complete!</h2>
          </div>
          
          <div className="p-6">
            <div className="text-center mb-6">
              <div className="text-2xl font-bold text-gray-800 mb-2">
                Decision: {shouldCall ? 
                  <span className="text-green-600">CALL</span> : 
                  <span className="text-red-600">FOLD</span>
                }
              </div>
              <div className="text-gray-600">
                You need {equityNeeded.toFixed(1)}% equity, estimated equity: {estimatedEquity.toFixed(1)}%
              </div>
            </div>

            <div className={`border-2 rounded-lg p-4 mb-4 ${
              shouldCall ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
            }`}>
              <h3 className={`font-bold mb-2 ${
                shouldCall ? 'text-green-800' : 'text-red-800'
              }`}>
                Mathematical Analysis:
              </h3>
              <div className={`text-sm ${
                shouldCall ? 'text-green-900' : 'text-red-900'
              }`}>
                {shouldCall 
                  ? `Since your estimated equity (${estimatedEquity.toFixed(1)}%) is greater than the required equity (${equityNeeded.toFixed(1)}%), this call is mathematically profitable.`
                  : `Since your estimated equity (${estimatedEquity.toFixed(1)}%) is less than the required equity (${equityNeeded.toFixed(1)}%), this call is not profitable.`
                }
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-bold text-gray-800 mb-3">Your Calculation:</h3>
              <div className="space-y-2 text-sm">
                <div>• Current pot: ${gameState.pot}</div>
                <div>• Call amount: ${callAmount}</div>
                <div>• Total pot after call: ${totalPot}</div>
                <div>• Pot odds: {potOdds.toFixed(1)}:1</div>
                <div className="font-bold">• Equity needed: {equityNeeded.toFixed(1)}%</div>
              </div>
            </div>

            <div className="text-center space-x-3">
              <button
                onClick={() => onComplete(shouldCall)}
                className={`font-bold py-3 px-6 rounded-lg transition-colors ${
                  shouldCall 
                    ? 'bg-green-600 hover:bg-green-700 text-white' 
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
              >
                {shouldCall ? 'Make the Call' : 'Fold the Hand'}
              </button>
              <button
                onClick={onClose}
                className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
              >
                Cancel
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
            <h2 className="text-xl font-bold">🧮 Calculate Pot Odds</h2>
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
                style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              />
            </div>
            <div className="text-sm text-gray-600 mt-1">
              Progress: {currentStep + 1} of {steps.length} steps
            </div>
          </div>

          {/* Game situation */}
          <div className="mb-4 bg-gray-50 border rounded-lg p-3">
            <h4 className="font-semibold text-gray-800 mb-2">Current Situation:</h4>
            <div className="text-sm space-y-1">
              <div>Your cards: {humanPlayer.holeCards.map(c => c.unicode).join(' ')}</div>
              <div>Board: {gameState.communityCards.map(c => c.unicode).join(' ') || 'Pre-flop'}</div>
              <div>Pot size: ${gameState.pot}</div>
              <div>You need to call: ${callAmount}</div>
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
              placeholder={currentStepData.type === 'percentage' ? 'Enter percentage (e.g., 25)' : 'Enter amount'}
              step={currentStepData.type === 'percentage' ? '0.1' : '1'}
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
                  Correct answer: {currentStepData.correctAnswer}{currentStepData.type === 'percentage' ? '%' : ''}
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
                    ✅ Step {index + 1}: {answer}{steps[index].type === 'percentage' ? '%' : ''} - {steps[index].explanation}
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

          {/* Reference */}
          <div className="mt-6 text-xs text-gray-600 bg-gray-50 p-3 rounded">
            <p><strong>Pot Odds Formula:</strong> Compare what you can win vs. what you risk. If your equity is higher than the required percentage, the call is profitable!</p>
          </div>
        </div>
      </div>
    </div>
  );
}