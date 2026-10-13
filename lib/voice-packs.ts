export const VOICE_PACKS = [
 {id:'playful',name:'元气搭子',tag:'俏皮女声',description:'轻快一点，快乐加倍。',icon:'✿'},
 {id:'comic',name:'戏精喵友',tag:'搞怪男声',description:'牌要打好，气氛也要到。',icon:'✦'},
 {id:'classic',name:'温柔茶友',tag:'清甜女声',description:'熟悉的声音，慢慢陪你玩。',icon:'♡'},
] as const;
export type VoiceStyle = typeof VOICE_PACKS[number]['id'];
export const DEFAULT_VOICE:VoiceStyle='playful';
export function voiceStyle(value:unknown):VoiceStyle{return VOICE_PACKS.some(p=>p.id===value)?value as VoiceStyle:DEFAULT_VOICE;}
export function voicePath(key:string,style:VoiceStyle):string|null{
 if(!/^(?:(?:single|pair)-(?:[2-9]|1[0-6])|(?:triple|fullHouse)-(?:[2-9]|1[0-4])|bomb-(?:[4-9]|10)(?:-(?:[2-9]|1[0-4]))?|straight|pairs|triples|straightFlush|jokerBomb|pass(?:-[23])?|deal|win|turn)$/.test(key))return null;
 // Old room events may still contain the previous bomb key during an update.
 const pack=/^bomb-(?:[4-9]|10)$/.test(key)?'classic':voiceStyle(style);
 if(pack==='classic'&&/^pass-[23]$/.test(key))key='pass';
 return `/voice/${pack==='classic'?'':`${pack}/`}${key}.mp3`;
}
