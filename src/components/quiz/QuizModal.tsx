"use client";

import { useState, useEffect, useCallback } from 'react';
import { QuizQuestion } from '@/lib/types';

interface QuizModalProps {
  question: QuizQuestion;
  onAnswer: (answer: string | number | boolean) => void;
  onClose: () => void;
  timeLimit?: number;
}

export default function QuizModal({ question, onAnswer, onClose, timeLimit = 60 }: QuizModalProps) {
  const [userAnswer, setUserAnswer] = useState<string | number | boolean>('');
  const [showResult, setShowResult] = useState(false);
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [isCorrect, setIsCorrect] = useState(false);

  const handleSubmit = useCallback(() => {
    let correct = false;
    
    switch (question.type) {
      case 'numeric':
        const numAnswer = parseFloat(String(userAnswer));
        const expectedNum = parseFloat(String(question.answer));
        correct = Math.abs(numAnswer - expectedNum) < 0.1; // Allow small tolerance
        break;
      case 'percentage':
        const pctAnswer = parseFloat(String(userAnswer));
        const expectedPct = parseFloat(String(question.answer));
        correct = Math.abs(pctAnswer - expectedPct) < 2; // Allow 2% tolerance
        break;
      case 'boolean':
        correct = userAnswer === question.answer;
        break;
      case 'multiple_choice':
        correct = userAnswer === question.answer;
        break;
      case 'ratio':
        correct = userAnswer.toString().toLowerCase() === question.answer.toString().toLowerCase();
        break;
      default:
        correct = userAnswer === question.answer;
    }

    setIsCorrect(correct);
    setShowResult(true);
    onAnswer(userAnswer);
  }, [question.type, question.answer, userAnswer, onAnswer]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [handleSubmit]);

  const handleClose = () => {
    onClose();
  };

  const renderInput = () => {
    switch (question.type) {
      case 'numeric':
      case 'percentage':
        return (
          <input
            type="number"
            value={String(userAnswer)}
            onChange={(e) => setUserAnswer(e.target.value)}
            className="w-full p-3 border-2 border-gray-300 rounded-lg text-lg text-center"
            placeholder={question.type === 'percentage' ? 'Enter percentage (e.g., 25)' : 'Enter number'}
            step="0.1"
          />
        );

      case 'boolean':
        return (
          <div className="flex space-x-4">
            <button
              onClick={() => setUserAnswer(true)}
              className={`flex-1 p-3 rounded-lg border-2 font-bold ${
                userAnswer === true 
                  ? 'bg-green-500 text-white border-green-600' 
                  : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
              }`}
            >
              True
            </button>
            <button
              onClick={() => setUserAnswer(false)}
              className={`flex-1 p-3 rounded-lg border-2 font-bold ${
                userAnswer === false 
                  ? 'bg-red-500 text-white border-red-600' 
                  : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
              }`}
            >
              False
            </button>
          </div>
        );

      case 'multiple_choice':
        return (
          <div className="space-y-2">
            {question.options?.map((option, index) => (
              <button
                key={index}
                onClick={() => setUserAnswer(index)}
                className={`w-full p-3 text-left rounded-lg border-2 ${
                  userAnswer === index
                    ? 'bg-blue-500 text-white border-blue-600'
                    : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                }`}
              >
                {String.fromCharCode(65 + index)}. {option}
              </button>
            ))}
          </div>
        );

      case 'ratio':
        return (
          <input
            type="text"
            value={String(userAnswer)}
            onChange={(e) => setUserAnswer(e.target.value)}
            className="w-full p-3 border-2 border-gray-300 rounded-lg text-lg text-center"
            placeholder="Enter ratio (e.g., 3:1)"
          />
        );

      default:
        return (
          <input
            type="text"
            value={String(userAnswer)}
            onChange={(e) => setUserAnswer(e.target.value)}
            className="w-full p-3 border-2 border-gray-300 rounded-lg text-lg"
            placeholder="Enter your answer"
          />
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-blue-600 text-white p-4 rounded-t-xl flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold">📚 Learning Quiz</h2>
            <p className="text-blue-100 text-sm capitalize">{question.category} • {question.difficulty}</p>
          </div>
          <div className="text-right">
            <div className={`text-2xl font-bold ${timeLeft <= 10 ? 'text-red-300 animate-pulse' : 'text-white'}`}>
              {timeLeft}s
            </div>
            <div className="text-xs text-blue-100">Time left</div>
          </div>
        </div>

        {/* Question */}
        <div className="p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              {question.question}
            </h3>
            
            {!showResult && (
              <div className="mb-4">
                {renderInput()}
              </div>
            )}
          </div>

          {/* Result */}
          {showResult && (
            <div className={`mb-4 p-4 rounded-lg border-2 ${
              isCorrect 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <div className={`text-lg font-bold mb-2 ${
                isCorrect ? 'text-green-800' : 'text-red-800'
              }`}>
                {isCorrect ? '✅ Correct!' : '❌ Incorrect'}
              </div>
              
              {!isCorrect && (
                <div className="text-gray-700 mb-2">
                  <strong>Your answer:</strong> {userAnswer.toString()}
                </div>
              )}
              
              <div className="text-gray-700 mb-2">
                <strong>Correct answer:</strong> {question.answer.toString()}
              </div>
              
              <div className="text-gray-600 text-sm">
                <strong>Explanation:</strong> {question.explanation}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex space-x-3">
            {!showResult ? (
              <>
                <button
                  onClick={handleSubmit}
                  disabled={userAnswer === '' || userAnswer === undefined}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                >
                  Submit Answer
                </button>
                <button
                  onClick={handleClose}
                  className="px-6 py-3 bg-gray-300 hover:bg-gray-400 text-gray-700 font-bold rounded-lg transition-colors"
                >
                  Skip
                </button>
              </>
            ) : (
              <button
                onClick={handleClose}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
              >
                Continue Playing
              </button>
            )}
          </div>

          {/* Progress indicator */}
          <div className="mt-4 bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-1000 ${
                timeLeft <= 10 ? 'bg-red-500' : 'bg-blue-500'
              }`}
              style={{ width: `${(timeLeft / timeLimit) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}