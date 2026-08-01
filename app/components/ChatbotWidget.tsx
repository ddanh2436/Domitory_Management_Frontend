'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { getLoggedInUser, type UserRole } from '../utils/auth';
import { apiClient } from '../utils/apiClient';

// Thẻ hoá đơn do backend gửi kèm (sự kiện SSE type="invoice"). Số liệu được vẽ
// thành bảng ở đây thay vì để model tự kẻ bảng Markdown — tránh sai số tiền.
interface InvoiceCard {
  id: string;
  month: number;
  year: number;
  roomName: string;
  roomFee: number;
  electricityFee: number;
  waterFee: number;
  totalAmount: number;
  dueDate?: string;
  status: string;
}

// Các sự kiện backend đẩy qua SSE (khớp ChatStreamEvent phía NestJS).
type StreamEvent =
  | { type: 'status'; status?: string }
  | { type: 'text'; text?: string }
  | { type: 'sources'; sources?: string[] }
  | { type: 'invoice'; invoice: InvoiceCard }
  | { type: 'notfound'; suggestions?: string[] };

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  time: string;
  sources?: string[];
  invoice?: InvoiceCard;
  notFound?: boolean;
  suggestions?: string[];
  verdict?: 'UP' | 'DOWN';
}

// Lượt hội thoại gửi kèm cho backend để bot hiểu câu hỏi nối tiếp.
interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

const WELCOME_TEXT = 'Chào bạn, tôi là trợ lý ảo của Dormify. Tôi có thể giúp gì cho bạn hôm nay?';

// Cờ ghi nhớ đã mời chào / đã mở chatbot, để bong bóng giới thiệu không lặp lại
// làm phiền người dùng cũ.
const INVITE_KEY = 'dormify-ai-invited';
const SEEN_KEY = 'dormify-ai-seen';
// Lịch sử chat của phiên hiện tại. Dùng sessionStorage (không phải localStorage)
// để đóng tab là sạch — hội thoại có chứa hoá đơn, phòng ở của sinh viên.
const HISTORY_KEY = 'dormify-ai-history';

// Số lượt gửi kèm cho backend. Backend cũng tự cắt lại, đây chỉ là để đỡ tốn băng thông.
const HISTORY_TURNS = 4;
// Trần số tin nhắn lưu lại, tránh sessionStorage phình vô hạn trong phiên dài.
const MAX_STORED_MESSAGES = 40;

const nowLabel = () =>
  new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('vi-VN').format(amount) + 'đ';

/* ── Icon ───────────────────────────────────────────────────────────────── */

const ChatIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M3 4h18v13H8l-5 4V4z"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinejoin="round"
      fill="none"
    />
    <path d="M7.5 8.5h9M7.5 12h6" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
  </svg>
);

const ArrowIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M4 12h15M13 6l6 6-6 6" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ThumbIcon = ({ down = false }: { down?: boolean }) => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
    style={down ? { transform: 'rotate(180deg)' } : undefined}
  >
    <path
      d="M7 22V10L13 2l1.5 1.2a2 2 0 01.6 2.2L14 10h5.5a2 2 0 012 2.5l-1.8 7A2 2 0 0117.7 21H7z"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinejoin="round"
    />
    <path d="M7 10H3v12h4" stroke="currentColor" strokeWidth={2} strokeLinejoin="round" />
  </svg>
);

const CopyIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="9" y="9" width="12" height="12" rx="2" stroke="currentColor" strokeWidth={2} />
    <path d="M5 15V5a2 2 0 012-2h10" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
  </svg>
);

const DocIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8l-5-5z" stroke="currentColor" strokeWidth={2} strokeLinejoin="round" />
    <path d="M14 3v5h5" stroke="currentColor" strokeWidth={2} strokeLinejoin="round" />
  </svg>
);

const AlertIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth={2} />
    <path d="M12 7.5v5.5M12 16.5v.5" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
  </svg>
);

/* ── Định dạng câu trả lời ──────────────────────────────────────────────── */

// Model trả về Markdown nhẹ (**đậm**, gạch đầu dòng, danh sách đánh số). Dựng lại
// bằng tay thay vì kéo cả thư viện Markdown về cho một khung chat 400px.
function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**') ? (
      <strong key={`${keyPrefix}-${i}`}>{part.slice(2, -2)}</strong>
    ) : (
      <React.Fragment key={`${keyPrefix}-${i}`}>{part}</React.Fragment>
    ),
  );
}

function RichText({ text }: { text: string }) {
  const blocks: React.ReactNode[] = [];
  let listBuffer: { marker: string; body: string }[] = [];

  const flushList = (key: string) => {
    if (listBuffer.length === 0) return;
    const items = listBuffer;
    listBuffer = [];
    blocks.push(
      <ul className="dai-list" key={key}>
        {items.map((item, i) => (
          <li key={i}>
            <span className="dai-list-marker">{item.marker}</span>
            <span>{renderInline(item.body, `${key}-${i}`)}</span>
          </li>
        ))}
      </ul>,
    );
  };

  text.split('\n').forEach((rawLine, index) => {
    const line = rawLine.trim();
    if (!line) {
      flushList(`list-${index}`);
      return;
    }

    const numbered = line.match(/^(\d+)[.)]\s+(.*)$/);
    const bulleted = line.match(/^[-*+•]\s+(.*)$/);

    if (numbered) {
      listBuffer.push({ marker: numbered[1], body: numbered[2] });
      return;
    }
    if (bulleted) {
      listBuffer.push({ marker: '·', body: bulleted[1] });
      return;
    }

    flushList(`list-${index}`);
    blocks.push(
      <p className="dai-p" key={`p-${index}`}>
        {renderInline(line.replace(/^#{1,6}\s*/, ''), `p-${index}`)}
      </p>,
    );
  });

  flushList('list-end');
  return <>{blocks}</>;
}

/* ── Widget ─────────────────────────────────────────────────────────────── */

export default function ChatbotWidget() {
  // Endpoint /chatbot/stream yêu cầu đăng nhập, nên chỉ hiện widget cho user đã đăng nhập.
  // Kiểm tra sau khi mount để tránh lệch hydration (localStorage chỉ có ở client).
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [role, setRole] = useState<UserRole | null>(null);
  const [fullName, setFullName] = useState('');

  const [isOpen, setIsOpen] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [hasUnseenBadge, setHasUnseenBadge] = useState(false);

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [status, setStatus] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  // Cho phép cắt ngang luồng đang chạy. Không có nó thì đóng khung chat xong
  // Ollama vẫn sinh nốt cả nghìn token — tốn CPU và làm câu hỏi sau chậm theo.
  const abortRef = useRef<AbortController | null>(null);

  const isStudent = role === 'STUDENT';

  useEffect(() => {
    const user = getLoggedInUser();
    if (!user) return;

    setIsAuthenticated(true);
    setRole(user.role);
    setHasUnseenBadge(localStorage.getItem(SEEN_KEY) !== '1');

    // Khôi phục hội thoại của phiên: F5 giữa chừng không còn mất sạch nội dung.
    try {
      const saved = sessionStorage.getItem(HISTORY_KEY);
      if (saved) {
        const parsed: unknown = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) setMessages(parsed as Message[]);
      }
    } catch {
      sessionStorage.removeItem(HISTORY_KEY);
    }

    // Tên thật để chào đúng người; hỏng thì vẫn chạy với lời chào chung.
    void apiClient
      .get('/users/profile')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const name: string | undefined = data?.fullName;
        if (name) setFullName(name.trim().split(' ').slice(-1)[0]);
      })
      .catch(() => undefined);
  }, []);

  // Bong bóng mời chào: chỉ hiện MỘT lần mỗi phiên, sau 2 giây (để trang kịp vẽ
  // xong), tự ẩn sau 8 giây. Mục đích là cho sinh viên biết có trợ lý ở đây,
  // không phải bắt họ tắt đi mỗi lần đổi trang.
  useEffect(() => {
    if (!isAuthenticated || isOpen) return;
    if (sessionStorage.getItem(INVITE_KEY) === '1') return;

    const showTimer = setTimeout(() => {
      setShowInvite(true);
      sessionStorage.setItem(INVITE_KEY, '1');
    }, 2000);
    const hideTimer = setTimeout(() => setShowInvite(false), 10000);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [isAuthenticated, isOpen]);

  useEffect(() => {
    if (isOpen) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, status, isOpen]);

  // Lưu lại sau mỗi thay đổi, nhưng bỏ qua lúc đang stream để không ghi
  // sessionStorage vài chục lần mỗi giây.
  useEffect(() => {
    if (isStreaming) return;

    if (messages.length === 0) {
      sessionStorage.removeItem(HISTORY_KEY);
      return;
    }

    try {
      sessionStorage.setItem(HISTORY_KEY, JSON.stringify(messages.slice(-MAX_STORED_MESSAGES)));
    } catch {
      // Hết dung lượng thì thôi, mất lịch sử không đáng để làm hỏng khung chat
    }
  }, [messages, isStreaming]);

  // Dừng luồng đang chạy khi rời trang, nếu không tab đóng rồi mà Ollama vẫn sinh tiếp.
  useEffect(() => () => abortRef.current?.abort(), []);

  const openChat = () => {
    setIsOpen(true);
    setShowInvite(false);
    setHasUnseenBadge(false);
    localStorage.setItem(SEEN_KEY, '1');
    setTimeout(() => inputRef.current?.focus(), 120);
  };

  const closeChat = () => {
    abortRef.current?.abort();
    setIsOpen(false);
  };

  const resetChat = () => {
    abortRef.current?.abort();
    setMessages([]);
    setInputValue('');
    setStatus('');
    sessionStorage.removeItem(HISTORY_KEY);
  };

  const sendMessage = useCallback(
    async (rawInput: string) => {
      const currentInput = rawInput.trim();
      if (!currentInput || isStreaming) return;

      // Lấy lịch sử TRƯỚC khi thêm lượt mới, và chỉ lấy lượt đã có nội dung.
      const history: ChatTurn[] = messages
        .filter((m) => m.text.trim().length > 0)
        .slice(-HISTORY_TURNS)
        .map((m) => ({ role: m.sender === 'user' ? 'user' : 'assistant', content: m.text }));

      const controller = new AbortController();
      abortRef.current = controller;

      const botMsgId = `bot-${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        { id: `user-${Date.now()}`, sender: 'user', text: currentInput, time: nowLabel() },
        { id: botMsgId, sender: 'bot', text: '', time: nowLabel() },
      ]);
      setInputValue('');
      setIsStreaming(true);
      setStatus('Đang tra cứu');

      const patchBot = (patch: Partial<Message>) =>
        setMessages((prev) => prev.map((m) => (m.id === botMsgId ? { ...m, ...patch } : m)));

      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';

        // Xử lý URL backend cho cả 2 trường hợp:
        // NEXT_PUBLIC_API_URL=http://localhost:3001
        // hoặc NEXT_PUBLIC_API_URL=http://localhost:3001/api
        const rawBase = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001')
          .trim()
          .replace(/\/$/, '');

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
              body: JSON.stringify({ message: currentInput, history }),
              signal: controller.signal,
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
            // Người dùng bấm đóng giữa chừng: dừng hẳn, đừng thử URL tiếp theo
            // (nếu không, hủy xong nó lại đi gọi lại chính request vừa hủy).
            if (err instanceof DOMException && err.name === 'AbortError') throw err;
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

        // Backend gửi các sự kiện có `type`: status | text | sources | invoice | notfound.
        const handleEvent = (payload: StreamEvent) => {
          switch (payload.type) {
            case 'status':
              setStatus(payload.status ?? '');
              return;
            case 'sources':
              patchBot({ sources: payload.sources ?? [] });
              return;
            case 'invoice':
              patchBot({ invoice: payload.invoice });
              return;
            case 'notfound':
              patchBot({ notFound: true, suggestions: payload.suggestions ?? [] });
              return;
            default: {
              // Không có `type` (bản backend cũ) thì mặc định coi là chữ
              const text = payload.text ?? '';
              if (!text) return;
              fullText += text;
              patchBot({ text: fullText });
            }
          }
        };

        const consume = (dataStr: string) => {
          if (!dataStr || dataStr === '[DONE]') return;
          try {
            handleEvent(JSON.parse(dataStr) as StreamEvent);
          } catch {
            // Chunk không phải JSON thì coi như chữ thuần
            fullText += dataStr;
            patchBot({ text: fullText });
          }
        };

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          let boundary = buffer.indexOf('\n\n');
          while (boundary !== -1) {
            const rawEvent = buffer.slice(0, boundary);
            buffer = buffer.slice(boundary + 2);

            const line = rawEvent.split('\n').find((item) => item.startsWith('data:'));
            if (line) consume(line.replace(/^data:\s*/, '').trim());

            boundary = buffer.indexOf('\n\n');
          }
        }

        if (buffer.trim()) {
          consume(buffer.trim().replace(/^data:\s*/, ''));
        }
      } catch (error) {
        // Hủy là hành động có chủ đích của người dùng, không phải lỗi — giữ lại
        // phần đã sinh được và im lặng.
        if (error instanceof DOMException && error.name === 'AbortError') {
          setMessages((prev) => prev.filter((m) => m.id !== botMsgId || m.text.trim().length > 0));
        } else {
          console.error('Lỗi Streaming:', error);
          patchBot({
            text: 'Xin lỗi, đã có lỗi xảy ra khi kết nối. Vui lòng kiểm tra backend hoặc URL API.',
          });
        }
      } finally {
        if (abortRef.current === controller) abortRef.current = null;
        setIsStreaming(false);
        setStatus('');
      }
    },
    [isStreaming, messages],
  );

  // Gửi 👍/👎. Cập nhật nút ngay rồi mới gọi API — phản hồi là việc phụ, không đáng
  // để sinh viên phải ngồi chờ. Gọi thất bại thì trả nút về trạng thái cũ.
  const handleVerdict = (msg: Message, verdict: 'UP' | 'DOWN') => {
    const next = msg.verdict === verdict ? undefined : verdict;
    setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, verdict: next } : m)));

    if (!next) return; // bấm lại lần nữa = bỏ đánh giá, không cần báo backend

    // Câu hỏi tương ứng là tin nhắn user ngay trước câu trả lời này
    const index = messages.findIndex((m) => m.id === msg.id);
    const question = [...messages.slice(0, index)].reverse().find((m) => m.sender === 'user')?.text;
    if (!question) return;

    void apiClient
      .post('/chatbot/feedback', {
        question,
        answer: msg.text,
        sources: msg.sources ?? [],
        verdict: next,
        notFound: msg.notFound ?? false,
      })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
      })
      .catch((err) => {
        console.error('Lỗi gửi phản hồi chatbot:', err);
        setMessages((prev) =>
          prev.map((m) => (m.id === msg.id ? { ...m, verdict: msg.verdict } : m)),
        );
      });
  };

  const handleCopy = (msg: Message) => {
    void navigator.clipboard?.writeText(msg.text).then(() => {
      setCopiedId(msg.id);
      setTimeout(() => setCopiedId(null), 1600);
    });
  };

  // Chưa đăng nhập thì không render gì (khách ở trang login sẽ không thấy widget)
  if (!isAuthenticated) return null;

  const starters = isStudent
    ? [
        { tag: 'Nội quy', text: 'Giờ đóng cửa KTX là mấy giờ?' },
        { tag: 'Hoá đơn', text: 'Hoá đơn tháng này của tôi?' },
        { tag: 'Điện nước', text: 'Định mức và đơn giá điện nước?' },
      ]
    : [
        { tag: 'Nội quy', text: 'Nội quy KTX gồm những mục nào?' },
        { tag: 'Gửi xe', text: 'Đăng ký vé xe cần những gì?' },
        { tag: 'Điện nước', text: 'Định mức và đơn giá điện nước?' },
      ];

  const lastBotId = [...messages].reverse().find((m) => m.sender === 'bot')?.id;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700&family=DM+Sans:wght@400;500;700&display=swap');

        .dai-root {
          --dai-navy: #0D1B2A;
          --dai-navy-mid: #1A2E42;
          --dai-gold: #C9A84C;
          --dai-gold-dim: rgba(201,168,76,0.14);
          --dai-gold-b: rgba(201,168,76,0.35);
          --dai-cream: #FAF7F0;
          --dai-bg: #F2EFE9;
          --dai-border: rgba(13,27,42,0.10);
          --dai-muted: #7C8899;

          position: fixed; right: 24px; bottom: 24px; z-index: 60;
          display: flex; flex-direction: column; align-items: flex-end; gap: 12px;
          font-family: 'DM Sans', system-ui, sans-serif;
        }
        .dai-root *, .dai-root *::before, .dai-root *::after { box-sizing: border-box; }

        /* ── Bong bóng mời chào ───────────────────────────────── */
        .dai-invite {
          position: relative; max-width: 264px; background: #fff; color: var(--dai-navy);
          border: 1px solid var(--dai-border); border-left: 3px solid var(--dai-gold);
          border-radius: 12px; padding: 13px 34px 13px 15px; cursor: pointer;
          box-shadow: 0 12px 32px rgba(13,27,42,0.16);
          animation: daiPop 0.32s cubic-bezier(0.2, 0.9, 0.3, 1.2);
          text-align: left;
        }
        .dai-invite-title { font-family: 'Fraunces', serif; font-size: 14.5px; font-weight: 600; line-height: 1.35; }
        .dai-invite-sub { font-size: 12px; color: var(--dai-muted); margin-top: 3px; line-height: 1.4; }
        .dai-invite-x {
          position: absolute; top: 7px; right: 7px; width: 20px; height: 20px; border: none;
          background: transparent; color: var(--dai-muted); cursor: pointer; border-radius: 6px;
          display: flex; align-items: center; justify-content: center; font-size: 13px; line-height: 1;
        }
        .dai-invite-x:hover { background: var(--dai-bg); color: var(--dai-navy); }
        .dai-invite::after {
          content: ''; position: absolute; right: 26px; bottom: -7px; width: 12px; height: 12px;
          background: #fff; border-right: 1px solid var(--dai-border); border-bottom: 1px solid var(--dai-border);
          transform: rotate(45deg);
        }
        @keyframes daiPop { from { opacity: 0; transform: translateY(8px) scale(0.96); } to { opacity: 1; transform: none; } }

        /* ── Nút mở ───────────────────────────────────────────── */
        .dai-launcher {
          position: relative; display: flex; align-items: center; gap: 0; padding: 0;
          border: none; background: var(--dai-navy); border-radius: 12px; cursor: pointer;
          box-shadow: 0 10px 28px rgba(13,27,42,0.28);
          transition: transform 0.16s ease, box-shadow 0.16s ease;
        }
        .dai-launcher:hover { transform: translateY(-2px); box-shadow: 0 14px 34px rgba(13,27,42,0.34); }
        .dai-launcher-icon {
          width: 48px; height: 48px; flex-shrink: 0; background: var(--dai-gold); color: var(--dai-navy);
          display: flex; align-items: center; justify-content: center;
          /* Bo góc riêng thay vì overflow:hidden ở nút — nếu cắt tràn thì huy hiệu
             số 1 nhô ra ngoài góc sẽ bị xén mất một nửa. */
          border-radius: 12px 0 0 12px;
        }
        .dai-launcher-text { padding: 0 16px 0 13px; text-align: left; }
        .dai-launcher-title {
          display: block; font-family: 'Fraunces', serif; font-size: 13px; font-weight: 700; color: #fff;
          letter-spacing: 0.06em; text-transform: uppercase; line-height: 1.2; white-space: nowrap;
        }
        .dai-launcher-sub {
          display: block; font-size: 11px; color: rgba(255,255,255,0.5); margin-top: 1px; white-space: nowrap;
        }
        .dai-badge {
          position: absolute; top: -5px; right: -5px; min-width: 18px; height: 18px; padding: 0 5px;
          border-radius: 999px; background: var(--dai-gold); color: var(--dai-navy);
          font-size: 11px; font-weight: 700; display: flex; align-items: center; justify-content: center;
          border: 2px solid var(--dai-bg);
        }

        /* ── Khung chat ───────────────────────────────────────── */
        .dai-panel {
          width: 400px; height: 560px; max-width: calc(100vw - 32px); max-height: calc(100vh - 120px);
          background: #fff; border: 1px solid var(--dai-border); border-radius: 14px;
          display: flex; flex-direction: column; overflow: hidden;
          box-shadow: 0 24px 64px rgba(13,27,42,0.24);
          animation: daiPop 0.24s cubic-bezier(0.2, 0.9, 0.3, 1.2);
        }
        .dai-head {
          display: flex; align-items: center; gap: 11px; padding: 12px 12px 12px 14px;
          background: var(--dai-navy); flex-shrink: 0;
        }
        .dai-head-mark {
          width: 30px; height: 30px; border-radius: 8px; background: var(--dai-gold); color: var(--dai-navy);
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .dai-head-name {
          font-family: 'Fraunces', serif; font-size: 15px; font-weight: 700; color: #fff;
          letter-spacing: 0.05em; text-transform: uppercase; line-height: 1.2;
        }
        .dai-head-sub { font-size: 11px; color: rgba(255,255,255,0.45); margin-top: 1px; }
        .dai-head-actions { margin-left: auto; display: flex; gap: 2px; }
        .dai-icon-btn {
          width: 30px; height: 30px; border: none; background: transparent; color: rgba(255,255,255,0.6);
          border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center;
          font-size: 15px; line-height: 1; transition: background 0.15s, color 0.15s;
        }
        .dai-icon-btn:hover { background: rgba(255,255,255,0.1); color: #fff; }

        .dai-body { flex: 1; overflow-y: auto; background: #fff; }
        .dai-body::-webkit-scrollbar { width: 8px; }
        .dai-body::-webkit-scrollbar-thumb { background: rgba(13,27,42,0.16); border-radius: 8px; }

        /* ── Trạng thái rỗng ──────────────────────────────────── */
        .dai-empty { padding: 26px 20px 20px; }
        .dai-eyebrow {
          display: flex; align-items: center; gap: 9px; font-size: 10.5px; font-weight: 700;
          letter-spacing: 0.14em; text-transform: uppercase; color: var(--dai-muted);
        }
        .dai-eyebrow::before { content: ''; width: 22px; height: 2px; background: var(--dai-gold); flex-shrink: 0; }
        .dai-greeting {
          font-family: 'Fraunces', serif; font-size: 27px; font-weight: 700; color: var(--dai-navy);
          line-height: 1.18; letter-spacing: -0.5px; margin: 16px 0 10px;
        }
        .dai-greeting span { color: var(--dai-gold); }
        .dai-lede { font-size: 13px; line-height: 1.55; color: #5A6675; margin-bottom: 20px; }
        .dai-starter {
          width: 100%; display: flex; align-items: center; gap: 12px; padding: 13px 2px;
          border: none; border-top: 1px solid var(--dai-border); background: transparent;
          cursor: pointer; text-align: left; transition: padding 0.15s;
        }
        .dai-starter:last-child { border-bottom: 1px solid var(--dai-border); }
        .dai-starter:hover { padding-left: 6px; }
        .dai-starter-tag {
          width: 62px; flex-shrink: 0; font-size: 9.5px; font-weight: 700; letter-spacing: 0.1em;
          text-transform: uppercase; color: var(--dai-gold); line-height: 1.3;
        }
        .dai-starter-text { flex: 1; font-size: 13.5px; font-weight: 500; color: var(--dai-navy); line-height: 1.4; }
        .dai-starter-arrow { color: var(--dai-muted); flex-shrink: 0; display: flex; }
        .dai-starter:hover .dai-starter-arrow { color: var(--dai-gold); }

        /* ── Lượt hội thoại ───────────────────────────────────── */
        .dai-turn { display: flex; gap: 12px; padding: 15px 18px; border-top: 1px solid var(--dai-border); }
        .dai-turn:first-child { border-top: none; }
        .dai-turn-label {
          width: 56px; flex-shrink: 0; font-size: 9.5px; font-weight: 700; letter-spacing: 0.1em;
          text-transform: uppercase; color: var(--dai-muted); line-height: 1.5; padding-top: 2px;
        }
        .dai-turn-time { display: block; font-weight: 400; letter-spacing: 0; color: rgba(124,136,153,0.75); }
        .dai-turn-content { flex: 1; min-width: 0; font-size: 13.5px; line-height: 1.6; color: var(--dai-navy); }
        .dai-turn--user .dai-turn-content {
          border-left: 2px solid var(--dai-gold); padding-left: 11px; color: var(--dai-navy); font-weight: 500;
        }
        .dai-p { margin: 0 0 8px; }
        .dai-p:last-child { margin-bottom: 0; }
        .dai-list { list-style: none; margin: 0 0 8px; padding: 0; display: flex; flex-direction: column; gap: 8px; }
        .dai-list:last-child { margin-bottom: 0; }
        .dai-list li { display: flex; gap: 10px; }
        .dai-list-marker {
          flex-shrink: 0; min-width: 13px; font-family: 'Fraunces', serif; font-weight: 700;
          color: var(--dai-gold); font-size: 13px; line-height: 1.6;
        }

        /* ── Chip nguồn + hành động ───────────────────────────── */
        .dai-sources { display: flex; align-items: center; flex-wrap: wrap; gap: 6px; margin-top: 12px; }
        .dai-sources-label {
          font-size: 9.5px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase;
          color: var(--dai-muted);
        }
        .dai-chip {
          font-size: 11px; font-weight: 500; color: var(--dai-navy); background: var(--dai-gold-dim);
          border: 1px solid var(--dai-gold-b); border-radius: 6px; padding: 3px 8px; line-height: 1.4;
        }
        .dai-actions { display: flex; align-items: center; flex-wrap: wrap; gap: 6px; margin-top: 11px; }
        .dai-act--icon { padding: 5px 7px; }
        .dai-act-note { font-size: 11px; color: var(--dai-muted); margin-left: 2px; white-space: nowrap; }
        .dai-act {
          display: inline-flex; align-items: center; gap: 6px; padding: 5px 9px; font-size: 11.5px;
          font-family: inherit; color: #5A6675; background: #fff; border: 1px solid var(--dai-border);
          border-radius: 7px; cursor: pointer; transition: all 0.15s; white-space: nowrap;
        }
        .dai-act:hover { border-color: var(--dai-gold-b); background: var(--dai-cream); color: var(--dai-navy); }
        .dai-act--on { border-color: var(--dai-gold-b); background: var(--dai-gold-dim); color: var(--dai-navy); }

        /* ── Bảng hoá đơn ─────────────────────────────────────── */
        .dai-invoice { margin-top: 12px; border: 1px solid var(--dai-border); border-radius: 10px; overflow: hidden; }
        .dai-invoice-head {
          padding: 8px 12px; background: var(--dai-cream); border-bottom: 1px solid var(--dai-border);
          font-size: 10px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: var(--dai-muted);
        }
        .dai-invoice-row {
          display: flex; justify-content: space-between; gap: 12px; padding: 9px 12px;
          border-bottom: 1px solid var(--dai-border); font-size: 13px; color: var(--dai-navy);
        }
        .dai-invoice-row--total {
          border-bottom: none; background: var(--dai-cream); font-weight: 700;
          font-family: 'Fraunces', serif; font-size: 14px;
        }
        .dai-invoice-row--total .dai-invoice-amount { color: var(--dai-navy); }
        .dai-invoice-amount { font-variant-numeric: tabular-nums; white-space: nowrap; }
        .dai-note { margin-top: 10px; font-size: 12.5px; line-height: 1.5; color: #5A6675; }
        .dai-note strong { color: var(--dai-navy); }

        /* ── Không có trong tài liệu ──────────────────────────── */
        .dai-nf-head {
          display: flex; align-items: center; gap: 7px; margin-bottom: 9px; color: #B4703A;
          font-size: 10.5px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase;
        }
        .dai-nf-box {
          margin-top: 12px; border: 1px solid var(--dai-border); border-radius: 10px;
          padding: 12px; background: var(--dai-cream);
        }
        .dai-nf-box-label {
          font-size: 9.5px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase;
          color: var(--dai-muted); margin-bottom: 9px;
        }
        .dai-cta {
          width: 100%; display: flex; align-items: center; gap: 9px; padding: 10px 12px; margin-bottom: 7px;
          border-radius: 8px; font-family: inherit; font-size: 13px; font-weight: 700; cursor: pointer;
          text-decoration: none; transition: all 0.15s; border: 1px solid transparent;
        }
        .dai-cta:last-child { margin-bottom: 0; }
        .dai-cta--primary { background: var(--dai-navy); color: #fff; }
        .dai-cta--primary:hover { background: var(--dai-navy-mid); }
        .dai-cta--ghost { background: #fff; color: var(--dai-navy); border-color: var(--dai-border); font-weight: 500; }
        .dai-cta--ghost:hover { border-color: var(--dai-gold-b); }
        .dai-alt-label {
          margin-top: 13px; font-size: 9.5px; font-weight: 700; letter-spacing: 0.1em;
          text-transform: uppercase; color: var(--dai-muted);
        }
        .dai-alt-wrap { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
        .dai-alt {
          font-family: inherit; font-size: 12px; color: var(--dai-navy); background: #fff;
          border: 1px solid var(--dai-border); border-radius: 7px; padding: 6px 10px; cursor: pointer;
          transition: all 0.15s;
        }
        .dai-alt:hover { border-color: var(--dai-gold-b); background: var(--dai-gold-dim); }

        /* ── Đang trả lời ─────────────────────────────────────── */
        .dai-status {
          display: flex; align-items: center; gap: 8px; font-size: 10.5px; font-weight: 700;
          letter-spacing: 0.1em; text-transform: uppercase; color: var(--dai-muted);
        }
        .dai-dots { display: inline-flex; gap: 3px; }
        .dai-dots i { width: 4px; height: 4px; background: var(--dai-gold); animation: daiBlink 1.1s infinite; }
        .dai-dots i:nth-child(2) { animation-delay: 0.18s; }
        .dai-dots i:nth-child(3) { animation-delay: 0.36s; }
        @keyframes daiBlink { 0%, 60%, 100% { opacity: 0.25; } 30% { opacity: 1; } }
        .dai-caret {
          display: inline-block; width: 2px; height: 13px; background: var(--dai-gold);
          margin-left: 2px; vertical-align: -2px; animation: daiBlink 1s infinite;
        }

        /* ── Ô nhập ───────────────────────────────────────────── */
        .dai-foot {
          flex-shrink: 0; display: flex; gap: 8px; padding: 12px; background: #fff;
          border-top: 1px solid var(--dai-border);
        }
        .dai-input {
          flex: 1; min-width: 0; padding: 11px 13px; font-family: inherit; font-size: 13.5px;
          color: var(--dai-navy); background: var(--dai-bg); border: 1px solid transparent;
          border-radius: 9px; outline: none; transition: all 0.15s;
        }
        .dai-input::placeholder { color: var(--dai-muted); }
        .dai-input:focus { background: #fff; border-color: var(--dai-gold-b); }
        .dai-send {
          width: 44px; flex-shrink: 0; border: none; border-radius: 9px; background: var(--dai-navy);
          color: var(--dai-gold); cursor: pointer; display: flex; align-items: center; justify-content: center;
          transition: background 0.15s;
        }
        .dai-send:hover:not(:disabled) { background: var(--dai-navy-mid); }
        .dai-send:disabled { background: rgba(13,27,42,0.18); color: rgba(255,255,255,0.6); cursor: not-allowed; }

        @media (max-width: 520px) {
          .dai-root { right: 14px; bottom: 14px; left: 14px; align-items: stretch; }
          .dai-panel { width: 100%; height: calc(100vh - 110px); }
          .dai-invite { max-width: none; align-self: flex-end; }
          .dai-launcher { align-self: flex-end; }
        }
      `}</style>

      <div className="dai-root">
        {isOpen ? (
          <div className="dai-panel" role="dialog" aria-label="Trợ lý ảo Dormify AI">
            <header className="dai-head">
              <span className="dai-head-mark">
                <ChatIcon size={17} />
              </span>
              <div>
                <div className="dai-head-name">Dormify AI</div>
                <div className="dai-head-sub">Trợ lý nội quy &amp; hoá đơn KTX</div>
              </div>
              <div className="dai-head-actions">
                {messages.length > 0 && (
                  <button className="dai-icon-btn" onClick={resetChat} title="Hội thoại mới" type="button">
                    ✎
                  </button>
                )}
                <button className="dai-icon-btn" onClick={closeChat} title="Đóng" type="button">
                  ✕
                </button>
              </div>
            </header>

            <div className="dai-body">
              {messages.length === 0 ? (
                <div className="dai-empty">
                  <div className="dai-eyebrow">Dựa trên tài liệu KTX</div>
                  <h2 className="dai-greeting">
                    Chào {fullName || 'bạn'},
                    <br />
                    bạn cần tra <span>gì?</span>
                  </h2>
                  <p className="dai-lede">
                    Tôi trả lời dựa trên nội quy, quy trình và hồ sơ của bạn — luôn kèm nguồn để bạn
                    kiểm tra lại.
                  </p>

                  {starters.map((starter) => (
                    <button
                      key={starter.text}
                      className="dai-starter"
                      type="button"
                      onClick={() => void sendMessage(starter.text)}
                    >
                      <span className="dai-starter-tag">{starter.tag}</span>
                      <span className="dai-starter-text">{starter.text}</span>
                      <span className="dai-starter-arrow">
                        <ArrowIcon size={15} />
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <>
                  <div className="dai-turn">
                    <div className="dai-turn-label">Dormify</div>
                    <div className="dai-turn-content">
                      <p className="dai-p">{WELCOME_TEXT}</p>
                    </div>
                  </div>

                  {messages.map((msg) => {
                    const isTyping = isStreaming && msg.id === lastBotId && !msg.text;
                    return (
                      <div
                        key={msg.id}
                        className={`dai-turn ${msg.sender === 'user' ? 'dai-turn--user' : ''}`}
                      >
                        <div className="dai-turn-label">
                          {msg.sender === 'user' ? 'Bạn' : 'Dormify'}
                          <span className="dai-turn-time">{msg.time}</span>
                        </div>
                        <div className="dai-turn-content">
                          {isTyping ? (
                            <div className="dai-status">
                              <span className="dai-dots">
                                <i />
                                <i />
                                <i />
                              </span>
                              {status || 'Đang tra cứu'}
                            </div>
                          ) : (
                            <>
                              {msg.notFound && (
                                <div className="dai-nf-head">
                                  <AlertIcon />
                                  Không có trong tài liệu
                                </div>
                              )}

                              {msg.notFound ? (
                                // Thay câu xin lỗi cụt lủn của model bằng lời giải thích
                                // vì sao không trả lời — quan trọng với câu hỏi dính tới
                                // tiền: thà nói không biết còn hơn đoán bừa.
                                <p className="dai-p">
                                  Bộ tài liệu tôi đang đọc không có nội dung này. Tôi{' '}
                                  <strong>không suy đoán</strong> để tránh đưa cho bạn thông tin sai.
                                </p>
                              ) : (
                                msg.text && <RichText text={msg.text} />
                              )}

                              {isStreaming && msg.id === lastBotId && <span className="dai-caret" />}

                              {msg.invoice && <InvoicePanel invoice={msg.invoice} isStudent={isStudent} />}

                              {msg.notFound && (
                                <>
                                  <div className="dai-nf-box">
                                    <div className="dai-nf-box-label">Bạn có thể</div>
                                    <a className="dai-cta dai-cta--primary" href={isStudent ? '/student/rules' : '/admin'}>
                                      <ChatIcon size={14} />
                                      Xem nội quy KTX đầy đủ
                                    </a>
                                    {isStudent && (
                                      <a className="dai-cta dai-cta--ghost" href="/student/contracts">
                                        <DocIcon />
                                        Xem hợp đồng của tôi
                                      </a>
                                    )}
                                  </div>

                                  {(msg.suggestions?.length ?? 0) > 0 && (
                                    <>
                                      <div className="dai-alt-label">Hoặc thử câu tôi trả lời được</div>
                                      <div className="dai-alt-wrap">
                                        {msg.suggestions!.map((s) => (
                                          <button
                                            key={s}
                                            className="dai-alt"
                                            type="button"
                                            onClick={() => void sendMessage(s)}
                                          >
                                            {s}
                                          </button>
                                        ))}
                                      </div>
                                    </>
                                  )}
                                </>
                              )}

                              {(msg.sources?.length ?? 0) > 0 && (
                                <div className="dai-sources">
                                  <span className="dai-sources-label">Nguồn</span>
                                  {msg.sources!.map((s) => (
                                    <span className="dai-chip" key={s}>
                                      {s}
                                    </span>
                                  ))}
                                </div>
                              )}

                              {msg.sender === 'bot' && msg.text && !isStreaming && (
                                <div className="dai-actions">
                                  <button
                                    className={`dai-act ${copiedId === msg.id ? 'dai-act--on' : ''}`}
                                    type="button"
                                    onClick={() => handleCopy(msg)}
                                  >
                                    <CopyIcon />
                                    {copiedId === msg.id ? 'Đã chép' : 'Sao chép'}
                                  </button>
                                  <button
                                    className={`dai-act dai-act--icon ${msg.verdict === 'UP' ? 'dai-act--on' : ''}`}
                                    type="button"
                                    title="Câu trả lời này hữu ích"
                                    aria-pressed={msg.verdict === 'UP'}
                                    onClick={() => handleVerdict(msg, 'UP')}
                                  >
                                    <ThumbIcon />
                                  </button>
                                  <button
                                    className={`dai-act dai-act--icon ${msg.verdict === 'DOWN' ? 'dai-act--on' : ''}`}
                                    type="button"
                                    title="Câu trả lời này chưa đúng"
                                    aria-pressed={msg.verdict === 'DOWN'}
                                    onClick={() => handleVerdict(msg, 'DOWN')}
                                  >
                                    <ThumbIcon down />
                                  </button>
                                  {msg.verdict && <span className="dai-act-note">Đã ghi nhận</span>}
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="dai-foot">
              <input
                ref={inputRef}
                type="text"
                className="dai-input"
                placeholder="Nhập câu hỏi..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && void sendMessage(inputValue)}
                disabled={isStreaming}
              />
              <button
                className="dai-send"
                onClick={() => void sendMessage(inputValue)}
                disabled={isStreaming || !inputValue.trim()}
                title="Gửi"
                type="button"
              >
                <ArrowIcon />
              </button>
            </div>
          </div>
        ) : (
          <>
            {showInvite && (
              <div className="dai-invite" onClick={openChat} role="button" tabIndex={0}>
                <button
                  className="dai-invite-x"
                  type="button"
                  title="Ẩn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowInvite(false);
                  }}
                >
                  ✕
                </button>
                <div className="dai-invite-title">Cần tra nội quy hay hoá đơn?</div>
                <div className="dai-invite-sub">Hỏi Dormify AI — trả lời ngay, kèm nguồn trích dẫn.</div>
              </div>
            )}

            <button className="dai-launcher" onClick={openChat} type="button">
              <span className="dai-launcher-icon">
                <ChatIcon size={21} />
              </span>
              <span className="dai-launcher-text">
                <span className="dai-launcher-title">Hỏi Dormify AI</span>
                <span className="dai-launcher-sub">Nội quy · hoá đơn · thủ tục</span>
              </span>
              {hasUnseenBadge && <span className="dai-badge">1</span>}
            </button>
          </>
        )}
      </div>
    </>
  );
}

/* ── Bảng hoá đơn ───────────────────────────────────────────────────────── */

function InvoicePanel({ invoice, isStudent }: { invoice: InvoiceCard; isStudent: boolean }) {
  const rows = [
    { label: 'Tiền phòng', value: invoice.roomFee },
    { label: 'Tiền điện', value: invoice.electricityFee },
    { label: 'Tiền nước', value: invoice.waterFee },
  ];

  return (
    <>
      <div className="dai-invoice">
        <div className="dai-invoice-head">
          Tháng {invoice.month}/{invoice.year} · Phòng {invoice.roomName}
        </div>
        {rows.map((row) => (
          <div className="dai-invoice-row" key={row.label}>
            <span>{row.label}</span>
            <span className="dai-invoice-amount">{formatCurrency(row.value)}</span>
          </div>
        ))}
        <div className="dai-invoice-row dai-invoice-row--total">
          <span>Tổng</span>
          <span className="dai-invoice-amount">{formatCurrency(invoice.totalAmount)}</span>
        </div>
      </div>

      {invoice.status === 'PAID' ? (
        <p className="dai-note">
          Hoá đơn này <strong>đã thanh toán</strong>.
        </p>
      ) : (
        <>
          {invoice.dueDate && (
            <p className="dai-note">
              Hạn đóng <strong>{invoice.dueDate}</strong>. Sau hạn tính phí trễ theo nội quy.
            </p>
          )}
          {isStudent && (
            <div style={{ marginTop: 10 }}>
              <a className="dai-cta dai-cta--primary" href={`/student/payment/${invoice.id}`}>
                Thanh toán ngay
                <span style={{ marginLeft: 'auto', display: 'flex' }}>
                  <ArrowIcon size={16} />
                </span>
              </a>
            </div>
          )}
        </>
      )}
    </>
  );
}
