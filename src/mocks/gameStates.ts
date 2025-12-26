import type { ActionLogEntry, GameSettings, GameState, HandState, Player } from '../domain/types';

const clone = <T,>(value: T): T =>
  typeof structuredClone === 'function'
    ? structuredClone(value)
    : (JSON.parse(JSON.stringify(value)) as T);

const baseSettings: GameSettings = {
  sb: 100,
  bb: 200,
  roundingRule: 'BUTTON_NEAR',
  burnCard: true,
};

const basePlayers: Player[] = [
  { id: 'p1', name: '佐藤', seatIndex: 0, stack: 18400, state: 'ACTIVE' },
  { id: 'p2', name: '鈴木', seatIndex: 1, stack: 15200, state: 'ACTIVE' },
  { id: 'p3', name: '高橋', seatIndex: 2, stack: 19200, state: 'ACTIVE' },
  { id: 'p4', name: '田中', seatIndex: 3, stack: 1800, state: 'ALL_IN' },
  { id: 'p5', name: '伊藤', seatIndex: 4, stack: 7800, state: 'ACTIVE' },
];

const potMain = 8600;
const potSide1 = 4200;
const potSide2 = 1800;

const contribThisStreet = {
  p1: 800,
  p2: 2000,
  p3: 2000,
  p4: 0,
  p5: 2000,
};

const totalContribThisHand = {
  p1: 3800,
  p2: 3600,
  p3: 3800,
  p4: 1200,
  p5: 2200,
};

const sharedPot = {
  main: potMain,
  sides: [
    { amount: potSide1, eligiblePlayerIds: ['p1', 'p2', 'p3', 'p4'] },
    { amount: potSide2, eligiblePlayerIds: ['p1', 'p2', 'p3'] },
  ],
};

const actionLog: ActionLogEntry[] = [
  { seq: 1, type: 'BET', playerId: 'p5', amount: 1000, street: 'TURN' },
  { seq: 2, type: 'CALL', playerId: 'p1', amount: 1000, street: 'TURN' },
  { seq: 3, type: 'RAISE', playerId: 'p2', amount: 2000, street: 'TURN' },
  { seq: 4, type: 'CALL', playerId: 'p3', amount: 2000, street: 'TURN' },
];

const baseHand: HandState = {
  handNumber: 12,
  dealerIndex: 0,
  sbIndex: 1,
  bbIndex: 2,
  street: 'RIVER',
  currentTurnPlayerId: 'p1',
  currentBet: 2000,
  lastRaiseSize: 800,
  reopenAllowed: true,
  contribThisStreet,
  totalContribThisHand,
  pot: sharedPot,
  actionLog,
};

const payoutPlayers: Player[] = [
  { id: 'p1', name: '佐藤', seatIndex: 0, stack: 22300, state: 'ACTIVE' },
  { id: 'p2', name: '鈴木', seatIndex: 1, stack: 17300, state: 'ACTIVE' },
  { id: 'p3', name: '高橋', seatIndex: 2, stack: 27800, state: 'ACTIVE' },
  { id: 'p4', name: '田中', seatIndex: 3, stack: 1800, state: 'ALL_IN' },
  { id: 'p5', name: '伊藤', seatIndex: 4, stack: 7800, state: 'ACTIVE' },
];

const payoutResult: NonNullable<HandState['payoutResult']> = {
  dealerIndex: baseHand.dealerIndex,
  pot: sharedPot,
  breakdown: [
    { id: 'main', label: 'メインポット', amount: potMain, eligiblePlayerIds: ['p1', 'p2', 'p3', 'p4', 'p5'] },
    { id: 'side1', label: 'サイドポット 1', amount: potSide1, eligiblePlayerIds: ['p1', 'p2', 'p3', 'p4'] },
    { id: 'side2', label: 'サイドポット 2', amount: potSide2, eligiblePlayerIds: ['p1', 'p2', 'p3'] },
  ],
  winners: {
    main: ['p3'],
    sides: [['p1', 'p2'], ['p1']],
  },
  payouts: {
    p1: 3900,
    p2: 2100,
    p3: 8600,
    p4: 0,
    p5: 0,
  },
};

export const tablePreviewState: GameState = {
  settings: baseSettings,
  players: clone(basePlayers),
  hand: clone(baseHand),
};

export const showdownPreviewState: GameState = {
  settings: baseSettings,
  players: clone(basePlayers),
  hand: {
    ...clone(baseHand),
    street: 'SHOWDOWN',
    reopenAllowed: false,
  },
};

export const payoutPreviewState: GameState = {
  settings: baseSettings,
  players: clone(payoutPlayers),
  hand: {
    ...clone(baseHand),
    street: 'PAYOUT',
    payoutResult,
  },
};

export const clonePreviewState = (state: GameState): GameState => clone(state);
