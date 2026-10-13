/** Common Guandan rules, including all legal heart-level wildcard interpretations.
 * Source: https://wgyxy.hfut.edu.cn/_t540/2022/1213/c6444a287644/pagem.htm
 */
export interface Card { id: string; r: number; s: string }
export type PlayType = 'single' | 'pair' | 'triple' | 'fullHouse' | 'straight' | 'pairs' | 'triples' | 'bomb' | 'straightFlush' | 'jokerBomb';
export interface Play { type: PlayType; size: number; rank: number; key: string; label: string; cards: Card[] }
type Template = { type: PlayType; ranks: number[]; high: number; suit?: string };
const SUITS = ['S', 'H', 'C', 'D'];
const NAMES: Record<PlayType, string> = { single: '单张', pair: '对子', triple: '三张', fullHouse: '三带二', straight: '顺子', pairs: '三连对', triples: '钢板', bomb: '炸弹', straightFlush: '同花顺', jokerBomb: '四王炸' };
export const rankLabel = (r: number) => (({ 11: 'J', 12: 'Q', 13: 'K', 14: 'A', 15: '小王', 16: '大王' } as Record<number, string>)[r] || String(r));
export const isWild = (card: Card, level: number) => card.s === 'H' && card.r === level;
export const cardPower = (rank: number, level: number) => rank >= 15 ? rank + 1 : rank === level ? 15 : rank;
export function sortCards(cards: Card[], level: number): Card[] {
  return [...cards].sort((a, b) => cardPower(b.r, level) - cardPower(a.r, level) || SUITS.indexOf(a.s) - SUITS.indexOf(b.s) || a.id.localeCompare(b.id));
}
export function createDeck(): Card[] {
  const cards: Card[] = [];
  for (let d = 0; d < 2; d++) {
    for (const s of SUITS) for (let r = 2; r <= 14; r++) cards.push({ id: `${d}-${s}-${r}`, r, s });
    for (const r of [15, 16]) cards.push({ id: `${d}-J-${r}`, r, s: 'J' });
  }
  return cards;
}
export function shuffle(cards: Card[]): Card[] {
  const result = [...cards];
  for (let i = result.length - 1; i > 0; i--) {
    // Rejection sampling avoids modulo bias while keeping the deal server-private.
    const range = i + 1, limit = Math.floor(4294967296 / range) * range;
    let value: number;
    do { value = crypto.getRandomValues(new Uint32Array(1))[0]; } while (value >= limit);
    const j = value % range;
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
export function deal(level = 2): Card[][] {
  const deck = shuffle(createDeck());
  return Array.from({ length: 4 }, (_, seat) => sortCards(deck.filter((_, i) => i % 4 === seat), level));
}
function templates(size?: number): Template[] {
  const out: Template[] = [];
  const add = (type: PlayType, ranks: number[], high: number, suit?: string) => { if (size === undefined || size === ranks.length) out.push({ type, ranks, high, suit }); };
  for (let r = 2; r <= 16; r++) {
    add('single', [r], r);
    add('pair', [r, r], r);
    if (r <= 14) {
      add('triple', [r, r, r], r);
      for (let n = 4; n <= 10; n++) add('bomb', Array(n).fill(r), r);
      if (size === undefined || size === 5) for (let p = 2; p <= 16; p++) if (r !== p) add('fullHouse', [r, r, r, p, p], r);
    }
  }
  for (const [type, length, repeat] of [['straight', 5, 1], ['pairs', 3, 2], ['triples', 2, 3]] as const) {
    for (let start = 1; start <= 15 - length; start++) {
      const ranks = Array.from({ length }, (_, i) => start + i === 1 ? 14 : start + i).flatMap(r => Array(repeat).fill(r));
      const high = start + length - 1;
      add(type, ranks, high);
      if (type === 'straight') for (const suit of SUITS) add('straightFlush', ranks, high, suit);
    }
  }
  add('jokerBomb', [15, 15, 16, 16], 16);
  return out;
}
const ALL_TEMPLATES = templates();
const TEMPLATES_BY_SIZE = new Map(Array.from({ length: 10 }, (_, i) => [i + 1, ALL_TEMPLATES.filter(t => t.ranks.length === i + 1)]));
function fromTemplate(t: Template, cards: Card[], level: number): Play {
  const sequence = ['straight', 'straightFlush', 'pairs', 'triples'].includes(t.type);
  return { type: t.type, size: cards.length, rank: sequence ? t.high : cardPower(t.high, level), key: `${t.type}:${t.high}:${t.ranks.join('-')}:${t.suit || ''}`, label: t.type === 'bomb' ? `${cards.length} 张炸弹 · ${rankLabel(t.high)}` : `${NAMES[t.type]}${t.type === 'jokerBomb' ? '' : ` · ${rankLabel(t.high)}`}`, cards: [...cards] };
}
function validCards(cards: Card[]): boolean {
  return new Set(cards.map(c => c.id)).size === cards.length && cards.every(c => Number.isInteger(c.r) && c.r >= 2 && c.r <= 16 && (c.r >= 15 ? c.s === 'J' : SUITS.includes(c.s)));
}
/** Pick natural cards first and use at most two wilds to fill ordinary-rank gaps. */
function match(t: Template, hand: Card[], level: number, exact: boolean): Card[] | null {
  if (t.ranks.length > hand.length) return null;
  if (t.type === 'single') {
    const c = hand.find(c => c.r === t.high);
    return c ? [c] : null;
  }
  const wilds = hand.filter(c => isWild(c, level));
  const pool = hand.filter(c => !isWild(c, level));
  const selected: Card[] = [];
  for (const rank of t.ranks) {
    const index = pool.findIndex(c => c.r === rank && (!t.suit || c.s === t.suit));
    if (index >= 0) selected.push(pool.splice(index, 1)[0]);
    else if (rank < 15 && wilds.length) selected.push(wilds.shift()!);
    else return null;
  }
  if (exact && (pool.length || wilds.length)) return null;
  return selected;
}
/** All interpretations; selecting the returned key lets users declare ambiguous wildcards. */
export function classify(cards: Card[], level: number): Play[] {
  if (!cards.length || cards.length > 10 || !validCards(cards)) return [];
  const result: Play[] = [];
  for (const t of TEMPLATES_BY_SIZE.get(cards.length) || []) {
    if (match(t, cards, level, true)) result.push(fromTemplate(t, cards, level));
  }
  return result.sort(compareStrength);
}
export function bombPower(play: Play): number {
  if (play.type === 'jokerBomb') return 100;
  if (play.type === 'straightFlush') return 5.5;
  if (play.type === 'bomb') return play.size;
  return 0;
}
export function beats(play: Play, previous?: Play | null): boolean {
  if (!previous) return true;
  const a = bombPower(play), b = bombPower(previous);
  if (a || b) return a > b || (a > 0 && a === b && play.rank > previous.rank);
  return play.type === previous.type && play.size === previous.size && play.rank > previous.rank;
}
function compareStrength(a: Play, b: Play): number {
  return bombPower(a) - bombPower(b) || a.rank - b.rank || a.type.localeCompare(b.type);
}
export function choosePlay(cards: Card[], level: number, previous?: Play | null, key?: string): Play | null {
  return classify(cards, level).find(p => (!key || p.key === key) && beats(p, previous)) || null;
}
/** One physical realization per legal pattern; enough for complete response detection. */
export function legalPlays(hand: Card[], level: number, previous?: Play | null): Play[] {
  if (!validCards(hand)) return [];
  const result: Play[] = [];
  for (const t of ALL_TEMPLATES) {
    const cards = match(t, hand, level, false);
    if (!cards) continue;
    const play = fromTemplate(t, cards, level);
    if (beats(play, previous)) result.push(play);
  }
  return result.sort(compareStrength);
}
/** A bounded, fair bot: only its own hand and the visible last play are used. */
export function suggest(hand: Card[], level: number, previous?: Play | null): Play | null {
  const choices = legalPlays(hand, level, previous);
  const finish = choices.find(p => p.size === hand.length);
  if (finish) return finish;
  const counts = new Map<number, number>();
  for (const c of hand) counts.set(c.r, (counts.get(c.r) || 0) + 1);
  const score = (p: Play) => {
    const wildCost = p.cards.filter(c => isWild(c, level)).length * 5;
    const splitCost = [...new Set(p.cards.map(c => c.r))].reduce((sum, rank) => {
      const total = counts.get(rank) || 0, used = p.cards.filter(c => c.r === rank).length;
      return sum + (total >= 4 && used < total ? 12 : total >= 2 && used < total ? 2 : 0);
    }, 0);
    return bombPower(p) * 100 + p.rank * .25 + wildCost + splitCost - (previous ? 0 : p.size * 3);
  };
  choices.sort((a, b) => score(a) - score(b));
  return choices[0] || null;
}
/** Bot follow-up policy: go out whenever possible, let a teammate's play stand, and keep bombs for real threats. */
export function botPlay(hand: Card[], level: number, previous: Play | null | undefined, situation: { teammateLed: boolean; opponentLeft: number }): Play | null {
  const play = suggest(hand, level, previous);
  if (!play || !previous || play.size === hand.length) return play;
  if (situation.teammateLed) return null;
  if (!bombPower(play)) return play;
  return situation.opponentLeft <= 8 || hand.length - play.size <= 5 ? play : null;
}
