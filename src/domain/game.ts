import { calcBlindIndices } from './positions';
import { calcFirstToActPlayerId } from './turns';
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
  totalContrib: Record<PlayerId, number>,
  targetIndex: number,
  amount: number,
): number => {
  const player = players[targetIndex];
  const pay = Math.min(player.stack, Math.max(0, amount));
  player.stack -= pay;
  contrib[player.id] += pay;
  totalContrib[player.id] += pay;
  if (player.stack === 0) {
    player.state = 'ALL_IN';
  }
  return pay;
};

const buildHandState = (
  settings: GameSettings,
  players: Player[],
  dealerIndex: number,
  handNumber: number,
): HandState => {
  const contribThisStreet = initializeContrib(players);
  const totalContribThisHand = initializeContrib(players);
  const { sbIndex, bbIndex } = calcBlindIndices(players, dealerIndex);

  const sbPaid = payBlind(players, contribThisStreet, totalContribThisHand, sbIndex, settings.sb);
  const bbPaid = payBlind(players, contribThisStreet, totalContribThisHand, bbIndex, settings.bb);

  const currentBet = Math.max(bbPaid, sbPaid);
  const currentTurnPlayerId = calcFirstToActPlayerId(players, PREFLOP, dealerIndex, bbIndex);

  const potTotal = Object.values(contribThisStreet).reduce((sum, value) => sum + value, 0);

  return {
    handNumber,
    dealerIndex,
    sbIndex,
    bbIndex,
    street: PREFLOP,
    currentTurnPlayerId,
    currentBet,
    lastRaiseSize: settings.bb,
    reopenAllowed: true,
    contribThisStreet,
    totalContribThisHand,
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
  const hand = buildHandState(normalizedSettings, players, dealerIndex, INITIAL_HAND_NUMBER);

  return {
    settings: normalizedSettings,
    players,
    hand,
  };
};

const toActiveOrAllIn = (player: Player): Player => ({
  ...player,
  state: player.stack > 0 ? 'ACTIVE' : 'ALL_IN',
});

const calcNextDealerIndex = (players: Player[], currentDealerIndex: number): number => {
  const activeSeats = players
    .filter((player) => player.state === 'ACTIVE')
    .map((player) => player.seatIndex)
    .sort((a, b) => a - b);

  if (activeSeats.length < 2) {
    throw new Error('次のハンドを開始するには2人以上のアクティブなプレイヤーが必要です。');
  }

  const currentPosition = activeSeats.indexOf(currentDealerIndex);
  const buttonPosition = currentPosition >= 0 ? currentPosition : 0;
  return activeSeats[(buttonPosition + 1) % activeSeats.length];
};

export const startNextHand = (game: GameState): GameState => {
  const players = game.players.map(toActiveOrAllIn);
  const dealerIndex = calcNextDealerIndex(players, game.hand.dealerIndex);
  const handNumber = game.hand.handNumber + 1;

  const hand = buildHandState(game.settings, players, dealerIndex, handNumber);

  return {
    ...game,
    players,
    hand,
  };
};
