"use client";

import handRankingsData from '@/data/hand-rankings.json';

interface HandRankingsProps {
  onClose: () => void;
}

export default function HandRankings({ onClose }: HandRankingsProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gray-800 text-white p-4 rounded-t-xl flex justify-between items-center">
          <h2 className="text-xl font-bold">Texas Hold&apos;em Hand Rankings</h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-300 text-xl font-bold w-8 h-8 flex items-center justify-center rounded hover:bg-gray-700"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-6 text-center">
            <p className="text-gray-600">Hands are ranked from strongest (1) to weakest (10). Higher-ranked hands beat lower-ranked hands.</p>
          </div>

          <div className="space-y-3">
            {handRankingsData.rankings.map((hand) => (
              <div
                key={hand.rank}
                className="border border-gray-200 rounded-lg p-4 bg-white hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-gray-800 text-white flex items-center justify-center font-bold text-sm">
                      {hand.rank}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-800">{hand.name}</h3>
                      <p className="text-sm text-gray-600">{hand.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-500">Probability</div>
                    <div className="text-sm font-semibold text-gray-700">
                      {hand.probability}%
                    </div>
                  </div>
                </div>

                {/* Examples */}
                <div className="bg-gray-50 rounded p-3 border">
                  <div className="text-xs font-semibold text-gray-600 mb-2">Examples:</div>
                  <div className="flex flex-wrap gap-2">
                    {hand.examples.map((example, index) => (
                      <div
                        key={index}
                        className="bg-white px-2 py-1 rounded text-xs font-mono text-gray-800 border border-gray-200"
                      >
                        {example}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Special notes for certain hands */}
                {hand.rank === 1 && (
                  <div className="mt-2 text-xs text-yellow-700 bg-yellow-100 p-2 rounded">
                    💎 <strong>Royal Flush:</strong> The ultimate hand! Only possible with A-K-Q-J-T all in the same suit.
                  </div>
                )}
                
                {hand.rank === 6 && (
                  <div className="mt-2 text-xs text-blue-700 bg-blue-100 p-2 rounded">
                    🌈 <strong>Straight:</strong> Ace can be high (A-K-Q-J-T) or low (5-4-3-2-A), but not wrap-around (K-A-2-3-4).
                  </div>
                )}

                {hand.rank === 9 && (
                  <div className="mt-2 text-xs text-gray-700 bg-gray-100 p-2 rounded">
                    👥 <strong>One Pair:</strong> Most common made hand. Kicker cards are crucial for determining winners.
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Quick tips */}
          <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-bold text-green-800 mb-2">💡 Quick Tips</h3>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• <strong>Suits have no ranking</strong> - a flush in spades equals a flush in hearts</li>
              <li>• <strong>Kicker cards matter</strong> - when hands tie, highest unused cards win</li>
              <li>• <strong>Best 5-card hand wins</strong> - use any combination of your 2 cards + 5 community cards</li>
              <li>• <strong>Practice recognition</strong> - quickly identifying hand strength is crucial</li>
            </ul>
          </div>

          {/* Memory aids */}
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-bold text-blue-800 mb-2">🧠 Memory Aids</h3>
            <div className="text-sm text-blue-700 grid md:grid-cols-2 gap-2">
              <div>• <strong>Royal Flush:</strong> &quot;Royal family&quot; in one suit</div>
              <div>• <strong>Straight Flush:</strong> Five in a row, matching suits</div>
              <div>• <strong>Four of a Kind:</strong> &quot;Quads&quot;</div>
              <div>• <strong>Full House:</strong> &quot;Full boat&quot; - three plus two</div>
              <div>• <strong>Flush:</strong> All same suit</div>
              <div>• <strong>Straight:</strong> Five in sequence</div>
              <div>• <strong>Three of a Kind:</strong> &quot;Trips&quot; or &quot;Set&quot;</div>
              <div>• <strong>Two Pair:</strong> Two different pairs</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}