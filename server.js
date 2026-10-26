const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// 端口：默认 3000，可用环境变量 PORT 修改
const PORT = process.env.PORT || 3000;

const app = express();

// 中间件
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// 对 HTML 文件禁止缓存，保证修改后立即生效
app.use(express.static(__dirname, {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.setHeader('Surrogate-Control', 'no-store');
    }
  }
}));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 保存 base64 图片为文件
function saveBase64Image(base64Data, filename, subdir = 'outfits') {
  const match = base64Data.match(/^data:image\/(\w+);base64,(.+)$/);
  if (!match) return null;
  const ext = match[1] === 'jpeg' ? 'jpg' : match[1];
  const dir = path.join(__dirname, 'uploads', subdir);
  fs.mkdirSync(dir, { recursive: true });
  const filepath = path.join(dir, `${filename}.${ext}`);
  fs.writeFileSync(filepath, Buffer.from(match[2], 'base64'));
  return `/uploads/${subdir}/${filename}.${ext}`;
}

// PostgreSQL 连接池（配置来自 .env / 环境变量）
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'outfit_diary'
});

// ========== 穿搭日记 API ==========

// 初始化表（首次启动自动建表）
async function initOutfitTables() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS outfits (
        id VARCHAR(64) PRIMARY KEY,
        photo TEXT NOT NULL,
        tags TEXT,
        season VARCHAR(10),
        color VARCHAR(50),
        style TEXT,
        date VARCHAR(10),
        created_at BIGINT NOT NULL,
        updated_at BIGINT NOT NULL
      )
    `);
    console.log('✅ 穿搭日记表初始化完成');
  } catch (err) {
    console.error('❌ 穿搭日记表初始化失败:', err.message);
  }
}

// 获取所有穿搭
app.get('/api/outfits', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM outfits ORDER BY date DESC, created_at DESC');
    const outfits = result.rows.map(item => {
      let tags = [];
      if (item.tags) {
        try {
          tags = JSON.parse(item.tags);
        } catch (e) {
          tags = item.tags.split(',').filter(t => t.trim());
        }
      }
      return { ...item, tags };
    });
    res.json(outfits);
  } catch (err) {
    console.error('获取穿搭失败:', err.message);
    res.status(500).json({ error: '获取穿搭失败' });
  }
});

// 获取单条穿搭
app.get('/api/outfits/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM outfits WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: '穿搭不存在' });
    }
    const outfit = result.rows[0];
    outfit.tags = outfit.tags ? JSON.parse(outfit.tags) : [];
    res.json(outfit);
  } catch (err) {
    console.error('获取穿搭失败:', err.message);
    res.status(500).json({ error: '获取穿搭失败' });
  }
});

// 新增穿搭
app.post('/api/outfits', async (req, res) => {
  try {
    let { photo, tags, season, color, style, date } = req.body;
    const now = Date.now();
    const id = 'outfit_' + now + '_' + Math.random().toString(36).substr(2, 9);

    // 如果是 base64，保存为文件
    if (photo && photo.startsWith('data:image')) {
      const savedPath = saveBase64Image(photo, id);
      if (savedPath) photo = savedPath;
    }

    const result = await pool.query(
      `INSERT INTO outfits (id, photo, tags, season, color, style, date, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [id, photo, JSON.stringify(tags || []), season || '', color || '', style || '', date || new Date().toISOString().split('T')[0], now, now]
    );

    const outfit = result.rows[0];
    outfit.tags = outfit.tags ? JSON.parse(outfit.tags) : [];
    res.json({ success: true, outfit });
  } catch (err) {
    console.error('新增穿搭失败:', err.message);
    res.status(500).json({ error: '新增穿搭失败' });
  }
});

// 修改穿搭
app.put('/api/outfits/:id', async (req, res) => {
  try {
    let { photo, tags, season, color, style, date } = req.body;
    const now = Date.now();

    // 如果是 base64，保存为文件
    if (photo && photo.startsWith('data:image')) {
      const savedPath = saveBase64Image(photo, req.params.id);
      if (savedPath) photo = savedPath;
    }

    const result = await pool.query(
      `UPDATE outfits
       SET photo = COALESCE($1, photo),
           tags = COALESCE($2, tags),
           season = COALESCE($3, season),
           color = COALESCE($4, color),
           style = COALESCE($5, style),
           date = COALESCE($6, date),
           updated_at = $7
       WHERE id = $8
       RETURNING *`,
      [photo, tags ? JSON.stringify(tags) : null, season, color, style, date, now, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '穿搭不存在' });
    }

    const outfit = result.rows[0];
    outfit.tags = outfit.tags ? JSON.parse(outfit.tags) : [];
    res.json({ success: true, outfit });
  } catch (err) {
    console.error('修改穿搭失败:', err.message);
    res.status(500).json({ error: '修改穿搭失败' });
  }
});

// 删除穿搭
app.delete('/api/outfits/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM outfits WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: '穿搭不存在' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('删除穿搭失败:', err.message);
    res.status(500).json({ error: '删除穿搭失败' });
  }
});

// 启动服务器
app.listen(PORT, '0.0.0.0', async () => {
  await initOutfitTables();
  console.log(`🚀 穿搭日记服务已启动`);
  console.log(`📱 打开浏览器访问: http://localhost:${PORT}/outfit.html`);
});
