import { describe, expect, it } from 'vitest';
import { calcCallNeeded, calcMinRaiseTo } from './bets';
import type { HandState } from './types';

describe('bets utilities', () => {
  const handBase: Pick<HandState, 'currentBet' | 'contribThisStreet' | 'lastRaiseSize' | 'reopenAllowed'> = {
    currentBet: 0,
    contribThisStreet: {},
    lastRaiseSize: 200,
    reopenAllowed: true,
  };

  describe('calcCallNeeded', () => {
    it('現在ベット未満の場合は差額を返す', () => {
      const hand = { ...handBase, currentBet: 500, contribThisStreet: { a: 100 } };
      expect(calcCallNeeded(hand, 'a')).toBe(400);
    });

    it('到達済みの場合は0を返す', () => {
      const hand = { ...handBase, currentBet: 500, contribThisStreet: { a: 600 } };
      expect(calcCallNeeded(hand, 'a')).toBe(0);
    });
  });

  describe('calcMinRaiseTo', () => {
    it('現在ベットと直近の上げ幅を合算した到達額を返す', () => {
      const hand = { ...handBase, currentBet: 800, lastRaiseSize: 300 };
      expect(calcMinRaiseTo(hand)).toBe(1100);
    });

    it('現在ベットが0のときはnullを返す', () => {
      const hand = { ...handBase, currentBet: 0 };
      expect(calcMinRaiseTo(hand)).toBeNull();
    });

    it('再オープン不可の場合はnullを返す', () => {
      const hand = { ...handBase, currentBet: 600, reopenAllowed: false };
      expect(calcMinRaiseTo(hand)).toBeNull();
    });
  });
});
