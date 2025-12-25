import { describe, expect, it } from 'vitest';
import { calcCallNeeded } from './bets';

const buildHand = (currentBet: number, contrib: Record<string, number>) => ({
  currentBet,
  contribThisStreet: contrib,
});

describe('calcCallNeeded', () => {
  it('現在のベットが0のときは必要額も0になる', () => {
    const hand = buildHand(0, { p1: 0, p2: 0 });

    expect(calcCallNeeded(hand, 'p1')).toBe(0);
    expect(calcCallNeeded(hand, 'p2')).toBe(0);
  });

  it('プレイヤーが到達済みなら必要額は0になる', () => {
    const hand = buildHand(200, { p1: 200, p2: 50 });

    expect(calcCallNeeded(hand, 'p1')).toBe(0);
  });

  it('未到達分をコール必要額として返す', () => {
    const hand = buildHand(200, { p1: 50, p2: 0 });

    expect(calcCallNeeded(hand, 'p1')).toBe(150);
    expect(calcCallNeeded(hand, 'p2')).toBe(200);
  });

  it('まだ一度も支払っていない場合は0扱いで計算する', () => {
    const hand = buildHand(120, { p1: 0 });

    expect(calcCallNeeded(hand, 'p2')).toBe(120);
  });
});
