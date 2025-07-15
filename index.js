import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import planningController from './controllers/planningController.js';
import assetsController from './controllers/assetsController.js';
import developmentController from './controllers/developmentController.js';

const app = express();
const port = process.env.PORT || 5000;

// 添加日志中间件（放在最前面）
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// // 配置 CORS，允许多个开发环境的源
// const allowedOrigins = ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'];
// const allowedOrigins = [
//   'http://localhost:3000',
//   'http://localhost:3001',
//   'http://localhost:3002',
//   'https://minigame-fullstack-web.vercel.app' // <<<<< ADD THIS LINE
// ];

// app.use(cors({
//   origin: (origin, callback) => {
//     if (!origin) return callback(null, true);

//     if (allowedOrigins.includes(origin)) {
//       callback(null, origin);git push origin main
//     } else {
//       callback(new Error('Not allowed by CORS'));
//     }
//   },
//   methods: ['GET', 'POST', 'OPTIONS'],
//   allowedHeaders: ['Content-Type', 'Authorization'],
//   credentials: true
// }));
// Remove the allowedOrigins array:
// const allowedOrigins = ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'https://minigame-fullstack-web.vercel.app'];

// app.use(cors({
//   origin: '*', // This now allows all origins
//   methods: ['GET', 'POST', 'OPTIONS'],
//   allowedHeaders: ['Content-Type', 'Authorization'],
//   credentials: true
// }));
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  'https://minigame-fullstack-web.vercel.app' // 确保这个 URL 包含在内！
];

app.use(cors({
  origin: (origin, callback) => {
    // 允许没有 origin (例如：同源请求，或者某些非浏览器/内部请求)
    if (!origin) {
      console.log('CORS: Origin is null or undefined, allowing request.');
      return callback(null, true);
    }

    // 检查请求的 origin 是否在允许列表中
    if (allowedOrigins.includes(origin)) {
      console.log(`CORS: Origin ${origin} is allowed.`);
      callback(null, origin);
    } else {
      console.error(`CORS: Origin ${origin} is NOT allowed.`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));



app.use(express.json());

// 添加根路径处理
app.get('/', (req, res) => {
  res.send('Welcome to the Game Demo API!');
});

// 设置 API 路由
app.post('/api/planning', planningController.generatePlan);
app.post('/api/assets', assetsController.generateAssets);
app.post('/api/development', developmentController.startDevelopment);

// 错误处理中间件（放在最后）
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' ? 'An error occurred' : err.message
  });
});

// 启动服务
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
