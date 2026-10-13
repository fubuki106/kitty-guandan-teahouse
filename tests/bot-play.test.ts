import assert from 'node:assert/strict';
import {botPlay,classify,bombPower,type Card} from '../lib/guandan';
import {createRoom,startRound,tick} from '../lib/room';
const card=(id:string,r:number,s='S'):Card=>({id,r,s});
// Only a bomb of 5s can beat the pair of 9s; eight cards remain after bombing.
const hand=[card('a',5,'S'),card('b',5,'C'),card('c',5,'D'),card('d',5,'S'),...[3,4,6,7,8,10,11,12].map((r,i)=>card('x'+i,r,['S','C','D'][i%3]))];
const pair9=classify([card('p',9,'S'),card('q',9,'C')],2)[0];
assert.equal(botPlay(hand,2,pair9,{teammateLed:false,opponentLeft:20}),null,'bombs are held while opponents still have many cards');
assert.equal(bombPower(botPlay(hand,2,pair9,{teammateLed:false,opponentLeft:6})!),4,'bombs are used when an opponent is close to going out');
assert.equal(botPlay(hand,2,pair9,{teammateLed:true,opponentLeft:3}),null,'a teammate play is left standing');
const finish=botPlay([card('t',10,'S'),card('u',10,'C')],2,pair9,{teammateLed:true,opponentLeft:20});
assert.equal(finish?.cards.length,2,'going out beats even a teammate play');
assert.ok(botPlay(hand,2,null,{teammateLed:false,opponentLeft:20}),'a bot always leads something');
// Full bot-only rounds: cards are conserved, every round ends, and per-seat moves reset with each new trick.
let rounds=0;
for(let game=0;game<40;game++){
 const r=createRoom('TEST'+game,'host','测试喵');startRound(r);
 let left=108;
 for(let step=0;r.phase==='playing';step++){
  assert.ok(step<3000,'round finishes');
  r.deadline=0;tick(r);
  const ids=r.hands.flat().map(c=>c.id);
  assert.equal(new Set(ids).size,ids.length,'no card is duplicated');
  assert.ok(ids.length<=left,'cards only leave hands');left=ids.length;
  assert.equal(r.moves?.length,4);
  if(r.phase==='playing'&&!r.last)assert.ok(r.moves!.every(m=>m===null),'moves clear when a new trick starts');
 }
 assert.ok(['ended','complete'].includes(r.phase));
 assert.equal(r.finished.length,4);
 rounds++;
}
console.log(`PASS: bot policy holds bombs, keeps teammate plays, goes out; ${rounds} simulated rounds finish with per-seat moves.`);
