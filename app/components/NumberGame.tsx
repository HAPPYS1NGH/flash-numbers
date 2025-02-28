"use client";

import { useEffect, useState, useCallback } from "react";
import {
  useAccount,
  useWaitForTransactionReceipt,
  useSendTransaction,
} from "wagmi";
import { parseEther, type Hash } from "viem";
import {
  RECEIVER_ADDRESS,
  baseSepoliaClient,
  flashblockClient,
} from "../lib/web3Config";


export const NumberGame = () => {
  const [mounted, setMounted] = useState(false);
  const { isConnected } = useAccount();
  const [numbers, setNumbers] = useState<number[]>([]);
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [gameStarted, setGameStarted] = useState(false);
  const [initialTxHash, setInitialTxHash] = useState<Hash>();
  const [winTxHash, setWinTxHash] = useState<Hash>();
  const [gameTimer, setGameTimer] = useState(0);
  const [gameInterval, setGameInterval] = useState<NodeJS.Timeout | null>(null);
  const [gameStats, setGameStats] = useState({
    gamePlayTime: 0,
    initialTxTime: 0,
    winTxTime: 0,
    potentialNormalTx: 0,
    potentialFlashTx: 0,
  });
  const [message, setMessage] = useState("Connect wallet to play");
  const [showTimeoutModal, setShowTimeoutModal] = useState(false);

  const { sendTransactionAsync: sendInitialTx } = useSendTransaction();
  const { sendTransactionAsync: sendWinTx } = useSendTransaction();

  // Handle mounting
  useEffect(() => {
    setMounted(true);
    // Cleanup any existing interval on unmount
    return () => {
      if (gameInterval) {
        clearInterval(gameInterval);
      }
    };
  }, [gameInterval]);

  // Monitor transactions
  const { isLoading: isInitialTxLoading } = useWaitForTransactionReceipt({ hash: initialTxHash });
  const { isLoading: isWinTxLoading } = useWaitForTransactionReceipt({ hash: winTxHash });

  // Function to poll for transaction confirmations
  const pollForConfirmation = useCallback(
    async (txHash: Hash, isFlashbot: boolean = false) => {
      const startTime = Date.now();
      const client = isFlashbot ? flashblockClient : baseSepoliaClient;

      while (true) {
        try {
          const receipt = await client.getTransactionReceipt({ hash: txHash });
          if (receipt) {
            const confirmationTime = Date.now() - startTime;
            if (isFlashbot) {
              setGameStats(prev => ({
                ...prev,
                winTxTime: confirmationTime / 10,
                potentialFlashTx: Math.floor(prev.gamePlayTime*10 / confirmationTime),
              }));
            } else {
              setGameStats(prev => ({
                ...prev,
                initialTxTime: confirmationTime,
                potentialNormalTx: Math.floor(prev.gamePlayTime / confirmationTime),
              }));
            }
            return receipt;
          }
        } catch (error) {
          console.error("Error polling for transaction:", error);
        }
        await new Promise((resolve) => setTimeout(resolve, 50)); // Poll every 50ms
      }
    },
    []
  );

  // Initialize game
  useEffect(() => {
    if (isConnected) {
      setMessage("Click Start Game to begin!");
    } else {
      setMessage("Connect wallet to play");
    }
  }, [isConnected]);

  // Start game logic
  const startGame = async () => {
    if (!isConnected) return;

    try {
      const txHash = await sendInitialTx({
        to: RECEIVER_ADDRESS,
        value: parseEther("0.01"),
      });

      setInitialTxHash(txHash);
      setMessage("Waiting for initial transaction confirmation...");

      await pollForConfirmation(txHash);

      // Initialize game after confirmation
      const shuffledNumbers = Array.from({ length: 9 }, (_, i) => i + 1).sort(
        () => Math.random() - 0.5
      );
      setNumbers(shuffledNumbers);
      setSelectedNumbers([]);
      setGameStarted(true);
      setGameTimer(0);
      setMessage("Select numbers in order from 1 to 9!");
      setShowTimeoutModal(false);

      // Clear any existing interval
      if (gameInterval) {
        clearInterval(gameInterval);
      }

      // Start new interval
      const interval = setInterval(() => {
        setGameTimer((prev) => {
          if (prev >= 15) {
            clearInterval(interval);
            setShowTimeoutModal(true);
            setGameStarted(false);
            return prev;
          }
          return prev + 0.1;
        });
      }, 100);

      setGameInterval(interval);
    } catch (error) {
      console.error("Error starting game:", error);
      setMessage("Error starting game. Please try again.");
    }
  };

  // Handle number selection
  const handleNumberClick = async (number: number) => {
    if (!gameStarted) return;

    const expectedNumber = selectedNumbers.length + 1;
    if (number === expectedNumber) {
      const newSelected = [...selectedNumbers, number];
      setSelectedNumbers(newSelected);

      if (newSelected.length === 9) {
        // Game won - clear interval and update state
        if (gameInterval) {
          clearInterval(gameInterval);
          setGameInterval(null);
        }
        setGameStarted(false);
        const finalTime = gameTimer;
        setGameStats(prev => ({ ...prev, gamePlayTime: finalTime * 1000 })); // Convert to ms
        setMessage("Sending win transaction...");

        try {
          const txHash = await sendWinTx({
            to: RECEIVER_ADDRESS,
            value: parseEther("0"),
          });

          setWinTxHash(txHash);

          await pollForConfirmation(txHash, true);

          setMessage("Game completed!");
        } catch (error) {
          console.error("Error sending win transaction:", error);
          setMessage("Error sending win transaction. Game completed though!");
        }
      }
    } else {
      // Visual feedback for wrong selection
      const element = document.getElementById(`number-${number}`);
      if (element) {
        element.classList.add("shake");
        setTimeout(() => element.classList.remove("shake"), 500);
      }
    }
  };

  // Don't render anything until mounted
  if (!mounted) return null;

  return (
    <div className="max-w-lg mx-auto p-6 bg-white rounded-xl shadow-lg">
      <div className="text-center mb-6">
        <p className="text-lg font-semibold mb-2">{message}</p>
        {gameStarted && (
          <div className="text-2xl font-bold text-blue-600">
            {gameTimer.toFixed(1)}s
          </div>
        )}
      </div>

      {isConnected &&
        !gameStarted &&
        !isInitialTxLoading &&
        !isWinTxLoading && (
          <button
            onClick={startGame}
            className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mb-6 font-bold"
          >
            Start Game
          </button>
        )}

      <div className="grid grid-cols-3 gap-4 mb-6">
        {numbers.map((number) => (
          <button
            key={number}
            id={`number-${number}`}
            onClick={() => handleNumberClick(number)}
            disabled={!gameStarted}
            className={`
              aspect-square text-2xl font-bold rounded-lg transition-all
              ${
                selectedNumbers.includes(number)
                  ? "bg-green-500 text-white"
                  : "bg-white hover:bg-gray-100 border-2 border-gray-200"
              }
              ${!gameStarted && "opacity-50 cursor-not-allowed"}
            `}
          >
            {number}
          </button>
        ))}
      </div>

      {gameStats.gamePlayTime > 0 && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-white rounded-lg shadow">
              <div className="text-sm text-gray-600">Game Time</div>
              <div className="text-xl font-bold text-blue-600">
                {(gameStats.gamePlayTime / 1000).toFixed(1)}s
              </div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg shadow">
              <div className="text-sm text-gray-600">Transactions</div>
              <div className="text-xl font-bold text-green-600">
                {(gameStats.initialTxTime/gameStats.winTxTime).toFixed(0)}x faster
              </div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg shadow">
              <div className="text-sm text-gray-600">Normal Tx</div>
              <div className="text-lg font-semibold">
                {gameStats.initialTxTime}ms
              </div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg shadow">
              <div className="text-sm text-gray-600">Flash Tx</div>
              <div className="text-lg font-semibold">
                {gameStats.winTxTime}ms
              </div>
            </div>
          </div>
        </div>
      )}

      {showTimeoutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-sm mx-4 text-center">
            <div className="text-2xl font-bold text-red-500 mb-4">Time is Up! 🕒</div>
            <p className="text-gray-600 mb-6">You need to be faster than that!</p>
            <button
              onClick={startGame}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
