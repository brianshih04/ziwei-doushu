'use client';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// 公告版本號——以後想再彈新公告，改這裡就行（舊版 key 失效，新版重新彈一次）
const ANNOUNCEMENT_VERSION = '2026-05-01';
const STORAGE_KEY = `announcement_seen_${ANNOUNCEMENT_VERSION}`;

export default function AnnouncementModal() {
  // 預設不開，client 端 useEffect 檢查 localStorage 後立即決定是否彈出。
  // 沒看過 → 立即覆蓋首頁；看過 → 不再彈。
  const [open, setOpen] = useState(false);
  const [decided, setDecided] = useState(false); // hydration 完成標誌

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const seen = localStorage.getItem(STORAGE_KEY);
      if (!seen) setOpen(true);
    } catch { /* localStorage 可能被禁，忽略 */ }
    setDecided(true);
  }, []);

  // 公告開啟時鎖住 body 滾動，防止背後首頁可滾（儀式感更強）
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
  }, [open]);

  const close = () => {
    setOpen(false);
    try { localStorage.setItem(STORAGE_KEY, '1'); } catch { /* skip */ }
  };

  if (!decided) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          // 不點選外部關閉——強制使用者按"我知道了"按鈕才能進入首頁
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(20,12,2,0.88)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '16px',
          }}
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'linear-gradient(180deg, #fefcf6 0%, #faf3e3 100%)',
              borderRadius: '20px',
              width: '100%',
              maxWidth: '640px',
              maxHeight: 'min(85vh, 760px)',
              overflow: 'hidden',
              boxShadow: '0 24px 80px rgba(60,30,10,0.4), 0 4px 16px rgba(60,30,10,0.2)',
              border: '1px solid rgba(184,146,42,0.25)',
              display: 'flex',
              flexDirection: 'column',
              fontFamily: '"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif',
            }}
          >
            {/* 頂部裝飾 + 關閉按鈕 */}
            <div style={{
              padding: '22px 28px 14px',
              borderBottom: '1px solid rgba(184,146,42,0.15)',
              background: 'linear-gradient(180deg, rgba(184,146,42,0.08) 0%, transparent 100%)',
              flexShrink: 0,
              position: 'relative',
            }}>
              <div style={{ fontSize: '10px', letterSpacing: '0.4em', color: '#b8922a', opacity: 0.7, marginBottom: '6px' }}>
                A LETTER TO USERS
              </div>
              <h2 style={{ fontSize: '19px', fontWeight: 700, color: '#3d2f10', letterSpacing: '0.08em', margin: 0 }}>
                致正在使用這個平臺的你
              </h2>
              <button
                onClick={close}
                aria-label="關閉"
                style={{
                  position: 'absolute', top: '14px', right: '16px',
                  width: '28px', height: '28px',
                  background: 'rgba(184,146,42,0.08)',
                  border: '1px solid rgba(184,146,42,0.2)',
                  borderRadius: '50%',
                  color: '#7a5e2a', fontSize: '14px',
                  cursor: 'pointer', lineHeight: 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >×</button>
            </div>

            {/* 限時免費 banner（最關鍵資訊，置頂強調）*/}
            <div style={{
              margin: '14px 22px 0',
              padding: '12px 16px',
              background: 'linear-gradient(135deg, #fff5e3 0%, #ffe1c0 100%)',
              border: '1.5px dashed rgba(232,132,62,0.5)',
              borderRadius: '12px',
              flexShrink: 0,
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '10px', letterSpacing: '0.3em', color: '#c45a2d', marginBottom: '4px', fontWeight: 600 }}>
                LIMITED TIME · 限時回饋
              </div>
              <div style={{ fontSize: '14px', color: '#8b3a1a', fontWeight: 600, lineHeight: 1.6 }}>
                <span style={{ fontSize: '16px', color: '#c45a2d', fontWeight: 700 }}>5 月 1 日 — 5 月 8 日</span>
                <br />
                平臺全部功能 + AI 提問 全部免費開放
              </div>
            </div>

            {/* 正文（可滾動）*/}
            <div style={{
              padding: '18px 28px 24px',
              overflowY: 'auto',
              fontSize: '14px',
              lineHeight: 1.85,
              color: '#5a4a30',
              flex: 1,
            }}>
              <p style={{ margin: '0 0 12px' }}>
                說實話，我真的沒想到會有這麼大的流量。
              </p>
              <p style={{ margin: '0 0 12px' }}>
                最開始做這個平臺，我的初心其實很簡單：在 AI 時代，把倪師這套原本複雜、門檻很高的體系，儘量做得更簡單、更高效、更容易理解。
              </p>
              <p style={{ margin: '0 0 12px' }}>
                不一定每個人都要先學很久、看很多書，才能接觸這些內容。我們希望通過這個平臺，讓大家用更輕鬆的方式，獲得一些對自我、人生階段、選擇方向的參考和啟發。
              </p>
              <p style={{
                margin: '0 0 12px',
                padding: '10px 14px',
                background: 'rgba(184,146,42,0.07)',
                borderLeft: '3px solid rgba(184,146,42,0.45)',
                borderRadius: '0 8px 8px 0',
                fontStyle: 'italic',
                color: '#7a5e2a',
              }}>
                倪師曾說過一句話：人怎麼可能發明出完全沒有用的東西呢？
              </p>
              <p style={{ margin: '0 0 12px' }}>
                我一直覺得，易經如此，紫微斗數也是如此。它們真正有價值的地方，不是讓人被某個結果困住，而是讓我們更早看見自己的性格慣性、人生課題和選擇方向。看見之後，才有機會調整；理解之後，才有機會變得更好。
              </p>
              <p style={{ margin: '0 0 12px' }}>
                至於那些說&ldquo;你當下在看這些，其實也是命運的一部分&rdquo;之類的話，我就不多評價了。
              </p>
              <p style={{ margin: '0 0 12px' }}>
                這幾天賬號被小紅書抬走了，<strong style={{ color: '#c45a2d' }}>5 月 3 號開始恢復正常更新。</strong>
              </p>
              <p style={{ margin: '0 0 16px', color: '#3d2f10', fontWeight: 500 }}>
                最後，真心祝願大家都能越來越瞭解自己，越來越愛自己，也越來越有能力愛身邊的人。
              </p>
              <p style={{ margin: 0, textAlign: 'right', fontSize: '13px', color: '#7a5e2a' }}>
                ——謝謝大家 🙏
              </p>
            </div>

            {/* 底部按鈕 */}
            <div style={{
              padding: '14px 22px',
              borderTop: '1px solid rgba(184,146,42,0.15)',
              background: 'rgba(184,146,42,0.04)',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '10px',
              flexShrink: 0,
            }}>
              <button
                onClick={close}
                style={{
                  padding: '10px 24px',
                  background: 'linear-gradient(135deg, #b8922a 0%, #9a7a20 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '13px',
                  letterSpacing: '0.1em',
                  fontWeight: 500,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(184,146,42,0.3)',
                }}
              >
                我知道了
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
