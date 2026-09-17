import { describe, expect, it } from 'vitest';
import { BOARD_LINKS, boardPosition, createGame, legalMove, takeTurn } from './game.js';

describe('board mapping', () => {
  it('maps a serpentine 10x10 board', () => {
    expect(boardPosition(1)).toEqual({ row: 0, col: 0 });
    expect(boardPosition(10)).toEqual({ row: 0, col: 9 });
    expect(boardPosition(11)).toEqual({ row: 1, col: 9 });
    expect(boardPosition(20)).toEqual({ row: 1, col: 0 });
    expect(boardPosition(100)).toEqual({ row: 9, col: 0 });
  });
});

describe('chutes and ladders', () => {
  it('contains recognizable climbs and slides without overlap', () => {
    const entries = Object.entries(BOARD_LINKS);
    expect(entries.some(([from, to]) => +to > +from)).toBe(true);
    expect(entries.some(([from, to]) => +to < +from)).toBe(true);
    expect(new Set(entries.map(([from]) => from)).size).toBe(entries.length);
  });
  it('applies a ladder and a chute after movement', () => {
    expect(legalMove(1, 3)).toEqual({ landing: 4, final: 25, link: 'ladder' });
    expect(legalMove(93, 5)).toEqual({ landing: 98, final: 78, link: 'chute' });
  });
});

describe('turns and winning', () => {
  it('advances players and rejects rolls beyond 100', () => {
    let game = createGame(4);
    game = takeTurn(game, 2);
    expect(game.players[0].square).toBe(2);
    expect(game.current).toBe(1);
    game = { ...game, players: game.players.map((p, i) => i === 1 ? { ...p, square: 98 } : p) };
    game = takeTurn(game, 3);
    expect(game.players[1].square).toBe(98);
    expect(game.current).toBe(2);
  });
  it('wins only by landing exactly on 100 and freezes turns', () => {
    let game = createGame(2);
    game = { ...game, players: game.players.map((p, i) => i === 0 ? { ...p, square: 94 } : p) };
    game = takeTurn(game, 6);
    expect(game.winner).toBe(0);
    expect(game.players[0].square).toBe(100);
    expect(() => takeTurn(game, 1)).toThrow(/finished/i);
  });
  it('validates player count and die values', () => {
    expect(() => createGame(1)).toThrow(/2.*4/);
    expect(() => takeTurn(createGame(), 7)).toThrow(/roll/i);
  });
});
