
export interface Player {
  id: string;
  name: string;
  avatar: string;
}

export interface Reward {
  id: string;
  text: string;
}

export interface HorizontalBar {
  row: number;
  fromCol: number; // 0-indexed column
}

export interface GameState {
  players: Player[];
  rewards: Reward[];
  bars: HorizontalBar[];
  results: Record<string, string>; // playerId -> rewardText
}
