# Persona Chat

[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-orange?logo=cloudflare)](https://workers.cloudflare.com/)
[![Workers AI](https://img.shields.io/badge/Workers-AI-blue)](https://developers.cloudflare.com/workers-ai/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

基于 Cloudflare Workers AI 的 `llm-chat-app-template` 模板深度定制，将通用聊天模板转化个性化 Prompt 角色聊天应用，全栈运行在全球边缘节点。

## 特性

- 💬 **简洁聊天界面** - 响应式设计，支持深色/浅色主题
- ⚡ **流式响应** - 基于 SSE (Server-Sent Events) 实时流式输出
- 🧠 **Workers AI 驱动** - 默认使用 Llama 3.1 8B 模型
- 🛠️ **TypeScript 全栈** - 类型安全，开发体验更佳
- 📱 **移动端友好** - 自适应布局，随时随地使用
- 🔄 **本地历史管理** - 客户端维护会话历史，无需后端存储
- 🔎 **可观测性** - 内置日志记录，便于调试与监控
- 🌍 **边缘部署** - 全球 CDN 加速，低延迟访问

## 技术栈

| 类别 | 技术 |
|------|------|
| 运行时 | Cloudflare Workers |
| AI 引擎 | Workers AI (Llama 3.1 8B) |
| 语言 | TypeScript 5.9 |
| 包管理 | pnpm |
| 测试框架 | Vitest |
| 前端 | 原生 HTML/CSS/JavaScript |

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
│   ├── chat.js              # 前端交互逻辑
│   └── styles.css           # UI 样式 (含主题变量)
├── src/
│   ├── index.ts             # Worker 入口 & API 路由
│   ├── prompt.ts            # 系统提示词 (数字分身人格)
│   └── types.ts             # TypeScript 类型定义
├── test/                    # 测试文件
├── wrangler.jsonc           # Cloudflare Workers 配置
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

### 更换 AI 模型

修改 `src/index.ts` 中的 `MODEL_ID` 常量：

```typescript
const MODEL_ID = "@cf/meta/llama-3.1-8b-instruct-fp8";
```

可用模型列表: [Workers AI Models](https://developers.cloudflare.com/workers-ai/models/)

### 自定义数字分身人格

编辑 `src/prompt.ts` 文件，修改系统提示词来定义你的 AI 数字分身：

```typescript
export default `
你是 [你的名字] 的 AI 数字分身...
`;
```

提示词支持设置：
- 核心身份（职业、技能、兴趣）
- 语言风格与语气
- 输出格式要求
- 行为边界与禁忌

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
