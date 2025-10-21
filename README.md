# 论文AI助手 | Paper AI Assistant

<div align="center">

智能论文生成与降重平台 - AI-powered paper generation and plagiarism reduction platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D%2016.0.0-brightgreen)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)

[功能特色](#功能特色) • [技术栈](#技术栈) • [快速开始](#快速开始) • [文档](#文档) • [贡献](#贡献)

</div>

---

## 📖 项目简介

论文AI助手是一款功能强大的智能化学术写作工具，利用先进的AI技术帮助用户快速生成高质量论文并进行智能降重改写。平台提供直观的用户界面，完善的文档管理功能，以及安全可靠的数据存储。

### 适用场景

- 📝 学术论文写作辅助
- 🔄 论文降重与改写
- 📊 相似度检测
- 💾 文档管理与归档
- 📤 多格式导出（Word、PDF）

## ✨ 功能特色

### 核心功能

- **🤖 AI智能论文生成**
  - 输入主题和关键词，自动生成完整论文结构
  - 智能大纲生成，可手动编辑调整
  - 章节内容逐步生成，支持分步骤创作
  - 富文本编辑器，支持格式化排版

- **🔄 智能降重改写**
  - 实时相似度检测，精准定位高重复内容
  - 多种改写策略：同义词替换、句式重构、段落重组
  - AI智能改写，保持原文语义和逻辑
  - 实时显示降重效果和相似度变化

- **📁 文档管理**
  - 历史文档保存与管理
  - 文档分类（生成/降重）
  - 状态跟踪（草稿/完成）
  - 快速检索和查看

- **👤 用户系统**
  - 安全的用户注册与登录
  - 个人信息管理
  - 使用统计和数据可视化
  - 历史记录追踪

- **📤 导出功能**
  - 支持Word格式导出
  - 支持PDF格式导出
  - 保持格式完整性

## 🛠 技术栈

### 前端

- **框架**: React 18 + TypeScript
- **构建工具**: Vite
- **样式**: Tailwind CSS
- **路由**: React Router v6
- **状态管理**: Zustand
- **数据请求**: Axios + React Query
- **富文本编辑**: React Quill
- **表单处理**: React Hook Form
- **图标**: Lucide React
- **导出**: docx + jsPDF

### 后端

- **运行时**: Node.js
- **框架**: Express
- **语言**: TypeScript
- **数据库**: MongoDB + Mongoose
- **认证**: JWT + bcrypt
- **验证**: express-validator
- **限流**: express-rate-limit
- **日志**: Winston
- **AI集成**: OpenAI API (可配置)

## 🚀 快速开始

### 环境要求

- Node.js >= 16.0.0
- MongoDB >= 4.4
- npm 或 yarn 或 pnpm

### 安装步骤

1. **克隆项目**

```bash
git clone https://github.com/shixianghua/paper-ai-assistant.git
cd paper-ai-assistant
```

2. **安装依赖**

```bash
# 安装前端依赖
cd frontend
npm install

# 安装后端依赖
cd ../backend
npm install
```

3. **配置环境变量**

```bash
# 后端配置
cd backend
cp .env.example .env
# 编辑 .env 文件，填入必要的配置

# 前端配置
cd ../frontend
cp .env.example .env
# 编辑 .env 文件，配置API地址
```

4. **启动MongoDB**

```bash
# 确保MongoDB服务正在运行
mongod
```

5. **启动服务**

```bash
# 启动后端服务（在backend目录）
npm run dev

# 启动前端服务（在frontend目录，新终端）
npm run dev
```

6. **访问应用**

打开浏览器访问: `http://localhost:3000`

## 📋 环境变量配置

### 后端环境变量 (backend/.env)

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/paper-ai
JWT_SECRET=your_secure_jwt_secret_key_here
JWT_EXPIRE=7d
OPENAI_API_KEY=your_openai_api_key_here
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

### 前端环境变量 (frontend/.env)

```env
VITE_API_URL=http://localhost:5000
VITE_APP_NAME=论文AI助手
```

## 📚 文档

详细文档请查看 `docs` 目录：

- [API 文档](./docs/API.md) - 完整的API接口说明
- [开发环境设置](./docs/SETUP.md) - 详细的环境配置指南
- [系统架构](./docs/ARCHITECTURE.md) - 技术架构和设计说明
- [部署指南](./docs/DEPLOYMENT.md) - 生产环境部署步骤

## 🗂 项目结构

```
paper-ai-assistant/
├── frontend/                 # 前端项目
│   ├── src/
│   │   ├── components/      # React组件
│   │   ├── pages/           # 页面组件
│   │   ├── services/        # API服务
│   │   ├── store/           # 状态管理
│   │   ├── types/           # TypeScript类型定义
│   │   ├── utils/           # 工具函数
│   │   ├── App.tsx          # 应用入口
│   │   └── main.tsx         # 主文件
│   ├── package.json
│   └── vite.config.ts
│
├── backend/                  # 后端项目
│   ├── src/
│   │   ├── config/          # 配置文件
│   │   ├── controllers/     # 控制器
│   │   ├── middleware/      # 中间件
│   │   ├── models/          # 数据模型
│   │   ├── routes/          # 路由
│   │   ├── services/        # 业务逻辑服务
│   │   ├── utils/           # 工具函数
│   │   └── app.ts           # 应用入口
│   ├── package.json
│   └── tsconfig.json
│
├── docs/                     # 项目文档
│   ├── API.md
│   ├── SETUP.md
│   ├── ARCHITECTURE.md
│   └── DEPLOYMENT.md
│
├── .gitignore
└── README.md
```

## 🔐 安全特性

- ✅ JWT身份认证
- ✅ 密码加密存储（bcrypt）
- ✅ 请求速率限制
- ✅ 输入验证与清理
- ✅ MongoDB注入防护
- ✅ CORS配置
- ✅ 错误处理与日志记录
- ✅ 环境变量管理

## 🎯 开发路线图

### 已完成 ✅

- [x] 项目基础架构搭建
- [x] 用户认证系统
- [x] 论文生成核心功能
- [x] 智能降重核心功能
- [x] 文档管理系统
- [x] 响应式UI设计

### 进行中 🚧

- [ ] AI模型集成优化
- [ ] 导出功能完善
- [ ] 实时保存功能

### 计划中 📅

- [ ] 文档版本控制
- [ ] 协作功能
- [ ] 多语言支持
- [ ] 深色模式
- [ ] 移动端应用
- [ ] 第三方登录集成

## 🤝 贡献

欢迎贡献代码、报告问题或提出新功能建议！

1. Fork 本项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

### 贡献指南

- 遵循现有代码风格
- 添加适当的注释
- 更新相关文档
- 确保所有测试通过

## 📄 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件

## 👥 联系方式

- 项目主页: [https://github.com/shixianghua/paper-ai-assistant](https://github.com/shixianghua/paper-ai-assistant)
- 问题反馈: [Issues](https://github.com/shixianghua/paper-ai-assistant/issues)

## 🙏 致谢

感谢所有为这个项目做出贡献的开发者！

---

<div align="center">

**⭐ 如果觉得项目不错，请给个Star支持一下！⭐**

Made with ❤️ by [shixianghua](https://github.com/shixianghua)

</div>
