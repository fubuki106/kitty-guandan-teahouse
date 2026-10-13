import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import assert from 'node:assert/strict';
import GroupedHand from '../components/grouped-hand';
import type {HandGroup} from '../lib/hand-layout';
const group:HandGroup={id:'steel',label:'钢板 K高',kind:'triples',cards:[13,13,13,12,12,12].map((r,i)=>({id:String(i),r,s:'S'}))};
let checked=0;
function checkColumns(group:HandGroup,maxStack:number,expected:number[]){
 const html=renderToStaticMarkup(<GroupedHand groups={[group]} selected={group.cards.map(c=>c.id)} maxStack={maxStack} onGroup={()=>{}} renderCard={c=><button data-card-id={c.id}>{c.r}</button>}/>);
 const columns=html.split('class="column-stack"').slice(1).map(part=>(part.match(/data-card-id=/g)||[]).length);
 assert.deepEqual(columns,expected,`${group.kind}/${group.cards.length} cards/maxStack ${maxStack}`);
 assert.deepEqual([...html.matchAll(/data-card-id="([^"]+)"/g)].map(match=>match[1]),group.cards.map(c=>c.id));
 assert.equal((html.match(/class="column-label"/g)||[]).length,1,'every combination keeps one shared label');
 assert.ok(html.includes('aria-pressed="true"'),'whole-group selection remains highlighted');
 checked++;
}
for(const maxStack of [3,5]){
 checkColumns(group,maxStack,[6]);
 checkColumns({id:'three-pairs',label:'三连对 K高',kind:'pairs',cards:[13,13,12,12,11,11].map((r,i)=>({id:`pair-${i}`,r,s:i%2?'H':'S'}))},maxStack,[6]);
 for(const [count,expected] of [[4,[4]],[5,[5]],[6,[3,3]],[7,[4,3]],[8,[4,4]],[9,[5,4]],[10,[5,5]]] as const){
  checkColumns({id:`bomb-${count}`,label:`炸弹 ${count}张`,kind:'bomb',cards:Array.from({length:count},(_,i)=>({id:`bomb-${i}`,r:6,s:'S'}))},maxStack,[...expected]);
 }
 checkColumns({...group,id:'joker',kind:'jokerBomb',cards:group.cards.slice(0,4)},maxStack,[4]);
 checkColumns({...group,id:'flush',kind:'straightFlush',cards:group.cards.slice(0,5)},maxStack,[5]);
 checkColumns({...group,id:'ordinary',kind:'rank',cards:group.cards.slice(0,4)},maxStack,maxStack===3?[3,1]:[4]);
}
console.log(`PASS: ${checked} column layouts; whole short bombs and steel, balanced large bombs, exact card order, shared selection labels, unchanged ordinary groups.`);
