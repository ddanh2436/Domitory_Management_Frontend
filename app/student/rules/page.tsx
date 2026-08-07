"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiClient } from "../../utils/apiClient";

interface RuleSection {
  icon: string;
  title: string;
  items: string[];
}

// ─── Nội dung nội quy (có thể tùy biến tự do) ───────────────────────────────────
const RULE_SECTIONS: RuleSection[] = [
  {
    icon: "🕙",
    title: "Giờ giấc sinh hoạt",
    items: [
      "Cổng ký túc xá mở cửa 05:00 và đóng cửa lúc 23:00 hằng ngày. Sinh viên về sau giờ đóng cửa phải đăng ký trước với quản lý.",
      "Giờ yên lặng từ 22:30 đến 06:00: không gây ồn, không mở nhạc lớn, không sinh hoạt tập thể làm ảnh hưởng người khác.",
      "Không vắng mặt qua đêm mà không khai báo tạm vắng với ban quản lý.",
    ],
  },
  {
    icon: "🛡️",
    title: "An ninh & trật tự",
    items: [
      "Không cho người lạ vào phòng ở hoặc lưu trú qua đêm khi chưa được cho phép.",
      "Không tàng trữ, sử dụng vũ khí, chất cấm, chất gây cháy nổ, ma túy hay đồ uống có cồn trong khu nội trú.",
      "Không đánh nhau, gây rối, cờ bạc dưới mọi hình thức.",
      "Giữ gìn thẻ sinh viên/thẻ ra vào; không cho người khác mượn để ra vào ký túc xá.",
    ],
  },
  {
    icon: "🧹",
    title: "Vệ sinh & môi trường",
    items: [
      "Giữ gìn vệ sinh chung, bỏ rác đúng nơi quy định, tham gia trực nhật phòng theo lịch.",
      "Không xả rác, phơi đồ, để vật dụng ở hành lang, cầu thang, lối thoát hiểm.",
      "Không nuôi thú cưng trong khu nội trú.",
    ],
  },
  {
    icon: "🔥",
    title: "Phòng cháy chữa cháy & an toàn",
    items: [
      "Không sử dụng bếp gas, bếp điện công suất lớn, thiết bị đun nấu trong phòng khi chưa được phép.",
      "Tắt các thiết bị điện, nước khi ra khỏi phòng; không tự ý câu mắc, sửa chữa hệ thống điện.",
      "Không tự ý di chuyển, che chắn bình chữa cháy và thiết bị PCCC.",
    ],
  },
  {
    icon: "🪑",
    title: "Tài sản & thiết bị",
    items: [
      "Bảo quản tài sản được trang bị; làm hư hỏng, mất mát phải bồi thường theo quy định.",
      "Không tự ý thay đổi kết cấu phòng, khoan đục tường, tháo lắp thiết bị.",
      "Báo ngay cho ban quản lý qua mục “Yêu cầu sửa chữa” khi có hư hỏng.",
    ],
  },
  {
    icon: "🤝",
    title: "Ứng xử văn minh",
    items: [
      "Tôn trọng, hòa nhã với bạn cùng phòng, nhân viên quản lý và bảo vệ.",
      "Thanh toán tiền phòng, điện, nước đúng hạn.",
      "Chấp hành sự hướng dẫn, kiểm tra của ban quản lý ký túc xá.",
    ],
  },
];

const SCORE_TABLE: { reason: string; points: string }[] = [
  { reason: "Về ký túc xá muộn quá giờ quy định", points: "-5" },
  { reason: "Gây mất vệ sinh, không trực nhật", points: "-5 đến -10" },
  { reason: "Gây ồn ào trong giờ yên lặng", points: "-10" },
  { reason: "Cho người lạ lưu trú trái phép", points: "-15" },
  { reason: "Sử dụng thiết bị dễ cháy nổ trái phép", points: "-20" },
  { reason: "Đánh nhau, gây rối, cờ bạc", points: "-30 trở lên" },
];

export default function StudentRulesPage() {
  const [score, setScore] = useState<number | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiClient.get("/users/profile");
        if (res.ok) {
          const data = await res.json();
          if (typeof data.behaviorScore === "number") setScore(data.behaviorScore);
        }
      } catch (e) {
        console.error(e);
      }
    };
    void load();
  }, []);

  const low = score !== null && score < 60;

  return (
    <div className="rules-page">
      <style>{`
        :root {
          --navy: #0D1B2A; --gold: #C9A84C; --gold-b: rgba(201,168,76,0.25);
          --white: #fff; --muted: #8A9BAD; --border: rgba(13,27,42,0.09);
        }
        .rules-page { padding: 28px 0 52px; max-width: 900px; margin: 0 auto; width: 100%; }
        .rules-hero {
          background: linear-gradient(135deg, #0D1B2A 0%, #1A2E42 100%);
          border: 1px solid var(--gold-b); border-radius: 18px;
          padding: 28px 30px; color: #fff; margin-bottom: 22px;
        }
        .rules-hero-eyebrow { font-size: 11px; font-weight: 500; letter-spacing: 0.12em; text-transform: uppercase; color: var(--gold); margin-bottom: 8px; }
        .rules-hero-title { font-family: 'FrauncesAmp', 'Fraunces', serif; font-size: 28px; font-weight: 700; letter-spacing: -0.4px; margin-bottom: 8px; }
        .rules-hero-sub { font-size: 13.5px; color: rgba(255,255,255,0.6); line-height: 1.7; max-width: 560px; }

        .rules-score {
          display: flex; align-items: center; justify-content: space-between; gap: 16px;
          margin-top: 20px; padding: 14px 18px; border-radius: 12px;
          background: rgba(255,255,255,0.06); border: 1px solid rgba(201,168,76,0.22);
        }
        .rules-score-left { font-size: 13px; color: rgba(255,255,255,0.7); }
        .rules-score-val { font-family: 'FrauncesAmp', 'Fraunces', serif; font-size: 22px; font-weight: 700; color: var(--gold); }
        .rules-score-link { font-size: 12.5px; color: var(--gold); text-decoration: none; font-weight: 600; white-space: nowrap; }
        .rules-score-link:hover { text-decoration: underline; }
        .rules-score--low { border-color: rgba(239,68,68,0.4); background: rgba(239,68,68,0.12); }
        .rules-score--low .rules-score-val { color: #fca5a5; }

        .rules-section {
          background: var(--white); border: 1px solid var(--border);
          border-radius: 14px; padding: 22px 24px; margin-bottom: 14px;
        }
        .rules-section-head { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; }
        .rules-section-icon {
          width: 40px; height: 40px; border-radius: 10px; flex-shrink: 0;
          background: rgba(201,168,76,0.12); display: flex; align-items: center; justify-content: center; font-size: 20px;
        }
        .rules-section-title { font-family: 'FrauncesAmp', 'Fraunces', serif; font-size: 17px; font-weight: 600; color: var(--navy); }
        .rules-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 10px; }
        .rules-list li { position: relative; padding-left: 22px; font-size: 14px; color: #334155; line-height: 1.65; }
        .rules-list li::before {
          content: ''; position: absolute; left: 4px; top: 9px;
          width: 6px; height: 6px; border-radius: 50%; background: var(--gold);
        }

        .rules-score-box { background: var(--white); border: 1px solid var(--border); border-radius: 14px; padding: 22px 24px; margin-top: 8px; }
        .rules-score-box-title { font-family: 'FrauncesAmp', 'Fraunces', serif; font-size: 17px; font-weight: 600; color: var(--navy); margin-bottom: 6px; }
        .rules-score-box-desc { font-size: 13px; color: var(--muted); line-height: 1.65; margin-bottom: 16px; }
        .rules-table { width: 100%; border-collapse: collapse; }
        .rules-table th, .rules-table td { text-align: left; padding: 10px 12px; font-size: 13.5px; border-bottom: 1px solid var(--border); }
        .rules-table th { font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--muted); font-weight: 600; }
        .rules-table td:last-child, .rules-table th:last-child { text-align: right; }
        .rules-table td:last-child { color: #dc2626; font-weight: 700; white-space: nowrap; }
        .rules-note { margin-top: 14px; font-size: 12.5px; color: var(--muted); line-height: 1.6; }
        .rules-note strong { color: #b45309; }
      `}</style>

      <div className="rules-hero">
        <div className="rules-hero-eyebrow">Ký túc xá Dormify</div>
        <div className="rules-hero-title">Nội quy Ký túc xá</div>
        <div className="rules-hero-sub">
          Nội quy nhằm xây dựng môi trường lưu trú văn minh, an toàn và kỷ luật. Mỗi sinh viên có 100 điểm hành vi;
          vi phạm sẽ bị ban quản lý trừ điểm tương ứng.
        </div>

        <div className={`rules-score ${low ? "rules-score--low" : ""}`}>
          <div className="rules-score-left">
            Điểm hành vi hiện tại của bạn:{" "}
            <span className="rules-score-val">{score === null ? "…" : `${score}/100`}</span>
            {low && " — đang dưới 60, hãy chấp hành nghiêm nội quy!"}
          </div>
          <Link href="/student/profile" className="rules-score-link">
            Xem chi tiết →
          </Link>
        </div>
      </div>

      {RULE_SECTIONS.map((sec, i) => (
        <div key={i} className="rules-section">
          <div className="rules-section-head">
            <div className="rules-section-icon">{sec.icon}</div>
            <div className="rules-section-title">
              {i + 1}. {sec.title}
            </div>
          </div>
          <ul className="rules-list">
            {sec.items.map((item, j) => (
              <li key={j}>{item}</li>
            ))}
          </ul>
        </div>
      ))}

      <div className="rules-score-box">
        <div className="rules-score-box-title">Điểm hành vi &amp; xử lý vi phạm</div>
        <div className="rules-score-box-desc">
          Sinh viên bắt đầu với <strong>100 điểm</strong>. Khi vi phạm nội quy, ban quản lý sẽ ghi nhận và trừ điểm.
          Bảng dưới đây là mức trừ điểm tham khảo cho một số lỗi thường gặp:
        </div>
        <table className="rules-table">
          <thead>
            <tr>
              <th>Hành vi vi phạm</th>
              <th>Điểm trừ</th>
            </tr>
          </thead>
          <tbody>
            {SCORE_TABLE.map((r, i) => (
              <tr key={i}>
                <td>{r.reason}</td>
                <td>{r.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="rules-note">
          <strong>Lưu ý:</strong> Điểm hành vi dưới 60 sẽ bị cảnh báo và có thể bị xem xét kỷ luật hoặc chấm dứt hợp đồng lưu trú.
          Bạn có thể theo dõi điểm và lịch sử vi phạm tại trang{" "}
          <Link href="/student/profile" style={{ color: "#9a7b2c", fontWeight: 600 }}>Hồ sơ cá nhân</Link>.
        </div>
      </div>
    </div>
  );
}
