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
// Disable SSR for this component

export const NumberGame = () => {
  const [mounted, setMounted] = useState(false);
  const { address: userAddress, isConnected } = useAccount();
  const [numbers, setNumbers] = useState<number[]>([]);
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [gameStarted, setGameStarted] = useState(false);
  const [initialTxHash, setInitialTxHash] = useState<Hash>();
  const [winTxHash, setWinTxHash] = useState<Hash>();
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [gameTimer, setGameTimer] = useState(0);
  const [message, setMessage] = useState("Connect wallet to play");
  const [metrics, setMetrics] = useState({
    initialTxTime: 0,
    winTxTime: 0,
  });

  const { sendTransactionAsync: sendInitialTx } = useSendTransaction();
  const { sendTransactionAsync: sendWinTx } = useSendTransaction();

  // Handle mounting
  useEffect(() => {
    setMounted(true);
  }, []);

  // Monitor initial transaction
  const { isLoading: isInitialTxLoading, isSuccess: isInitialTxSuccess } =
    useWaitForTransactionReceipt({
      hash: initialTxHash,
    });

  // Monitor win transaction
  const { isLoading: isWinTxLoading, isSuccess: isWinTxSuccess } =
    useWaitForTransactionReceipt({
      hash: winTxHash,
    });

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
              setMetrics((prev) => ({
                ...prev,
                winTxTime: confirmationTime / 10,
              }));
            } else {
              setMetrics((prev) => ({
                ...prev,
                initialTxTime: confirmationTime,
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

      // Start polling for initial transaction
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

      const gameInterval = setInterval(() => {
        setGameTimer((prev) => {
          if (prev >= 15) {
            clearInterval(gameInterval);
            setMessage("Time's up! Try again!");
            setGameStarted(false);
            return prev;
          }
          return prev + 0.1;
        });
      }, 100);

      return () => clearInterval(gameInterval);
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
        setGameStarted(false);
        setTimeElapsed(gameTimer);
        setMessage("Sending win transaction...");

        try {
          const txHash = await sendWinTx({
            to: RECEIVER_ADDRESS,
            value: parseEther("0"),
          });

          setWinTxHash(txHash);

          // Start polling for win transaction
          await pollForConfirmation(txHash, true);

          setMessage(`Game completed! Time: ${gameTimer.toFixed(1)}s`);
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
    <div className="max-w-lg mx-auto p-4">
      <div className="text-center mb-4">
        <p className="text-lg font-semibold mb-2">{message}</p>
        {gameStarted && (
          <p className="text-xl font-bold text-blue-600">
            Time: {gameTimer.toFixed(1)}s
          </p>
        )}
      </div>

      {isConnected &&
        !gameStarted &&
        !isInitialTxLoading &&
        !isWinTxLoading && (
          <button
            onClick={startGame}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mb-4"
          >
            Start Game
          </button>
        )}

      <div className="grid grid-cols-3 gap-4 mb-4">
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
                  : "bg-white hover:bg-gray-100"
              }
              ${!gameStarted && "opacity-50 cursor-not-allowed"}
            `}
          >
            {number}
          </button>
        ))}
      </div>

      {(metrics.initialTxTime > 0 || metrics.winTxTime > 0) && (
        <div className="mt-4 p-4 bg-gray-100 rounded-lg">
          <h3 className="font-semibold mb-2">Transaction Metrics:</h3>
          <p>Initial Transaction: {metrics.initialTxTime}ms</p>
          {metrics.winTxTime > 0 && (
            <p>Win Transaction: {metrics.winTxTime}ms</p>
          )}
        </div>
      )}
    </div>
  );
};
