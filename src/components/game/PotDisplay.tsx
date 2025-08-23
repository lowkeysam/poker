"use client";

import { GameStage } from '@/lib/types';

interface PotDisplayProps {
  pot: number;
  stage: GameStage;
}

export default function PotDisplay({ pot, stage }: PotDisplayProps) {
  if (pot === 0) return null;

  return (
    <div className="mt-2">
      <div className="bg-yellow-600 text-white px-4 py-2 rounded-full shadow-lg border-2 border-yellow-400">
        <div className="text-center">
          <div className="text-xs font-semibold text-yellow-100 mb-1">
            POT
          </div>
          <div className="text-lg font-bold">
            ${pot.toLocaleString()}
          </div>
        </div>
      </div>
      
      {/* Animated chips */}
      <div className="flex justify-center mt-1 space-x-1">
        {Array.from({ length: Math.min(5, Math.floor(pot / 100) + 1) }).map((_, index) => (
          <div
            key={index}
            className={`
              w-3 h-3 rounded-full border-2
              ${index % 3 === 0 ? 'bg-red-500 border-red-700' : ''}
              ${index % 3 === 1 ? 'bg-blue-500 border-blue-700' : ''}
              ${index % 3 === 2 ? 'bg-green-500 border-green-700' : ''}
              animate-pulse
            `}
            style={{
              animationDelay: `${index * 0.2}s`
            }}
          />
        ))}
      </div>
    </div>
  );
}