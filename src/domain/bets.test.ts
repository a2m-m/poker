import { describe, expect, it } from 'vitest';
import { applyPayment, calcCallNeeded, calcMinRaiseTo } from './bets';
import type { HandState, Player } from './types';

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

  describe('applyPayment', () => {
    const buildPlayers = (): Player[] => [
      { id: 'p1', name: 'Alice', seatIndex: 0, stack: 1000, state: 'ACTIVE' },
      { id: 'p2', name: 'Bob', seatIndex: 1, stack: 800, state: 'ACTIVE' },
    ];

    const buildHand = (overrides: Partial<HandState> = {}): HandState => ({
      handNumber: 1,
      dealerIndex: 0,
      sbIndex: 0,
      bbIndex: 1,
      street: 'PREFLOP',
      currentTurnPlayerId: 'p1',
      currentBet: 200,
      lastRaiseSize: 200,
      reopenAllowed: true,
      contribThisStreet: { p1: 0, p2: 0 },
      pot: { main: 0, sides: [] },
      actionLog: [],
      ...overrides,
    });

    it('指定額をスタックから差し引き、投入とポットへ加算する', () => {
      const players = buildPlayers();
      const hand = buildHand();

      const paid = applyPayment(players, hand, 'p1', 300);

      expect(paid).toBe(300);
      expect(players.find((p) => p.id === 'p1')?.stack).toBe(700);
      expect(hand.contribThisStreet.p1).toBe(300);
      expect(hand.pot.main).toBe(300);
    });

    it('支払いでスタックが尽きた場合はALL_INにする', () => {
      const players = buildPlayers();
      const hand = buildHand({ contribThisStreet: { p1: 50, p2: 0 }, pot: { main: 100, sides: [] } });

      const paid = applyPayment(players, hand, 'p2', 1000);

      expect(paid).toBe(800);
      expect(players.find((p) => p.id === 'p2')?.stack).toBe(0);
      expect(players.find((p) => p.id === 'p2')?.state).toBe('ALL_IN');
      expect(hand.contribThisStreet.p2).toBe(800);
      expect(hand.pot.main).toBe(900);
    });
  });
});
