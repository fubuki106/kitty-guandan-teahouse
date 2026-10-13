# 将喵友茶馆部署到自己的 Cloudflare

本指南对应当前锁定的 Vinext / Wrangler 版本。使用 Cloudflare Workers（服务器与静态文件）、D1（房间／资料）和 R2（新上传音乐）。准备好自己的 Cloudflare 账号，账号需可创建 R2 bucket。

## 1. 下载仓库和安装依赖

从 GitHub 克隆仓库，或下载 ZIP 后解压。进入包含 package.json 的目录，安装 Node.js >= 22.13，然后运行：

```sh
npm ci
npx wrangler login
```

登录的是你准备托管网站的 Cloudflare 账号。

## 2. 创建独立的数据资源

```sh
npx wrangler d1 create kitty-guandan-db
npx wrangler r2 bucket create kitty-guandan-uploads
```

记录第一条命令返回的 `database_id`。若名字已被使用，可换名字，并在下一步保持一致。

复制 `deploy/cloudflare.example.json` 为 `deploy/cloudflare.json`。填入真实的 database_id；如账号下有多个账户，也填 account_id。name 是新网站的 Worker 名，database_name 和 bucket_name 对应刚才创建的资源。这个本机配置文件已加入 .gitignore。

## 3. 构建、初始化数据库、上线

```sh
npm run build
npm run cf:prepare
npm run cf:migrate
npm run cf:deploy
```

`cf:prepare` 为这次构建写入你自己的 D1/R2 绑定；没有真实 database_id 会直接报错，防止使用本地占位值。

`cf:migrate` 会把 `drizzle/` 中尚未应用的迁移应用到你配置的远端数据库，出现提示时确认。`cf:deploy` 将网站发布到该 Cloudflare 账号。部署成功后，Wrangler 会打印可分享的 workers.dev 网址。

每次 `npm run build` 后都要重新执行 `npm run cf:prepare`，再部署。后续更新沿用同一个数据库和 bucket；不要为普通代码更新重新创建资源。

## 4. 验收

1. 打开新网址，创建好友房，用另一个浏览器加入。
2. 更换座位、开始游戏，确认缺席位置由机器人补齐。
3. 点一键理牌：炸弹靠前；三连对、钢板六张同列；再次点击恢复点数排序。
4. 保存昵称头像，刷新后核对资料。
5. 两位玩家各点一次加入听歌，确认共享播放、暂停、随机与单曲循环；浏览器首次播放仍需要用户点击。
6. 如需自定义域名，在 Cloudflare Worker 的 Settings → Domains & Routes 中添加。

## 数据和故障排查

- 新网址不会继承原 Sites 网站的在线房间、资料或 R2 上传文件。仓库内置的音乐和封面会随静态资源一起部署。
- 房间创建／资料接口报数据库错误：确认已执行远端迁移，绑定名严格为 DB。
- 音乐上传失败：确认 bucket 已创建且绑定名为 BUCKET；单首上限 25 MB，需标准可播放音频。
- 只显示静态页面或 API 404：请按本指南部署 Workers，不能只把 public 文件夹放到静态托管。
- 不要把账户登录令牌或 API 密钥写进源码。Wrangler 使用正常登录；若日后配置 CI，把令牌放到 CI 的 secrets 设置。

参考：[Wrangler 配置](https://developers.cloudflare.com/workers/wrangler/configuration/)、[D1 命令](https://developers.cloudflare.com/d1/wrangler-commands/)、[R2 创建存储桶](https://developers.cloudflare.com/r2/buckets/create-buckets/)。
