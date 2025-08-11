const express = require('express');
const http = require('http');
const cors = require('cors');
const mongoose = require('mongoose');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

console.log('[DEBUG] 서버 코드 로딩 시작');

// DB 연결
const mongoURI = 'mongodb+srv://Juwon:YJSqhdks@jwcluster0.kqx5tvg.mongodb.net/?retryWrites=true&w=majority&appName=JWCluster0';
console.log('[DEBUG] MongoDB 연결 문자열:', mongoURI);
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('[DEBUG] MongoDB 연결 성공'))
  .catch(err => console.error('[ERROR] MongoDB 연결 실패:', err));

// DB 스키마
const linkSchema = new mongoose.Schema({
  user: String,
  link: String,
  timestamp: { type: Date, default: Date.now },
});
const Link = mongoose.model('Link', linkSchema);

// CORS 상세 로그
const corsOptions = {
  origin: 'https://imjw25.github.io', // 반드시 소문자, 슬래시 없음
  credentials: true,
  optionsSuccessStatus: 200,
};
console.log('[DEBUG] CORS 옵션:', corsOptions);
app.use((req, res, next) => {
  console.log(`[DEBUG] ${req.method} ${req.url} - Origin:`, req.headers.origin);
  next();
});
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(express.json());

// 루트 응답
app.get('/', (req, res) => {
  console.log('[DEBUG] GET / 루트 도착');
  res.send('백엔드 서버 작동 중');
});

// 모든 링크 조회
app.get('/api/messages', async (req, res) => {
  console.log('[DEBUG] GET /api/messages 호출');
  try {
    const links = await Link.find().sort({ timestamp: 1 });
    console.log('[DEBUG] DB 조회 성공, links:', links);
    res.json(links);
  } catch (err) {
    console.error('[ERROR] DB 조회 실패:', err);
    res.status(500).json({ error: 'DB 조회 실패' });
  }
});

// 새 링크 등록
app.post('/api/messages', async (req, res) => {
  console.log('[DEBUG] POST /api/messages 호출, Body:', req.body);
  try {
    const { user, link } = req.body;
    if (!user || !link) {
      console.warn('[WARN] user 또는 link 누락');
      return res.status(400).json({ error: 'user와 link 필요' });
    }
    const newLink = new Link({ user, link });
    await newLink.save();
    console.log('[DEBUG] 새 링크 저장 성공:', newLink);
    io.emit('new-link', newLink);
    res.status(201).json(newLink);
  } catch (err) {
    console.error('[ERROR] 링크 저장 실패:', err);
    res.status(500).json({ error: '링크 저장 실패' });
  }
});

// 웹소켓 로그
io.on('connection', (socket) => {
  console.log(`[DEBUG] 소켓 연결! id:${socket.id}`);
  socket.on('disconnect', () => {
    console.log(`[DEBUG] 소켓 연결 해제: id:${socket.id}`);
  });
});

// 서버 실행
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`[DEBUG] 서버 실행 중: http://localhost:${PORT}`);
});
