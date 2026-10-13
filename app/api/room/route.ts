import {tableTheme} from '../../../lib/table-style';
import { env } from 'cloudflare:workers';
import { createRoom,startRound,playTurn,tick,publicRoom,type Room } from '../../../lib/room';
import {avatar,nickname,seatNumber,moveSeat,kick,removePlayer,controlMusic,advanceMusic} from '../../../lib/lounge';
const reply=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
export async function POST(req:Request){try{
 if(req.headers.get('origin')&&new URL(req.headers.get('origin')!).host!==new URL(req.url).host)return reply({error:'请求来源不正确'},403);
 const t=req.headers.get('x-player-token')||'';if(!/^[a-f0-9-]{36}$/.test(t))throw Error('请刷新网页后重试。');
 const raw=await req.text();if(raw.length>75000)return reply({error:'请求过大'},413);const b=JSON.parse(raw),db=env.DB!;
 if(b.action==='create'){
  const id=crypto.randomUUID().replace(/-/g,'').slice(0,8).toUpperCase(),r=createRoom(id,t,nickname(b.name));r.players[0]!.avatar=avatar(b.avatar);
  if(b.seat!==undefined)moveSeat(r,0,seatNumber(b.seat));advanceMusic(r);
  await db.prepare('INSERT INTO rooms (id,state,revision,updated) VALUES (?,?,0,?)').bind(id,JSON.stringify(r),Date.now()).run();return reply(publicRoom(r,t));
 }
 const id=String(b.id||'');if(!/^[A-Z0-9]{8}$/.test(id))throw Error('房间码应为 8 位字母或数字。');
 for(let attempt=0;attempt<6;attempt++){
  const row=await db.prepare('SELECT state,revision FROM rooms WHERE id = ?').bind(id).first<{state:string;revision:number}>();if(!row)return reply({error:'没有找到这个房间，请检查房间码。'},404);
  const r=JSON.parse(row.state) as Room;let seat=r.players.findIndex(p=>p?.token===t);
  if(r.banned?.includes(t))return reply({error:'房主已请你离开这张牌桌。',code:'KICKED'},403);
  if(b.action==='peek')return reply({id:r.id,phase:r.phase,seat,players:r.players.map(p=>p?{name:p.name,avatar:p.avatar,bot:p.bot,isHost:p.token===r.host}:null)});
  if(b.action==='join'){
   if(seat<0){if(r.phase!=='lobby')throw Error('牌局已经开始，请让房主新建房间。');seat=b.seat===undefined?r.players.findIndex(p=>!p||p.bot):seatNumber(b.seat);if(seat<0)throw Error('这桌已经坐满了喵。');if(r.players[seat]&&!r.players[seat]!.bot)throw Error('这个座位刚被选走了，请换一个。');r.players[seat]={token:t,name:nickname(b.name),avatar:avatar(b.avatar),bot:false,auto:false,lastSeen:Date.now()};if(!r.host)r.host=t;}
  }else{
   if(seat<0)return reply({error:'你已离开这张牌桌，请重新加入。',code:'NOT_MEMBER'},403);
   if(b.action==='start'){if(r.host!==t)throw Error('请等房主开始。');startRound(r);}
   else if(b.action==='play')playTurn(r,seat,Array.isArray(b.cards)?b.cards:[],b.key);
   else if(b.action==='seat'){const target=seatNumber(b.seat);moveSeat(r,seat,target);seat=target;}
   else if(b.action==='kick')kick(r,t,seatNumber(b.seat));
   else if(b.action==='profile'){r.players[seat]!.name=nickname(b.name);r.players[seat]!.avatar=avatar(b.avatar);}
   else if(b.action==='music')controlMusic(r,t,b);
   else if(b.action==='theme'){r.theme=tableTheme(b.theme);r.themeBy=r.players[seat]!.name;}
   else if(b.action==='auto'){r.players[seat]!.auto=!!b.enabled;if(r.turn===seat)r.deadline=Date.now()+(b.enabled?1000:45000);}
   else if(b.action==='leave'){removePlayer(r,seat);if(r.host===t)r.host=r.players.find(p=>p&&!p.bot)?.token||'';}
   else if(b.action!=='poll')throw Error('不支持的操作。');
  }
  if(b.action!=='leave')r.players[seat]!.lastSeen=Date.now();tick(r);advanceMusic(r);
  const result=await db.prepare('UPDATE rooms SET state=?,revision=revision+1,updated=? WHERE id=? AND revision=?').bind(JSON.stringify(r),Date.now(),id,row.revision).run();
  if(result.meta.changes){if(b.action==='music'&&b.command==='remove'&&/^[a-f0-9-]{36}$/.test(String(b.track)))await env.BUCKET?.delete(`music/${id}/${b.track}`);return b.action==='leave'?reply({ok:true}):reply(publicRoom(r,t));}
 }
 return reply({error:'牌桌正在更新，请再试一次。'},409);
 }catch(e){return reply({error:e instanceof Error?e.message:'牌桌暂时连接不上，请稍后再试。'},400);}}
