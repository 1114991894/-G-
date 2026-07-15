import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { Sequelize } from 'sequelize';
import winston from 'winston';
import path from 'path';

// 加载环境变量
dotenv.config();

// 创建Express应用
const app: Express = express();
const PORT = process.env.PORT || 3000;

// 配置日志
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: path.join(__dirname, '../logs/error.log'), level: 'error' }),
    new winston.transports.File({ filename: path.join(__dirname, '../logs/combined.log') }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// 中间件
app.use(helmet());
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  process.env.FRONTEND_URL || '',
  ...(process.env.ALLOWED_ORIGINS || '').split(',').filter(Boolean)
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use((req: Request, _res: Response, next: NextFunction) => {
  logger.info(`${req.method} ${req.path}`, {
    query: req.query,
    body: req.method !== 'GET' ? req.body : undefined,
    ip: req.ip
  });
  next();
});

// 数据库连接
const sequelize = new Sequelize(
  process.env.DB_NAME || 'bwg_performance',
  process.env.DB_USER || 'root',
  process.env.DB_PASS || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    dialect: 'mysql',
    dialectOptions: {
      charset: 'utf8mb4'
    },
    logging: (msg: string) => logger.debug(msg),
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

// 测试数据库连接
sequelize.authenticate()
  .then(() => logger.info('数据库连接成功'))
  .catch(err => logger.error('数据库连接失败:', err));

// 导入模型
import './models';
import { initModels } from './models';

// 初始化模型
initModels(sequelize);

// 路由
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import departmentRoutes from './routes/department.routes';
import employeeRoutes from './routes/employee.routes';
import goalRoutes from './routes/goal.routes';
import indicatorRoutes from './routes/indicator.routes';
import performanceRoutes from './routes/performance.routes';
import talentRoutes from './routes/talent.routes';
import notificationRoutes from './routes/notification.routes';
import oauthRoutes from './routes/oauth.routes';
import integrationRoutes from './routes/integration.routes';
import sharedRoutes from './routes/shared.routes';

// 注意：oauthRoutes 必须在 authRoutes 之前注册
// 因为 authRoutes 会匹配 /api/v1/auth/* 下的所有请求
app.use('/api/v1/auth/oauth', oauthRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/departments', departmentRoutes);
app.use('/api/v1/employees', employeeRoutes);
app.use('/api/v1/goals', goalRoutes);
app.use('/api/v1/indicators', indicatorRoutes);
app.use('/api/v1/performance', performanceRoutes);
app.use('/api/v1/talent', talentRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/integration', integrationRoutes);
app.use('/api/shared', sharedRoutes);

app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '9.0.0'
  });
});

app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: '接口不存在'
  });
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error('服务器错误:', err);
  
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'development' 
      ? err.message 
      : '服务器内部错误'
  });
});

// 启动服务器
app.listen(PORT, () => {
  logger.info(`百鲸G系统v9.0 API服务启动成功，端口: ${PORT}`);
});

export { app, sequelize, logger };
