# 百鲸G系统 - 智能绩效管理平台 v9.0

## 项目概述

百鲸G系统是一个智能化的绩效管理与人才发展平台，支持多租户模式，提供完整的绩效管理、人才发展、组织架构管理等功能。

## 技术栈

### 后端 (API服务)
- **框架**: Node.js + Express + TypeScript
- **ORM**: Sequelize
- **数据库**: MySQL
- **认证**: JWT + Redis
- **日志**: Winston

### 前端 (客户端Web)
- **框架**: React 18 + TypeScript
- **构建工具**: Vite
- **UI组件库**: Ant Design 5
- **状态管理**: Zustand
- **路由**: React Router 6
- **图表**: Recharts

### 前端 (服务端Web)
- **框架**: React 18 + TypeScript
- **构建工具**: Vite
- **UI组件库**: Ant Design 5
- **状态管理**: Zustand
- **路由**: React Router 6

## 项目结构

```
3.0/
├── api/                          # 后端API服务
│   ├── src/
│   │   ├── controllers/          # 控制器
│   │   │   ├── auth.controller.ts
│   │   │   ├── user.controller.ts
│   │   │   ├── department.controller.ts
│   │   │   ├── employee.controller.ts
│   │   │   ├── goal.controller.ts
│   │   │   ├── performance.controller.ts
│   │   │   ├── talent.controller.ts
│   │   │   └── notification.controller.ts
│   │   ├── models/               # 数据模型
│   │   │   ├── index.ts
│   │   │   ├── user.model.ts
│   │   │   ├── tenant.model.ts
│   │   │   ├── role.model.ts
│   │   │   ├── department.model.ts
│   │   │   ├── employee.model.ts
│   │   │   ├── goal.model.ts
│   │   │   ├── indicator.model.ts
│   │   │   ├── performance-cycle.model.ts
│   │   │   ├── score.model.ts
│   │   │   ├── notification.model.ts
│   │   │   ├── talent-grid.model.ts
│   │   │   ├── evaluation-360.model.ts
│   │   │   └── competency.model.ts
│   │   ├── routes/               # 路由
│   │   │   ├── auth.routes.ts
│   │   │   ├── user.routes.ts
│   │   │   ├── department.routes.ts
│   │   │   ├── employee.routes.ts
│   │   │   ├── goal.routes.ts
│   │   │   ├── performance.routes.ts
│   │   │   ├── talent.routes.ts
│   │   │   └── notification.routes.ts
│   │   ├── middlewares/          # 中间件
│   │   │   └── auth.middleware.ts
│   │   └── index.ts              # 主入口
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
├── client/web/                   # 客户端前端
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Login.tsx
│   │   │   └── Dashboard.tsx
│   │   ├── layouts/
│   │   │   └── MainLayout.tsx
│   │   ├── stores/
│   │   │   └── authStore.ts
│   │   ├── utils/
│   │   │   └── request.ts
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── package.json
│   ├── vite.config.ts
│   └── index.html
└── server/web/                   # 服务端前端
    ├── src/
    │   ├── pages/
    │   │   ├── Login.tsx
    │   │   ├── Dashboard.tsx
    │   │   ├── ClientList.tsx
    │   │   ├── AdminManagement.tsx
    │   │   └── DataAnalysis.tsx
    │   ├── layouts/
    │   │   └── MainLayout.tsx
    │   ├── stores/
    │   │   └── authStore.ts
    │   ├── utils/
    │   │   └── request.ts
    │   ├── App.tsx
    │   ├── main.tsx
    │   └── index.css
    ├── package.json
    ├── vite.config.ts
    └── index.html
```

## 功能模块

### 1. 认证与授权
- ✅ 用户登录/注册
- ✅ JWT认证
- ✅ 多端登录（客户端/服务端）
- ✅ 权限控制

### 2. 系统设置
- ✅ 组织架构管理（部门树）
- ✅ 员工管理（CRUD、批量导入导出）
- ✅ 角色权限管理
- ✅ 个人中心

### 3. 绩效管理
- ✅ 绩效看板
- ✅ 目标管理（创建、审批、跟踪）
- ✅ 绩效周期管理
- ✅ 评分管理
- ✅ 绩效校准

### 4. 人才发展
- ✅ 人才九宫格
- ✅ 360度评价
- ✅ 岗位胜任力模型

### 5. 服务端功能
- ✅ 客户管理
- ✅ 管理员管理
- ✅ 数据分析
- ✅ 客户看板

### 6. 通用能力
- ✅ 通知系统
- ✅ 操作日志
- ✅ 数据加密
- ✅ 文件上传

## 安装与运行

### 1. 后端API服务

```bash
# 进入后端目录
cd api

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件，配置数据库连接等信息

# 创建数据库
# 在MySQL中创建数据库：bwg_performance

# 启动服务（开发模式）
npm run dev

# API服务将在 http://localhost:3000 启动
```

### 2. 客户端前端

```bash
# 进入客户端前端目录
cd client/web

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 前端将在 http://localhost:5173 启动
```

### 3. 服务端前端

```bash
# 进入服务端前端目录
cd server/web

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 前端将在 http://localhost:5174 启动
```

## API接口文档

### 认证模块
- `POST /api/v1/auth/register` - 注册
- `POST /api/v1/auth/login` - 登录
- `POST /api/v1/auth/logout` - 登出
- `GET /api/v1/auth/profile` - 获取个人信息

### 用户管理
- `GET /api/v1/users` - 用户列表
- `POST /api/v1/users` - 创建用户
- `GET /api/v1/users/:id` - 获取用户详情
- `PUT /api/v1/users/:id` - 更新用户
- `DELETE /api/v1/users/:id` - 删除用户

### 部门管理
- `GET /api/v1/departments` - 部门列表（树形）
- `POST /api/v1/departments` - 创建部门
- `PUT /api/v1/departments/:id` - 更新部门
- `DELETE /api/v1/departments/:id` - 删除部门
- `POST /api/v1/departments/reorder` - 部门排序

### 员工管理
- `GET /api/v1/employees` - 员工列表
- `POST /api/v1/employees` - 创建员工
- `GET /api/v1/employees/:id` - 获取员工详情
- `PUT /api/v1/employees/:id` - 更新员工
- `DELETE /api/v1/employees/:id` - 删除员工
- `POST /api/v1/employees/import` - 批量导入
- `GET /api/v1/employees/export` - 导出

### 目标管理
- `GET /api/v1/goals` - 目标列表
- `POST /api/v1/goals` - 创建目标
- `GET /api/v1/goals/:id` - 获取目标详情
- `PUT /api/v1/goals/:id` - 更新目标
- `POST /api/v1/goals/:id/approve` - 审批目标
- `DELETE /api/v1/goals/:id` - 删除目标

### 绩效管理
- `GET /api/v1/performance/cycles` - 绩效周期列表
- `POST /api/v1/performance/cycles` - 创建绩效周期
- `GET /api/v1/performance/dashboard` - 绩效看板
- `POST /api/v1/performance/scores` - 提交评分

### 人才发展
- `GET /api/v1/talent/grid` - 获取人才九宫格
- `POST /api/v1/talent/grid/generate` - 生成人才九宫格
- `GET /api/v1/talent/evaluations` - 获取360评价
- `POST /api/v1/talent/evaluations/:id/submit` - 提交360评价
- `GET /api/v1/talent/competencies` - 获取胜任力模型
- `POST /api/v1/talent/competencies` - 创建胜任力模型
- `PUT /api/v1/talent/competencies/:id` - 更新胜任力模型
- `DELETE /api/v1/talent/competencies/:id` - 删除胜任力模型

### 通知管理
- `GET /api/v1/notifications` - 通知列表
- `POST /api/v1/notifications` - 发送通知
- `PUT /api/v1/notifications/:id/read` - 标记已读
- `PUT /api/v1/notifications/read-all` - 全部标记已读

## 数据库设计

### 核心表结构

1. **tenants** - 租户表
2. **users** - 用户表
3. **roles** - 角色表
4. **departments** - 部门表
5. **employees** - 员工表
6. **goals** - 目标表
7. **indicators** - 指标表
8. **performance_cycles** - 绩效周期表
9. **scores** - 评分表
10. **notifications** - 通知表
11. **talent_grids** - 人才九宫格表
12. **evaluation_360s** - 360评价表
13. **competencies** - 胜任力模型表

## 开发计划

### 已完成 ✅
- [x] 项目基础架构搭建
- [x] 数据库Schema设计
- [x] 认证与登录模块
- [x] 系统设置模块
- [x] 绩效管理核心模块
- [x] 人才发展模块
- [x] 服务端（机构端）功能
- [x] 通知系统与通用能力

### 待完成 🔄
- [ ] 数据验证（Joi）
- [ ] 文件上传功能
- [ ] 单元测试
- [ ] 数据库迁移脚本
- [ ] Docker容器化
- [ ] CI/CD配置
- [ ] 性能优化
- [ ] 小程序端（Taro）

## 贡献指南

欢迎提交Issue和Pull Request！

## 许可证

MIT License

## 联系方式

如有问题，请联系：support@bwg.com

---

**版本**: v9.0.0  
**最后更新**: 2026-07-04
