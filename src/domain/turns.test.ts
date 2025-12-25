import { describe, expect, it } from 'vitest';
import { calcFirstToActPlayerId } from './turns';
import type { Player } from './types';

const basePlayers: Player[] = [
  { id: 'p1', name: 'ボタン', seatIndex: 0, stack: 5000, state: 'ACTIVE' },
  { id: 'p2', name: 'スモール', seatIndex: 1, stack: 5000, state: 'ACTIVE' },
  { id: 'p3', name: 'ビッグ', seatIndex: 2, stack: 5000, state: 'ACTIVE' },
  { id: 'p4', name: 'UTG', seatIndex: 3, stack: 5000, state: 'ACTIVE' },
];

describe('calcFirstToActPlayerId', () => {
  it('プリフロップはUTG（BB左）から開始する', () => {
    const playerId = calcFirstToActPlayerId(basePlayers, 'PREFLOP', 0, 2);

    expect(playerId).toBe('p4');
  });

  it('ヘッズアップではプリフロップの最初の手番がボタンになる', () => {
    const headsUpPlayers = basePlayers.slice(0, 2);

    const playerId = calcFirstToActPlayerId(headsUpPlayers, 'PREFLOP', 0, 1);

    expect(playerId).toBe('p1');
  });

  it('フロップ以降はボタン左のアクティブプレイヤーから開始する', () => {
    const foldedPlayers: Player[] = [
      { id: 'p1', name: 'ボタン', seatIndex: 0, stack: 5000, state: 'ACTIVE' },
      { id: 'p2', name: 'スモール', seatIndex: 1, stack: 5000, state: 'FOLDED' },
      { id: 'p3', name: 'ビッグ', seatIndex: 2, stack: 5000, state: 'ACTIVE' },
      { id: 'p4', name: 'CO', seatIndex: 3, stack: 5000, state: 'ACTIVE' },
    ];

    const playerId = calcFirstToActPlayerId(foldedPlayers, 'FLOP', 0, 2);

    expect(playerId).toBe('p3');
  });
});
