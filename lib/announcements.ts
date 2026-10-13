import type {Play} from './guandan';
/** Use the declared wildcard interpretation, not the printed rank of a heart-level card. */
export function announcement(p:Play):string{
 const rank=Number(p.key.split(':')[1]);
 if(['single','pair','triple','fullHouse'].includes(p.type))return `${p.type}-${rank}`;
 if(p.type==='bomb')return `bomb-${p.size}-${rank}`;
 return p.type;
}
