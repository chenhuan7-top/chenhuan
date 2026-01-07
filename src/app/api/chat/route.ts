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
      stream: stream,
      additional_messages: [
        {
          role: "user",
          content: message,
          content_type: "text"
        }
      ]
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
    console.log("Coze API response:", JSON.stringify(data, null, 2));
    console.log("Data structure:", {
      hasData: !!data.data,
      dataStatus: data.data?.status,
      errorCode: data.code,
      errorMsg: data.msg
    });

    // 如果状态是 in_progress，需要轮询获取结果
    if (data.code === 0 && data.data?.status === "in_progress") {
      const conversationId = data.data.conversation_id;
      const chatId = data.data.id;

      // 轮询等待 Bot 完成回复
      let attempts = 0;
      const maxAttempts = 30; // 最多轮询 30 次
      let finalReply = "抱歉，没有收到回复。";

      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // 等待 1 秒

        // 查询对话结果
        const statusResponse = await fetch(
          `${COZE_API_BASE_URL}/v3/chat/retrieve?conversation_id=${conversationId}&chat_id=${chatId}`,
          {
            method: "GET",
            headers: {
              "Authorization": `Bearer ${COZE_API_TOKEN}`,
              "Content-Type": "application/json"
            }
          }
        );

        if (statusResponse.ok) {
          const statusData = await statusResponse.json();

          if (statusData.data?.status === "completed") {
            // 获取消息列表
            const messagesResponse = await fetch(
              `${COZE_API_BASE_URL}/v3/chat/message/list?conversation_id=${conversationId}&chat_id=${chatId}`,
              {
                method: "GET",
                headers: {
                  "Authorization": `Bearer ${COZE_API_TOKEN}`,
                  "Content-Type": "application/json"
                }
              }
            );

            if (messagesResponse.ok) {
              const messagesData = await messagesResponse.json();
              // 查找 assistant 的最后一条消息
              const assistantMessages = messagesData.data?.filter(
                (msg: any) => msg.role === "assistant" && msg.type === "answer"
              );
              if (assistantMessages && assistantMessages.length > 0) {
                const lastMessage = assistantMessages[assistantMessages.length - 1];
                finalReply = lastMessage.content || "抱歉，没有收到回复。";
                console.log("Found assistant message:", finalReply);
              } else {
                console.log("No answer message found, messages:", JSON.stringify(messagesData.data?.map((m: any) => ({ role: m.role, type: m.type, content: m.content?.substring(0, 100) }))));
              }
            }
            break;
          } else if (statusData.data?.status === "failed") {
            finalReply = "抱歉，Bot 处理失败。";
            break;
          }
        }

        attempts++;
      }

      return NextResponse.json({
        reply: finalReply,
        debug: process.env.NODE_ENV === "development" ? data : undefined
      });
    }

    // 尝试多种可能的回复字段（直接返回）
    const reply =
      data.data?.[0]?.content ||
      data.messages?.[0]?.content ||
      data.answer ||
      data.reply ||
      "抱歉，没有收到回复。";

    return NextResponse.json({ reply, debug: process.env.NODE_ENV === "development" ? data : undefined });

  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "服务器内部错误" },
      { status: 500 }
    );
  }
}
