import { GameState, GameSettings, HandState, Player, PlayerId, Street } from './types';

export type PlayerSetup = {
  id: PlayerId;
  name: string;
  stack: number;
};

const INITIAL_HAND_NUMBER = 1;
const PREFLOP: Street = 'PREFLOP';

const toPlayers = (setups: PlayerSetup[]): Player[] =>
  setups.map((setup, index) => ({
    id: setup.id,
    name: setup.name,
    seatIndex: index,
    stack: Math.max(0, setup.stack),
    state: 'ACTIVE' as const,
  }));

const initializeContrib = (players: Player[]): Record<PlayerId, number> =>
  players.reduce<Record<PlayerId, number>>((acc, player) => {
    acc[player.id] = 0;
    return acc;
  }, {});

const payBlind = (
  players: Player[],
  contrib: Record<PlayerId, number>,
  targetIndex: number,
  amount: number,
): number => {
  const player = players[targetIndex];
  const pay = Math.min(player.stack, Math.max(0, amount));
  player.stack -= pay;
  contrib[player.id] += pay;
  if (player.stack === 0) {
    player.state = 'ALL_IN';
  }
  return pay;
};

const calcBlindIndices = (playerCount: number, dealerIndex: number) => {
  if (playerCount < 2) {
    throw new Error('ゲーム開始には2人以上が必要です。');
  }

  if (playerCount === 2) {
    const sbIndex = dealerIndex;
    const bbIndex = (dealerIndex + 1) % playerCount;
    return { sbIndex, bbIndex };
  }

  const sbIndex = (dealerIndex + 1) % playerCount;
  const bbIndex = (dealerIndex + 2) % playerCount;
  return { sbIndex, bbIndex };
};

const findNextActivePlayerId = (players: Player[], startIndex: number): PlayerId => {
  for (let i = 0; i < players.length; i += 1) {
    const index = (startIndex + i) % players.length;
    if (players[index].state === 'ACTIVE') {
      return players[index].id;
    }
  }
  return players[startIndex % players.length].id;
};

const decideFirstToAct = (players: Player[], sbIndex: number, bbIndex: number): PlayerId => {
  if (players.length === 2) {
    return findNextActivePlayerId(players, sbIndex);
  }
  const utgIndex = (bbIndex + 1) % players.length;
  return findNextActivePlayerId(players, utgIndex);
};

const buildInitialHandState = (
  settings: GameSettings,
  players: Player[],
  dealerIndex: number,
): HandState => {
  const contribThisStreet = initializeContrib(players);
  const { sbIndex, bbIndex } = calcBlindIndices(players.length, dealerIndex);

  const sbPaid = payBlind(players, contribThisStreet, sbIndex, settings.sb);
  const bbPaid = payBlind(players, contribThisStreet, bbIndex, settings.bb);

  const currentBet = Math.max(bbPaid, sbPaid);
  const currentTurnPlayerId = decideFirstToAct(players, sbIndex, bbIndex);

  const potTotal = Object.values(contribThisStreet).reduce((sum, value) => sum + value, 0);

  return {
    handNumber: INITIAL_HAND_NUMBER,
    dealerIndex,
    sbIndex,
    bbIndex,
    street: PREFLOP,
    currentTurnPlayerId,
    currentBet,
    lastRaiseSize: settings.bb,
    reopenAllowed: true,
    contribThisStreet,
    pot: {
      main: potTotal,
      sides: [],
    },
    actionLog: [],
  };
};

export const createNewGame = (settings: GameSettings, playerSetups: PlayerSetup[]): GameState => {
  const { roundingRule = 'BUTTON_NEAR', burnCard = true, ...restSettings } = settings;
  const normalizedSettings: GameSettings = {
    ...restSettings,
    roundingRule,
    burnCard,
  };

  const players = toPlayers(playerSetups);
  const dealerIndex = 0;
  const hand = buildInitialHandState(normalizedSettings, players, dealerIndex);

  return {
    settings: normalizedSettings,
    players,
    hand,
  };
};
