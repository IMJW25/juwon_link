// index.js
const express = require('express');
const http = require('http');
const cors = require('cors');
const mongoose = require('mongoose');
const { Server } = require('socket.io');

// [DEBUG] 서버 코드 시작
console.log('[DEBUG] 서버 코드 실행 시작!');

// 1. DB 연결문자열
const mongoURI = 'mongodb+srv://Juwon:YJSqhdks@jwcluster0.kqx5tvg.mongodb.net/?retryWrites=true&w=majority&appName=JWCluster0';
console.log('[DEBUG] MongoDB 연결 URI:', mongoURI);

mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('[DEBUG] MongoDB 연결 성공'))
  .catch(err => console.error('[ERROR] MongoDB 연결 실패:', err));

// 2. DB 스키마 선언
const linkSchema = new mongoose.Schema({
  user: String,
  link: String,
  timestamp: { type: Date, default: Date.now }
});
const Link = mongoose.model('Link', linkSchema);

// 3. 서버/소켓 설정
const app = express();
const server = http.createServer(app);
const io = new Server(server, { 
  cors: { origin: '*' } // socket.io는 프론트에서 직접 문제가 날 경우만 개선
});

// 4. CORS 최상단에 명확하게!
const corsOptions = {
  origin: 'https://imjw25.github.io/juwon_link_sharing/',   // 반드시 소문자, 슬래시/경로 없이!
  credentials: true,
  optionsSuccessStatus: 200
};
console.log('[DEBUG] CORS 옵션:', corsOptions);
app.use((req, res, next) => {
  // 요청마다 찍기
  console.log(`[DEBUG] ${req.method} ${req.url}, Origin: ${req.headers.origin}`);
  next();
});
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // preflight도 허용

app.use(express.json());

// 5. 루트 안내 라우트(유저에게 안내)
app.get('/', (req, res) => {
  console.log('[DEBUG] GET / (루트) 요청');
  res.send('백엔드 서버 정상 작동 중! (juwon-link-backend)');
});

// 6. GET: 모든 링크 조회
app.get('/api/messages', async (req, res) => {
  console.log('[DEBUG] GET /api/messages 호출');
  try {
    const links = await Link.find().sort({ timestamp: 1 });
    console.log('[DEBUG] DB links 조회 성공:', links);
    res.json(links);
  } catch (err) {
    console.error('[ERROR] DB 조회 실패:', err);
    res.status(500).json({ error: 'DB 조회 실패' });
  }
});

// 7. POST: 새 링크 등록/브로드캐스트
app.post('/api/messages', async (req, res) => {
  console.log('[DEBUG] POST /api/messages', req.body);
  try {
    const { user, link } = req.body;
    if (!user || !link) {
      console.warn('[WARN] user/link 누락:', req.body);
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

// 8. 소켓 연결 로그
io.on('connection', (socket) => {
  console.log('[DEBUG] 소켓 연결! ID:', socket.id);
  socket.on('disconnect', () => {
    console.log('[DEBUG] 소켓 연결 끊김! ID:', socket.id);
  });
});

// 9. 서버 실행
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`[DEBUG] 서버 실행 완료: http://localhost:${PORT}`);
});
