"use client";

import { useState } from 'react';
import { GameState, Player } from '@/lib/types';

interface CSICalculatorProps {
  gameState: GameState;
  humanPlayer: Player;
  onComplete: (calculatedCSI: number) => void;
  onClose: () => void;
  embedded?: boolean;
}

export default function CSICalculatorSimple({ 
  gameState, 
  humanPlayer, 
  onComplete, 
  onClose,
  embedded = false
}: CSICalculatorProps) {
  const [userInput, setUserInput] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  // Simple single-step CSI calculation
  const correctCSI = Math.round((humanPlayer.chips / (gameState.smallBlind + gameState.bigBlind)) * 10) / 10;
  const question = `Calculate your CSI: ${humanPlayer.chips} ÷ (${gameState.smallBlind} + ${gameState.bigBlind})`;
  const hint = `CSI = Chip Stack ÷ (Small Blind + Big Blind)`;
  const explanation = `CSI = ${humanPlayer.chips} ÷ ${gameState.smallBlind + gameState.bigBlind} = ${correctCSI}`;

  const handleSubmit = () => {
    const userAnswer = parseFloat(userInput);
    const tolerance = 0.1; // Allow small rounding differences
    const correct = Math.abs(userAnswer - correctCSI) <= tolerance;

    if (correct) {
      setIsComplete(true);
      onComplete(correctCSI);
    } else {
      setShowHint(true);
    }
  };

  const completionContent = (
    <>
      <div className="text-center mb-6">
        <div className="text-2xl font-bold text-green-800 mb-2">
          ✅ Correct! CSI = {correctCSI}
        </div>
        <div className="text-gray-800 font-medium">
          Your Chip Stack Index is {correctCSI}
        </div>
      </div>

      <div className="border-2 rounded-lg p-4 mb-4 border-green-200 bg-green-50">
        <h3 className="font-bold mb-2 text-green-800">
          CSI Strategy Guidelines:
        </h3>
        <div className="text-green-900 font-medium space-y-1">
          {correctCSI <= 2 ? 
            <p>• CSI ≤ 2: Extreme short stack - Push/fold with very wide ranges</p> :
            correctCSI <= 5 ?
            <p>• CSI 2-5: Very short stack - Tight push/fold strategy</p> :
            correctCSI <= 7 ?
            <p>• CSI 5-7: Short stack - Push/fold based on position and cards</p> :
            correctCSI <= 10 ?
            <p>• CSI 7-10: Medium short stack - Some post-flop play possible</p> :
            <p>• CSI 10+: Deeper stack - Standard tournament play</p>
          }
        </div>
      </div>

      <div className="text-center space-x-3">
        <button
          onClick={() => onComplete(correctCSI)}
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg"
        >
          Continue
        </button>
        <button
          onClick={onClose}
          className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg"
        >
          Close
        </button>
      </div>
    </>
  );

  const calculationContent = (
    <>
      {/* Game situation */}
      <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-bold text-blue-800 mb-3">Current Situation:</h4>
        <div className="text-base text-gray-900 space-y-2 font-medium">
          <div className="text-gray-900 font-medium"><strong>Your chip stack:</strong> {humanPlayer.chips}</div>
          <div className="text-gray-900 font-medium"><strong>Small blind:</strong> {gameState.smallBlind}</div>
          <div className="text-gray-900 font-medium"><strong>Big blind:</strong> {gameState.bigBlind}</div>
        </div>
      </div>

      {/* CSI Question */}
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4 leading-relaxed">
          {question}
        </h3>

        <input
          type="number"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          className="w-full p-4 border-2 border-gray-300 rounded-lg text-xl text-center mb-4 font-semibold focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          placeholder="Enter your answer (e.g., 20.0)"
          step="0.1"
        />

        {showHint && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="text-red-800 font-semibold mb-2">
              ❌ Not quite right. Let me help:
            </div>
            <div className="text-red-800 text-base mb-2 font-medium">
              {hint}
            </div>
            <div className="text-red-900 font-bold text-lg">
              Correct answer: {correctCSI}
            </div>
            <div className="text-red-900 text-base mt-3 font-medium">
              {explanation}
            </div>
          </div>
        )}
      </div>

      <div className="flex space-x-3">
        <button
          onClick={handleSubmit}
          disabled={!userInput}
          className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-lg"
        >
          {showHint ? 'Try Again' : 'Submit Answer'}
        </button>
        
        {!showHint && (
          <button
            onClick={() => setShowHint(true)}
            className="px-4 py-3 bg-yellow-500 hover:bg-yellow-600 text-white font-bold rounded-lg"
          >
            💡 Hint
          </button>
        )}
      </div>

      {/* CSI Reference */}
      <div className="mt-6 text-base text-gray-800 bg-blue-50 border border-blue-200 p-4 rounded-lg">
        <p className="font-semibold text-blue-800 mb-2">💡 About CSI (Chip Stack Index)</p>
        <p className="text-blue-900 leading-relaxed font-medium">CSI tells you how many &quot;rounds&quot; you can survive before being blinded out. It&apos;s the most important number for tournament strategy!</p>
      </div>
    </>
  );

  if (embedded) {
    return (
      <div className="w-full">
        <div className="p-4">
          {isComplete ? (
            <>
              <div className="mb-4 p-3 bg-green-600 text-white rounded-lg">
                <h3 className="font-bold">✅ CSI Calculation Complete!</h3>
              </div>
              {completionContent}
            </>
          ) : (
            <>
              <div className="mb-4 p-3 bg-blue-600 text-white rounded-lg">
                <h3 className="font-bold">🧮 Calculate Your CSI</h3>
                <p className="text-blue-100 text-sm">Chip Stack Index = Your Chips ÷ (SB + BB)</p>
              </div>
              {calculationContent}
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full">
        <div className="bg-blue-600 text-white p-4 rounded-t-xl flex justify-between items-center">
          <h2 className="text-xl font-bold">🧮 Calculate Your CSI</h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-300 text-xl font-bold w-8 h-8 flex items-center justify-center rounded hover:bg-blue-700"
          >
            ×
          </button>
        </div>

        <div className="p-6">
          {isComplete ? completionContent : calculationContent}
        </div>
      </div>
    </div>
  );
}