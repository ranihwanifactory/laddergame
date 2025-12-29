
import React, { useState, useCallback, useEffect } from 'react';
import { Player, Reward, HorizontalBar } from './types';
import SetupForm from './components/SetupForm';
import LadderBoard from './components/LadderBoard';
import { Sparkles, Trophy, Users } from 'lucide-react';

const AVATARS = ['🐶', '🐱', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🦁', '🐯'];
const NICKNAMES = [
  '웃음보따리 토끼', '춤추는 곰돌이', '무지개 사탕', '씩씩한 다람쥐', 
  '구름 위 고양이', '반짝이는 별이', '새콤달콤 딸기', '노래하는 파랑새',
  '폭신한 구름이', '용감한 사자', '깜찍한 햄스터', '신비한 유니콘'
];
const MISSIONS = [
  '엉덩이로 이름 쓰기', '귀여운 표정 짓기', '옆 친구 칭찬하기', '코끼리 코 5바퀴', 
  '좋아하는 노래 한 구절', '토끼 뜀 3번 뛰기', '사랑의 하트 날리기', '윙크 세 번 하기',
  '동물 소리 흉내내기', '자신 있는 포즈 취하기', '앞 친구랑 하이파이브', '웃긴 얼굴 만들기'
];

const getRandom = (arr: string[], count: number) => {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

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

  // Initialize with fun nicknames on mount
  useEffect(() => {
    const names = getRandom(NICKNAMES, 2);
    setPlayers(names.map((n, i) => ({ id: `${i}`, name: n, avatar: AVATARS[i % AVATARS.length] })));
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

  const handleUseRandomNames = () => {
    const names = getRandom(NICKNAMES, players.length);
    setPlayers(prev => prev.map((p, i) => ({ ...p, name: names[i] || p.name })));
  };

  const handleUseRandomRewards = () => {
    const missions = getRandom(MISSIONS, rewards.length);
    setRewards(prev => prev.map((r, i) => ({ ...r, text: missions[i] || r.text })));
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
            onRandomNames={handleUseRandomNames}
            onRandomRewards={handleUseRandomRewards}
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
