# 升格智能论文系统 · Shengge AI Paper

从题目到 Word 成稿的一站式 AI 学术写作工作台。参考 **lunwen66.com / aiwriting.icu** 的产品结构重建，视觉与交互整体升级：现代 SaaS 设计语言、深靛紫品牌色、细腻动效与完整三栏写作工作台。

> 本仓库为**前端演示版**：大纲、全文、文献与降重均为本地演示引擎模拟，数据保存在浏览器。正式接入真实模型与检索服务时，只需替换 `src/lib/generator.js` 的生成实现（接口已在 UI 层就绪）。

## 界面预览

![首页桌面端](docs/screenshots/home-desktop.png)

![首页移动端](docs/screenshots/home-mobile.png)

![工作台成稿](docs/screenshots/workspace-doc.png)

![Word 导出效果（国家开放大学本科毕业论文格式）](docs/screenshots/word-ouc-format.png)

## 功能一览

- 首页落地页：品牌 Hero、22+ 文档类型、四阶段创作流程、能力矩阵、在线大纲演示、写作记录、套餐、生态合作、FAQ、合规声明
- 文档类型：毕业论文、开题报告、文献综述、调查报告、实习报告、答辩稿、教学设计、自定义写作等
- 生成配置：学历 / 字数 / 语言 / 参考文献数量 / 模型档位 / 三级大纲 / “投喂 AI”
- 大纲体验：免费生成、日志流式输出、大纲预览、进入工作台后可增删与重命名章节
- 全文工作台：三栏布局（配置与大纲 / A4 论文画布 / 写作工具链），逐章生成进度与日志，A4 学术排版（摘要、关键词、参考文献、致谢）
- 排版格式标准：内置「国家开放大学 · 本科毕业论文 / 学位论文 / 通用院校（章-节式）」三套规范，按官方要求处理封面字段、`一、（一）1.（1）` 四级编号、小四宋体、行距 24 磅 / 1.5 倍、图题在下表题在上、参考文献顺序编码制
- 图表与注释规范（对照国开放官方原文）：图编号与图题置于图下方居中（图 1、图 2……），表编号与表题置于表上方居中（表 1、表 2……）；表格采用三线表、表内五号宋体，数据来源以「注：」小五号宋体标注在表下；正文引用以上标 `[n]` 与文末参考文献一一对应；注释一律为页下脚注（导出 Word 后自动落到引用页页脚），格式参照参考文献并注明页码，学位论文要求 3 处以上
- 交付工具链：无限改稿、降 AIGC、一键降重、智能排版、复制全文、**Word 导出（单文件图文格式，图片内嵌，Word / WPS 直接打开即可看到图表）**、全套材料打包（论文 + 开题报告 + 任务书 + 中期检查表）
- 模型接入：浏览器本地保存 API Key，支持思考强度、超时与自动重试、断点续写，并可在「接口地址（高级设置）」填写自建 / 代理网关地址、检测该接口实际可用的模型
- 响应式与动效：桌面 / 平板 / 手机自适应；滚动显现、漂移光斑、进度流光、打字式日志；完整支持 `prefers-reduced-motion`

## GitHub 底座调研结论（本次选型依据）

| 候选 | 结论 |
| --- | --- |
| `gdswcxzljj/ai_paper` | lunwen66.com 的 OEM 源头，功能清单最贴近，但仓库只有 README 与截图、无源码，不能直接复用 |
| `andyshen1121/paper-agent` | 最接近的可运行开源论文写作 Agent（Next.js + SSE + 三栏工作台），但其依赖 Vercel 全家桶与多家 LLM 密钥，脱离密钥无法运行与验收 |
| `Abnerla/AI_paper`（纸研社） | 桌面端 PyQt 应用，定位“本地个人写作助手”，形态与 Web SaaS 不同 |
| `Future-House/paper-qa` | 高质量 RAG 文献问答引擎，可作为正式版“真实文献”模块的检索底座 |

因此本仓库没有直接克隆某个仓库，而是**沿用 paper-agent 的“规划 Agent + 三栏工作台 + 流式进度”架构思路**，用 React + Vite 自建可控、可本地运行、可 Docker 一键部署的版本，并把论文66/aiwriting 的功能骨架完整搬入。

## 技术栈

- React 19 + Vite 8
- React Router（Hash 路由，任意静态托管均可运行）
- lucide-react 图标
- 原生 CSS 设计系统（Design Tokens + 动画，无 UI 框架依赖）

## 本地开发

```bash
npm install
npm run dev      # http://localhost:5173
npm run lint
npm run build    # 产物在 dist/
npm run preview  # 预览生产构建
```

## 部署方案

### 方案 A：GitHub Pages（免费、自动）

1. 推送本仓库到 GitHub（默认分支 `main`）。
2. 仓库 Settings → Pages → Source 选择 **GitHub Actions**。
3. 每次 `push` 都会由 `.github/workflows/pages.yml` 自动构建并发布。

### 方案 B：自有服务器 Docker 一键部署

服务器执行（已装 Docker）：

```bash
git clone <你的仓库地址> /opt/shengge-ai-paper
cd /opt/shengge-ai-paper
bash deploy.sh 80
```

或本地构建后运行：

```bash
APP_PORT=80 docker compose up -d --build
```

### 方案 C：GitHub Actions 自动发布到服务器

`.github/workflows/deploy-server.yml` 已内置 SSH 部署：在仓库 Secrets 中配置
`SSH_HOST / SSH_USERNAME / SSH_KEY / SSH_PORT(可选) / APP_DIR(可选)`，
服务器上先把仓库 clone 到 `APP_DIR`，然后在 Actions 页面**手动触发** Deploy to server
（配置完成后如需每次 push 自动发布，把该 workflow 的触发条件改回 push 即可）。

## 目录结构

```text
src/
  components/       通用 UI 与页面区块
  data/catalog.js   文档类型、套餐、FAQ 等站点配置
  lib/generator.js  ★ 演示生成引擎（正式版替换为真实 API 调用点）
  lib/store.js      本地状态：登录、写作记录、会话文档
  pages/Home.jsx    落地页
  pages/Workspace.jsx  三栏写作工作台
  styles/global.css 设计令牌 / 布局 / 动效 / 响应式
docs/screenshots/   界面预览
Dockerfile · nginx.conf · docker-compose.yml · deploy.sh
.github/workflows/   Pages 与服务器自动部署
```

## 接入正式后端（路线图）

1. 在 `src/lib/generator.js` 中把 `demoOutline` / `generateFullDoc` 替换为真实 API 调用，UI 已按 `onLog / onProgress / onChunk` 协议消费流式进度；
2. 用户与订单系统：建议 Next.js API Route 或独立 Node/Go 服务 + PostgreSQL；
3. 真实文献检索：可接入 Semantic Scholar / CrossRef / 知网数据服务，或自建 `paper-qa` RAG；
4. 支付与套餐：按 `src/data/catalog.js` 中 PRICING 结构接入支付与权益校验；
5. Word 规范导出：当前为 HTML 转 .doc；正式版建议服务端生成 docx（如 docx-templates / python-docx）。

## 学术诚信声明

本系统输出内容仅用于学习、研究与写作灵感参考，请严格遵守所在机构的学术规范与道德准则。我们不鼓励、不支持任何违反学术诚信的行为。

## License

源码可自由学习与二次开发；商用部署请自行评估合规、内容安全与学术诚信要求。
