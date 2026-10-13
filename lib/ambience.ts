import {DEFAULT_VOICE,voicePath,type VoiceStyle} from './voice-packs';
export type SoundKind = 'play'|'pass'|'bomb'|'straightFlush'|'jokerBomb'|'deal'|'win'|'turn';
export type MusicSettings = {music:number;sfx:number;voice?:number;voiceStyle?:VoiceStyle;muted:boolean;motion:'full'|'soft'|'off'};
export const DEFAULT_AUDIO:MusicSettings={music:0.3,sfx:0.45,voice:0.7,voiceStyle:DEFAULT_VOICE,muted:false,motion:'full'};
/** Synthesized game sounds; no background music. */
export class TeaAudio {
 context:AudioContext|null=null; musicGain:GainNode|null=null;sfxGain:GainNode|null=null;
 private timer:ReturnType<typeof setInterval>|null=null;private voices=new Set<OscillatorNode>();private settings=DEFAULT_AUDIO;
 private spoken:AudioBufferSourceNode|null=null;private spokenGain:GainNode|null=null;private speechEpoch=0;private spokenCache=new Map<string,Promise<AudioBuffer>>();
 private passTake=0;
 async unlock(){if(!this.context){const C=window.AudioContext||(window as any).webkitAudioContext;if(!C)throw Error('当前浏览器不支持游戏音频。');this.context=new C();this.musicGain=this.context!.createGain();this.sfxGain=this.context!.createGain();this.musicGain.connect(this.context!.destination);this.sfxGain.connect(this.context!.destination);this.configure(this.settings);}if(this.context!.state!=='running')await this.context!.resume();}
 configure(s:MusicSettings){this.settings=s;const t=this.context?.currentTime||0;this.musicGain?.gain.setTargetAtTime(s.muted?0:s.music,t,.04);this.sfxGain?.gain.setTargetAtTime(s.muted?0:s.sfx,t,.025);this.spokenGain?.gain.setTargetAtTime(s.muted?0:(s.voice??.7),t,.025);}
 async announce(key:string,style:VoiceStyle=this.settings.voiceStyle??DEFAULT_VOICE){
  const c=this.context;if(!c||c.state!=='running'||this.settings.muted||(this.settings.voice??.7)===0)return;
  if(key==='pass'&&style!=='classic'){const take=this.passTake++%3;key=take?`pass-${take+1}`:'pass';}
  const path=voicePath(key,style);if(!path)return;
  const epoch=++this.speechEpoch;this.spoken?.stop();this.spoken=null;
  try{let clip=this.spokenCache.get(path);if(!clip){clip=fetch(path).then(r=>{if(!r.ok)throw Error('voice unavailable');return r.arrayBuffer();}).then(b=>c.decodeAudioData(b));this.spokenCache.set(path,clip);}const buffer=await clip;if(epoch!==this.speechEpoch||c.state!=='running')return;
   this.spokenGain??=c.createGain();this.spokenGain.disconnect();this.spokenGain.connect(c.destination);this.spokenGain.gain.value=this.settings.muted?0:(this.settings.voice??.7);const source=c.createBufferSource();source.buffer=buffer;source.connect(this.spokenGain);source.onended=()=>{source.disconnect();if(this.spoken===source)this.spoken=null;};this.spoken=source;source.start();
  }catch{this.spokenCache.delete(path);}
 }
 private note(freq:number,time:number,length:number,volume:number,route:'music'|'sfx',wave:OscillatorType='sine',end?:number){const c=this.context!;const o=c.createOscillator(),g=c.createGain();o.type=wave;o.frequency.setValueAtTime(freq,time);if(end)o.frequency.exponentialRampToValueAtTime(end,time+length);g.gain.setValueAtTime(.0001,time);g.gain.exponentialRampToValueAtTime(Math.max(.0002,volume),time+.018);g.gain.exponentialRampToValueAtTime(.0001,time+length);o.connect(g);g.connect(route==='music'?this.musicGain!:this.sfxGain!);if(route==='music')this.voices.add(o);o.onended=()=>{o.disconnect();g.disconnect();this.voices.delete(o);};o.start(time);o.stop(time+length+.02);}
 stopMusic(){if(this.timer)clearInterval(this.timer);this.timer=null;for(const v of this.voices){try{v.stop();}catch{}}this.voices.clear();}
 sound(kind:SoundKind){if(!this.context||this.context.state!=='running'||this.settings.muted)return;const t=this.context.currentTime+.008;
 if(kind==='bomb'||kind==='jokerBomb'){this.note(180,t,.5,.28,'sfx','sine',45);const notes=kind==='jokerBomb'?[523,659,784,1047]:[523,659,784];notes.forEach((n,i)=>this.note(n,t+.1+i*.07,.48,.10,'sfx'));}
 else if(kind==='win') [523,659,784,1047,1319].forEach((n,i)=>this.note(n,t+i*.12,.8,.13,'sfx'));
 else if(kind==='straightFlush') [523,587,659,784,1047].forEach((n,i)=>this.note(n,t+i*.07,.4,.1,'sfx'));
 else if(kind==='deal') [392,523,659].forEach((n,i)=>this.note(n,t+i*.09,.35,.09,'sfx'));
 else if(kind==='turn'){this.note(784,t,.25,.09,'sfx');this.note(1047,t+.13,.32,.07,'sfx');}
 else if(kind==='pass')this.note(260,t,.11,.035,'sfx','sine',180);
 else this.note(580,t,.13,.09,'sfx','triangle',340);
 }
 close(){this.stopMusic();this.speechEpoch++;this.spoken?.stop();this.spoken=null;void this.context?.close();}
}

