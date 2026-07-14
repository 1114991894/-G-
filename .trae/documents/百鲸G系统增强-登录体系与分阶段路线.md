# 百鲸G系统增强方案 — 登录体系与分阶段路线

## Context（背景与目标）

用户提出了一份覆盖双端全模块的企业级SaaS系统规格（登录体系、客户端三大模块、人才发展、系统设置、服务端、通用能力、技术架构）。经代码库探查，现状为：
- 后端 `api/`：Express+Sequelize+MySQL，已有8控制器/13模型/JWT/通知系统，但缺services层、Redis、迁移、AI集成
- 客户端前端 `client/web/`：12页面，Mock数据驱动
- 服务端前端 `server/web/`：4页面，Mock数据驱动

需求规模远超单次可实现范围。本方案采取**分阶段、前端Mock优先**策略：第一阶段聚焦**登录体系+安全**（所有模块的入口基础），后续阶段作为路线图。前端Mock模式延续现有React+AntD方式，不依赖后端可用性，最快可见效、可独立演示。

## 实施范围决策（基于用户未明确选择时的推荐）

| 维度 | 决策 | 理由 |
|------|------|------|
| 实施范围 | 前端增强（Mock数据） | 延续现有模式，不依赖MySQL/后端，最快演示 |
| 优先模块 | 登录体系+安全 | 所有模块入口基础，用户列表首位 |
| AI实现 | Mock AI（前端模拟） | 无需API Key，立即可演示 |

---

## 第一阶段：登录体系+安全（本次实施）

### 需求拆解（5项）

1. **公司名称模糊搜索匹配**（客户端）：输入时下拉匹配Mock企业列表
2. **密码错误锁定策略**：连续5次失败锁定15分钟，显示倒计时
3. **新设备二次验证**：模拟"新设备检测"→发送短信验证码→二次验证弹窗
4. **完整申请试用审批流程**：提交→待审批→通过/拒绝→通知→可重试
5. **个人中心修改后同步链路**：编辑后显示同步状态至"客户端登录+组织架构+服务端系统设置"

### 文件修改清单

#### 客户端 `client/web/src/`

**修改：**
- `pages/Login.tsx` — 核心重构：公司名AutoComplete模糊搜索、锁定逻辑、新设备2FA弹窗、申请试用多步流程
- `stores/authStore.ts` — 增加登录失败计数、锁定状态、2FA验证方法、mock企业列表
- `layouts/MainLayout.tsx` — 个人中心弹窗增加"同步状态"展示与进度

**新建：**
- `utils/mockData.ts` — Mock企业列表、短信验证码生成、审批记录存储
- `components/TrialApprovalFlow.tsx` — 申请试用审批流程组件（提交→待审批→结果→重试）
- `components/SmsVerifyModal.tsx` — 短信二次验证弹窗组件
- `components/LockCountdown.tsx` — 锁定倒计时组件

#### 服务端 `server/web/src/`

**修改：**
- `pages/Login.tsx` — 同步增加锁定策略、新设备2FA（服务端管理员同样适用）
- `stores/authStore.ts` — 增加锁定计数、2FA验证
- `pages/AdminManagement.tsx` — 增加"申请试用审批"Tab页，可查看/审批客户端提交的申请

**新建：**
- `components/SmsVerifyModal.tsx` — 服务端短信二次验证弹窗
- `utils/mockData.ts` — 共享Mock审批记录存储

### 详细实现要点

#### 1. 公司名称模糊搜索（客户端 Login.tsx）
- 使用 antd `AutoComplete` 替换现有 `Input`
- Mock企业列表：`[{value:'百鲸科技有限公司', phone:'13800138000'}, ...]`
- 输入时 `filterOption` 模糊匹配（不区分大小写，包含即匹配）
- 选中企业后自动填充示例手机号提示

#### 2. 密码错误锁定策略（authStore.ts）
- `loginFailedCount: number`、`lockUntil: number`（时间戳）状态
- 失败计数存入 `localStorage`（持久化）
- 连续失败5次 → 锁定15分钟，`lockUntil = Date.now() + 15*60*1000`
- 锁定期间提交按钮禁用，显示 `LockCountdown` 倒计时
- 锁定到期或登录成功 → 重置计数

#### 3. 新设备二次验证（SmsVerifyModal.tsx）
- 模拟"新设备检测"：首次登录或localStorage无设备指纹时触发
- 生成6位随机验证码，`message.info` 提示"验证码已发送至 138****8000"
- 开发模式下验证码直接显示在控制台/页面提示（便于测试）
- `SmsVerifyModal`：6位验证码输入（Input.OTP）+ 60秒重发倒计时
- 验证通过 → 继续登录流程；写入设备指纹到localStorage

#### 4. 申请试用审批流程（TrialApprovalFlow.tsx）
- 多步骤状态机：`draft → submitted → pending → approved/rejected → retry`
- 提交后存入localStorage（key: `trial_applications`），含公司名/联系人/电话/时间/状态
- 服务端 `AdminManagement.tsx` 新增"申请审批"Tab，读取localStorage展示待审批列表
- 审批操作：通过/拒绝 + 备注，更新申请状态
- 客户端Login页"申请试用"按钮显示当前申请状态（待审批/已通过/已拒绝+重试按钮）

#### 5. 个人中心同步链路（MainLayout.tsx）
- 个人中心弹窗"保存"后，显示 `SyncStatus` 组件
- 同步项：✓ 客户端登录账号、✓ 客户端组织架构、✓ 服务端系统设置（仅总管理员）
- 每项显示同步中→已同步状态切换（setTimeout模拟）

---

## 第二~五阶段：路线图（本次不实施，仅规划）

### 第二阶段：通知系统 + 通用页面状态规范
- 双端新建 `components/Notification/` 组件（铃铛下拉列表、未读数、标记已读）
- 7种通知类型Mock（目标到期/评分提醒/审批通知/校准反馈/面谈邀约/客户分配/系统公告）
- 页面状态规范组件：`LoadingState`/`EmptyState`/`ErrorState`/`NoPermission`/`NotFound`
- 异常处理：`utils/errorHandler.ts`（网络断开/登录过期/重复提交/数据冲突/导入失败）

### 第三阶段：客户端绩效模块深度增强
- 绩效看板：角色差异化内容、卡片下钻、悬浮提示
- 目标管理：模板复用、权重校验、状态流转（草稿→待审批→已生效→已修改）、批量设定、到期提醒
- 绩效考核：四步创建流程、指标库/模板管理
- 评分管理：六步评分链路、数据确认留痕、逾期处理
- 绩效校准：反馈→处理→升级→留痕闭环
- 绩效提升：面谈邀约状态流转、行动项追踪

### 第四阶段：人才发展 + 系统设置
- 九宫格：可配置维度、历史回溯、AI水印标注
- 360评价：完整流程 + 异常问卷检测
- 岗位胜任力：模型版本管理、横向对比
- 组织架构：树形展示、拖拽排序、离职归档、导入错误行标红
- 权限分配：模块级勾选 + 数据范围 + 即时生效

### 第五阶段：服务端增强 + 双端权限矩阵
- 客户看板：环比数据、AI分析维度
- 客户管理：筛选/搜索、禁用原因、编辑审批流程、客户分配机制
- 管理员管理：删除前客户转移校验
- 双端权限矩阵落地（客户端20项×5角色，服务端8项×3角色）
- 双端数据联动表

---

## 验证方式（第一阶段）

1. **构建验证**：
   - `cd client/web && npx vite build`
   - `cd server/web && npx vite build`
   - 两者均需无错误通过

2. **功能验证**（启动 `npm run dev` 后浏览器访问）：
   - 客户端 http://localhost:5173/ ：公司名模糊搜索下拉、连续5次错误密码→锁定倒计时、首次登录→短信2FA弹窗、申请试用→多步流程、个人中心修改→同步状态显示
   - 服务端 http://localhost:5174/ ：管理员登录锁定、2FA、AdminManagement"申请审批"Tab可见客户端提交的申请、审批后客户端状态更新

3. **Mock账号**：
   - 客户端：13800138000 / 123456（已存在）
   - 服务端：13800138000 / 123456（总管理员）、13800138001（主）、13800138002（分）

## 关键复用

- 复用现有 `authStore.ts` persist 中间件模式
- 复用现有 `MainLayout.tsx` Modal 弹窗模式
- 复用 antd `AutoComplete`/`Input.OTP`/`Form`/`Modal`/`Steps`/`Timeline` 组件
- Mock数据通过 localStorage 持久化，模拟双端数据联动

## 不在本次范围

- 后端微服务改造、数据库迁移、Redis接入
- 真实大模型API集成（仅Mock）
- 单元测试、Docker、CI/CD
- 第二~五阶段的具体编码
