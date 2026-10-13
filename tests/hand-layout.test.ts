import assert from 'node:assert/strict';
import {arrangeHand,rankGroups,groupStrength,displayCards,toggleHandGroup} from '../lib/hand-layout';
import {deal,createDeck,classify,cardPower,bombPower,beats,type Card} from '../lib/guandan';
let checked=0;
function check(hand:Card[],level:number){
 const original=JSON.stringify(hand);
 for(const groupFn of [rankGroups,arrangeHand]){
  const groups=groupFn(hand,level),cards=groups.flatMap(g=>g.cards);
  assert.deepEqual(cards.map(c=>c.id).sort(),hand.map(c=>c.id).sort());
  assert.equal(new Set(cards.map(c=>c.id)).size,hand.length);
  assert.equal(JSON.stringify(hand),original);
  assert.deepEqual(groupFn(hand,level),groups);
  assert.ok(groups.every(g=>g.kind!=='fullHouse'));
  if(groupFn===rankGroups)assert.ok(groups.every((g,i)=>!i||groupStrength(groups[i-1],level)>=groupStrength(g,level)));
  else{
   const bombs=groups.filter(g=>g.play&&bombPower(g.play));
   assert.deepEqual(groups.slice(0,bombs.length),bombs,'all bombs must lead the hand');
   for(let i=1;i<bombs.length;i++)assert.ok(!beats(bombs[i].play!,bombs[i-1].play!),'stronger bomb cannot follow a weaker one');
   const plain=groups.filter(g=>!g.play);
   assert.deepEqual(groups.slice(bombs.length,bombs.length+plain.length),plain,'plain ranks precede ordinary sequences');
   assert.ok(plain.every((g,i)=>!i||groupStrength(plain[i-1],level)>=groupStrength(g,level)));
   const sequences=groups.slice(bombs.length+plain.length);
   const families=['triples','pairs','straight'];
   assert.ok(sequences.every((g,i)=>!i||families.indexOf(sequences[i-1].kind)<families.indexOf(g.kind)||sequences[i-1].kind===g.kind&&groupStrength(sequences[i-1],level)>=groupStrength(g,level)));
  }
  assert.ok(groups.filter(g=>g.cards.some(c=>c.r===level)).every(g=>g.kind==='level'||g.kind==='bomb'&&g.cards.every(c=>c.r===level)));
  for(const g of groups){
   const ranks=g.cards.map(c=>g.play&&['straight','straightFlush','pairs','triples'].includes(g.kind)?(c.r===14&&g.play.rank<14?1:c.r):cardPower(c.r,level));
   assert.ok(ranks.every((r,i)=>!i||ranks[i-1]>=r));
  }
  for(const g of groups)if(g.play)assert.ok(classify(g.cards,level).some(p=>p.key===g.play!.key),g.play.label);
 }
 checked++;
}
for(let level=2;level<=14;level++)for(let i=0;i<10;i++)for(const hand of deal(level))check(hand,level);
const deck=createDeck();
check([],2);
check(deck.filter(c=>c.r===6||c.r===2&&c.s==='H'),2);
check(deck.filter(c=>c.r>14),2);
check(deck.filter(c=>c.s==='H'&&c.r>=2&&c.r<=7),2);
const triple=deck.filter(c=>c.r===3).slice(0,3),pair=deck.filter(c=>c.r===13).slice(0,2);
const manual=arrangeHand([...triple,...pair],2);
assert.deepEqual(manual.map(g=>g.cards.length),[2,3]);
const selected=toggleHandGroup(toggleHandGroup([],triple),pair);
assert.equal(selected.length,5);
assert.ok(classify([...triple,...pair],2).some(p=>p.type==='fullHouse'));
assert.deepEqual(toggleHandGroup(selected,pair),triple.map(c=>c.id));
const mixed=[...deck.filter(c=>[16,15,14,13,2,3].includes(c.r))].reverse();
assert.deepEqual(rankGroups(mixed,2).flatMap(g=>g.cards),displayCards(mixed,2));
assert.deepEqual(rankGroups(mixed,2).map(g=>g.cards[0].r),[16,15,2,14,13,3]);
const lowStraight=deck.filter(c=>c.s==='S'&&c.id.startsWith('0-')&&[14,2,3,4,5].includes(c.r));
assert.deepEqual(arrangeHand(lowStraight,9)[0].cards.map(c=>c.r),[5,4,3,2,14]);
const take=(r:number,n:number)=>deck.filter(c=>c.r===r).slice(0,n);
const smallBomb=arrangeHand([...take(3,4),...take(14,1),...take(16,1)],2);
assert.deepEqual(smallBomb.map(g=>[g.kind,g.cards[0].r]),[['bomb',3],['rank',16],['rank',14]]);
assert.deepEqual(arrangeHand([...take(3,6),...take(14,4)],2).map(g=>[g.cards.length,g.cards[0].r]),[[6,3],[4,14]]);
assert.deepEqual(arrangeHand([...take(6,4),...take(14,4)],2).map(g=>g.cards[0].r),[14,6]);
assert.deepEqual(arrangeHand([...take(2,4),...take(6,4)],2).map(g=>[g.kind,g.cards[0].r]),[['bomb',2],['bomb',6]]);
const flush=deck.filter(c=>c.id.startsWith('0-S-')&&c.r>=8&&c.r<=12);
const bombFamily=[...take(15,2),...take(16,2),...take(3,6),...flush,...take(6,5),...take(14,4)];
assert.deepEqual(arrangeHand(bombFamily,2).map(g=>[g.kind,g.cards.length]),[['jokerBomb',4],['bomb',6],['straightFlush',5],['bomb',5],['bomb',4]]);
// Prefer a made straight flush over a weaker four-card bomb competing for its card.
assert.equal(arrangeHand([...flush,...deck.filter(c=>c.r===10&&!flush.some(f=>f.id===c.id)).slice(0,3)],2)[0].kind,'straightFlush');
// Heart-level cards remain in their own rank; do not automatically fill a bomb.
const wildReserved=arrangeHand([...take(3,3),...deck.filter(c=>c.r===2&&c.s==='H')],2);
assert.deepEqual(wildReserved.map(g=>g.kind),['level','rank']);
for(const hand of [bombFamily,smallBomb.flatMap(g=>g.cards),deck.filter(c=>c.r===2)])check(hand,2);
console.log(`PASS: ${checked} hands; exact card partition, valid declarations, stable arrangement, no input mutation.`);
