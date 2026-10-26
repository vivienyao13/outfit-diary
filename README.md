# 👗 穿搭日记

一个私人穿搭记录小程序：拍照上传、打标签、按季节/颜色/风格筛选，数据全部存在自己的数据库里，隐私安全。

原作者：薇薇 & thir 🍀 | 开源分享，随便用～

---

## 📋 你需要准备什么

| 物品 | 说明 |
|------|------|
| 一台电脑 | Windows / Mac / Linux 都行，需要 **一直开机** 才能随时记录（也可以用云服务器） |
| Node.js | 运行环境（下面会教安装，10 分钟） |
| PostgreSQL | 数据库（下面会教安装，10 分钟） |

> ⚠️ 如果电脑关机，程序就访问不了（数据不会丢，开机重启就好）。

---

## 第 1 步：安装 Node.js

1. 打开官网：https://nodejs.org/zh-cn
2. 下载 **LTS（长期支持版）**
3. 双击安装，一路点「下一步」即可（全部默认）
4. 验证：打开命令行（Windows 按 `Win + R` 输入 `cmd` 回车；Mac 打开「终端」），输入：
   ```bash
   node -v
   ```
   显示版本号（如 `v22.x.x`）就成功了 ✅

## 第 2 步：安装 PostgreSQL

1. 打开官网：https://www.postgresql.org/download/
2. 选择你的系统（Windows / macOS），下载安装包
3. 安装时注意记住两个东西：
   - **超级用户密码**（安装过程中会让你设置，比如 `123456`，自己记好）
   - **端口**（默认 5432，不用改）
4. 一路默认安装完成即可

> Mac 用户也可以用 Homebrew：`brew install postgresql@16`

## 第 3 步：创建数据库

打开命令行，依次执行（把密码换成你第 2 步设置的）：

```bash
# Windows 如果找不到 psql，先执行：
# set PATH=%PATH%;"C:\Program Files\PostgreSQL\16\bin"
# Mac 用：export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH"

psql -U postgres -h localhost
```

进入 PostgreSQL 命令行后（提示符变成 `postgres=#`）执行：

```sql
CREATE DATABASE outfit_diary;
\q
```

> 💡 数据表不用手动建，程序第一次启动时会自动创建。

## 第 4 步：配置程序

1. 解压本压缩包，得到一个文件夹 `outfit-diary`
2. 把 `.env.example` 文件复制一份，重命名为 `.env`（注意前面有个点）
3. 用记事本/文本编辑器打开 `.env`，填入你的数据库信息：

```
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=你第2步设置的密码
DB_NAME=outfit_diary
PORT=3000
```

保存关闭。

## 第 5 步：启动 🚀

在命令行中进入程序文件夹（Windows 资源管理器地址栏输入 `cmd` 可以快速打开；Mac 在文件夹上右键→服务→新建位于文件夹位置的终端窗口）：

```bash
# 第一次运行先安装依赖（以后不用）
npm install

# 启动
npm start
```

看到下面的输出就是成功了：

```
✅ 穿搭日记表初始化完成
🚀 穿搭日记服务已启动
📱 打开浏览器访问: http://localhost:3000/outfit.html
```

在浏览器打开 **http://localhost:3000/outfit.html** 就能开始记录穿搭啦～

---

## 📱 手机怎么访问？

手机和电脑连 **同一个 Wi-Fi**：

1. 电脑上查 IP 地址：
   - Windows：命令行输入 `ipconfig`，找「IPv4 地址」（如 `192.168.1.23`）
   - Mac：系统设置 → Wi-Fi → 详细信息 → TCP/IP → IP 地址
2. 手机浏览器访问：`http://192.168.1.23:3000/outfit.html`（换成你的 IP）
3. iPhone 可以「分享 → 添加到主屏幕」，像 App 一样用

---

## 🌐 想在外面也能访问？（进阶，可选）

两种常见方式：

1. **Cloudflare Tunnel（免费）**：https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/ ，可以得到一个 `https://xxx.pages.dev` 或自己的域名地址，不用公网 IP
2. **内网穿透**：花生壳、frp 等国内工具

需要的话可以让推荐人（薇薇）找我（thir）要详细教程～

---

## 🔄 开机自动启动（进阶，可选）

不想让每次开机都手动 `npm start`：

```bash
npm install -g pm2
pm2 start server.js --name outfit-diary
pm2 save
pm2 startup    # 按提示执行它打印的命令
```

以后开机自动运行，崩溃自动重启 ✅

---

## ❓ 常见问题

**Q: 手机打不开页面？**
- 检查手机和电脑是不是同一个 Wi-Fi
- 检查 Windows 防火墙是不是拦了 3000 端口（控制面板 → Windows Defender 防火墙 → 高级设置 → 入站规则 → 新建规则 → 端口 → TCP 3000 → 允许）

**Q: 提示「数据库连接失败」？**
- 检查 `.env` 里的密码对不对
- 检查 PostgreSQL 服务有没有启动（Windows：服务管理器里找 `postgresql` 服务；Mac：`brew services start postgresql@16`）

**Q: 端口 3000 被占用？**
- 改 `.env` 里的 `PORT=3005`，访问地址也改成 `http://localhost:3005/outfit.html`

**Q: 照片存在哪里？**
- 数据库里存路径，照片文件存在程序文件夹的 `uploads/outfits/` 目录里。**备份 = 复制整个文件夹 + 数据库**

---

## 📁 文件说明

```
outfit-diary/
├── outfit.html      ← 前端页面（浏览器打开的那个）
├── server.js        ← 后端服务
├── package.json     ← 依赖清单
├── .env.example     ← 配置模板（复制为 .env 后填真实值）
├── .env             ← 你的真实配置（不要发给别人！）
├── uploads/         ← 照片自动存这里（启动后生成）
└── README.md        ← 本文件
```

有问题随时找推荐人问我 🍀
