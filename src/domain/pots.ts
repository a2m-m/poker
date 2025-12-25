import type { Player, PlayerId, PotState } from './types';

const buildContributorList = (
  players: Player[],
  totalContribThisHand: Record<PlayerId, number>,
) =>
  players
    .map((player) => ({
      player,
      amount: Math.max(0, totalContribThisHand[player.id] ?? 0),
    }))
    .filter((entry) => entry.amount > 0);

export const recalcPots = (
  players: Player[],
  totalContribThisHand: Record<PlayerId, number>,
): PotState => {
  const contributors = buildContributorList(players, totalContribThisHand);

  if (contributors.length === 0) {
    return { main: 0, sides: [] };
  }

  const sorted = [...contributors].sort((a, b) => a.amount - b.amount);

  const pots: { amount: number; eligiblePlayerIds: PlayerId[] }[] = [];
  let remainingCount = sorted.length;
  let prevAmount = 0;
  let index = 0;

  while (index < sorted.length) {
    const currentAmount = sorted[index].amount;
    const layerAmount = currentAmount - prevAmount;

    if (layerAmount > 0) {
      const potIncrease = layerAmount * remainingCount;
      const eligiblePlayerIds = contributors
        .filter((entry) => entry.amount >= currentAmount && entry.player.state !== 'FOLDED')
        .map((entry) => entry.player.id);

      pots.push({ amount: potIncrease, eligiblePlayerIds });
    }

    let cursor = index;
    while (cursor < sorted.length && sorted[cursor].amount === currentAmount) {
      cursor += 1;
    }

    remainingCount -= cursor - index;
    prevAmount = currentAmount;
    index = cursor;
  }

  const [main, ...sides] = pots;

  return {
    main: main?.amount ?? 0,
    sides,
  };
};
