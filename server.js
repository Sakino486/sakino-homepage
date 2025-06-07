const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;
const API_KEY = 'sakino123'; // 必须与前端一致

// 确保上传目录存在
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 配置 multer 处理文件上传
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname),
});
const upload = multer({ storage });

// 启用 CORS 和 JSON 解析
app.use(cors());
app.use(express.json());

// 静态文件服务（用于访问上传的图片/视频）
app.use('/uploads', express.static(uploadDir));

// 模拟数据库（实际项目建议用数据库）
let posts = [];

// 获取所有内容
app.get('/posts', (req, res) => {
  res.json(posts);
});

// 发布新内容（需要 API_KEY 验证）
app.post('/posts', upload.array('media'), (req, res) => {
  if (req.headers.authorization !== `Bearer ${API_KEY}`) {
    return res.status(401).json({ error: '未授权' });
  }

  const { content, background, nickname, avatar } = req.body;
  const mediaFiles = req.files?.map(file => ({
    filename: file.filename,
    type: file.mimetype.startsWith('image') ? 'image' : 'video',
    mimetype: file.mimetype,
  }));

  const newPost = {
    id: Date.now(),
    type: 'shuoshuo',
    content,
    background,
    nickname,
    avatar,
    time: new Date().toLocaleString(),
    media: mediaFiles || [],
  };

  posts.unshift(newPost); // 添加到数组开头
  res.status(201).json(newPost);
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});
