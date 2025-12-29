
import React, { useState, useEffect, useCallback } from 'react';
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
  // Use a Set to track multiple characters currently moving
  const [animatingPlayers, setAnimatingPlayers] = useState<Set<string>>(new Set());
  const [results, setResults] = useState<Record<number, number>>({}); // playerIndex -> rewardIndex
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [showConfetti, setShowConfetti] = useState(false);
  const [activePaths, setActivePaths] = useState<Record<string, {x: number, y: number}[]>>({});

  const numPlayers = players.length;
  const numRows = 12; 

  const getColX = useCallback((colIndex: number) => {
    return ((colIndex + 0.5) / numPlayers) * 100;
  }, [numPlayers]);

  const getRowY = useCallback((rowIndex: number) => {
    return (rowIndex / (numRows + 1)) * 100;
  }, [numRows]);

  const calculatePath = useCallback((startCol: number) => {
    let currentCol = startCol;
    const path: { x: number, y: number }[] = [];
    
    for (let r = 0; r <= numRows; r++) {
      path.push({ x: currentCol, y: r });
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
    path.push({ x: currentCol, y: numRows + 1 });
    return { path, finalCol: currentCol };
  }, [bars, numRows]);

  const startAnimation = (player: Player, index: number) => {
    if (completed.has(player.id) || animatingPlayers.has(player.id)) return;
    
    setAnimatingPlayers(prev => new Set(prev).add(player.id));
    const { finalCol } = calculatePath(index);

    // This callback is triggered when the MovingCharacter completes its path
    const onFinish = () => {
      setResults(prev => ({ ...prev, [index]: finalCol }));
      setCompleted(prev => new Set(prev).add(player.id));
      setAnimatingPlayers(prev => {
        const next = new Set(prev);
        next.delete(player.id);
        return next;
      });
    };

    return onFinish;
  };

  useEffect(() => {
    if (completed.size > 0 && completed.size === players.length) {
      const timer = setTimeout(() => setShowConfetti(true), 800);
      return () => clearTimeout(timer);
    }
  }, [completed.size, players.length]);

  const handleAnimateAll = async () => {
    if (animatingPlayers.size > 0 || completed.size > 0) return;
    for (let i = 0; i < players.length; i++) {
      startAnimation(players[i], i);
      await new Promise(res => setTimeout(res, 400)); // Staggered start for more fun!
    }
  };

  const resetLocalState = () => {
    setCompleted(new Set());
    setResults({});
    setShowConfetti(false);
    setActivePaths({});
    setAnimatingPlayers(new Set());
  };

  return (
    <div className="w-full flex flex-col items-center select-none overflow-visible">
      <div className="w-full flex justify-between mb-8 items-center px-4">
        <button 
          onClick={onReset}
          className="flex items-center gap-2 text-gray-400 hover:text-pink-500 transition-colors font-bold text-lg"
        >
          <ArrowLeft size={20} /> 처음으로
        </button>
        <div className="flex gap-4">
           {completed.size === players.length ? (
             <button 
              onClick={resetLocalState}
              className="px-6 py-3 bg-pink-100 text-pink-600 font-bold rounded-2xl hover:bg-pink-200 flex items-center gap-2 shadow-sm transition-transform active:scale-95"
            >
              <RefreshCcw size={18} /> 다시 도전!
            </button>
           ) : (
             <button 
              onClick={handleAnimateAll}
              disabled={animatingPlayers.size > 0 || completed.size > 0}
              className="px-8 py-3 bg-gradient-to-r from-yellow-400 to-orange-400 text-white font-bold rounded-2xl hover:shadow-lg disabled:opacity-50 flex items-center gap-2 transition-all active:scale-95"
            >
              <Play size={18} fill="currentColor" /> 모두 출발!
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
                  animate={animatingPlayers.has(p.id) ? { scale: 1.1, y: -10 } : { scale: 1, y: 0 }}
                  className={`text-4xl w-16 h-16 rounded-full flex items-center justify-center transition-all bg-white border-4 ${
                    completed.has(p.id) ? 'border-gray-200 opacity-40 grayscale' : 'border-yellow-200 shadow-lg cursor-pointer hover:border-pink-300'
                  }`}
                  onClick={() => startAnimation(p, i)}
                >
                  <span className={animatingPlayers.has(p.id) ? 'animate-bounce' : ''}>{p.avatar}</span>
                </motion.div>
                <span className={`mt-2 font-bold text-lg truncate w-full text-center transition-colors ${completed.has(p.id) ? 'text-gray-300' : 'text-gray-600'}`}>
                  {p.name}
                </span>
              </div>
            ))}
          </div>

          {/* Ladder Canvas Area */}
          <div className="relative w-full h-[550px]">
             {/* Vertical Grid Lines */}
             <div className="absolute inset-0 flex justify-around pointer-events-none">
                {players.map((_, i) => (
                  <div key={i} className="w-[10px] bg-yellow-100/40 h-full rounded-full relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-yellow-200/20 via-transparent to-yellow-200/20" />
                  </div>
                ))}
             </div>

             {/* SVG Layer */}
             <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none">
               {/* Fixed Horizontal Bars */}
               {bars.map((bar, idx) => {
                 const x1 = getColX(bar.fromCol);
                 const x2 = getColX(bar.fromCol + 1);
                 const y = getRowY(bar.row + 1);
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

               {/* Active Trails for each player */}
               {Object.entries(activePaths).map(([pid, pathPoints], idx) => {
                 const colors = ['#F472B6', '#60A5FA', '#34D399', '#FBBF24', '#A78BFA', '#F87171'];
                 const color = colors[idx % colors.length];
                 return (
                   <polyline
                      key={`trail-${pid}`}
                      points={(pathPoints as {x: number, y: number}[]).map(p => `${getColX(p.x)}%,${getRowY(p.y + 1)}%`).join(' ')}
                      fill="none"
                      stroke={color}
                      strokeWidth="6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeDasharray="1,12"
                      className="opacity-60 transition-all duration-300"
                   />
                 );
               })}
             </svg>
             
             {/* Render all moving characters */}
             {players.map((player, idx) => (
               animatingPlayers.has(player.id) && (
                 <MovingCharacter 
                    key={`moving-${player.id}`}
                    player={player}
                    path={calculatePath(idx).path}
                    getColX={getColX}
                    getRowY={(y) => getRowY(y + 1)}
                    onStep={(visited) => setActivePaths(prev => ({
                      ...prev,
                      [player.id]: visited
                    }))}
                    onComplete={() => {
                      const { finalCol } = calculatePath(idx);
                      setResults(prev => ({ ...prev, [idx]: finalCol }));
                      setCompleted(prev => new Set(prev).add(player.id));
                      setAnimatingPlayers(prev => {
                        const next = new Set(prev);
                        next.delete(player.id);
                        return next;
                      });
                    }}
                  />
               )
             ))}
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
                      scale: [1, 1.15, 1],
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
              <h2 className="text-5xl font-bold text-pink-500 mb-8 leading-tight">와아! 모험 대성공! 🎉</h2>
              
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
                      <p className="text-pink-500 font-black text-xl">✨ {rewards[results[i]]?.text || '?'}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
              
              <button 
                onClick={() => setShowConfetti(false)}
                className="w-full py-4 bg-gradient-to-r from-pink-400 to-yellow-400 text-white text-2xl font-bold rounded-2xl shadow-xl hover:scale-105 transition-all active:scale-95"
              >
                친구들과 같이 확인하기
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
  onComplete: () => void;
}

const MovingCharacter: React.FC<MovingCharacterProps> = ({ player, path, getColX, getRowY, onStep, onComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < path.length - 1) {
      const isHorizontal = path[currentIndex].y === path[currentIndex+1].y;
      const delay = isHorizontal ? 300 : 200;
      
      const timer = setTimeout(() => {
        setCurrentIndex(prev => prev + 1);
      }, delay);
      return () => clearTimeout(timer);
    } else {
      // Animation finished
      const timer = setTimeout(onComplete, 300);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, path, onComplete]);

  useEffect(() => {
    onStep(path.slice(0, currentIndex + 1));
  }, [currentIndex, path, onStep]);

  const currentPos = path[currentIndex];
  const nextPos = path[currentIndex + 1];
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
        rotate: isTurning ? [0, -20, 20, 0] : [0, -3, 3, 0],
        scale: isTurning ? 1.4 : 1.2
      }}
      transition={{ 
        duration: 0.2, 
        ease: "linear" 
      }}
    >
      <div className="relative">
        <div className="absolute inset-0 bg-yellow-300/40 rounded-full blur-xl animate-pulse scale-125"></div>
        <motion.div
           animate={{
             y: [0, -10, 0],
           }}
           transition={{
             repeat: Infinity,
             duration: 0.4,
             ease: "easeInOut"
           }}
           className="relative z-10"
        >
          {player.avatar}
        </motion.div>

        {isTurning && (
          <motion.div 
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: [0, 1, 0], scale: [0.5, 2, 0.5] }}
            className="absolute -top-8 left-1/2 -translate-x-1/2 text-2xl"
          >
            💫
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default LadderBoard;
