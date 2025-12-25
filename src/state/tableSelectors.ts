import { calcCallNeeded, calcMinRaiseTo } from '../domain/bets';
import type { HandState, Player, PlayerId, PotState, Street } from '../domain/types';
import type { PlayerRole } from '../components/PlayerCard';

const streetLabels: Record<Street, string> = {
  PREFLOP: 'プリフロップ',
  FLOP: 'フロップ',
  TURN: 'ターン',
  RIVER: 'リバー',
  SHOWDOWN: 'ショーダウン',
  PAYOUT: '配当',
};

const formatAmount = (amount: number | null | undefined): string => {
  if (amount === null || amount === undefined) return '—';
  return amount.toLocaleString();
};

const calcPotTotal = (pot: PotState): number => pot.main + pot.sides.reduce((sum, side) => sum + side.amount, 0);

const resolveEligibleNames = (playerIds: PlayerId[], players: Player[]) =>
  playerIds
    .map((id) => players.find((player) => player.id === id)?.name ?? id)
    .filter((name) => name.length > 0);

const buildMainEligibleNames = (players: Player[]) =>
  [...players]
    .filter((player) => player.state !== 'FOLDED')
    .sort((a, b) => a.seatIndex - b.seatIndex)
    .map((player) => player.name);

export const getRoleForIndex = (
  hand: Pick<HandState, 'dealerIndex' | 'sbIndex' | 'bbIndex'>,
  seatIndex: number,
): PlayerRole | undefined => {
  if (seatIndex === hand.dealerIndex) return 'D';
  if (seatIndex === hand.sbIndex) return 'SB';
  if (seatIndex === hand.bbIndex) return 'BB';
  return undefined;
};

const buildStatusBarProps = (players: Player[], hand: HandState, callNeeded: number, minRaiseTo: number | null) => {
  const buttonPlayer = players.find((player) => player.seatIndex === hand.dealerIndex)?.name;
  const smallBlindPlayer = players.find((player) => player.seatIndex === hand.sbIndex)?.name;
  const bigBlindPlayer = players.find((player) => player.seatIndex === hand.bbIndex)?.name;

  return {
    handLabel: `#${hand.handNumber}`,
    streetLabel: streetLabels[hand.street],
    goalText: '全員の投入額を揃えます',
    currentBetText: formatAmount(hand.currentBet),
    callNeededText: formatAmount(callNeeded),
    callHighlight: callNeeded > 0,
    minRaiseText: formatAmount(minRaiseTo),
    buttonLabel: buttonPlayer ?? '—',
    buttonBadge: buttonPlayer ? 'D' : undefined,
    blindLabel: `${smallBlindPlayer ?? '—'} / ${bigBlindPlayer ?? '—'}`,
    blindBadge: smallBlindPlayer || bigBlindPlayer ? 'SB / BB' : undefined,
  } as const;
};

const buildTurnPanelProps = (
  turnPlayerName: string,
  positionLabel: string | undefined,
  callNeeded: number,
  minRaiseTo: number | null,
  stack: number,
  currentBet: number,
) => {
  const canCheck = callNeeded === 0;
  const minRaiseText = formatAmount(minRaiseTo);
  const requiredText = canCheck ? 'チェックで継続' : `コール ${formatAmount(callNeeded)}（継続）`;

  const availableText = currentBet > 0
    ? `チェック / レイズは ${minRaiseText} 以上 / オールイン ${formatAmount(stack)}`
    : `ベットは ${minRaiseText} 以上 / オールイン ${formatAmount(stack)}`;

  return {
    turnPlayer: turnPlayerName,
    positionLabel,
    requiredText,
    availableText,
  } as const;
};

const buildPotPanelProps = (players: Player[], pot: PotState) => {
  const breakdown = [
    {
      label: 'メインポット',
      amountText: formatAmount(pot.main),
      eligibleNames: buildMainEligibleNames(players),
    },
    ...pot.sides.map((side, index) => ({
      label: `サイドポット ${index + 1}`,
      amountText: formatAmount(side.amount),
      eligibleNames: resolveEligibleNames(side.eligiblePlayerIds, players),
    })),
  ];

  return {
    totalText: formatAmount(calcPotTotal(pot)),
    sideCount: pot.sides.length,
    breakdown,
  } as const;
};

export const buildTableViewModel = (players: Player[], hand: HandState) => {
  const turnPlayer = players.find((player) => player.id === hand.currentTurnPlayerId) ?? null;
  const turnRole = turnPlayer ? getRoleForIndex(hand, turnPlayer.seatIndex) : undefined;

  const callNeeded = turnPlayer ? calcCallNeeded(hand, turnPlayer.id) : 0;
  const minRaiseTo = calcMinRaiseTo(hand);

  return {
    statusBarProps: buildStatusBarProps(players, hand, callNeeded, minRaiseTo),
    turnPanelProps: buildTurnPanelProps(
      turnPlayer?.name ?? '—',
      turnRole ?? '参加者',
      callNeeded,
      minRaiseTo,
      turnPlayer?.stack ?? 0,
      hand.currentBet,
    ),
    potPanelProps: buildPotPanelProps(players, hand.pot),
    turnPlayer,
    turnRole,
    callNeeded,
    minRaiseTo,
    potTotal: calcPotTotal(hand.pot),
  } as const;
};
