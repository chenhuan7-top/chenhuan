import { NextRequest, NextResponse } from "next/server";

// Coze API 配置（需要从环境变量或用户配置中获取）
const COZE_API_BASE_URL = process.env.COZE_API_BASE_URL || "https://api.coze.cn";
const COZE_API_TOKEN = process.env.COZE_API_TOKEN || "";
const COZE_BOT_ID = process.env.COZE_BOT_ID || "";

/**
 * 聊天 API - 调用 Coze Agent
 * 支持流式和非流式响应
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, userId, stream = true } = body;

    // 验证必要参数
    if (!message) {
      return NextResponse.json(
        { error: "消息内容不能为空" },
        { status: 400 }
      );
    }

    if (!COZE_API_TOKEN || !COZE_BOT_ID) {
      return NextResponse.json(
        {
          error: "未配置 Coze API Token 或 Bot ID",
          hint: "请在环境变量中设置 COZE_API_TOKEN 和 COZE_BOT_ID"
        },
        { status: 500 }
      );
    }

    // 构建请求头
    const headers = {
      "Authorization": `Bearer ${COZE_API_TOKEN}`,
      "Content-Type": "application/json",
      "Accept": stream ? "text/event-stream" : "application/json"
    };

    // 构建请求体（根据 Coze API v3 规范）
    const requestBody = {
      bot_id: COZE_BOT_ID,
      user_id: userId || `user_${Date.now()}`,
      query: message,
      stream: stream,
      additional_messages: []
    };

    // 发送请求到 Coze API
    const response = await fetch(`${COZE_API_BASE_URL}/v3/chat`, {
      method: "POST",
      headers,
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Coze API error:", errorText);
      return NextResponse.json(
        { error: `Coze API 调用失败: ${response.status} ${errorText}` },
        { status: response.status }
      );
    }

    // 处理流式响应
    if (stream) {
      const encoder = new TextEncoder();
      const streamResponse = new ReadableStream({
        async start(controller) {
          const reader = response.body?.getReader();
          if (!reader) {
            controller.close();
            return;
          }

          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              const chunk = decoder.decode(value);
              const lines = chunk.split("\n");

              for (const line of lines) {
                if (line.startsWith("data: ")) {
                  const data = line.slice(6);
                  if (data === "[DONE]") {
                    controller.enqueue(encoder.encode("data: [DONE]\n\n"));
                    continue;
                  }

                  try {
                    const parsed = JSON.parse(data);
                    // 根据 Coze API 返回的数据结构提取消息
                    if (parsed.event === "conversation.message.delta") {
                      const content = parsed.data?.content || "";
                      if (content) {
                        controller.enqueue(
                          encoder.encode(`data: ${JSON.stringify({ content })}\n\n`)
                        );
                      }
                    }
                  } catch (e) {
                    console.error("Failed to parse SSE data:", e);
                  }
                }
              }
            }
          } catch (error) {
            console.error("Stream error:", error);
          } finally {
            controller.close();
          }
        }
      });

      const decoder = new TextDecoder();

      return new NextResponse(streamResponse, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive"
        }
      });
    }

    // 处理非流式响应
    const data = await response.json();
    const reply = data.data?.[0]?.content || "抱歉，没有收到回复。";

    return NextResponse.json({ reply });

  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "服务器内部错误" },
      { status: 500 }
    );
  }
}
