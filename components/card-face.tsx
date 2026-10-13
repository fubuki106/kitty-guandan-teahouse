import {rankLabel,type Card} from '../lib/guandan';
import type {ReactNode} from 'react';
const positions:Record<number,number[][]>={2:[[35,29],[35,71]],3:[[35,29],[35,50],[35,71]],4:[[24,29],[46,29],[24,71],[46,71]],5:[[24,29],[46,29],[35,50],[24,71],[46,71]],6:[[24,29],[46,29],[24,50],[46,50],[24,71],[46,71]],7:[[24,29],[46,29],[35,39],[24,50],[46,50],[24,71],[46,71]],8:[[24,29],[46,29],[35,39],[24,50],[46,50],[35,61],[24,71],[46,71]],9:[[24,27],[46,27],[24,42],[46,42],[35,50],[24,58],[46,58],[24,73],[46,73]],10:[[24,27],[46,27],[35,35],[24,42],[46,42],[24,58],[46,58],[35,65],[24,73],[46,73]]};
export default function CardFace({card,wild,cat}:{card:Card;wild:boolean;cat:ReactNode}){
 const suit=({S:'♠',H:'♥',D:'♦',C:'♣',J:'✦'})[card.s],rank=rankLabel(card.r),joker=card.r>14;
 const corner=<><text x="9" y="15" fontSize={joker?7:14} fontWeight="700" textAnchor="middle">{rank}</text><text x="9" y="27" fontSize="12" textAnchor="middle">{suit}</text></>;
 return <svg className="card-face" viewBox="0 0 70 100" aria-hidden="true" preserveAspectRatio="xMidYMid meet">
  {corner}<g transform="rotate(180 35 50)">{corner}</g>
  {joker?<svg x="12" y="25" width="46" height="50" viewBox="0 0 180 180">{cat}</svg>:card.r===14?<text x="35" y="62" textAnchor="middle" fontSize="36">{suit}</text>:card.r>10?<><rect x="19" y="29" width="32" height="42" rx="4" fill="none" stroke="currentColor" strokeWidth=".6" opacity=".35"/><text x="35" y="55" fontSize="26" fontWeight="700" textAnchor="middle">{rank}</text><text x="35" y="67" fontSize="13" textAnchor="middle">{suit}</text></>:positions[card.r]?.map(([x,y],i)=><text key={i} x={x} y={y+5} fontSize="16" textAnchor="middle" transform={y>50?`rotate(180 ${x} ${y})`:undefined}>{suit}</text>)}
  {wild&&<><rect x="18" y="81" width="34" height="10" rx="3" fill="#ae822c"/><text x="35" y="88" fontSize="6.5" textAnchor="middle" fill="#fff9df" fontFamily="sans-serif">逢人配</text></>}
 </svg>;
}
