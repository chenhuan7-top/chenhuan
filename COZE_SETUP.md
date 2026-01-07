# Coze Agent 接入配置指南

本文档说明如何将你的 Coze 平台上的 Agent 接入到个人网站中。

## 📋 前置要求

1. 已在 [Coze 平台](https://www.coze.cn/) 创建并发布了 Bot/Agent
2. 获取了 Bot 的 API 访问权限

## 🔑 获取 Coze API 信息

### 1. 获取 API Token

1. 登录 [Coze 平台](https://www.coze.cn/)
2. 进入 **个人中心** 或 **开发者设置**
3. 找到 **API Token** 或 **访问令牌** 选项
4. 创建或复制你的 API Token

### 2. 获取 Bot ID

1. 在 Coze 平台选择你要接入的 Bot
2. 进入 Bot 设置页面
3. 找到 **Bot ID**（通常在基本信息或发布设置中）

### 3. 验证 API 权限

确保你的 Bot 已启用 API 访问权限：
- 检查 Bot 的发布设置
- 确认 API 接口已开放

## ⚙️ 配置环境变量

在项目根目录创建 `.env.local` 文件，添加以下配置：

```env
# Coze API 配置
COZE_API_BASE_URL=https://api.coze.cn
COZE_API_TOKEN=your_api_token_here
COZE_BOT_ID=your_bot_id_here
```

### 环境变量说明

| 变量名 | 说明 | 必填 | 示例值 |
|--------|------|------|--------|
| `COZE_API_BASE_URL` | Coze API 基础 URL | 否 | `https://api.coze.cn` |
| `COZE_API_TOKEN` | API 访问令牌 | 是 | `pat_xxxx...` |
| `COZE_BOT_ID` | Bot 机器人 ID | 是 | `7xxxx...` |

## 🚀 启动项目

配置完成后，重启开发服务器：

```bash
# 停止当前服务（如果正在运行）
# Ctrl + C

# 重新启动
pnpm dev
```

## 🧪 测试接入

1. 访问 `http://localhost:5000`
2. 点击 "开始体验 Bot" 按钮
3. 发送测试消息

### 预期效果

- ✅ 消息成功发送到你的 Coze Bot
- ✅ 收到 Bot 的响应（支持流式输出）
- ✅ 响应以打字机效果逐步显示

## 🔍 故障排查

### 问题 1：未配置 Coze API Token 或 Bot ID

**错误信息**: `未配置 Coze API Token 或 Bot ID`

**解决方法**:
- 检查 `.env.local` 文件是否创建
- 确认 `COZE_API_TOKEN` 和 `COZE_BOT_ID` 已正确填写
- 重启开发服务器

### 问题 2：Coze API 调用失败 (401/403)

**错误信息**: `Coze API 调用失败: 401`

**解决方法**:
- 检查 API Token 是否正确
- 确认 API Token 未过期
- 检查 Bot ID 是否正确
- 确认 Bot 已发布并启用 API 访问

### 问题 3：收不到响应

**可能原因**:
- Bot 未配置回复逻辑
- Bot 处理时间过长
- API 返回数据结构变更

**解决方法**:
- 在 Coze 平台测试 Bot 是否正常工作
- 检查浏览器控制台是否有错误信息
- 查看 Network 标签中的 API 请求和响应

## 📚 相关文档

- [Coze 开发者文档](https://docs.coze.cn/)
- [Coze API 参考手册](https://docs.coze.cn/open_guides/)

## 🎯 进阶配置

### 自定义 API Base URL

如果使用自定义的 Coze API 服务：

```env
COZE_API_BASE_URL=https://your-custom-api.com
```

### 调整流式输出

在 `src/app/api/chat/route.ts` 中，可以通过 `stream` 参数控制是否使用流式输出：

```typescript
const { stream = true } = body;  // 改为 false 使用非流式输出
```

### 添加会话管理

如需支持多轮对话和上下文记忆，可以：
1. 在前端维护 `conversation_id`
2. 在 API 请求中传递会话 ID
3. 使用 Coze API 的会话管理功能

## 📞 支持

如遇到问题：
1. 检查本文档的故障排查部分
2. 查看浏览器控制台错误信息
3. 查看 Coze 平台的 API 文档
