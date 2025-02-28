'use client';

import { useState, useEffect } from 'react';

interface NumberTile {
  number: number;
  isSelected: boolean;
}

const SLOW_MESSAGES = [
  "Too slow! Maybe Math isn't your thing... 😅",
  "Found a use case when Base is not for everyone! 😂",
  "Have you considered a career in slow motion? 🐌",
  "Your reflexes remind me of Internet Explorer... 🤣",
  "Even my grandma's faster! (Just kidding!) 😆"
];

export default function NumberGame() {
  const [numbers, setNumbers] = useState<NumberTile[]>([]);
  const [currentNumber, setCurrentNumber] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null);
  const [showSlowMessage, setShowSlowMessage] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [finalTime, setFinalTime] = useState(0);

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 100) / 10;
    return seconds.toFixed(2) + 's';
  };

  const shuffleNumbers = () => {
    const shuffled = Array.from({ length: 9 }, (_, i) => ({
      number: i + 1,
      isSelected: false,
    })).sort(() => Math.random() - 0.5);
    setNumbers(shuffled);
  };

  const endGame = (isSlow = false) => {
    setIsPlaying(false);
    setGameOver(true);
    if (timerInterval) {
      clearInterval(timerInterval);
      setTimerInterval(null);
    }
    if (!isSlow) {
      setFinalTime(time);
    }
  };

  const startGame = () => {
    shuffleNumbers();
    setCurrentNumber(1);
    setIsPlaying(true);
    setGameOver(false);
    setTime(0);
    setFinalTime(0);
    setShowSlowMessage(false);
    if (timerInterval) {
      clearInterval(timerInterval);
    }
    const interval = setInterval(() => {
      setTime(prev => {
        if (prev >= 15000) {
          setShowSlowMessage(true);
          endGame(true);
          return prev;
        }
        return prev + 100;
      });
    }, 100);
    setTimerInterval(interval);
  };

  const handleNumberClick = (number: number) => {
    if (!isPlaying) return;
    if (number === currentNumber) {
      setNumbers((prev) =>
        prev.map((n) =>
          n.number === number ? { ...n, isSelected: true } : n
        )
      );
      if (currentNumber === 9) {
        endGame(false);
      } else {
        setCurrentNumber((prev) => prev + 1);
      }
    } else {
      const tile = document.querySelector(`[data-number="${number}"]`);
      tile?.classList.add('shake');
      setTimeout(() => {
        tile?.classList.remove('shake');
      }, 500);
    }
  };

  useEffect(() => {
    return () => {
      if (timerInterval) {
        clearInterval(timerInterval);
      }
    };
  }, [timerInterval]);

  return (
    <div className="max-w-md mx-auto p-4 relative">
      <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
        <div className="text-center mb-4">
          <div className="text-2xl font-bold font-mono">
            {formatTime(isPlaying ? time : finalTime)}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          {numbers.map((tile) => (
            <button
              key={tile.number}
              data-number={tile.number}
              onClick={() => handleNumberClick(tile.number)}
              disabled={tile.isSelected || !isPlaying}
              className={`aspect-square text-2xl font-bold rounded-lg transition-colors
                ${tile.isSelected
                  ? 'bg-green-500 text-white cursor-not-allowed'
                  : 'bg-blue-100 hover:bg-blue-200 text-blue-800'
                }
                disabled:opacity-90 disabled:cursor-not-allowed`}
            >
              {tile.number}
            </button>
          ))}
        </div>

        {(!isPlaying && !gameOver) && (
          <div className="text-center">
            <button
              onClick={startGame}
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded-full transition-colors"
            >
              Start Game
            </button>
          </div>
        )}

        {gameOver && !showSlowMessage && (
          <div className="text-center">
            <div className="text-green-600 font-bold text-xl mb-4">
              Congratulations! You won! 🎉
              <div className="text-lg text-gray-600 mt-2">
                Your time: {formatTime(finalTime)}
              </div>
            </div>
            <button
              onClick={startGame}
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded-full transition-colors"
            >
              Play Again
            </button>
          </div>
        )}

        {showSlowMessage && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-sm mx-4">
              <div className="text-center text-xl font-bold text-orange-500 mb-4 animate-bounce">
                {SLOW_MESSAGES[Math.floor(Math.random() * SLOW_MESSAGES.length)]}
              </div>
              <button
                onClick={startGame}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded-full transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 