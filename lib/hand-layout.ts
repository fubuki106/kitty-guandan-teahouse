import {bombPower,cardPower,isWild,legalPlays,rankLabel,sortCards,type Card,type Play} from './guandan';
export type HandGroup={id:string;label:string;cards:Card[];kind:string;play?:Play};
export function displayCards(hand:Card[],level:number):Card[]{
 return sortCards(hand,level).sort((a,b)=>cardPower(b.r,level)-cardPower(a.r,level)||Number(isWild(b,level))-Number(isWild(a,level)));
}
export function rankGroups(hand:Card[],level:number):HandGroup[]{
 const groups=new Map<number,HandGroup>();
 for(const card of displayCards(hand,level)){
  if(!groups.has(card.r))groups.set(card.r,{id:`rank-${card.r}`,label:card.r===level?`级牌 ${rankLabel(card.r)}`:rankLabel(card.r),cards:[],kind:card.r===level?'level':'rank'});
  groups.get(card.r)!.cards.push(card);
 }
 return [...groups.values()];
}
const priority:Record<string,number>={jokerBomb:2000,bomb:1200,straightFlush:1100,triples:750,pairs:700,straight:550};
const labels:Record<string,string>={jokerBomb:'四王炸',bomb:'炸弹',straightFlush:'同花顺',triples:'钢板',pairs:'三连对',straight:'顺子'};
const sequenceTypes=new Set(['straight','straightFlush','pairs','triples']);
export function groupStrength(group:HandGroup,level:number){return group.play&&sequenceTypes.has(group.kind)?group.play.rank:Math.max(...group.cards.map(c=>cardPower(c.r,level)));}
function compareGroups(a:HandGroup,b:HandGroup,level:number){
 const bombA=a.play?bombPower(a.play):0,bombB=b.play?bombPower(b.play):0;
 // Bombs lead the hand by actual game strength, regardless of their point rank.
 if(bombA||bombB)return bombB-bombA||groupStrength(b,level)-groupStrength(a,level)||a.id.localeCompare(b.id);
 const band=(g:HandGroup)=>g.kind==='triples'?1:g.kind==='pairs'?2:g.kind==='straight'?3:0;
 return band(a)-band(b)||groupStrength(b,level)-groupStrength(a,level)||a.id.localeCompare(b.id);
}
function sequenceCards(play:Play):Card[]{
 // Template cards are dealt low-to-high. Sort their assigned sequence positions,
 // so A remains low in A2345, and level-card power never breaks a sequence.
 const ranks=play.key.split(':')[2].split('-').map(Number);
 return play.cards.map((card,i)=>({card,rank:ranks[i]===14&&play.rank<14?1:ranks[i],i})).sort((a,b)=>b.rank-a.rank||a.i-b.i).map(x=>x.card);
}
function playGroup(play:Play,level:number):HandGroup{
 const cards=sequenceTypes.has(play.type)?sequenceCards(play):displayCards(play.cards,level);
 const detail=sequenceTypes.has(play.type)?`${rankLabel(Number(play.key.split(':')[1]))}高`:play.type==='bomb'?rankLabel(cards[0].r):'';
 return {id:`group-${cards.map(c=>c.id).sort().join('_')}`,label:`${labels[play.type]}${detail?' '+detail:''}`,cards,kind:play.type,play};
}
/** Display only: no full-house assembly or borrowing level cards for other ranks. */
export function arrangeHand(hand:Card[],level:number):HandGroup[]{
 let levelCards=hand.filter(c=>c.r===level);
 let remaining=displayCards(hand.filter(c=>c.r!==level),level);const groups:HandGroup[]=[];
 // Level cards stay together; four or more are already a natural level-rank bomb.
 if(levelCards.length>=4){
  const natural=legalPlays(levelCards,level).find(p=>p.type==='bomb'&&p.size===levelCards.length&&Number(p.key.split(':')[1])===level);
  if(natural){groups.push(playGroup(natural,level));levelCards=[];}
 }
 while(remaining.length){
  const choices=legalPlays(remaining,level).filter(p=>priority[p.type]);
  const score=(p:Play)=>bombPower(p)?10000+bombPower(p)*100+p.rank:priority[p.type]+p.size*12+p.rank*.01;
  choices.sort((a,b)=>score(b)-score(a)||a.key.localeCompare(b.key));
  const best=choices[0];if(!best)break;
  groups.push(playGroup(best,level));
  const ids=new Set(best.cards.map(c=>c.id));remaining=remaining.filter(c=>!ids.has(c.id));
 }
 return [...groups,...rankGroups([...levelCards,...remaining],level)].sort((a,b)=>compareGroups(a,b,level));
}
export function toggleHandGroup(selected:string[],cards:Card[]):string[]{
 const ids=new Set(cards.map(c=>c.id));return cards.every(c=>selected.includes(c.id))?selected.filter(id=>!ids.has(id)):[...new Set([...selected,...ids])];
}
