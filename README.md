# 喵友茶馆 · Kitty Guandan Teahouse

奶油小猫主题的四人联机掼蛋网站，支持好友房、机器人补位、共享音乐、头像昵称保存和手机横屏牌桌。

现有在线网站：https://kitty-guandan-teahouse.earlykoala4.chatgpt.site/

本仓库是独立部署用的源码副本，包含最新的炸弹优先理牌、三连对／钢板六张同列修复。原网站继续运行；新部署会有自己的网址和独立数据库。

## 给接手部署的朋友

先看 [DEPLOY.md](DEPLOY.md)。这是 **React + Vinext + Cloudflare Workers + D1 + R2** 全栈应用，需要服务器接口和数据库。GitHub 仓库用于保存代码；GitHub Pages 无法直接运行这个联机后端。

- `app/`：页面、样式及房间／音乐／资料 API
- `lib/guandan.ts`、`lib/room.ts`：牌型规则、机器人与房间逻辑
- `lib/hand-layout.ts`、`components/grouped-hand.tsx`：排序与手牌显示
- `public/music/`：内置歌单音频与封面；`lib/music-library.ts`：歌单索引
- `public/`：卡牌、头像、语音等静态资源
- `drizzle/`：房间与个人资料表的建表迁移
- `deploy/`、`scripts/prepare-cloudflare.mjs`：独立 Cloudflare 部署配置
- `tests/`：手牌排序与六张组合完整显示的回归检查

## 本地开发

需要 Node.js 22.13 或以上版本，以及 npm。

```sh
npm ci
npm run build
```

首次运行初始化本地数据库（仅影响本机）：

```sh
npx wrangler d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_special_butterfly.sql
npx wrangler d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0001_grey_meggan.sql
npm run dev
```

打开终端打印的本地地址。已初始化的数据库不要重复执行上述建表 SQL。也可 `npm start` 预览构建产物。

```sh
npm run test:hand
npx tsc --noEmit
```

## 交接范围

包含源码、锁定依赖、现有静态音频／图片和数据库结构。原站在线房间、玩家资料、上传的运行时文件及登录凭据不包含在仓库中。新站首次打开需重新设置昵称头像、创建房间。上传到 R2 的新歌曲不会自动同步到源码仓库。

保留 `vendor/` 及 `build/` 中原有第三方许可文件。替换或增删歌曲时，同时维护 `lib/music-library.ts` 的路径、大小和时长。
