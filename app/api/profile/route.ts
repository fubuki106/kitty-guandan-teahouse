import {env} from 'cloudflare:workers';
import {nickname,avatar} from '../../../lib/lounge';
const reply=(v:unknown,status=200)=>Response.json(v,{status,headers:{'Cache-Control':'no-store'}});
function token(req:Request){const t=req.headers.get('x-player-token')||'';if(!/^[a-f0-9-]{36}$/.test(t))throw Error('请刷新网页后重试。');return t;}
export async function GET(req:Request){try{const p=await env.DB!.prepare('SELECT name,avatar FROM profiles WHERE token=?').bind(token(req)).first();return reply(p||{});}catch{return reply({error:'资料暂时无法读取'},400);}}
export async function POST(req:Request){try{if(req.headers.get('origin')&&new URL(req.headers.get('origin')!).host!==new URL(req.url).host)return reply({error:'来源不正确'},403);const t=token(req),raw=await req.text();if(raw.length>70000)return reply({error:'头像过大'},413);const b=JSON.parse(raw),n=nickname(b.name),a=avatar(b.avatar);await env.DB!.prepare('INSERT INTO profiles(token,name,avatar,updated) VALUES(?,?,?,?) ON CONFLICT(token) DO UPDATE SET name=excluded.name,avatar=excluded.avatar,updated=excluded.updated').bind(t,n,a,Date.now()).run();return reply({name:n,avatar:a});}catch(e){return reply({error:(e as Error).message},400);}}
