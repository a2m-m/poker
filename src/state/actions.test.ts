import { describe, expect, it } from 'vitest';
import { applyPlayerActionToState } from './actions';
import type { GameState } from '../domain/types';

const buildGameState = (): GameState => ({
  settings: { sb: 100, bb: 200, roundingRule: 'BUTTON_NEAR', burnCard: false },
  players: [
    { id: 'p1', name: 'Alice', seatIndex: 0, stack: 1000, state: 'ACTIVE' },
    { id: 'p2', name: 'Bob', seatIndex: 1, stack: 800, state: 'ACTIVE' },
  ],
  hand: {
    handNumber: 1,
    dealerIndex: 0,
    sbIndex: 0,
    bbIndex: 1,
    street: 'PREFLOP',
    currentTurnPlayerId: 'p1',
    currentBet: 200,
    lastRaiseSize: 200,
    reopenAllowed: true,
    contribThisStreet: { p1: 0, p2: 200 },
    totalContribThisHand: { p1: 0, p2: 200 },
    pot: { main: 200, sides: [] },
    actionLog: [],
  },
});

describe('applyPlayerActionToState', () => {
  it('元の状態を汚さずにアクションとスナップショットを適用する', () => {
    const state = buildGameState();

    const next = applyPlayerActionToState(state, { type: 'CALL' });

    expect(state.hand.actionLog).toHaveLength(0);
    expect(next.players[0].stack).toBe(800);
    expect(next.hand.contribThisStreet.p1).toBe(200);
    expect(next.hand.actionLog).toHaveLength(1);
    expect(next.hand.actionLog[0]?.snapshot).toEqual(state.hand);
    expect(next.hand.actionLog[0]?.playersSnapshot).toEqual(state.players);
  });
});
