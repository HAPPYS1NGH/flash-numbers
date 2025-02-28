// 'use client';

// import { useState, useEffect } from 'react';
// import { parseEther } from 'viem';
// import { useSendTransaction } from 'wagmi';
// import { RECEIVER_ADDRESS, FLASHBLOCKS_WS, baseSepoliaClient, preconfClient } from '../lib/web3Config';

// interface NumberTile {
//   number: number;
//   isSelected: boolean;
// }

// interface GameStats {
//   initialTxTime?: number;  // Time for first transaction
//   gamePlayTime?: number;   // Time taken to play
//   flashbotTime?: number;   // Time for flashbot transaction
// }

// const SLOW_MESSAGES = [
//   "Too slow! Maybe Math isn't your thing... 😅",
//   "Found a use case when Base is not for everyone! 😂",
//   "Have you considered a career in slow motion... 🐌",
//   "Your reflexes remind me of Internet Explorer... 🤣",
//   "Even my grandma's faster! (Just kidding!) 😆"
// ];

// export default function NumberGame() {
//   const [numbers, setNumbers] = useState<NumberTile[]>([]);
//   const [currentNumber, setCurrentNumber] = useState(1);
//   const [isPlaying, setIsPlaying] = useState(false);
//   const [time, setTime] = useState(0);
//   const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null);
//   const [showSlowMessage, setShowSlowMessage] = useState(false);
//   const [gameOver, setGameOver] = useState(false);
//   const [finalTime, setFinalTime] = useState(0);
//   const [isProcessing, setIsProcessing] = useState(false);
//   const [gameStats, setGameStats] = useState<GameStats>({});
//   const [initialTxHash, setInitialTxHash] = useState<string>('');
  
//   const { sendTransactionAsync } = useSendTransaction();

//   const formatTime = (ms: number) => {
//     const seconds = Math.floor(ms / 100) / 10;
//     return seconds.toFixed(2) + 's';
//   };

//   const monitorTransaction = async (txHash: string, isFlashbot: boolean = false) => {
//     const startTime = Date.now();
//     let preconfTime: number | undefined;
    
//     // Setup WebSocket for preconf monitoring
//     const ws = new WebSocket(FLASHBLOCKS_WS);
    
//     const preconfPromise = new Promise<number>((resolve) => {
//       ws.onmessage = async (event: MessageEvent) => {
//         try {
//           // Handle blob data if present
//           const text = event.data instanceof Blob ? 
//             await event.data.text() : 
//             event.data;
          
//           const data = JSON.parse(text);
          
//           if (data.metadata?.receipts?.[txHash]) {
//             const time = Date.now() - startTime;
//             if (isFlashbot) {
//               setGameStats(prev => ({ ...prev, flashbotTime: time }));
//             }
//             resolve(time);
//             ws.close();
//           }
//         } catch (error) {
//           console.error('WebSocket message parsing error:', error);
//         }
//       };
//     });

//     // Wait for regular confirmation
//     const regularConfPromise = baseSepoliaClient.waitForTransactionReceipt({
//       hash: txHash as `0x${string}`,
//     }).then(() => Date.now() - startTime);

//     try {
//       // Race between preconf and regular conf
//       const [preconf, regular] = await Promise.all([
//         Promise.race([preconfPromise, regularConfPromise]),
//         regularConfPromise
//       ]);

//       if (!isFlashbot) {
//         setGameStats(prev => ({ ...prev, initialTxTime: regular }));
//         startGame();
//       }

//       return { preconfTime: preconf, confirmTime: regular };
//     } catch (error) {
//       console.error('Transaction monitoring error:', error);
//       ws.close();
//       throw error;
//     }
//   };

//   const initiateGame = async () => {
//     try {
//       setIsProcessing(true);
      
//       // Send initial transaction with 0.01 ETH
//       const txHash = await sendTransactionAsync({
//         to: RECEIVER_ADDRESS,
//         value: parseEther('0.01'),
//       });
      
//       setInitialTxHash(txHash);
//       await monitorTransaction(txHash);
      
//     } catch (error) {
//       console.error('Initial transaction failed:', error);
//     } finally {
//       setIsProcessing(false);
//     }
//   };

//   const sendFinalTransaction = async () => {
//     try {
//       setIsProcessing(true);
      
//       // Send final transaction with 0 ETH using flashbot
//       const txHash = await sendTransactionAsync({
//         to: RECEIVER_ADDRESS,
//         value: BigInt(0),
//         chainId: baseSepoliaClient.chain.id,
//       });
      
//       await monitorTransaction(txHash, true);
      
//     } catch (error) {
//       console.error('Final transaction failed:', error);
//     } finally {
//       setIsProcessing(false);
//     }
//   };

//   const shuffleNumbers = () => {
//     const shuffled = Array.from({ length: 9 }, (_, i) => ({
//       number: i + 1,
//       isSelected: false,
//     })).sort(() => Math.random() - 0.5);
//     setNumbers(shuffled);
//   };

//   const startGame = () => {
//     shuffleNumbers();
//     setCurrentNumber(1);
//     setIsPlaying(true);
//     setGameOver(false);
//     setTime(0);
//     setFinalTime(0);
//     setShowSlowMessage(false);
    
//     if (timerInterval) {
//       clearInterval(timerInterval);
//     }
//     const interval = setInterval(() => {
//       setTime(prev => {
//         if (prev >= 15000) {
//           setShowSlowMessage(true);
//           endGame(true);
//           return prev;
//         }
//         return prev + 100;
//       });
//     }, 100);
//     setTimerInterval(interval);
//   };

//   const endGame = async (isSlow = false) => {
//     setIsPlaying(false);
//     setGameOver(true);
//     if (timerInterval) {
//       clearInterval(timerInterval);
//       setTimerInterval(null);
//     }
//     if (!isSlow) {
//       setFinalTime(time);
//       setGameStats(prev => ({ ...prev, gamePlayTime: time }));
//       await sendFinalTransaction();
//     }
//   };

//   const handleNumberClick = (number: number) => {
//     if (!isPlaying) return;
//     if (number === currentNumber) {
//       setNumbers((prev) =>
//         prev.map((n) =>
//           n.number === number ? { ...n, isSelected: true } : n
//         )
//       );
//       if (currentNumber === 9) {
//         endGame(false);
//       } else {
//         setCurrentNumber((prev) => prev + 1);
//       }
//     } else {
//       const tile = document.querySelector(`[data-number="${number}"]`);
//       tile?.classList.add('shake');
//       setTimeout(() => {
//         tile?.classList.remove('shake');
//       }, 500);
//     }
//   };

//   useEffect(() => {
//     return () => {
//       if (timerInterval) {
//         clearInterval(timerInterval);
//       }
//     };
//   }, [timerInterval]);

//   const renderGameStats = () => {
//     if (!gameStats.initialTxTime && !gameStats.gamePlayTime && !gameStats.flashbotTime) return null;
    
//     return (
//       <div className="mt-6 p-4 bg-gray-50 rounded-lg">
//         <h3 className="font-bold mb-3">Game Statistics:</h3>
//         <div className="space-y-2 text-sm">
//           <p>Initial Transaction Time: {gameStats.initialTxTime ? `${gameStats.initialTxTime}ms` : 'Pending...'}</p>
//           <p>Game Play Time: {gameStats.gamePlayTime ? formatTime(gameStats.gamePlayTime) : 'Not completed'}</p>
//           <p>Flashbot Transaction Time: {gameStats.flashbotTime ? `${gameStats.flashbotTime}ms` : 'Waiting for preconfirmation...'}</p>
//           {gameStats.flashbotTime && gameStats.initialTxTime && (
//             <p className="text-green-600 font-semibold">
//               Speed Improvement: {Math.max(0, gameStats.initialTxTime - gameStats.flashbotTime)}ms faster!
//             </p>
//           )}
//         </div>
//       </div>
//     );
//   };

//   return (
//     <div className="max-w-md mx-auto p-4 relative">
//       <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
//         <div className="text-center mb-4">
//           <div className="text-2xl font-bold font-mono">
//             {formatTime(isPlaying ? time : finalTime)}
//           </div>
//         </div>

//         <div className="grid grid-cols-3 gap-4 mb-6">
//           {numbers.map((tile) => (
//             <button
//               key={tile.number}
//               data-number={tile.number}
//               onClick={() => handleNumberClick(tile.number)}
//               disabled={tile.isSelected || !isPlaying}
//               className={`aspect-square text-2xl font-bold rounded-lg transition-colors
//                 ${tile.isSelected
//                   ? 'bg-green-500 text-white cursor-not-allowed'
//                   : 'bg-blue-100 hover:bg-blue-200 text-blue-800'
//                 }
//                 disabled:opacity-90 disabled:cursor-not-allowed`}
//             >
//               {tile.number}
//             </button>
//           ))}
//         </div>

//         {(!isPlaying && !gameOver) && (
//           <div className="text-center">
//             <button
//               onClick={initiateGame}
//               disabled={isProcessing}
//               className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded-full transition-colors disabled:opacity-50"
//             >
//               {isProcessing ? 'Processing...' : 'Start Game'}
//             </button>
//           </div>
//         )}

//         {gameOver && !showSlowMessage && (
//           <div className="text-center">
//             <div className="text-green-600 font-bold text-xl mb-4">
//               Congratulations! You won! 🎉
//               <div className="text-lg text-gray-600 mt-2">
//                 Your time: {formatTime(finalTime)}
//               </div>
//             </div>
//             <button
//               onClick={initiateGame}
//               disabled={isProcessing}
//               className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded-full transition-colors disabled:opacity-50"
//             >
//               {isProcessing ? 'Processing...' : 'Play Again'}
//             </button>
//           </div>
//         )}

//         {showSlowMessage && (
//           <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//             <div className="bg-white rounded-lg p-8 max-w-sm mx-4">
//               <div className="text-center text-xl font-bold text-orange-500 mb-4 animate-bounce">
//                 {SLOW_MESSAGES[Math.floor(Math.random() * SLOW_MESSAGES.length)]}
//               </div>
//               <button
//                 onClick={initiateGame}
//                 disabled={isProcessing}
//                 className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded-full transition-colors disabled:opacity-50"
//               >
//                 {isProcessing ? 'Processing...' : 'Try Again'}
//               </button>
//             </div>
//           </div>
//         )}

//         {renderGameStats()}
//       </div>
//     </div>
//   );
// } 

'use client';

import { useState, useEffect, useCallback } from 'react';
import { parseEther } from 'viem';
import { useSendTransaction } from 'wagmi';
import { RECEIVER_ADDRESS, FLASHBLOCKS_WS, baseSepoliaClient } from '../lib/web3Config';

interface NumberTile {
  number: number;
  isSelected: boolean;
}

interface GameStats {
  initialTxTime?: number;  // Time for first transaction
  gamePlayTime?: number;   // Time taken to play
  flashbotTime?: number;   // Time for flashbot transaction
}

interface TransactionStatus {
  status: 'idle' | 'pending' | 'confirmed' | 'failed';
  txHash?: string;
  isFlashbot: boolean;
}

const SLOW_MESSAGES = [
  "Too slow! Maybe Math isn't your thing... 😅",
  "Found a use case when Base is not for everyone! 😂",
  "Have you considered a career in slow motion... 🐌",
  "Your reflexes remind me of Internet Explorer... 🤣",
  "Even my grandma's faster! (Just kidding!) 😆"
];

// WebSocket timeout (30 seconds)
const WS_TIMEOUT = 30000;

export default function NumberGame() {
  const [numbers, setNumbers] = useState<NumberTile[]>([]);
  const [currentNumber, setCurrentNumber] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null);
  const [showSlowMessage, setShowSlowMessage] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [finalTime, setFinalTime] = useState(0);
  const [gameStats, setGameStats] = useState<GameStats>({});
  const [transactionStatus, setTransactionStatus] = useState<TransactionStatus>({
    status: 'idle',
    isFlashbot: false
  });
  
  const { sendTransactionAsync } = useSendTransaction();

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 100) / 10;
    return seconds.toFixed(2) + 's';
  };

  // Improved WebSocket connection handler with proper lifecycle management
  const createWebSocketConnection = useCallback(() => {
    const ws = new WebSocket(FLASHBLOCKS_WS);
    
    ws.onopen = () => console.log('WebSocket connected to Flashblocks');
    ws.onerror = (error) => console.error('WebSocket error:', error);
    ws.onclose = () => console.log('WebSocket connection closed');
    
    return ws;
  }, []);

  // Process WebSocket messages for transaction confirmations
  const processWebSocketMessage = useCallback(async (event: MessageEvent, txHash: string) => {
    try {
      // Handle blob data if present
      const text = event.data instanceof Blob ? await event.data.text() : event.data;
      const data = JSON.parse(text);
      
      // Check if our transaction is in the receipts
      if (data.metadata?.receipts?.[txHash]) {
        return true;
      }
      return false;
    } catch (error) {
      console.error('WebSocket message parsing error:', error);
      return false;
    }
  }, []);


  const monitorTransaction = useCallback(async (txHash: string, isFlashbot: boolean = false) => {
    const startTime = Date.now();
    
    // Update transaction status
    setTransactionStatus({
      status: 'pending',
      txHash,
      isFlashbot
    });
    
    // Setup WebSocket for preconf monitoring
    const ws = createWebSocketConnection();
    let wsTimeout: NodeJS.Timeout | null = null;
    
    const preconfPromise = new Promise<number>((resolve, reject) => {
      // Set timeout for WebSocket
      wsTimeout = setTimeout(() => {
        console.log('WebSocket timeout reached');
        ws.close();
        reject(new Error('Preconfirmation timeout'));
      }, WS_TIMEOUT);
      
      ws.onmessage = async (event: MessageEvent) => {
        const isConfirmed = await processWebSocketMessage(event, txHash);
        
        if (isConfirmed) {
          const time = Date.now() - startTime;
          if (wsTimeout) clearTimeout(wsTimeout);
          ws.close();
          resolve(time);
        }
      };
    });

    // Wait for regular confirmation using client
    const regularConfPromise = baseSepoliaClient.waitForTransactionReceipt({
      hash: txHash as `0x${string}`,
    }).then(() => Date.now() - startTime);

    try {
      // Race between preconf and regular conf
      const preconfTime = await Promise.race([preconfPromise, regularConfPromise]);
      const regularTime = await regularConfPromise;
      
      // Update game stats based on transaction type
      if (isFlashbot) {
        setGameStats(prev => ({ ...prev, flashbotTime: preconfTime }));
      } else {
        setGameStats(prev => ({ ...prev, initialTxTime: regularTime }));
        startGame(); // Only start game after initial transaction is confirmed
      }
      
      // Update transaction status
      setTransactionStatus({
        status: 'confirmed',
        txHash,
        isFlashbot
      });
      
      return { preconfTime, confirmTime: regularTime };
    } catch (error) {
      console.error('Transaction monitoring error:', error);
      
      // Clean up WebSocket on error
      if (wsTimeout) clearTimeout(wsTimeout);
      if (ws.readyState === WebSocket.OPEN) ws.close();
      
      // Still wait for regular confirmation
      const regularTime = await regularConfPromise;
      
      if (!isFlashbot) {
        setGameStats(prev => ({ ...prev, initialTxTime: regularTime }));
        startGame();
      }
      
      setTransactionStatus({
        status: 'confirmed', // We still got regular confirmation
        txHash,
        isFlashbot
      });
      
      return { preconfTime: undefined, confirmTime: regularTime };
    }
  }, [createWebSocketConnection, processWebSocketMessage]);

  // Initiate game with improved transaction handling
  const initiateGame = useCallback(async () => {
    try {
      setGameStats({}); // Reset game stats
      setTransactionStatus({
        status: 'pending',
        isFlashbot: false
      });
      
      // Send initial transaction with 0.01 ETH
      const txHash = await sendTransactionAsync({
        to: RECEIVER_ADDRESS,
        value: parseEther('0.01'),
      });
      
      console.log('Initial transaction sent:', txHash);
      await monitorTransaction(txHash, false);
      
    } catch (error) {
      console.error('Initial transaction failed:', error);
      setTransactionStatus({
        status: 'failed',
        isFlashbot: false
      });
    }
  }, [sendTransactionAsync, monitorTransaction]);

  // Send final transaction using flashbot
  const sendFinalTransaction = useCallback(async () => {
    try {
      setTransactionStatus({
        status: 'pending',
        isFlashbot: true
      });
      
      // Send final transaction with 0 ETH
      const txHash = await sendTransactionAsync({
        to: RECEIVER_ADDRESS,
        value: BigInt(0),
        chainId: baseSepoliaClient.chain.id,
      });
      
      console.log('Flashbot transaction sent:', txHash);
      await monitorTransaction(txHash, true);
      
    } catch (error) {
      console.error('Flashbot transaction failed:', error);
      setTransactionStatus({
        status: 'failed',
        isFlashbot: true
      });
    }
  }, [sendTransactionAsync, monitorTransaction]);

  // Shuffle numbers for the game
  const shuffleNumbers = useCallback(() => {
    const shuffled = Array.from({ length: 9 }, (_, i) => ({
      number: i + 1,
      isSelected: false,
    })).sort(() => Math.random() - 0.5);
    setNumbers(shuffled);
  }, []);

  // Start the game after initial transaction is confirmed
  const startGame = useCallback(() => {
    shuffleNumbers();
    setCurrentNumber(1);
    setIsPlaying(true);
    setGameOver(false);
    setTime(0);
    setFinalTime(0);
    setShowSlowMessage(false);
    
    // Clear any existing timer
    if (timerInterval) {
      clearInterval(timerInterval);
    }
    
    // Start the game timer
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
  }, [shuffleNumbers, timerInterval]);

  // End the game and optionally send the final transaction
  const endGame = useCallback(async (isSlow = false) => {
    setIsPlaying(false);
    setGameOver(true);
    
    // Stop the timer
    if (timerInterval) {
      clearInterval(timerInterval);
      setTimerInterval(null);
    }
    
    if (!isSlow) {
      setFinalTime(time);
      setGameStats(prev => ({ ...prev, gamePlayTime: time }));
      await sendFinalTransaction();
    }
  }, [time, timerInterval, sendFinalTransaction]);

  // Handle number tile click
  const handleNumberClick = useCallback((number: number) => {
    if (!isPlaying) return;
    
    if (number === currentNumber) {
      // Correct number clicked
      setNumbers((prev) =>
        prev.map((n) =>
          n.number === number ? { ...n, isSelected: true } : n
        )
      );
      
      if (currentNumber === 9) {
        // Game completed
        endGame(false);
      } else {
        // Move to next number
        setCurrentNumber((prev) => prev + 1);
      }
    } else {
      // Wrong number clicked - add shake animation
      const tile = document.querySelector(`[data-number="${number}"]`);
      tile?.classList.add('shake');
      setTimeout(() => {
        tile?.classList.remove('shake');
      }, 500);
    }
  }, [isPlaying, currentNumber, endGame]);

  // Cleanup timer on component unmount
  useEffect(() => {
    return () => {
      if (timerInterval) {
        clearInterval(timerInterval);
      }
    };
  }, [timerInterval]);

  // Render game statistics
  const renderGameStats = () => {
    if (!gameStats.initialTxTime && !gameStats.gamePlayTime && !gameStats.flashbotTime) return null;
    
    return (
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-bold mb-3">Game Statistics:</h3>
        <div className="space-y-2 text-sm">
          <p>Initial Transaction Time: {gameStats.initialTxTime ? `${gameStats.initialTxTime}ms` : 'Pending...'}</p>
          <p>Game Play Time: {gameStats.gamePlayTime ? formatTime(gameStats.gamePlayTime) : 'Not completed'}</p>
          <p>Flashbot Transaction Time: {gameStats.flashbotTime ? `${gameStats.flashbotTime}ms` : 
              transactionStatus.status === 'pending' && transactionStatus.isFlashbot ? 
              'Waiting for preconfirmation...' : 'Not sent'}</p>
          {gameStats.flashbotTime && gameStats.initialTxTime && (
            <p className="text-green-600 font-semibold">
              Speed Improvement: {Math.max(0, gameStats.initialTxTime - gameStats.flashbotTime)}ms faster!
            </p>
          )}
        </div>
      </div>
    );
  };

  // Render transaction status
  const renderTransactionStatus = () => {
    if (transactionStatus.status === 'idle') return null;
    
    return (
      <div className="mt-4 text-sm">
        <p className={`font-semibold ${
          transactionStatus.status === 'pending' ? 'text-yellow-600' : 
          transactionStatus.status === 'confirmed' ? 'text-green-600' : 'text-red-600'
        }`}>
          {transactionStatus.isFlashbot ? 'Flashbot' : 'Initial'} Transaction: {transactionStatus.status}
          {transactionStatus.txHash && (
            <span className="block mt-1 text-gray-500 text-xs overflow-hidden text-ellipsis">
              Hash: {transactionStatus.txHash}
            </span>
          )}
        </p>
      </div>
    );
  };

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
              onClick={initiateGame}
              disabled={transactionStatus.status === 'pending'}
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded-full transition-colors disabled:opacity-50"
            >
              {transactionStatus.status === 'pending' ? 'Processing...' : 'Start Game'}
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
              onClick={initiateGame}
              disabled={transactionStatus.status === 'pending'}
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded-full transition-colors disabled:opacity-50"
            >
              {transactionStatus.status === 'pending' ? 'Processing...' : 'Play Again'}
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
                onClick={initiateGame}
                disabled={transactionStatus.status === 'pending'}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded-full transition-colors disabled:opacity-50"
              >
                {transactionStatus.status === 'pending' ? 'Processing...' : 'Try Again'}
              </button>
            </div>
          </div>
        )}

        {renderTransactionStatus()}
        {renderGameStats()}
      </div>
    </div>
  );
}