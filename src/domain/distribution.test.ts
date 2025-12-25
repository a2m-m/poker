import { describe, expect, it } from 'vitest';
import { calcPayoutShares, distribute, type PotWinners } from './distribution';
import type { Player, PotState } from './types';

const buildPlayer = (overrides: Partial<Player> = {}): Player => ({
  id: 'p1',
  name: 'Alice',
  seatIndex: 0,
  stack: 1000,
  state: 'ACTIVE',
  ...overrides,
});

describe('distribute', () => {
  const players: Player[] = [
    buildPlayer({ id: 'p1', name: 'Alice', seatIndex: 0 }),
    buildPlayer({ id: 'p2', name: 'Bob', seatIndex: 1 }),
    buildPlayer({ id: 'p3', name: 'Carol', seatIndex: 2 }),
    buildPlayer({ id: 'p4', name: 'Dave', seatIndex: 3 }),
  ];

  const basePot: PotState = {
    main: 0,
    sides: [],
  };

  it('同点時に均等分配する', () => {
    const pot: PotState = { ...basePot, main: 800 };
    const winners: PotWinners = { main: ['p1', 'p2', 'p3', 'p4'], sides: [] };

    const payouts = distribute(players, 0, pot, winners);

    expect(payouts).toEqual({
      p1: 200,
      p2: 200,
      p3: 200,
      p4: 200,
    });
  });

  it('割り切れない端数をボタンに近い勝者へ渡す', () => {
    const pot: PotState = { ...basePot, main: 101 };
    const winners: PotWinners = { main: ['p3', 'p2'], sides: [] };

    const payouts = distribute(players, 0, pot, winners);

    expect(payouts).toEqual({
      p2: 51, // BTNに近いp2が端数を獲得
      p3: 50,
    });
  });

  it('サイドポットも含めて合算で配当する', () => {
    const pot: PotState = {
      main: 300,
      sides: [
        { amount: 90, eligiblePlayerIds: ['p1', 'p2', 'p3'] },
        { amount: 50, eligiblePlayerIds: ['p2', 'p3'] },
      ],
    };

    const winners: PotWinners = {
      main: ['p1'],
      sides: [['p2', 'p3'], ['p3']],
    };

    const payouts = distribute(players, 1, pot, winners);

    expect(payouts).toEqual({
      p1: 300,
      p2: 45,
      p3: 95,
    });
  });
});

describe('calcPayoutShares', () => {
  const players: Player[] = [
    buildPlayer({ id: 'p1', name: 'Alice', seatIndex: 0 }),
    buildPlayer({ id: 'p2', name: 'Bob', seatIndex: 1 }),
    buildPlayer({ id: 'p3', name: 'Carol', seatIndex: 2 }),
  ];

  it('単一ポットの配当を計算し、端数はボタンに近い勝者へ付与する', () => {
    const payouts = calcPayoutShares(players, 1, 101, ['p1', 'p3']);

    expect(payouts).toEqual({
      p1: 50,
      p3: 51,
    });
  });

  it('勝者が空のときは配当しない', () => {
    const payouts = calcPayoutShares(players, 0, 500, []);

    expect(payouts).toEqual({});
  });

  it('ボタンを基準に時計回りで端数を分配する', () => {
    const payouts = calcPayoutShares(players, 3, 5, ['p1', 'p2', 'p3']);

    expect(payouts).toEqual({
      p1: 2, // BTNに最も近いp1が端数を獲得
      p2: 2,
      p3: 1,
    });
  });
});
