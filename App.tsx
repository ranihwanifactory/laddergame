
import React, { useState, useCallback, useEffect } from 'react';
import { Player, Reward, HorizontalBar, GameState } from './types';
import SetupForm from './components/SetupForm';
import LadderBoard from './components/LadderBoard';
import { Sparkles, Trophy, Users } from 'lucide-react';
import { getCuteNicknames, getFunMissions } from './services/geminiService';

const AVATARS = ['🐶', '🐱', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🦁', '🐯'];

const App: React.FC = () => {
  const [step, setStep] = useState<'setup' | 'game' | 'result'>('setup');
  const [players, setPlayers] = useState<Player[]>([
    { id: '1', name: '친구 1', avatar: '🐶' },
    { id: '2', name: '친구 2', avatar: '🐱' }
  ]);
  const [rewards, setRewards] = useState<Reward[]>([
    { id: '1', text: '과자 먹기' },
    { id: '2', text: '노래 부르기' }
  ]);
  const [bars, setBars] = useState<HorizontalBar[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Auto-generate nicknames on mount
  useEffect(() => {
    const loadInitial = async () => {
      setIsAiLoading(true);
      const names = await getCuteNicknames(2);
      setPlayers(names.map((n, i) => ({ id: `${i}`, name: n, avatar: AVATARS[i % AVATARS.length] })));
      setIsAiLoading(false);
    };
    loadInitial();
  }, []);

  const handleStartGame = (finalPlayers: Player[], finalRewards: Reward[]) => {
    setPlayers(finalPlayers);
    setRewards(finalRewards);
    
    // Generate random ladder bars
    const newBars: HorizontalBar[] = [];
    const rows = 12;
    const cols = finalPlayers.length;
    
    for (let r = 1; r < rows - 1; r++) {
      for (let c = 0; c < cols - 1; c++) {
        // Randomly place a bar, ensuring no adjacent bars on the same row to avoid confusion
        if (Math.random() > 0.6) {
          const hasLeft = newBars.some(b => b.row === r && b.fromCol === c - 1);
          if (!hasLeft) {
            newBars.push({ row: r, fromCol: c });
          }
        }
      }
    }
    setBars(newBars);
    setStep('game');
  };

  const resetGame = () => {
    setStep('setup');
  };

  const handleUseAiNames = async () => {
    setIsAiLoading(true);
    const names = await getCuteNicknames(players.length);
    setPlayers(prev => prev.map((p, i) => ({ ...p, name: names[i] || p.name })));
    setIsAiLoading(false);
  };

  const handleUseAiRewards = async () => {
    setIsAiLoading(true);
    const missions = await getFunMissions(rewards.length);
    setRewards(prev => prev.map((r, i) => ({ ...r, text: missions[i] || r.text })));
    setIsAiLoading(false);
  };

  return (
    <div className="min-h-screen bg-yellow-50 flex flex-col items-center p-4 sm:p-8">
      {/* Header */}
      <header className="mb-8 text-center">
        <h1 className="text-4xl sm:text-6xl font-bold text-pink-500 flex items-center justify-center gap-2 drop-shadow-md">
          <Sparkles className="w-8 h-8 sm:w-12 sm:h-12 text-yellow-400 animate-pulse" />
          무지개 사다리 모험
          <Sparkles className="w-8 h-8 sm:w-12 sm:h-12 text-yellow-400 animate-pulse" />
        </h1>
        <p className="text-xl text-blue-500 mt-2">친구들과 함께 신나는 사다리 타기!</p>
      </header>

      {/* Main Content */}
      <main className="w-full max-w-4xl bg-white rounded-3xl shadow-xl p-6 sm:p-10 relative overflow-hidden">
        {step === 'setup' && (
          <SetupForm 
            players={players} 
            rewards={rewards} 
            onStart={handleStartGame}
            onAiNames={handleUseAiNames}
            onAiRewards={handleUseAiRewards}
            isAiLoading={isAiLoading}
          />
        )}

        {step === 'game' && (
          <div className="flex flex-col items-center">
            <LadderBoard 
              players={players} 
              rewards={rewards} 
              bars={bars} 
              onReset={resetGame}
            />
          </div>
        )}
      </main>

      {/* Footer Info */}
      <footer className="mt-8 text-gray-400 text-sm flex items-center gap-4">
        <span className="flex items-center gap-1"><Users size={16} /> 친구들 모여라!</span>
        <span className="flex items-center gap-1"><Trophy size={16} /> 누가 1등일까?</span>
      </footer>
    </div>
  );
};

export default App;
