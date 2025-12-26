import { recalcPots } from './pots';
import type { HandState, Player, PlayerId, PotBreakdown, PotState, PotWinners } from './types';

const buildMainEligible = (
  players: Player[],
  totalContribThisHand: Record<PlayerId, number>,
  fallback: PlayerId[],
) => {
  const eligible = players
    .filter((player) => (totalContribThisHand[player.id] ?? 0) > 0 && player.state !== 'FOLDED')
    .map((player) => player.id);

  return eligible.length > 0 ? eligible : fallback;
};

const fallbackEligible = (players: Player[]) => players.filter((player) => player.state !== 'FOLDED').map((p) => p.id);

export type PotBreakdownResult = {
  potState: PotState;
  breakdown: PotBreakdown[];
};

export type PotBreakdownOptions = {
  hand?: HandState;
  potStateOverride?: PotState;
  eligibleMainPlayerIds?: PlayerId[];
};

export const buildPotBreakdown = (
  players: Player[],
  { hand, potStateOverride, eligibleMainPlayerIds }: PotBreakdownOptions = {},
): PotBreakdownResult => {
  const potState = potStateOverride ?? (hand ? recalcPots(players, hand.totalContribThisHand) : { main: 0, sides: [] });

  const mainEligible = hand
    ? buildMainEligible(players, hand.totalContribThisHand, fallbackEligible(players))
    : eligibleMainPlayerIds ?? fallbackEligible(players);

  const breakdown: PotBreakdown[] = [];

  if (potState.main > 0 || potStateOverride) {
    breakdown.push({
      id: 'main',
      label: 'メインポット',
      amount: potState.main,
      eligiblePlayerIds: mainEligible,
    });
  }

  potState.sides.forEach((side, index) => {
    if (side.amount <= 0 || side.eligiblePlayerIds.length === 0) return;
    breakdown.push({
      id: `side${index + 1}`,
      label: `サイドポット${index + 1}`,
      amount: side.amount,
      eligiblePlayerIds: side.eligiblePlayerIds,
    });
  });

  return { potState, breakdown };
};

export const buildPotWinnersFromSelection = (
  breakdown: PotBreakdown[],
  selection: Record<string, PlayerId[]>,
): PotWinners => {
  const main = selection['main'] ?? [];
  const sides = breakdown
    .filter((pot) => pot.id !== 'main')
    .map((pot) => selection[pot.id] ?? []);

  return { main, sides };
};
