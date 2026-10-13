'use client';
import {useEffect,useRef,useState} from 'react';
export default function useTableFocus(inRoom:boolean){
 const [focus,setFocus]=useState(false),[screenSize,setScreenSize]=useState({mobile:false,portrait:false,short:false});
 const requested=useRef(false),ownedFullscreen=useRef(false);
 function release(){requested.current=false;try{screen.orientation?.unlock();}catch{}if(ownedFullscreen.current){ownedFullscreen.current=false;if(document.fullscreenElement)void document.exitFullscreen().catch(()=>{});}}
 useEffect(()=>{const resize=()=>setScreenSize({mobile:Math.min(innerWidth,innerHeight)<=600&&Math.max(innerWidth,innerHeight)<=1100,portrait:innerHeight>innerWidth,short:Math.min(innerWidth,innerHeight)<=350});resize();window.addEventListener('resize',resize);return()=>window.removeEventListener('resize',resize);},[]);
 useEffect(()=>{if(!inRoom){setFocus(false);release();}},[inRoom]);
 useEffect(()=>{if(!focus||!screenSize.mobile)return;const previous=document.body.style.overflow;document.body.style.overflow='hidden';return()=>{document.body.style.overflow=previous;};},[focus,screenSize.mobile]);
 useEffect(()=>{const changed=()=>{if(ownedFullscreen.current&&!document.fullscreenElement){ownedFullscreen.current=false;requested.current=false;setFocus(false);try{screen.orientation?.unlock();}catch{}}};const key=(e:KeyboardEvent)=>{if(e.key==='Escape'){setFocus(false);release();}};document.addEventListener('fullscreenchange',changed);document.addEventListener('keydown',key);return()=>{document.removeEventListener('fullscreenchange',changed);document.removeEventListener('keydown',key);release();};},[]);
 async function toggleFocus(){if(focus){setFocus(false);release();return;}setFocus(true);requested.current=true;
  if(screenSize.mobile&&matchMedia('(pointer:coarse)').matches&&document.documentElement.requestFullscreen){
   try{await document.documentElement.requestFullscreen();ownedFullscreen.current=true;if(!requested.current){release();return;}await (screen.orientation as ScreenOrientation&{lock?:(mode:string)=>Promise<void>}).lock?.('landscape');if(!requested.current)release();}catch{/* The rotated layout works even when fullscreen or orientation lock is unavailable. */}
  }
 }
 return {focus,toggleFocus,shortFocus:focus&&screenSize.mobile&&screenSize.short,mobileFocus:focus&&screenSize.mobile,rotatedFocus:focus&&screenSize.mobile&&screenSize.portrait};
}
