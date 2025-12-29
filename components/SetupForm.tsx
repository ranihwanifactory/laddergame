
import React, { useState } from 'react';
import { Player, Reward } from '../types';
import { Plus, Minus, Wand2, Play } from 'lucide-react';

interface SetupFormProps {
  players: Player[];
  rewards: Reward[];
  onStart: (p: Player[], r: Reward[]) => void;
  onRandomNames: () => void;
  onRandomRewards: () => void;
}

const AVATARS = ['🐶', '🐱', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🦁', '🐯'];

const SetupForm: React.FC<SetupFormProps> = ({ players, rewards, onStart, onRandomNames, onRandomRewards }) => {
  const [localPlayers, setLocalPlayers] = useState<Player[]>(players);
  const [localRewards, setLocalRewards] = useState<Reward[]>(rewards);

  const addPlayer = () => {
    if (localPlayers.length >= 8) return;
    const id = Date.now().toString();
    setLocalPlayers([...localPlayers, { id, name: `친구 ${localPlayers.length + 1}`, avatar: AVATARS[localPlayers.length % AVATARS.length] }]);
    setLocalRewards([...localRewards, { id, text: `미션 ${localRewards.length + 1}` }]);
  };

  const removePlayer = () => {
    if (localPlayers.length <= 2) return;
    setLocalPlayers(localPlayers.slice(0, -1));
    setLocalRewards(localRewards.slice(0, -1));
  };

  const updatePlayerName = (id: string, name: string) => {
    setLocalPlayers(localPlayers.map(p => p.id === id ? { ...p, name } : p));
  };

  const updateRewardText = (id: string, text: string) => {
    setLocalRewards(localRewards.map(r => r.id === id ? { ...r, text } : r));
  };

  const handleRandomNames = () => {
    onRandomNames();
    // Re-sync local state with the props passed down (in a real app you might use a ref or managed state higher up)
    // For simplicity, let's just trigger the callback which the parent App.tsx handles.
  };

  // Because parent updates players/rewards, we need to sync local state if parent state changes via random buttons
  React.useEffect(() => {
    setLocalPlayers(players);
  }, [players]);

  React.useEffect(() => {
    setLocalRewards(rewards);
  }, [rewards]);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center bg-blue-50 p-4 rounded-2xl">
        <h2 className="text-2xl font-bold text-blue-600">게임 설정하기</h2>
        <div className="flex gap-2">
          <button 
            onClick={removePlayer}
            disabled={localPlayers.length <= 2}
            className="p-2 bg-white text-red-400 rounded-full shadow hover:bg-red-50 disabled:opacity-50 transition-all"
          >
            <Minus />
          </button>
          <span className="text-xl font-bold text-blue-800 px-4 py-1">{localPlayers.length}명</span>
          <button 
            onClick={addPlayer}
            disabled={localPlayers.length >= 8}
            className="p-2 bg-white text-green-400 rounded-full shadow hover:bg-green-50 disabled:opacity-50 transition-all"
          >
            <Plus />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Players Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-pink-500">참여하는 친구</h3>
            <button 
              onClick={onRandomNames}
              className="flex items-center gap-1 text-sm bg-pink-100 text-pink-600 px-3 py-1 rounded-full hover:bg-pink-200 transition-colors font-bold"
            >
              <Wand2 size={16} /> 랜덤 닉네임
            </button>
          </div>
          <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
            {localPlayers.map((player) => (
              <div key={player.id} className="flex items-center gap-3 bg-white border-2 border-pink-100 p-2 rounded-xl">
                <span className="text-3xl">{player.avatar}</span>
                <input 
                  type="text"
                  value={player.name}
                  onChange={(e) => updatePlayerName(player.id, e.target.value)}
                  className="flex-1 border-none focus:ring-0 text-lg font-medium text-gray-700 placeholder-gray-300 bg-transparent"
                  placeholder="이름 입력"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Rewards Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-purple-500">벌칙/미션</h3>
            <button 
              onClick={onRandomRewards}
              className="flex items-center gap-1 text-sm bg-purple-100 text-purple-600 px-3 py-1 rounded-full hover:bg-purple-200 transition-colors font-bold"
            >
              <Wand2 size={16} /> 랜덤 미션
            </button>
          </div>
          <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
            {localRewards.map((reward, idx) => (
              <div key={reward.id} className="flex items-center gap-3 bg-white border-2 border-purple-100 p-2 rounded-xl">
                <span className="bg-purple-100 text-purple-500 font-bold w-8 h-8 flex items-center justify-center rounded-full text-xs">
                  {idx + 1}
                </span>
                <input 
                  type="text"
                  value={reward.text}
                  onChange={(e) => updateRewardText(reward.id, e.target.value)}
                  className="flex-1 border-none focus:ring-0 text-lg font-medium text-gray-700 placeholder-gray-300 bg-transparent"
                  placeholder="보상이나 미션"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <button 
        onClick={() => onStart(localPlayers, localRewards)}
        className="w-full py-5 bg-gradient-to-r from-pink-400 to-yellow-400 text-white text-2xl font-bold rounded-2xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-3"
      >
        <Play fill="white" />
        모험 시작하기!
      </button>
    </div>
  );
};

export default SetupForm;
