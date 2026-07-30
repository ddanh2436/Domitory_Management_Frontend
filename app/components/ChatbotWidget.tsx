'use client';

import React, { useState, useRef, useEffect } from 'react';

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
}

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: 'welcome', sender: 'bot', text: 'Xin chào! Tôi có thể giúp gì cho bạn hôm nay?' },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isStreaming) return;

    const currentInput = inputValue.trim();
    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: currentInput,
    };
    const botMsgId = (Date.now() + 1).toString();

    setMessages((prev) => [...prev, userMsg, { id: botMsgId, sender: 'bot', text: '' }]);
    setInputValue('');
    setIsStreaming(true);

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';

      // Xử lý URL backend cho cả 2 trường hợp:
      // NEXT_PUBLIC_API_URL=http://localhost:3001
      // hoặc NEXT_PUBLIC_API_URL=http://localhost:3001/api
      const rawBase =
        (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').trim().replace(/\/$/, '');

      let base = rawBase;
      if (base.endsWith('/api')) {
        base = base.slice(0, -4); // bỏ /api nếu env đã có
      }

      const candidates = [
        `${base}/api/chatbot/stream`,
        `${base}/chatbot/stream`,
        '/api/chatbot/stream',
        '/chatbot/stream',
      ];

      let response: Response | null = null;
      let lastError: unknown = null;

      for (const url of candidates) {
        try {
          const res = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ message: currentInput }),
          });

          if (res.status === 404) {
            lastError = new Error(`404 at ${url}`);
            continue;
          }

          if (!res.ok) {
            throw new Error(`HTTP ${res.status}`);
          }

          response = res;
          break;
        } catch (err) {
          lastError = err;
        }
      }

      if (!response || !response.body) {
        throw lastError ?? new Error('Không có luồng dữ liệu nào được trả về');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      let fullText = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        let boundary = buffer.indexOf('\n\n');
        while (boundary !== -1) {
          const rawEvent = buffer.slice(0, boundary);
          buffer = buffer.slice(boundary + 2);

          const line = rawEvent
            .split('\n')
            .find((item) => item.startsWith('data:'));

          if (line) {
            const dataStr = line.replace(/^data:\s*/, '').trim();

            if (!dataStr || dataStr === '[DONE]') {
              boundary = buffer.indexOf('\n\n');
              continue;
            }

            try {
              const data = JSON.parse(dataStr);
              const text = data.text ?? '';
              if (text) {
                fullText += text;
                setMessages((prev) =>
                  prev.map((msg) => (msg.id === botMsgId ? { ...msg, text: fullText } : msg)),
                );
              }
            } catch {
              if (dataStr) {
                fullText += dataStr;
                setMessages((prev) =>
                  prev.map((msg) => (msg.id === botMsgId ? { ...msg, text: fullText } : msg)),
                );
              }
            }
          }

          boundary = buffer.indexOf('\n\n');
        }
      }

      if (buffer.trim()) {
        try {
          const data = JSON.parse(buffer.trim());
          const text = data.text ?? '';
          if (text) {
            fullText += text;
            setMessages((prev) =>
              prev.map((msg) => (msg.id === botMsgId ? { ...msg, text: fullText } : msg)),
            );
          }
        } catch {
          if (buffer.trim()) {
            fullText += buffer.trim();
            setMessages((prev) =>
              prev.map((msg) => (msg.id === botMsgId ? { ...msg, text: fullText } : msg)),
            );
          }
        }
      }
    } catch (error) {
      console.error('Lỗi Streaming:', error);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          sender: 'bot',
          text: 'Xin lỗi, đã có lỗi xảy ra khi kết nối. Vui lòng kiểm tra backend hoặc URL API.',
        },
      ]);
    } finally {
      setIsStreaming(false);
    }
  };

  const latestBotMessageId = [...messages]
    .filter((msg) => msg.sender === 'bot')
    .slice(-1)[0]?.id;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen && (
        <div className="flex flex-col w-80 h-96 bg-white rounded-lg shadow-xl border border-gray-200 mb-4 overflow-hidden">
          <div className="bg-slate-800 text-white p-3 font-semibold flex justify-between items-center">
            <span>Dormify Assistant</span>
            <button onClick={() => setIsOpen(false)} className="text-white hover:text-gray-300 focus:outline-none">
              &#10005;
            </button>
          </div>

          <div className="flex-1 p-3 overflow-y-auto bg-gray-50 flex flex-col space-y-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`max-w-[85%] p-2.5 rounded-lg text-sm leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-blue-600 text-white self-end rounded-br-none'
                    : 'bg-gray-200 text-gray-800 self-start rounded-bl-none'
                }`}
              >
                {msg.text}
                {isStreaming && msg.id === latestBotMessageId && msg.sender === 'bot' && (
                  <span className="animate-pulse ml-1 font-bold">|</span>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-3 bg-white border-t border-gray-200 flex gap-2">
            <input
              type="text"
              className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-slate-800"
              placeholder="Hỏi tôi bất cứ điều gì..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              disabled={isStreaming}
            />
            <button
              onClick={handleSendMessage}
              disabled={isStreaming || !inputValue.trim()}
              className="bg-slate-800 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-slate-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              Gửi
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-slate-800 rounded-full shadow-lg flex items-center justify-center text-white hover:bg-slate-700 transition-transform hover:scale-105 focus:outline-none ml-auto"
      >
        {isOpen ? (
          <span className="text-2xl">&#10005;</span>
        ) : (
          <span className="text-2xl">&#128172;</span>
        )}
      </button>
    </div>
  );
}