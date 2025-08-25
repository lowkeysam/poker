"use client";

import { GameStage } from '@/lib/types';

interface PotDisplayProps {
  pot: number;
  stage: GameStage;
  smallBlind: number;
  bigBlind: number;
}

export default function PotDisplay({ pot, stage, smallBlind, bigBlind }: PotDisplayProps) {
  if (pot === 0) return null;

  return (
    <div className="mt-1">
      {/* Blinds info above pot */}
      <div className="mb-2 text-center">
        <div className="bg-blue-600 text-white px-3 py-1 rounded text-sm font-bold shadow">
          Blinds: {smallBlind}/{bigBlind}
        </div>
      </div>
      
      {/* Pot display */}
      <div className="bg-gradient-to-br from-yellow-400 to-yellow-600 text-black px-6 py-3 rounded-full shadow-2xl border-4 border-yellow-300 transform hover:scale-105 transition-transform">
        <div className="text-center">
          <div className="text-base font-black text-yellow-900 mb-1 tracking-wide">
            💰 POT 💰
          </div>
          <div className="text-2xl font-black text-yellow-900 drop-shadow-lg">
            ${pot.toLocaleString()}
          </div>
        </div>
      </div>
      
      {/* Poker chips removed to eliminate blinking circles */}
    </div>
  );
}