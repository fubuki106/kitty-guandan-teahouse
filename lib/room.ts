import {announcement} from './announcements';
import type {TableTheme} from './table-style';
import { deal, sortCards, choosePlay, botPlay, cardPower, isWild, type Card, type Play } from './guandan';

export type GameEvent={id:number;kind:'play'|'pass'|'bomb'|'straightFlush'|'jokerBomb'|'deal'|'win';label:string;seat:number;at:number;voice?:string};
export type Player = {token:string;name:string;avatar?:string;bot:boolean;auto:boolean;lastSeen:number};
export type Room = {theme?:TableTheme;themeBy?:string;id:string;host:string;players:(Player|null)[];phase:'lobby'|'playing'|'ended'|'complete';hands:Card[][];level:number;levels:number[];round:number;turn:number;last:Play|null;lastSeat:number;passed:number[];finished:number[];moves?:(string|null)[];log:string[];deadline:number;previous:number[];tribute:string;winner?:number;events?:GameEvent[];banned?:string[];music?:import('./lounge').Music};
export function createRoom(id:string,token:string,name:string):Room {return {id,host:token,players:[{token,name,bot:false,auto:false,lastSeen:Date.now()},null,null,null],phase:'lobby',hands:[[],[],[],[]],level:2,levels:[2,2],round:0,turn:0,last:null,lastSeat:0,passed:[],finished:[],log:['茶已沏好，等喵友入座。'],deadline:0,previous:[],tribute:''};}
function event(r:Room,kind:GameEvent['kind'],label:string,seat:number,voice?:string){r.events=[...(r.events||[]),{id:(r.events?.at(-1)?.id||0)+1,kind,label,seat,at:Date.now(),voice:voice||kind}].slice(-12);}
function note(r:Room,s:string){r.log=[...r.log,s].slice(-14);}
function next(r:Room,s:number){for(let i=1;i<=4;i++){const n=(s+i)%4;if(r.hands[n].length)return n;}return s;}
function setTurn(r:Room,s:number){r.turn=s;r.deadline=Date.now()+(r.players[s]?.bot||r.players[s]?.auto?1300:45000);}
function setMove(r:Room,seat:number,label:string){const moves=r.moves||[null,null,null,null];moves[seat]=label;r.moves=moves;}
function take(r:Room,from:number,to:number,c:Card){r.hands[from]=r.hands[from].filter(x=>x.id!==c.id);r.hands[to].push(c);}
export function startRound(r:Room){
  if(r.phase!=='lobby'&&r.phase!=='ended')throw Error('这副牌还没结束喵。');
  r.players=r.players.map((p,i)=>p||{token:'bot-'+i,name:['奶盖','布丁','糯米','椰椰'][i],bot:true,auto:true,lastSeen:Date.now()});
  r.hands=deal(r.level);r.round++;r.phase='playing';r.last=null;r.passed=[];r.finished=[];r.moves=[null,null,null,null];r.tribute='';
  let first=Math.floor(Math.random()*4);
  if(r.previous.length){
    const [head,second,,tail]=r.previous;
    const double=head%2===second%2;
    const donors=double?r.previous.slice(2):[tail];
    const anti=donors.reduce((n,s)=>n+r.hands[s].filter(c=>c.r===16).length,0)===2;
    if(anti){first=head;r.tribute='两张大王抗贡，由上游先出。';}
    else {
      const gifts=donors.map(s=>({s,c:sortCards(r.hands[s].filter(c=>!isWild(c,r.level)),r.level).reduce((a,b)=>cardPower(a.r,r.level)>=cardPower(b.r,r.level)?a:b)})).sort((a,b)=>cardPower(b.c.r,r.level)-cardPower(a.c.r,r.level));
      first=gifts[0].s;
      for(let i=0;i<gifts.length;i++){
        const to=i===0?head:second,{s,c}=gifts[i];
        // Return the lowest eligible natural card, selected before receiving tribute.
        const eligible=r.hands[to].filter(x=>x.r<=10&&!isWild(x,r.level));
        const back=sortCards(eligible.length?eligible:r.hands[to].filter(x=>!isWild(x,r.level)),r.level).sort((a,b)=>a.r-b.r)[0];
        take(r,s,to,c);take(r,to,s,back);
      }
      r.tribute='已自动进贡与还贡（还最小的非逢人配、10及以下牌；无此牌则还最小牌），进贡大者先出。';
    }
    note(r,r.tribute);
  }
  r.hands=r.hands.map(h=>sortCards(h,r.level));setTurn(r,first);event(r,'deal','第 '+r.round+' 副 · 好运开场',first);note(r,`第 ${r.round} 副 · 打 ${rankLabel(r.level)}，${r.players[first]!.name}先出。`);
}
export function rankLabel(n:number){return n===14?'A':n===13?'K':n===12?'Q':n===11?'J':String(n);}
function finishRound(r:Room){
  const remaining=[0,1,2,3].filter(s=>!r.finished.includes(s));r.finished.push(...remaining);r.previous=[...r.finished];
  event(r,'win','一局好牌，一桌好朋友',r.finished[0]);
  const team=r.finished[0]%2, partner=(r.finished[0]+2)%4, place=r.finished.indexOf(partner),up=place===1?3:place===2?2:1;
  if(r.level===14&&r.levels[team]===14&&place<3){r.phase='complete';r.winner=team;note(r,`${team===0?'奶油队':'抹茶队'}成功过 A，赢得整场！`);return;}
  r.levels[team]=Math.min(14,r.levels[team]+up);r.level=r.levels[team];r.phase='ended';
  note(r,`${r.players[r.finished[0]]!.name}头游！${team===0?'奶油队':'抹茶队'}升 ${up} 级，下副打 ${rankLabel(r.level)}。`);
}
export function playTurn(r:Room,seat:number,ids:string[],key?:string){
  if(r.phase!=='playing'||r.turn!==seat)throw Error('还没轮到你出牌喵。');
  if(!ids.length){
    if(!r.last)throw Error('新一轮需要先出牌。');
    event(r,'pass','不要',seat);r.passed.push(seat);note(r,`${r.players[seat]!.name}：不要`);setMove(r,seat,'不要');
  }else{
    if(new Set(ids).size!==ids.length)throw Error('选牌重复。');
    const selected=ids.map(id=>r.hands[seat].find(c=>c.id===id));
    if(selected.some(c=>!c))throw Error('手牌已更新，请重新选牌。');
    const p=choosePlay(selected as Card[],r.level,r.last||undefined,key);
    if(!p)throw Error('这个牌型不能这样出，试试「提示」喵。');
    r.hands[seat]=r.hands[seat].filter(c=>!ids.includes(c.id));r.last=p;r.lastSeat=seat;r.passed=[];event(r,['bomb','straightFlush','jokerBomb'].includes(p.type)?p.type as 'bomb'|'straightFlush'|'jokerBomb':'play',p.label,seat,announcement(p));
    note(r,`${r.players[seat]!.name}：${p.label}`);setMove(r,seat,p.label);
    if(!r.hands[seat].length){r.finished.push(seat);note(r,`${r.players[seat]!.name}第 ${r.finished.length} 个出完！`);}
    if(r.finished.length>=3||(r.finished.length===2&&r.finished[0]%2===r.finished[1]%2)){finishRound(r);return;}
  }
  const active=[0,1,2,3].filter(s=>r.hands[s].length&&s!==r.lastSeat);
  if(r.last&&active.every(s=>r.passed.includes(s))){
    let lead=r.lastSeat;if(!r.hands[lead].length){const partner=(lead+2)%4;lead=r.hands[partner].length?partner:next(r,lead);note(r,`${r.players[lead]!.name}接风。`);}
    r.last=null;r.passed=[];r.moves=[null,null,null,null];setTurn(r,lead);
  }else setTurn(r,next(r,seat));
}
export function tick(r:Room){
  if(r.phase!=='playing'||Date.now()<r.deadline)return false;
  const p=r.players[r.turn]!;
  if(!p.bot&&!p.auto){p.auto=true;note(r,`${p.name}超时，猫咪接手托管。`);}
  const opponents=[0,1,2,3].filter(s=>s%2!==r.turn%2&&r.hands[s].length).map(s=>r.hands[s].length);
  const choice=botPlay(r.hands[r.turn],r.level,r.last,{teammateLed:!!r.last&&r.lastSeat%2===r.turn%2,opponentLeft:Math.min(27,...opponents)});
  playTurn(r,r.turn,choice?.cards.map(c=>c.id)||[],choice?.key);return true;
}
export function publicRoom(r:Room,token:string){const seat=r.players.findIndex(p=>p?.token===token);if(seat<0)throw Error('你还没有加入这个房间。');return {...r,host:undefined,banned:undefined,serverTime:Date.now(),players:r.players.map(p=>p?{name:p.name,avatar:p.avatar,bot:p.bot,auto:p.auto,isHost:p.token===r.host,online:p.bot||Date.now()-p.lastSeen<15000}:null),hands:undefined,hand:r.hands[seat],counts:r.hands.map(h=>h.length),seat,isHost:r.host===token};}
