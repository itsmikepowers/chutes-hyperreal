export const BOARD_LINKS = Object.freeze({
  4: 25, 9: 31, 20: 38, 28: 84, 40: 59, 51: 67, 63: 81, 71: 91,
  17: 7, 54: 34, 62: 19, 64: 60, 87: 24, 93: 73, 95: 75, 98: 78,
});

export function boardPosition(square) {
  if (!Number.isInteger(square) || square < 1 || square > 100) throw new RangeError('Square must be 1–100');
  const row = Math.floor((square - 1) / 10);
  const offset = (square - 1) % 10;
  return { row, col: row % 2 ? 9 - offset : offset };
}

export function legalMove(start, roll) {
  if (!Number.isInteger(roll) || roll < 1 || roll > 6) throw new RangeError('Roll must be 1–6');
  const overshoot = start + roll > 100;
  const landing = overshoot ? start : start + roll;
  const final = overshoot ? landing : (BOARD_LINKS[landing] ?? landing);
  const link = final > landing ? 'ladder' : final < landing ? 'chute' : null;
  return { landing, final, link };
}

export function createGame(playerCount = 4) {
  if (!Number.isInteger(playerCount) || playerCount < 2 || playerCount > 4) throw new RangeError('Player count must be 2–4');
  const names = ['You', 'Nova', 'Atlas', 'Vega'];
  return { players: names.slice(0, playerCount).map((name, id) => ({ id, name, square: 0 })), current: 0, winner: null, turns: 0 };
}

export function takeTurn(game, roll) {
  if (game.winner !== null) throw new Error('Game is finished');
  const move = legalMove(game.players[game.current].square, roll);
  const players = game.players.map((p, i) => i === game.current ? { ...p, square: move.final } : p);
  const winner = move.final === 100 ? game.current : null;
  return { ...game, players, current: winner === null ? (game.current + 1) % players.length : game.current, winner, turns: game.turns + 1, lastMove: { player: game.current, roll, ...move } };
}
