// ドメインモデルの型定義。仕様書 (docs/specification.md) のセクション6を反映しています。

export type PlayerId = string;

export type PlayerState = 'ACTIVE' | 'FOLDED' | 'ALL_IN';

export type Street = 'PREFLOP' | 'FLOP' | 'TURN' | 'RIVER' | 'SHOWDOWN' | 'PAYOUT';

export type PotBreakdown = {
  id: string;
  label: string;
  amount: number;
  eligiblePlayerIds: PlayerId[];
};

export type PotWinners = {
  main: PlayerId[];
  sides: PlayerId[][];
};

export type Player = {
  id: PlayerId;
  name: string;
  seatIndex: number; // 時計回り
  stack: number; // 残高
  state: PlayerState;
};

export type SidePot = {
  amount: number;
  eligiblePlayerIds: PlayerId[];
};

export type PotState = {
  main: number;
  sides: SidePot[];
};

export type PayoutResult = {
  dealerIndex: number;
  pot: PotState;
  breakdown: PotBreakdown[];
  winners: PotWinners;
  payouts: Record<PlayerId, number>;
};

export type ActionType =
  | 'CHECK'
  | 'BET'
  | 'CALL'
  | 'RAISE'
  | 'FOLD'
  | 'ALL_IN'
  | 'ADVANCE_STREET'
  | 'START_HAND'
  | 'END_HAND';

export type ActionLogEntry = {
  seq: number;
  type: ActionType;
  playerId?: PlayerId;
  amount?: number; // BET/RAISE/CALL/ALL_IN時の支払額 or 到達額
  street: Street;
  snapshot?: HandState; // Undo方式により利用
  playersSnapshot?: Player[]; // Undo方式により利用
};

export type GameSettings = {
  sb: number;
  bb: number;
  roundingRule: 'BUTTON_NEAR'; // v1固定
  burnCard: boolean; // 表示/保存のみでも可
};

export type HandState = {
  handNumber: number;
  dealerIndex: number;
  sbIndex: number;
  bbIndex: number;
  street: Street;

  currentTurnPlayerId: PlayerId;

  currentBet: number;
  lastRaiseSize: number; // 最小レイズ計算用
  reopenAllowed: boolean; // 最小レイズ未満オールインで false

  contribThisStreet: Record<PlayerId, number>; // ストリート投入
  totalContribThisHand: Record<PlayerId, number>; // ハンド累計投入（サイドポット計算用）
  pot: PotState;

  payoutResult?: PayoutResult; // SHOWDOWN 以降の配当結果

  actionLog: ActionLogEntry[];
};

export type GameState = {
  settings: GameSettings;
  players: Player[];
  hand: HandState;
};
