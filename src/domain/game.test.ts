import { describe, expect, it } from 'vitest';
import { createNewGame, type PlayerSetup } from './game';
import type { GameSettings } from './types';

describe('createNewGame', () => {
  const baseSettings: GameSettings = {
    sb: 100,
    bb: 200,
    roundingRule: 'BUTTON_NEAR',
    burnCard: true,
  };

  it('セットアップ値からプリフロップの状態を構築する', () => {
    const players: PlayerSetup[] = [
      { id: 'p1', name: 'ボタン', stack: 10000 },
      { id: 'p2', name: 'スモール', stack: 12000 },
      { id: 'p3', name: 'ビッグ', stack: 8000 },
    ];

    const game = createNewGame(baseSettings, players);

    expect(game.players.map((p) => p.seatIndex)).toEqual([0, 1, 2]);
    expect(game.players.map((p) => p.state)).toEqual(['ACTIVE', 'ACTIVE', 'ACTIVE']);
    expect(game.hand.handNumber).toBe(1);
    expect(game.hand.dealerIndex).toBe(0);
    expect(game.hand.sbIndex).toBe(1);
    expect(game.hand.bbIndex).toBe(2);
    expect(game.hand.street).toBe('PREFLOP');
    expect(game.hand.currentTurnPlayerId).toBe('p1');
    expect(game.hand.currentBet).toBe(200);
    expect(game.hand.lastRaiseSize).toBe(200);
    expect(game.hand.reopenAllowed).toBe(true);
    expect(game.hand.contribThisStreet).toEqual({
      p1: 0,
      p2: 100,
      p3: 200,
    });
    expect(game.hand.totalContribThisHand).toEqual({
      p1: 0,
      p2: 100,
      p3: 200,
    });
    expect(game.hand.pot).toEqual({ main: 300, sides: [] });
    expect(game.hand.actionLog).toEqual([]);
  });

  it('ヘッズアップではボタン=SBになりプリフロップで最初に行動する', () => {
    const players: PlayerSetup[] = [
      { id: 'p1', name: 'ボタン', stack: 5000 },
      { id: 'p2', name: 'ビッグ', stack: 7000 },
    ];

    const game = createNewGame(baseSettings, players);

    expect(game.hand.dealerIndex).toBe(0);
    expect(game.hand.sbIndex).toBe(0);
    expect(game.hand.bbIndex).toBe(1);
    expect(game.hand.currentTurnPlayerId).toBe('p1');
    expect(game.hand.contribThisStreet).toEqual({ p1: 100, p2: 200 });
    expect(game.hand.totalContribThisHand).toEqual({ p1: 100, p2: 200 });
  });

  it('ブラインドでスタックが尽きたプレイヤーをALL_INにする', () => {
    const players: PlayerSetup[] = [
      { id: 'p1', name: 'ボタン', stack: 500 },
      { id: 'p2', name: 'スモール', stack: 60 },
      { id: 'p3', name: 'ビッグ', stack: 150 },
    ];

    const game = createNewGame(baseSettings, players);

    expect(game.players.find((p) => p.id === 'p2')?.state).toBe('ALL_IN');
    expect(game.players.find((p) => p.id === 'p3')?.state).toBe('ALL_IN');
    expect(game.hand.contribThisStreet).toEqual({ p1: 0, p2: 60, p3: 150 });
    expect(game.hand.totalContribThisHand).toEqual({ p1: 0, p2: 60, p3: 150 });
    expect(game.hand.currentBet).toBe(150);
    expect(game.hand.pot.main).toBe(210);
  });
});
