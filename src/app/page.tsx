"use client";

import { useState, useEffect, useRef } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
}

export default function PersonalWebsite() {
  const [showChat, setShowChat] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const currentAssistantMessageRef = useRef<string>("");

  // 星空背景动画
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // 创建星星
    const stars: Array<{ x: number; y: number; size: number; brightness: number; speed: number }> = [];
    const numStars = 300;
    for (let i = 0; i < numStars; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2 + 0.5,
        brightness: Math.random(),
        speed: Math.random() * 0.02 + 0.01
      });
    }

    // 银河效果
    let galaxyRotation = 0;

    const animate = () => {
      // 深邃背景渐变
      const gradient = ctx.createRadialGradient(
        canvas.width / 2,
        canvas.height / 2,
        0,
        canvas.width / 2,
        canvas.height / 2,
        canvas.width
      );
      gradient.addColorStop(0, "#0a0a1a");
      gradient.addColorStop(0.5, "#050510");
      gradient.addColorStop(1, "#000005");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 绘制银河
      galaxyRotation += 0.0005;
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(galaxyRotation);

      for (let i = 0; i < 5; i++) {
        const galaxyGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, canvas.width * 0.6);
        galaxyGradient.addColorStop(0, `hsla(${220 + i * 20}, 60%, 50%, 0.05)`);
        galaxyGradient.addColorStop(0.5, `hsla(${240 + i * 15}, 70%, 40%, 0.02)`);
        galaxyGradient.addColorStop(1, "transparent");

        ctx.fillStyle = galaxyGradient;
        ctx.beginPath();
        ctx.ellipse(0, 0, canvas.width * 0.5, canvas.width * 0.15, (i * Math.PI) / 5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // 绘制星星
      stars.forEach((star) => {
        star.brightness += star.speed;
        const opacity = Math.sin(star.brightness) * 0.5 + 0.5;

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
        ctx.fill();

        // 为部分大星星添加光晕
        if (star.size > 1.5) {
          const glow = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, star.size * 4);
          glow.addColorStop(0, `rgba(200, 220, 255, ${opacity * 0.3})`);
          glow.addColorStop(1, "transparent");
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.size * 4, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
    };
  }, []);

  // 滚动聊天到底部
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // 发送消息到 Coze Agent
  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setError(null);

    // 添加用户消息
    const newMessages: Message[] = [...messages, { role: "user", content: userMessage }];
    setMessages(newMessages);
    setIsLoading(true);

    // 初始化助手消息
    currentAssistantMessageRef.current = "";
    const assistantMessageIndex = newMessages.length;
    setMessages([...newMessages, { role: "assistant", content: "", isStreaming: true }]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: userMessage,
          userId: `user_${Date.now()}`,
          stream: false
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "请求失败");
      }

      // 处理流式响应
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("无法读取响应流");
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") {
              break;
            }

            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                currentAssistantMessageRef.current += parsed.content;
                setMessages((prev) => {
                  const updated = [...prev];
                  if (updated[assistantMessageIndex]) {
                    updated[assistantMessageIndex] = {
                      ...updated[assistantMessageIndex],
                      content: currentAssistantMessageRef.current
                    };
                  }
                  return updated;
                });
              }
            } catch (e) {
              console.error("Failed to parse SSE data:", e);
            }
          }
        }
      }

      // 完成流式输出
      setMessages((prev) => {
        const updated = [...prev];
        if (updated[assistantMessageIndex]) {
          updated[assistantMessageIndex] = {
            ...updated[assistantMessageIndex],
            isStreaming: false
          };
        }
        return updated;
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "发送失败";
      setError(errorMessage);
      setMessages((prev) => {
        const updated = [...prev];
        if (updated[assistantMessageIndex]) {
          updated[assistantMessageIndex] = {
            ...updated[assistantMessageIndex],
            content: `❌ ${errorMessage}`,
            isStreaming: false
          };
        }
        return updated;
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* 星空背景 */}
      <canvas ref={canvasRef} className="fixed inset-0 -z-10" />

      {/* 主内容 */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4">
        <div className="text-center space-y-6 max-w-3xl">
          {/* 欢迎标题 */}
          <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight">
            欢迎来到我的空间
          </h1>

          {/* 副标题 */}
          <p className="text-xl md:text-2xl text-zinc-300 font-light leading-relaxed">
            探索无限可能，体验智能对话
          </p>

          {/* 分割线 */}
          <div className="w-24 h-px bg-gradient-to-r from-transparent via-zinc-500 to-transparent mx-auto" />

          {/* 描述文字 */}
          <p className="text-lg text-zinc-400 font-light max-w-2xl mx-auto">
            在这里，你可以与我的 AI Bot 进行深度交流，探索知识的边界
          </p>

          {/* 体验按钮 */}
          <button
            onClick={() => setShowChat(true)}
            className="mt-8 px-8 py-4 bg-white/10 backdrop-blur-sm text-white rounded-full
                     border border-white/20 hover:bg-white/20 hover:scale-105
                     transition-all duration-300 font-medium text-lg
                     shadow-lg hover:shadow-xl"
          >
            开始体验 Bot
          </button>
        </div>

        {/* 底部版权信息 */}
        <div className="absolute bottom-8 text-zinc-500 text-sm">
          © 2024 My Personal Space. All rights reserved.
        </div>
      </div>

      {/* Chat 弹窗 */}
      {showChat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0, 0, 0, 0.7)" }}>
          <div className="w-full max-w-2xl bg-zinc-900/95 backdrop-blur-sm rounded-2xl border border-zinc-700/50 overflow-hidden shadow-2xl">
            {/* Chat 头部 */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-700/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <span className="text-white text-lg">🤖</span>
                </div>
                <div>
                  <h3 className="text-white font-semibold">我的 AI Bot</h3>
                  <p className="text-zinc-400 text-sm">在线</p>
                </div>
              </div>
              <button
                onClick={() => setShowChat(false)}
                className="text-zinc-400 hover:text-white transition-colors p-2"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Chat 消息区 */}
            <div ref={chatContainerRef} className="h-96 overflow-y-auto px-6 py-4 space-y-4">
              {messages.length === 0 && (
                <div className="text-center text-zinc-500 py-12">
                  <p className="text-4xl mb-4">💬</p>
                  <p>开始与我的 AI Bot 对话吧！</p>
                </div>
              )}

              {messages.map((msg, index) => (
                <div key={index} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[70%] px-4 py-3 rounded-2xl ${
                      msg.role === "user"
                        ? "bg-gradient-to-br from-blue-600 to-purple-600 text-white"
                        : "bg-zinc-800 text-zinc-200 border border-zinc-700"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                    {msg.isStreaming && (
                      <span className="inline-block ml-1 animate-pulse">▋</span>
                    )}
                  </div>
                </div>
              ))}

              {isLoading && !error && (
                <div className="flex justify-start">
                  <div className="bg-zinc-800 text-zinc-200 px-4 py-3 rounded-2xl border border-zinc-700">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" />
                      <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                      <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Chat 输入区 */}
            <div className="border-t border-zinc-700/50 p-4">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                  placeholder="输入你的消息..."
                  disabled={isLoading}
                  className="flex-1 bg-zinc-800 border border-zinc-700 rounded-full px-4 py-3
                           text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500
                           transition-colors disabled:opacity-50"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!input.trim() || isLoading}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full
                           hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:hover:scale-100"
                >
                  发送
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
