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
    interface Star {
      x: number;
      y: number;
      size: number;
      brightness: number;
      speed: number;
      color: string;
      glowColor: string;
    }

    const stars: Star[] = [];
    const numStars = 400;

    // 苍茫色系：银白色、淡蓝色、青色
    const coldColors = [
      "#E8F4F8", // 银白色
      "#C9D6DF", // 淡蓝灰色
      "#A7C7E7", // 淡蓝色
      "#B0E0E6", // 粉蓝色
      "#C0D8E8", // 冰蓝色
      "#D6EAF8", // 淡青色
    ];

    for (let i = 0; i < numStars; i++) {
      const colorIndex = Math.floor(Math.random() * coldColors.length);
      const size = Math.random() * 3 + 0.5;

      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: size,
        brightness: Math.random(),
        speed: Math.random() * 0.03 + 0.01,
        color: coldColors[colorIndex],
        glowColor: coldColors[colorIndex]
      });
    }

    // 流星数组
    interface Meteor {
      x: number;
      y: number;
      length: number;
      speed: number;
      opacity: number;
    }

    let meteors: Meteor[] = [];

    // 银河效果
    let galaxyRotation = 0;

    // 星云效果
    interface Nebula {
      x: number;
      y: number;
      radius: number;
      hue: number;
      opacity: number;
    }

    const nebulas: Nebula[] = [
      { x: canvas.width * 0.3, y: canvas.height * 0.4, radius: 300, hue: 210, opacity: 0.1 },
      { x: canvas.width * 0.7, y: canvas.height * 0.6, radius: 350, hue: 220, opacity: 0.08 },
    ];

    // 创建流星
    const createMeteor = () => {
      return {
        x: Math.random() * canvas.width,
        y: -100,
        length: Math.random() * 100 + 50,
        speed: Math.random() * 15 + 10,
        opacity: 1
      };
    };

    // 绘制函数
    const animate = () => {
      // 苍茫背景渐变
      const gradient = ctx.createRadialGradient(
        canvas.width / 2,
        canvas.height / 2,
        0,
        canvas.width / 2,
        canvas.height / 2,
        canvas.width
      );
      gradient.addColorStop(0, "#0a0f1a"); // 中心：深蓝灰
      gradient.addColorStop(0.3, "#050810"); // 中层：深蓝
      gradient.addColorStop(0.6, "#020408"); // 外层：深灰蓝
      gradient.addColorStop(1, "#000000"); // 边缘：纯黑
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 绘制星云
      nebulas.forEach(nebula => {
        const nebulaGradient = ctx.createRadialGradient(
          nebula.x, nebula.y, 0,
          nebula.x, nebula.y, nebula.radius
        );
        nebulaGradient.addColorStop(0, `hsla(${nebula.hue}, 60%, 50%, ${nebula.opacity})`);
        nebulaGradient.addColorStop(0.5, `hsla(${nebula.hue + 10}, 50%, 40%, ${nebula.opacity * 0.5})`);
        nebulaGradient.addColorStop(1, "transparent");

        ctx.fillStyle = nebulaGradient;
        ctx.beginPath();
        ctx.arc(nebula.x, nebula.y, nebula.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      // 绘制银河（增强温度感）
      galaxyRotation += 0.0008;
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(galaxyRotation);

      for (let i = 0; i < 8; i++) {
        const galaxyGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, canvas.width * 0.6);
        const hue = 200 + i * 5; // 银色到淡蓝的渐变
        galaxyGradient.addColorStop(0, `hsla(${hue}, 50%, 60%, 0.08)`);
        galaxyGradient.addColorStop(0.5, `hsla(${hue + 10}, 40%, 50%, 0.04)`);
        galaxyGradient.addColorStop(1, "transparent");

        ctx.fillStyle = galaxyGradient;
        ctx.beginPath();
        ctx.ellipse(0, 0, canvas.width * 0.6, canvas.width * 0.18, (i * Math.PI) / 8, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // 绘制星星（增强闪烁效果）
      stars.forEach((star) => {
        star.brightness += star.speed;
        const opacity = Math.sin(star.brightness) * 0.7 + 0.3;

        // 绘制光晕（增强温度感）
        if (star.size > 2) {
          const glow = ctx.createRadialGradient(
            star.x, star.y, 0,
            star.x, star.y, star.size * 6
          );
          glow.addColorStop(0, `${star.color}${Math.floor(opacity * 0.6).toString(16).padStart(2, '0')}`);
          glow.addColorStop(0.5, `${star.color}${Math.floor(opacity * 0.3).toString(16).padStart(2, '0')}`);
          glow.addColorStop(1, "transparent");

          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.size * 6, 0, Math.PI * 2);
          ctx.fill();
        }

        // 绘制星星本体
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fillStyle = star.color;
        ctx.globalAlpha = opacity;
        ctx.fill();
        ctx.globalAlpha = 1;
      });

      // 随机生成流星
      if (Math.random() < 0.02) {
        meteors.push(createMeteor());
      }

      // 绘制和更新流星
      meteors = meteors.filter(meteor => {
        meteor.x += meteor.speed;
        meteor.y += meteor.speed * 0.6;
        meteor.opacity -= 0.015;

        if (meteor.opacity <= 0) return false;

        // 绘制流星尾巴
        const meteorGradient = ctx.createLinearGradient(
          meteor.x, meteor.y,
          meteor.x - meteor.length, meteor.y - meteor.length * 0.6
        );
        meteorGradient.addColorStop(0, `rgba(192, 224, 232, ${meteor.opacity})`);
        meteorGradient.addColorStop(1, "transparent");

        ctx.strokeStyle = meteorGradient;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(meteor.x, meteor.y);
        ctx.lineTo(meteor.x - meteor.length, meteor.y - meteor.length * 0.6);
        ctx.stroke();

        // 流星头部
        ctx.beginPath();
        ctx.arc(meteor.x, meteor.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${meteor.opacity})`;
        ctx.fill();

        return true;
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

    const newMessages: Message[] = [...messages, { role: "user", content: userMessage }];
    setMessages(newMessages);
    setIsLoading(true);

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

      const data = await response.json();
      const reply = data.reply || "抱歉，没有收到回复。";

      setMessages((prev) => {
        const updated = [...prev];
        if (updated[assistantMessageIndex]) {
          updated[assistantMessageIndex] = {
            ...updated[assistantMessageIndex],
            content: reply,
            isStreaming: false
          };
        }
        return updated;
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "发送失败";
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
        <div className="text-center space-y-8 max-w-4xl">
          {/* Logo 和标题 */}
          <div className="space-y-4">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-slate-400 to-cyan-500 shadow-2xl mb-4 animate-pulse">
              <span className="text-4xl">✨</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-slate-200 via-blue-100 to-cyan-200 tracking-tight drop-shadow-lg">
              探索未来更多可能
            </h1>
          </div>

          {/* 副标题 */}
          <p className="text-xl md:text-2xl text-slate-100/80 font-light leading-relaxed">
            探索 AI 的无限可能，创造属于你的星辰
          </p>

          {/* 理念展示 */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-cyan-500/20 max-w-2xl mx-auto">
            <p className="text-lg text-slate-50/70 font-light leading-relaxed italic">
              "由我打造的智能体，将会像星辰一般闪耀下去"
            </p>
          </div>

          {/* 分割线 */}
          <div className="w-32 h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent mx-auto" />

          {/* 描述文字 */}
          <div className="text-slate-100/60 font-light max-w-2xl mx-auto space-y-2">
            <p>在这里，我们研究智能体的温度与光芒</p>
            <p>每一个智能体，都是一颗独特的星辰</p>
            <p>在 AI 的星空中，闪耀着属于自己的光辉</p>
          </div>

          {/* 体验按钮 */}
          <div className="pt-4">
            <button
              onClick={() => setShowChat(true)}
              className="px-10 py-4 bg-gradient-to-r from-slate-500 to-cyan-500 text-white rounded-full
                       border border-cyan-400/30 hover:scale-105 hover:shadow-2xl hover:shadow-cyan-500/30
                       transition-all duration-300 font-medium text-lg
                       backdrop-blur-sm"
            >
              🌟 与天启对话
            </button>
          </div>

          {/* 特性标签 */}
          <div className="flex flex-wrap justify-center gap-3 pt-6">
            {["温度", "创新", "未来", "智慧", "探索"].map((tag) => (
              <span
                key={tag}
                className="px-4 py-1.5 bg-white/5 backdrop-blur-sm text-slate-100/70 rounded-full
                         border border-cyan-500/20 text-sm font-light"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* 底部版权信息 */}
        <div className="absolute bottom-8 text-slate-200/40 text-sm">
          <p>© 2024 智能体研究空间 · 天启</p>
          <p className="text-xs mt-1">每颗星辰都有属于它的温度</p>
        </div>
      </div>

      {/* Chat 弹窗 */}
      {showChat && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.8)" }}
        >
          <div className="w-full max-w-2xl bg-gradient-to-br from-zinc-900/98 to-zinc-800/98 backdrop-blur-sm rounded-2xl border border-cyan-500/30 overflow-hidden shadow-2xl shadow-cyan-500/20">
            {/* Chat 头部 */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-cyan-500/20 bg-gradient-to-r from-slate-900/10 to-cyan-900/10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-400 to-cyan-500 flex items-center justify-center shadow-lg">
                  <span className="text-2xl">🌟</span>
                </div>
                <div>
                  <h3 className="text-white font-semibold text-lg">天启助手</h3>
                  <p className="text-slate-200/60 text-sm">你的智能天象助手</p>
                </div>
              </div>
              <button
                onClick={() => setShowChat(false)}
                className="text-slate-200/60 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-full"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M 18L 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Chat 消息区 */}
            <div ref={chatContainerRef} className="h-96 overflow-y-auto px-6 py-4 space-y-4 bg-zinc-900/50">
              {messages.length === 0 && (
                <div className="text-center text-slate-200/40 py-12">
                  <div className="text-6xl mb-4">🌌</div>
                  <p className="text-lg mb-2">欢迎来到智能体研究空间</p>
                  <p className="text-sm">开始与天启对话吧，探索 AI 的温度与光芒</p>
                </div>
              )}

              {messages.map((msg, index) => (
                <div key={index} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[75%] px-4 py-3 rounded-2xl ${
                      msg.role === "user"
                        ? "bg-gradient-to-br from-slate-500 to-cyan-600 text-white shadow-lg"
                        : "bg-zinc-800 text-slate-100 border border-cyan-500/20"
                    }`}
                  >
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                    {msg.isStreaming && (
                      <span className="inline-block ml-1 animate-pulse text-amber-400">✦</span>
                    )}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-zinc-800 text-slate-100 px-4 py-3 rounded-2xl border border-cyan-500/20">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" />
                      <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                      <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Chat 输入区 */}
            <div className="border-t border-cyan-500/20 p-4 bg-gradient-to-r from-slate-900/5 to-cyan-900/5">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                  placeholder="输入你的消息，探索星辰的奥秘..."
                  disabled={isLoading}
                  className="flex-1 bg-zinc-800/80 border border-cyan-500/30 rounded-full px-5 py-3
                           text-white placeholder-slate-200/40 focus:outline-none focus:border-cyan-500/60
                           focus:ring-2 focus:ring-cyan-500/20 transition-all disabled:opacity-50"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!input.trim() || isLoading}
                  className="px-6 py-3 bg-gradient-to-r from-slate-500 to-cyan-500 text-white rounded-full
                           hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/30
                           transition-all duration-300 disabled:opacity-50 disabled:hover:scale-100
                           flex items-center gap-2"
                >
                  <span>发送</span>
                  <span className="text-lg">✦</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
