'use client';
import {useEffect,useRef,type PointerEvent as ReactPointerEvent,type MouseEvent as ReactMouseEvent} from 'react';
type Gesture={pointer:number;root:HTMLElement;start:string[];next:Set<string>;visited:Set<string>;select:boolean;x:number;y:number;frame:number};
export default function useCardSwipe(selected:string[],onChange:(ids:string[])=>void,handKey:string){
 const active=useRef<Gesture|null>(null),suppressClick=useRef(false),latest=useRef(onChange);latest.current=onChange;
 function finish(restore=false){const g=active.current;if(!g)return;active.current=null;cancelAnimationFrame(g.frame);if(restore)latest.current(g.start);if(g.root.hasPointerCapture(g.pointer))g.root.releasePointerCapture(g.pointer);}
 useEffect(()=>{finish();},[handKey]);
 useEffect(()=>()=>finish(),[]);
 function paint(g:Gesture,x:number,y:number){const card=document.elementFromPoint(x,y)?.closest<HTMLElement>('[data-card-id]');const id=card?.dataset.cardId;if(!id||!g.root.contains(card)||g.visited.has(id))return;g.visited.add(id);if(g.select)g.next.add(id);else g.next.delete(id);latest.current([...g.next]);}
 function autoPan(){const g=active.current;if(!g)return;const scroller=g.root.querySelector<HTMLElement>('.grouped-hand,.hand-cards');if(scroller){const rect=scroller.getBoundingClientRect(),rotated=!!scroller.closest('.rotated-focus'),axis=rotated?g.y:g.x,start=rotated?rect.top:rect.left,end=rotated?rect.bottom:rect.right;const cross=rotated?g.x:g.y,crossStart=rotated?rect.left:rect.top,crossEnd=rotated?rect.right:rect.bottom;
  if(cross>=crossStart&&cross<=crossEnd&&axis>=start-15&&axis<=end+15){const direction=axis<start+24?-1:axis>end-24?1:0;if(direction){scroller.scrollLeft+=direction*6;paint(g,g.x,g.y);}}
 if(scroller.classList.contains('hand-cards')){const localY=rotated?rect.right-g.x:g.y-rect.top,logicalHeight=rotated?rect.width:rect.height;if(axis>=start&&axis<=end&&localY>=-15&&localY<=logicalHeight+15){const vertical=localY<16?-1:localY>logicalHeight-16?1:0;if(vertical){scroller.scrollTop+=vertical*5;paint(g,g.x,g.y);}}}
 }g.frame=requestAnimationFrame(autoPan);}
 return {
  onPointerDown(e:ReactPointerEvent<HTMLDivElement>){if(active.current||!e.isPrimary||e.button!==0)return;suppressClick.current=false;const card=(e.target as Element).closest<HTMLElement>('[data-card-id]');const id=card?.dataset.cardId;if(!id)return;suppressClick.current=true;const g:Gesture={pointer:e.pointerId,root:e.currentTarget,start:[...selected],next:new Set(selected),visited:new Set(),select:!selected.includes(id),x:e.clientX,y:e.clientY,frame:0};active.current=g;e.currentTarget.setPointerCapture(e.pointerId);paint(g,e.clientX,e.clientY);g.frame=requestAnimationFrame(autoPan);},
  onPointerMove(e:ReactPointerEvent<HTMLDivElement>){const g=active.current;if(!g||g.pointer!==e.pointerId)return;e.preventDefault();const dx=e.clientX-g.x,dy=e.clientY-g.y,steps=Math.max(1,Math.ceil(Math.hypot(dx,dy)/4));for(let i=1;i<=steps;i++)paint(g,g.x+dx*i/steps,g.y+dy*i/steps);g.x=e.clientX;g.y=e.clientY;},
  onPointerUp(e:ReactPointerEvent<HTMLDivElement>){if(active.current?.pointer===e.pointerId)finish();},
  onPointerCancel(e:ReactPointerEvent<HTMLDivElement>){if(active.current?.pointer===e.pointerId)finish(true);},
  onLostPointerCapture(){finish();},
  onClickCapture(e:ReactMouseEvent<HTMLDivElement>){if(e.detail>0&&suppressClick.current){suppressClick.current=false;e.preventDefault();e.stopPropagation();}},
 };
}
