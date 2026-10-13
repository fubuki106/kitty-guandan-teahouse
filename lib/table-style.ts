export const TABLE_THEMES=[
 {id:'cream',name:'奶油茶馆',note:'暖木、奶油与一杯热茶',color:'#dce5cd',accent:'#71845e',symbol:'☀'},
 {id:'sakura',name:'樱花午后',note:'花瓣落在猫咪的午睡里',color:'#eed5df',accent:'#ac6e85',symbol:'✿'},
 {id:'ocean',name:'海盐薄荷',note:'海风很轻，好牌刚好',color:'#cbe3df',accent:'#4e8980',symbol:'≈'},
 {id:'midnight',name:'月夜星空',note:'与小猫一起，把星星点亮',color:'#283c56',accent:'#b9cbee',symbol:'☾'},
] as const;
export type TableTheme=typeof TABLE_THEMES[number]['id'];
export function tableTheme(value:unknown):TableTheme{if(!TABLE_THEMES.some(t=>t.id===value))throw Error('请选择茶馆提供的牌桌主题。');return value as TableTheme;}
export const CAT_AVATARS=[
 {id:'cream',name:'奶盖',color:'#ecc499',patch:'#c59162',bg:'#f4e6cd',mood:'blink'},
 {id:'matcha',name:'抹茶',color:'#cbd7b7',patch:'#98af87',bg:'#e6ebdb',mood:'sway'},
 {id:'peach',name:'桃桃',color:'#efc3c4',patch:'#cf959e',bg:'#f6e0e2',mood:'wink'},
 {id:'cloud',name:'云朵',color:'#eee9e1',patch:'#c9c1b7',bg:'#e3ebed',mood:'blink'},
 {id:'lilac',name:'芋圆',color:'#d6c8e4',patch:'#aa94c1',bg:'#eae3f0',mood:'sway'},
 {id:'tuxedo',name:'芝麻',color:'#676d7a',patch:'#f4eee1',bg:'#dee3e6',mood:'wink'},
] as const;
export const isCatAvatar=(value:unknown)=>typeof value==='string'&&CAT_AVATARS.some(c=>'cat:'+c.id===value);
