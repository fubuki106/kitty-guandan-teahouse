import type {Room,Player} from './room';
import {MUSIC_LIBRARY} from './music-library';
import {isCatAvatar} from './table-style';
export type Song={id:string;title:string;duration:number;mime:string;size:number;cover?:string;src?:string;addedVersion?:number};
export type Music={tracks:Song[];current:string;playing:boolean;position:number;at:number;shuffle:boolean;repeatOne?:boolean;revision:number;libraryVersion?:number};
export function music(r:Room):Music{const m=r.music??(r.music={tracks:[],current:'',playing:false,position:0,at:Date.now(),shuffle:false,revision:0});if((m.libraryVersion||0)<2){const existing=new Set(m.tracks.map(s=>s.id));m.tracks.push(...MUSIC_LIBRARY.filter(s=>(s.addedVersion||1)>(m.libraryVersion||0)&&!existing.has(s.id)).map(s=>({...s})));if(!m.current)m.current=m.tracks[0]?.id||'';m.libraryVersion=2;m.revision++;}return m;}
export function nickname(value:unknown){return String(value||'茶馆新喵').trim().slice(0,16)||'茶馆新喵';}
export function avatar(value:unknown){if(!value)return 'cat:cream';if(isCatAvatar(value))return value as string;if(typeof value!=='string'||value.length>65000||!/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(value))throw Error('头像请使用压缩后的小尺寸 JPG、PNG 或 WebP 图片。');return value;}
export function seatNumber(value:unknown){if(!Number.isInteger(value)||Number(value)<0||Number(value)>3)throw Error('请选择 1–4 号座位。');return Number(value);}
export function moveSeat(r:Room,from:number,to:number){if(r.phase!=='lobby')throw Error('开牌后座位就固定啦，请下一桌再换。');if(from===to)return;if(r.players[to]&&!r.players[to]!.bot)throw Error('这个座位已经有人了，换一个吧。');r.players[to]=r.players[from];r.players[from]=null;}
export function removePlayer(r:Room,seat:number){const old=r.players[seat];if(r.phase==='lobby')r.players[seat]=null;else{r.players[seat]={token:'bot-'+seat,name:old?.name+'的猫咪',bot:true,auto:true,lastSeen:Date.now()};if(r.turn===seat)r.deadline=Date.now()+1000;}}
export function kick(r:Room,actor:string,target:number){if(r.host!==actor)throw Error('只有房主可以请玩家离桌。');const p=r.players[target];if(!p||p.bot||p.token===actor)throw Error('请选择其他已入座的玩家。');r.banned=[...(r.banned||[]),p.token];r.log=[...r.log,`${p.name}已由房主请离牌桌。`].slice(-14);removePlayer(r,target);}
export function advanceMusic(r:Room,now=Date.now()){
 const m=music(r);let song=m.tracks.find(s=>s.id===m.current),elapsed=m.position+(now-m.at)/1000;
 if(!m.playing||!song||song.duration<=0||elapsed<song.duration)return;
 if(m.repeatOne)elapsed%=song.duration;
 else if(m.shuffle){const others=m.tracks.filter(s=>s.id!==song!.id);song=others.length?others[Math.floor(Math.random()*others.length)]:song;elapsed=0;}
 else{const total=m.tracks.reduce((n,s)=>n+Math.max(0,s.duration),0);if(total<=0)return;elapsed%=total;let i=m.tracks.indexOf(song);while(elapsed>=song.duration){elapsed-=song.duration;song=m.tracks[(++i)%m.tracks.length];}}
 m.current=song.id;m.position=elapsed;m.at=now;m.revision++;
}
export function controlMusic(r:Room,t:string,b:any){if(r.host!==t)throw Error('房主管理共享播放，你可以调节自己的音量。');const now=Date.now();advanceMusic(r,now);const m=music(r);const current=m.tracks.find(s=>s.id===m.current);let pos=m.position+(m.playing?(now-m.at)/1000:0);
 switch(b.command){
 case 'play': {const song=m.tracks.find(s=>s.id===(b.track||m.current))||(!b.track?m.tracks[0]:undefined);if(!song)throw Error('请先添加一首可播放的歌曲。');if(song.id!==m.current||b.restart)pos=0;m.current=song.id;m.playing=true;break;}
 case 'pause':m.playing=false;break;
 case 'seek':if(!current||!Number.isFinite(b.position))throw Error('播放进度无效。');pos=Math.max(0,Math.min(current.duration,Number(b.position)));break;
 case 'next':{if(!m.tracks.length)throw Error('歌单还是空的，先添加歌曲吧。');const others=m.tracks.filter(s=>s.id!==m.current);m.current=m.shuffle&&others.length?others[Math.floor(Math.random()*others.length)].id:m.tracks[(m.tracks.findIndex(s=>s.id===m.current)+1)%m.tracks.length].id;pos=0;m.playing=true;break;}
 case 'shuffle':m.shuffle=!!b.enabled;if(m.shuffle)m.repeatOne=false;break;
 case 'repeat':m.repeatOne=!!b.enabled;if(m.repeatOne)m.shuffle=false;break;
 case 'remove':m.tracks=m.tracks.filter(s=>s.id!==b.track);if(m.current===b.track){m.current=m.tracks[0]?.id||'';pos=0;if(!m.current)m.playing=false;}break;
 default:throw Error('不支持的音乐操作。');
 }m.position=pos;m.at=now;m.revision++;
}
