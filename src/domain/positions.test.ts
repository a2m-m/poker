import { describe, expect, it } from 'vitest';
import type { Player } from './types';
import { calcBlindIndices, getActivePlayerSeatIndices } from './positions';

describe('getActivePlayerSeatIndices', () => {
  it('座席順にアクティブプレイヤーのseatIndexを返す', () => {
    const players: Player[] = [
      { id: 'p1', name: 'A', seatIndex: 2, stack: 1000, state: 'ACTIVE' },
      { id: 'p2', name: 'B', seatIndex: 0, stack: 1000, state: 'FOLDED' },
      { id: 'p3', name: 'C', seatIndex: 1, stack: 1000, state: 'ACTIVE' },
    ];

    expect(getActivePlayerSeatIndices(players)).toEqual([1, 2]);
  });
});

describe('calcBlindIndices', () => {
  const basePlayers: Player[] = [
    { id: 'p1', name: 'ボタン', seatIndex: 0, stack: 5000, state: 'ACTIVE' },
    { id: 'p2', name: 'スモール', seatIndex: 1, stack: 5000, state: 'ACTIVE' },
    { id: 'p3', name: 'ビッグ', seatIndex: 2, stack: 5000, state: 'ACTIVE' },
    { id: 'p4', name: 'UTG', seatIndex: 3, stack: 5000, state: 'ACTIVE' },
    { id: 'p5', name: 'CO', seatIndex: 4, stack: 5000, state: 'ACTIVE' },
  ];

  it('ヘッズアップではボタンがSBになり左隣がBBになる', () => {
    const players: Player[] = basePlayers.slice(0, 2);
    const { sbIndex, bbIndex } = calcBlindIndices(players, 0);

    expect(sbIndex).toBe(0);
    expect(bbIndex).toBe(1);
  });

  it('3人以上ではボタン左がSB、その次がBBになる', () => {
    const { sbIndex, bbIndex } = calcBlindIndices(basePlayers, 2);

    expect(sbIndex).toBe(3);
    expect(bbIndex).toBe(4);
  });

  it('アクティブプレイヤーが1人の場合はエラーを投げる', () => {
    const singlePlayer: Player[] = [
      { id: 'p1', name: 'Only', seatIndex: 0, stack: 1000, state: 'ACTIVE' },
    ];

    expect(() => calcBlindIndices(singlePlayer, 0)).toThrow('ゲーム開始には2人以上が必要です。');
  });
});
