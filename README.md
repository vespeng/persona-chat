# Persona Chat

<p align="center">
  <img src="public/favicon.svg" alt="Persona Chat" width="144" height="144">
</p>

[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-orange?logo=cloudflare)](https://workers.cloudflare.com/)
[![Workers AI](https://img.shields.io/badge/Workers-AI-blue)](https://developers.cloudflare.com/workers-ai/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

基于 Cloudflare Workers AI 的 `llm-chat-app-template` 模板，历经大规模重构演化而来的 AI 角色聊天应用：通过系统提示词注入角色设定，让 AI 以特定身份、性格与语气与访客对话，而非通用助手。全栈运行在全球边缘节点。

## 特性

- 🎭 **AI 角色化** - 通过系统提示词定义角色身份、性格、语气、回答方式与行为底线，对话有"人味儿"
- 🗄️ **提示词 KV 化管理** - 系统提示词存储于 Cloudflare KV，随时更新无需重新部署，读取失败自动降级为内置默认提示词
- ⚡ **流式响应** - 基于 SSE (Server-Sent Events) 实时流式输出，兼容 Workers AI 与 OpenAI 两种响应格式
- 📝 **Markdown 渲染** - 基于 Marked.js 实时渲染 AI 回复，代码块、列表、加粗直接呈现
- 🌗 **主题切换** - 深色/浅色主题一键切换，配合圆形展开过渡动画
- 💬 **沉浸式聊天体验** - 随机欢迎语、欢迎页到聊天页的自然过渡、输入框自动增高
- 🔄 **本地历史管理** - 客户端维护会话历史，无需后端存储
- 🧠 **Workers AI 驱动** - 默认使用 Llama 3.1 8B 模型，模型与页面标题均可通过环境变量配置
- 🛠️ **TypeScript 全栈** - 类型安全，开发体验更佳
- 📱 **移动端友好** - 自适应布局，随时随地使用
- 🔬 **可观测性** - 内置日志记录，便于调试与监控
- 🌍 **边缘部署** - 全球 CDN 加速，低延迟访问

## 技术栈

| 类别 | 技术 |
|------|------|
| 运行时 | Cloudflare Workers |
| AI 引擎 | Workers AI (Llama 3.1 8B) |
| 语言 | TypeScript 5.9 |
| 包管理 | pnpm |
| 前端 | 原生 HTML/CSS/JavaScript + Marked.js |
| 测试框架 | Vitest |

## 快速开始

### 先决条件

- [Node.js](https://nodejs.org/) v18+
- [pnpm](https://pnpm.io/) (推荐) 或 npm
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/)
- 拥有 Workers AI 访问权限的 Cloudflare 账户

### 安装

```bash
# 克隆仓库
git clone https://github.com/vespeng/persona-chat.git
cd persona-chat

# 安装依赖
pnpm install

# 生成 Worker 类型定义
pnpm run cf-typegen
```

### 本地开发

```bash
pnpm run dev
```

访问 http://localhost:8787 即可预览。

> ⚠️ **注意**: 本地开发期间调用 Workers AI 会访问 Cloudflare 账户，可能产生费用。

### 部署

> ⚠️ 如需 KV 存储提示词，请先在控制台创建并绑定 KV 命名空间（见下文「自定义 AI 角色」），绑定关系在控制台配置，无需修改 `wrangler.jsonc`。

```bash
pnpm run deploy
```

部署成功后，Workers 将在全球边缘节点运行。

### 查看日志

```bash
pnpm wrangler tail
```

## 项目结构

```
persona-chat/
├── public/                  # 静态资源
│   ├── index.html           # 聊天 UI 入口
│   ├── chat.js              # 前端交互逻辑（SSE 解析、Markdown 渲染、主题切换）
│   ├── styles.css           # UI 样式 (含主题变量)
│   └── favicon.svg          # 站点图标
├── src/
│   ├── index.ts             # Worker 入口 & API 路由（含默认提示词兜底）
│   └── types.ts             # TypeScript 类型定义
├── wrangler.jsonc           # Cloudflare Workers 配置
├── .env.example             # 环境变量示例（复制为 .dev.vars 可本地覆盖）
├── tsconfig.json            # TypeScript 配置
└── package.json             # 项目依赖
```

## API 接口

### POST `/api/chat`

发送聊天消息并获取流式响应。

**请求体:**

```json
{
  "messages": [
    { "role": "user", "content": "你好" }
  ]
}
```

**响应:**

- Content-Type: `text/event-stream`
- 流式返回 AI 生成的回复

**示例:**

```bash
curl -X POST https://your-worker.workers.dev/api/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"你好"}]}'
```

## 自定义配置

### 环境变量配置

模型 ID 与页面标题均可通过环境变量控制，无需修改代码：

| 变量 | 说明 | 代码默认值 |
|------|------|--------|
| `MODEL_ID` | Workers AI 模型 ID | `@cf/meta/llama-3.1-8b-instruct-fp8` |
| `APP_TITLE` | 浏览器标签页标题（`<title>`） | `AI Chat` |

代码默认值定义于 `src/index.ts` 的 `DEFAULT_MODEL_ID` / `DEFAULT_APP_TITLE`。

配置优先级：

**线上（生产环境，从高到低）：**

1. **线上环境变量** - Cloudflare 控制台（Worker → 设置 → 变量），或用 `wrangler secret put <KEY>` 配置同名密钥（`wrangler.jsonc` 已启用 `keep_vars`，部署时不会覆盖平台配置）
2. **代码默认值** - 平台未配置时，使用 `src/index.ts` 中的 `DEFAULT_MODEL_ID` / `DEFAULT_APP_TITLE`

**本地开发（从高到低）：**

1. **`.dev.vars`** - 仅本地开发生效，覆盖默认值。基于示例文件创建：

   ```bash
   cp .env.example .dev.vars
   ```

   然后按需修改：

   ```bash
   MODEL_ID=@cf/meta/llama-3.1-8b-instruct-fp8
   APP_TITLE=AI Chat
   ```

2. **代码默认值** - 未创建 `.dev.vars` 时，使用 `src/index.ts` 中的 `DEFAULT_MODEL_ID` / `DEFAULT_APP_TITLE`

可用模型列表: [Workers AI Models](https://developers.cloudflare.com/workers-ai/models/)

### 自定义 AI 角色（提示词）

系统提示词存储在 Cloudflare KV 中（绑定名 `PROMPT_KV`，键 `system_prompt`），可随时更新、即时生效，无需修改代码或重新部署。

**首次使用（全程在 Cloudflare 控制台操作，无需填写 id）：**

1. **创建 KV 命名空间**：控制台 → **Workers & Pages → KV → 创建命名空间**，命名随意（如 `persona-chat-kv`）
2. **绑定到 Worker**：进入你的 Worker → **设置 → 绑定 → 添加绑定 → KV 命名空间**，变量名称填 `PROMPT_KV`，命名空间选择上一步创建的，保存后重新部署
3. **写入提示词**：回到 **KV** 页面 → 进入该命名空间 → **新建键**，键名 `system_prompt`，值粘贴提示词全文

提示词支持设置：
- 核心身份（职业背景、性格、兴趣）
- 语言风格与语气
- 回答方式与输出要求
- 行为底线与禁忌

> 💡 **更新即时生效**：修改 KV 中 `system_prompt` 的值后，全球分发通常约 60 秒生效，无需重新部署。
>
> 🛟 **兜底机制**：KV 未绑定、读取失败或键不存在时，自动降级为 `src/index.ts` 中内置的 `DEFAULT_SYSTEM_PROMPT`（通用助手提示词）。
>
> 🖥️ **本地开发**：控制台绑定仅线上生效。本地 `wrangler dev`（本地模式）没有该绑定，会走默认提示词；如需联调线上 KV，可用 `wrangler dev --remote`。

### 启用 AI Gateway

取消 `src/index.ts` 中 AI Gateway 配置的注释：

```typescript
{
  gateway: {
    id: "YOUR_GATEWAY_ID",
    skipCache: false,
    cacheTtl: 3600,
  },
}
```

### 自定义 UI 样式

修改 `public/styles.css` 顶部的 CSS 变量：

```css
:root {
  --primary-color: #007bff;
  --background-color: #ffffff;
  /* ... */
}
```

## NPM Scripts

| 命令 | 说明 |
|------|------|
| `pnpm run dev` | 启动本地开发服务器 |
| `pnpm run deploy` | 部署到 Cloudflare Workers |
| `pnpm run check` | 类型检查 + 部署预检 |
| `pnpm run test` | 运行测试 |
| `pnpm run cf-typegen` | 生成 Worker 类型定义 |

## 相关资源

- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
- [Workers AI 文档](https://developers.cloudflare.com/workers-ai/)
- [Workers AI 模型列表](https://developers.cloudflare.com/workers-ai/models/)
- [Wrangler CLI 参考](https://developers.cloudflare.com/workers/wrangler/)

## License

[MIT](LICENSE)

---

> 🚀 由 [Cloudflare Workers](https://workers.cloudflare.com/) 驱动
