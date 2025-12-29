
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Player, Reward, HorizontalBar } from '../types';
import { ArrowLeft, Play, RefreshCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface LadderBoardProps {
  players: Player[];
  rewards: Reward[];
  bars: HorizontalBar[];
  onReset: () => void;
}

const LadderBoard: React.FC<LadderBoardProps> = ({ players, rewards, bars, onReset }) => {
  const [animatingPlayerId, setAnimatingPlayerId] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, number>>({}); // playerIndex -> rewardIndex
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [showConfetti, setShowConfetti] = useState(false);
  const [activePaths, setActivePaths] = useState<Record<string, {x: number, y: number}[]>>({});

  const numPlayers = players.length;
  const numRows = 12; 

  // Precise coordinate calculation: center of each column relative to the ladder width
  const getColX = useCallback((colIndex: number) => {
    return ((colIndex + 0.5) / numPlayers) * 100;
  }, [numPlayers]);

  const getRowY = useCallback((rowIndex: number) => {
    return (rowIndex / (numRows + 1)) * 100;
  }, [numRows]);

  const calculatePath = useCallback((startCol: number) => {
    let currentCol = startCol;
    const path: { x: number, y: number }[] = [];
    
    // Start at the top (y=0)
    for (let r = 0; r <= numRows; r++) {
      // 1. Current vertical position
      path.push({ x: currentCol, y: r });
      
      // 2. Check for horizontal movement before moving to the next vertical row
      if (r < numRows) {
        const rightBar = bars.find(b => b.row === r && b.fromCol === currentCol);
        const leftBar = bars.find(b => b.row === r && b.fromCol === currentCol - 1);
        
        if (rightBar) {
          currentCol++;
          path.push({ x: currentCol, y: r });
        } else if (leftBar) {
          currentCol--;
          path.push({ x: currentCol, y: r });
        }
      }
    }
    // Add final destination point
    path.push({ x: currentCol, y: numRows + 1 });

    return { path, finalCol: currentCol };
  }, [bars, numRows]);

  const handleAnimate = (player: Player, index: number) => {
    if (completed.has(player.id) || animatingPlayerId) return;
    
    setAnimatingPlayerId(player.id);
    const { path, finalCol } = calculatePath(index);

    // Track path for visual trail
    setActivePaths(prev => ({ ...prev, [player.id]: [] }));

    const totalSteps = path.length;
    const stepDuration = 250; // ms per step

    // We calculate when the animation will finish to update state
    setTimeout(() => {
      setResults(prev => ({ ...prev, [index]: finalCol }));
      setCompleted(prev => {
        const next = new Set(prev);
        next.add(player.id);
        return next;
      });
      setAnimatingPlayerId(null);
      
      if (completed.size + 1 === players.length) {
        setTimeout(() => setShowConfetti(true), 1000);
      }
    }, totalSteps * stepDuration + 500);
  };

  const handleAnimateAll = async () => {
    if (animatingPlayerId || completed.size > 0) return;
    for (let i = 0; i < players.length; i++) {
      handleAnimate(players[i], i);
      await new Promise(res => setTimeout(res, 600));
    }
  };

  return (
    <div className="w-full flex flex-col items-center select-none overflow-visible">
      <div className="w-full flex justify-between mb-8 items-center px-4">
        <button 
          onClick={onReset}
          className="flex items-center gap-2 text-gray-400 hover:text-pink-500 transition-colors font-bold text-lg"
        >
          <ArrowLeft size={20} /> 설정 다시하기
        </button>
        <div className="flex gap-4">
           {completed.size === players.length ? (
             <button 
              onClick={() => { setCompleted(new Set()); setResults({}); setShowConfetti(false); setActivePaths({}); }}
              className="px-6 py-3 bg-pink-100 text-pink-600 font-bold rounded-2xl hover:bg-pink-200 flex items-center gap-2 shadow-sm"
            >
              <RefreshCcw size={18} /> 한 번 더 하기!
            </button>
           ) : (
             <button 
              onClick={handleAnimateAll}
              disabled={animatingPlayerId !== null || completed.size > 0}
              className="px-6 py-3 bg-gradient-to-r from-yellow-400 to-orange-400 text-white font-bold rounded-2xl hover:shadow-lg disabled:opacity-50 flex items-center gap-2 transition-all active:scale-95"
            >
              <Play size={18} fill="currentColor" /> 친구들 모두 출발!
            </button>
           )}
        </div>
      </div>

      <div className="relative w-full max-w-4xl overflow-x-auto pb-10 custom-scrollbar">
        <div className="min-w-[700px] flex flex-col items-center px-10">
          
          {/* Players Header */}
          <div className="flex justify-around w-full mb-10">
            {players.map((p, i) => (
              <div key={p.id} className="flex flex-col items-center w-24">
                <motion.div
                  initial={false}
                  animate={animatingPlayerId === p.id ? { scale: 1.2, y: -10 } : { scale: 1, y: 0 }}
                  className={`text-4xl w-16 h-16 rounded-full flex items-center justify-center transition-all bg-white border-4 ${
                    completed.has(p.id) ? 'border-gray-200 opacity-40' : 'border-yellow-200 shadow-lg cursor-pointer hover:border-pink-300'
                  }`}
                  onClick={() => handleAnimate(p, i)}
                >
                  <span className={animatingPlayerId === p.id ? 'animate-bounce' : ''}>{p.avatar}</span>
                </motion.div>
                <span className="mt-2 font-bold text-gray-600 text-lg truncate w-full text-center">{p.name}</span>
              </div>
            ))}
          </div>

          {/* Ladder Canvas Area */}
          <div className="relative w-full h-[550px]">
             {/* Vertical Grid Lines */}
             <div className="absolute inset-0 flex justify-around pointer-events-none">
                {players.map((_, i) => (
                  <div key={i} className="w-[8px] bg-yellow-100/50 h-full rounded-full relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-yellow-200/20 via-transparent to-yellow-200/20" />
                  </div>
                ))}
             </div>

             {/* SVG for Permanent Bars and Active Paths */}
             <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none">
               {/* Horizontal Bars */}
               {bars.map((bar, idx) => {
                 const x1 = getColX(bar.fromCol);
                 const x2 = getColX(bar.fromCol + 1);
                 const y = getRowY(bar.row + 1); // offset by 1 for top padding
                 return (
                   <line 
                     key={`bar-${idx}`}
                     x1={`${x1}%`} 
                     y1={`${y}%`} 
                     x2={`${x2}%`} 
                     y2={`${y}%`} 
                     stroke="#FDE68A" 
                     strokeWidth="10" 
                     strokeLinecap="round"
                     className="drop-shadow-sm"
                   />
                 );
               })}

               {/* Active Trails */}
               {Object.entries(activePaths).map(([pid, pathPoints]) => (
                 <polyline
                    key={`trail-${pid}`}
                    points={(pathPoints as {x: number, y: number}[]).map(p => `${getColX(p.x)}%,${getRowY(p.y + 1)}%`).join(' ')}
                    fill="none"
                    stroke="#F472B6"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeDasharray="1,12"
                    opacity="0.6"
                 />
               ))}
             </svg>
             
             {/* Dynamic Moving Character */}
             {animatingPlayerId && (
                <MovingCharacter 
                  player={players.find(p => p.id === animatingPlayerId)!} 
                  path={calculatePath(players.findIndex(p => p.id === animatingPlayerId)).path}
                  getColX={getColX}
                  getRowY={(y) => getRowY(y + 1)}
                  onStep={(visited) => setActivePaths(prev => ({
                    ...prev,
                    [animatingPlayerId]: visited
                  }))}
                />
             )}
          </div>

          {/* Rewards Footer */}
          <div className="flex justify-around w-full mt-12">
            {rewards.map((r, i) => {
              const winningPlayer = players.find((_, pIdx) => results[pIdx] === i);
              return (
                <div key={r.id} className="flex flex-col items-center w-24">
                  <span className="mb-2 font-black text-blue-200 text-3xl">{i + 1}</span>
                  <motion.div 
                    animate={winningPlayer ? { 
                      scale: [1, 1.1, 1],
                      rotate: [0, -5, 5, 0]
                    } : {}}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className={`w-full min-h-[90px] p-3 rounded-3xl text-center border-4 flex flex-col items-center justify-center transition-all ${
                      winningPlayer ? 'bg-white border-pink-400 shadow-2xl scale-110 z-10' : 'bg-blue-50/50 border-blue-100 text-gray-300'
                    }`}
                  >
                    {winningPlayer ? (
                      <>
                        <span className="text-4xl mb-1">{winningPlayer.avatar}</span>
                        <span className="font-bold text-pink-500 leading-tight text-lg">{r.text}</span>
                      </>
                    ) : (
                      <span className="font-bold leading-tight text-sm opacity-50">{r.text}</span>
                    )}
                  </motion.div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showConfetti && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed inset-0 pointer-events-none flex items-center justify-center z-50 p-6"
          >
            <div className="bg-white/95 backdrop-blur-sm p-10 rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] border-8 border-yellow-300 text-center pointer-events-auto max-w-xl w-full">
              <h2 className="text-5xl font-bold text-pink-500 mb-8 leading-tight">모험 대성공! 🎉</h2>
              
              <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar mb-8">
                {players.map((p, i) => (
                  <motion.div 
                    key={p.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-yellow-50 p-4 rounded-2xl flex items-center gap-4 border-2 border-yellow-100"
                  >
                    <span className="text-4xl">{p.avatar}</span>
                    <div className="flex-1 text-left">
                      <p className="font-bold text-gray-700 text-lg">{p.name}</p>
                      <p className="text-pink-500 font-black text-xl">✨ {rewards[results[i]]?.text}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
              
              <button 
                onClick={() => setShowConfetti(false)}
                className="w-full py-4 bg-gradient-to-r from-pink-400 to-yellow-400 text-white text-2xl font-bold rounded-2xl shadow-xl hover:scale-105 transition-all active:scale-95"
              >
                친구들과 결과보기
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface MovingCharacterProps {
  player: Player;
  path: { x: number, y: number }[];
  getColX: (c: number) => number;
  getRowY: (y: number) => number;
  onStep: (visited: {x: number, y: number}[]) => void;
}

const MovingCharacter: React.FC<MovingCharacterProps> = ({ player, path, getColX, getRowY, onStep }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < path.length - 1) {
      // Determine if next move is horizontal to add extra "cautious" delay
      const isHorizontal = path[currentIndex].y === path[currentIndex+1].y;
      const delay = isHorizontal ? 350 : 250;
      
      const timer = setTimeout(() => {
        setCurrentIndex(prev => prev + 1);
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, path]);

  useEffect(() => {
    // Report visited points for the trail
    onStep(path.slice(0, currentIndex + 1));
  }, [currentIndex, path, onStep]);

  const currentPos = path[currentIndex];
  const nextPos = path[currentIndex + 1];
  
  // Decide rotation/wobble based on movement
  const isTurning = nextPos && currentPos.x !== nextPos.x;

  return (
    <motion.div 
      className="absolute text-6xl z-30 pointer-events-none"
      initial={false}
      animate={{ 
        left: `${getColX(currentPos.x)}%`, 
        top: `${getRowY(currentPos.y)}%`,
        translateX: '-50%',
        translateY: '-50%',
        rotate: isTurning ? [0, -15, 15, 0] : [0, -3, 3, 0],
        scale: isTurning ? 1.3 : 1.1
      }}
      transition={{ 
        duration: 0.25, 
        ease: "easeInOut" 
      }}
    >
      <div className="relative group">
        {/* Magic aura/glow */}
        <div className="absolute inset-0 bg-pink-300/30 rounded-full blur-xl animate-pulse scale-150"></div>
        
        {/* The character with a slight jumping bounce */}
        <motion.div
           animate={{
             y: [0, -8, 0],
             rotateZ: isTurning ? [-10, 10, -10] : 0
           }}
           transition={{
             repeat: Infinity,
             duration: 0.5,
             ease: "easeInOut"
           }}
           className="relative z-10"
        >
          {player.avatar}
        </motion.div>

        {/* Fun particles when turning */}
        {isTurning && (
          <motion.div 
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: [0, 1, 0], scale: [0.5, 1.5, 0.5] }}
            className="absolute -top-6 left-1/2 -translate-x-1/2 text-2xl"
          >
            ⭐
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default LadderBoard;
