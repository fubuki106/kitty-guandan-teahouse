'use client';
import {useEffect,useRef,useState,type CSSProperties,type ReactNode} from 'react';
import type {Card} from '../lib/guandan';
import type {HandGroup} from '../lib/hand-layout';
const bombKinds=new Set(['bomb','jokerBomb','straightFlush']);
function cardStacks(group:HandGroup,maxStack:number):Card[][]{
 // Six-card combinations stay intact; screen height only changes strip spacing.
 if(group.kind==='triples'||group.kind==='pairs')return [group.cards];
 if(bombKinds.has(group.kind)){
  // Keep short bombs whole; larger bombs use balanced columns under one label.
  const count=Math.ceil(group.cards.length/5),base=Math.floor(group.cards.length/count),extra=group.cards.length%count;
  let start=0;
  return Array.from({length:count},(_,i)=>{const size=base+Number(i<extra),cards=group.cards.slice(start,start+size);start+=size;return cards;});
 }
 return Array.from({length:Math.ceil(group.cards.length/maxStack)},(_,i)=>group.cards.slice(i*maxStack,(i+1)*maxStack));
}
export default function GroupedHand({groups,selected,renderCard,onGroup,maxStack=5}:{maxStack?:number;groups:HandGroup[];selected:string[];renderCard:(card:Card)=>ReactNode;onGroup:(group:HandGroup)=>void}){
 const scroller=useRef<HTMLDivElement>(null),[width,setWidth]=useState(700);
 useEffect(()=>{const el=scroller.current;if(!el)return;const update=()=>setWidth(el.clientWidth);const observer=new ResizeObserver(update);observer.observe(el);update();return()=>observer.disconnect();},[groups.length]);
 const stacks=groups.map(group=>cardStacks(group,maxStack));
 const columns=stacks.reduce((n,group)=>n+group.length,0);
 const cardWidth=Math.min(92,Math.max(48,(width-12-(columns-1)*6)/Math.max(1,columns)));
 const overflow=columns*cardWidth+(columns-1)*6+12>width+2;
 const maximum=Math.max(1,...groups.map(g=>g.cards.length));
 return <div className="grouped-hand-wrap"><div ref={scroller} className="grouped-hand" aria-label="你的手牌，按列分组" style={{'--group-card-width':`${cardWidth}px`,'--largest-group':maximum} as CSSProperties}><div className="grouped-track">
 {groups.map((group,groupIndex)=><div className={`card-column group-${group.kind}${bombKinds.has(group.kind)?' bomb-family':''}`} key={group.id} style={{'--group-size':group.cards.length} as CSSProperties}><div className="column-cards">{stacks[groupIndex].map((cards,i)=><div className="column-stack" key={i}>{cards.map(card=><div className="column-card" key={card.id}>{renderCard(card)}</div>)}</div>)}</div><button className="column-label" aria-label={`选中整组：${group.label}，${group.cards.length}张`} aria-pressed={group.cards.every(c=>selected.includes(c.id))} onClick={()=>onGroup(group)} title={group.play?.label||`${group.label} · ${group.cards.length}张`}><span>{group.label}</span><b>{group.cards.length}张</b></button></div>)}
 {!groups.length&&<p className="hand-empty">手牌出完啦，等搭档凯旋。</p>}
 </div></div><span className="hand-scroll-cue">{overflow?'划过牌面选中 / 取消 · 拖空白处翻牌，或划到边缘':'划过牌面选中 / 取消 · 点下方标签选整组'}</span></div>;
}
