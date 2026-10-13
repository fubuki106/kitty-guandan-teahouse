'use client';
import {Check,PawPrint,X} from 'lucide-react';
import type {CSSProperties} from 'react';
import {TABLE_THEMES,type TableTheme} from '../lib/table-style';
export default function ThemePicker({current,busy,onChoose,onClose}:{current:string;busy:boolean;onChoose:(theme:TableTheme)=>void;onClose:()=>void}){
 return <div className="modal-backdrop" onClick={onClose}><section className="modal theme-modal" role="dialog" aria-modal="true" aria-label="更换全桌主题" onClick={e=>e.stopPropagation()}><button className="close" onClick={onClose} aria-label="关闭主题选择"><X size={20}/></button><span className="eyebrow">A TABLE FOR EVERY MOOD</span><h2>今晚，坐进哪种心情？</h2><p>入座的喵友都可以换。选好后，全桌一起焕新。</p><div className="theme-options">{TABLE_THEMES.map(t=><button key={t.id} className={current===t.id?'theme-selected':''} aria-pressed={current===t.id} disabled={busy} onClick={()=>onChoose(t.id)} style={{'--swatch':t.color,'--swatch-accent':t.accent} as CSSProperties}><span className="theme-swatch"><PawPrint/><i>{t.symbol}</i>{current===t.id&&<Check/>}</span><strong>{t.name}</strong><small>{t.note}</small></button>)}</div><p className="theme-note">主题只改变牌桌外观，牌面颜色和规则保持一致。</p></section></div>;
}
