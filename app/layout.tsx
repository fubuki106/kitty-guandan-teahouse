import type { Metadata } from 'next';
import './globals.css';
import './table-experience.css';
import './focus-table.css';
import './hand-table.css';
import './classic-cards.css';
export const metadata: Metadata = { title: '喵友茶馆 · 和朋友一起掼蛋', description: '茶沏好了，就等你来出牌。好友联机掼蛋、分享房间、猫咪机器人补位。', icons: {icon:'/favicon.svg'} };
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="zh-CN"><body>{children}</body></html>}
