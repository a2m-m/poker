import { describe, expect, it } from 'vitest';
import { recalcPots } from './pots';
import type { Player } from './types';

const buildPlayer = (overrides: Partial<Player> = {}): Player => ({
  id: 'p1',
  name: 'Alice',
  seatIndex: 0,
  stack: 1000,
  state: 'ACTIVE',
  ...overrides,
});

describe('recalcPots', () => {
  it('全員同額のときはサイドポットが発生しない', () => {
    const players: Player[] = [
      buildPlayer({ id: 'p1', name: 'Alice', state: 'ACTIVE' }),
      buildPlayer({ id: 'p2', name: 'Bob', state: 'ACTIVE' }),
      buildPlayer({ id: 'p3', name: 'Carol', state: 'FOLDED' }),
    ];

    const pot = recalcPots(players, { p1: 500, p2: 500, p3: 500 });

    expect(pot.main).toBe(1500);
    expect(pot.sides).toHaveLength(0);
    expect(pot).toEqual({
      main: 1500,
      sides: [],
    });
  });

  it('最小額オールインでサイドポットを生成する', () => {
    const players: Player[] = [
      buildPlayer({ id: 'p1', name: 'Alice', state: 'ACTIVE' }),
      buildPlayer({ id: 'p2', name: 'Bob', state: 'ALL_IN' }),
      buildPlayer({ id: 'p3', name: 'Carol', state: 'ACTIVE' }),
    ];

    const pot = recalcPots(players, { p1: 1000, p2: 300, p3: 1000 });

    expect(pot.main).toBe(900);
    expect(pot.sides).toEqual([
      {
        amount: 1400,
        eligiblePlayerIds: ['p1', 'p3'],
      },
    ]);
    expect(pot.sides[0].eligiblePlayerIds).not.toContain('p2');
  });

  it('フォールドしたプレイヤーはeligibleから除外される', () => {
    const players: Player[] = [
      buildPlayer({ id: 'p1', name: 'Alice', state: 'ACTIVE' }),
      buildPlayer({ id: 'p2', name: 'Bob', state: 'ALL_IN' }),
      buildPlayer({ id: 'p3', name: 'Carol', state: 'ACTIVE' }),
      buildPlayer({ id: 'p4', name: 'Dave', state: 'FOLDED' }),
    ];

    const pot = recalcPots(players, { p1: 1000, p2: 300, p3: 1000, p4: 300 });

    expect(pot.main).toBe(1200);
    expect(pot.sides).toEqual([
      {
        amount: 1400,
        eligiblePlayerIds: ['p1', 'p3'],
      },
    ]);
    expect(pot.sides[0].eligiblePlayerIds).not.toContain('p4');
  });

  it('複数のオールインでサイドポットを段階的に生成する', () => {
    const players: Player[] = [
      buildPlayer({ id: 'p1', name: 'Alice', state: 'ACTIVE' }),
      buildPlayer({ id: 'p2', name: 'Bob', state: 'ALL_IN' }),
      buildPlayer({ id: 'p3', name: 'Carol', state: 'ALL_IN' }),
      buildPlayer({ id: 'p4', name: 'Dave', state: 'ACTIVE' }),
    ];

    const pot = recalcPots(players, { p1: 1000, p2: 600, p3: 300, p4: 1000 });

    expect(pot.main).toBe(1200);
    expect(pot.sides).toEqual([
      {
        amount: 900,
        eligiblePlayerIds: ['p1', 'p2', 'p4'],
      },
      {
        amount: 800,
        eligiblePlayerIds: ['p1', 'p4'],
      },
    ]);
    expect(pot.sides[0].eligiblePlayerIds).not.toContain('p3');
  });
});
