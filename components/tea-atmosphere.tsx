'use client';
import {useEffect,useRef,useState,type CSSProperties} from 'react';
import {PawPrint,Sparkles} from 'lucide-react';
import {TeaAudio,DEFAULT_AUDIO,type MusicSettings,type SoundKind} from '../lib/ambience';
import SharedMusic from './shared-music';
import {voiceStyle} from '../lib/voice-packs';
export type TableEvent={id:number;kind:SoundKind;label:string;seat:number;at:number;voice?:string};
const effectWords:Record<string,[string,string]>={bomb:['猫爪炸弹','PAW! A LITTLE MAGIC'],straightFlush:['同花绽放','FIVE CARDS, ONE LITTLE WONDER'],jokerBomb:['猫王驾到','THE ROYAL MEOW'],win:['好牌，好搭档','A LOVELY LITTLE VICTORY'],deal:['好戏开场','LET THE GOOD TIMES DEAL']};
export default function TeaAtmosphere({room,onRoom}:{room:any;onRoom:(r:any)=>void}){
 const [settings,setSettings]=useState<MusicSettings>(DEFAULT_AUDIO),[loaded,setLoaded]=useState(false),[effect,setEffect]=useState<TableEvent|null>(null);
 const engine=useRef<TeaAudio|null>(null),settingsRef=useRef(settings),seen=useRef({room:'',id:0,turn:''}),effectTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
 useEffect(()=>{engine.current=new TeaAudio();try{const saved=JSON.parse(localStorage.getItem('meow-audio')||'null');if(saved){const clamp=(x:unknown,f:number)=>typeof x==='number'&&Number.isFinite(x)?Math.max(0,Math.min(1,x)):f;setSettings({music:clamp(saved.music,.3),sfx:clamp(saved.sfx,.45),voice:clamp(saved.voice,.7),voiceStyle:voiceStyle(saved.voiceStyle),muted:!!saved.muted,motion:['full','soft','off'].includes(saved.motion)?saved.motion:'full'});}}catch{}setLoaded(true);const unlock=()=>{void engine.current?.unlock().catch(()=>{});};document.addEventListener('pointerdown',unlock);document.addEventListener('keydown',unlock);return()=>{document.removeEventListener('pointerdown',unlock);document.removeEventListener('keydown',unlock);engine.current?.close();if(effectTimer.current)clearTimeout(effectTimer.current);};},[]);
 useEffect(()=>{settingsRef.current=settings;engine.current?.configure(settings);if(loaded)localStorage.setItem('meow-audio',JSON.stringify(settings));},[settings,loaded]);
 const show=(event:TableEvent)=>{if(settingsRef.current.motion==='off')return;setEffect(event);if(effectTimer.current)clearTimeout(effectTimer.current);effectTimer.current=setTimeout(()=>setEffect(null),event.kind==='win'?2600:1900);};
 useEffect(()=>{if(!room){seen.current={room:'',id:0,turn:''};setEffect(null);return;}const events:TableEvent[]=room.events||[],max=events.at(-1)?.id||0;const turn=room.phase==='playing'&&room.turn===room.seat?`${room.round}:${room.deadline}`:'';
 if(seen.current.room!==room.id){seen.current={room:room.id,id:max,turn};return;}
 const incoming=events.filter(e=>e.id>seen.current.id&&Date.now()-e.at<8000);seen.current.id=max;
 if(incoming.length){const spoken=[...incoming].reverse().find(e=>e.voice&&Date.now()-e.at<4500);if(spoken)void engine.current?.announce(spoken.voice!);const special=[...incoming].reverse().find(e=>effectWords[e.kind]);if(special){show(special);engine.current?.sound(special.kind);}else engine.current?.sound(incoming.at(-1)!.kind);}
 if(turn&&turn!==seen.current.turn&&!incoming.some(e=>effectWords[e.kind]))engine.current?.sound('turn');seen.current.turn=turn;
 },[room]);
 function preview(){void engine.current?.unlock().then(()=>{engine.current?.sound('bomb');show({id:Date.now(),kind:'bomb',label:'猫爪炸弹',seat:0,at:Date.now()});}).catch(()=>{});}
 return <>
 {effect&&settings.motion!=='off'&&<div key={effect.id} className={`table-magic magic-${effect.kind} motion-${settings.motion}`} aria-hidden="true"><div className="magic-halo"/><div className="magic-ring"/>{Array.from({length:16},(_,i)=><span key={i} className="magic-particle" style={{'--angle':`${i*22.5}deg`,'--distance':`${115+(i%4)*25}px`,'--delay':`${(i%3)*.035}s`} as CSSProperties}>{i%3===0?<PawPrint/>:<Sparkles/>}</span>)}<div className="magic-medallion"><span className="magic-cat-ears"/><PawPrint size={43}/><i>✦</i></div><h2>{effectWords[effect.kind]?.[0]}</h2><p>{effectWords[effect.kind]?.[1]}</p><small>{effect.kind==='win'?'又收获了一桌好时光':effect.label}</small></div>}
<SharedMusic room={room} onRoom={onRoom} settings={settings} setSettings={setSettings} preview={preview} voicePreview={(style,key)=>{void engine.current?.unlock().then(()=>engine.current?.announce(key,style)).catch(()=>{});}}/></>;
}