'use client';

import { useEffect, useState } from 'react';

/**
 * 「AI 分析中」明確指示：脈動星號＋文案＋ 3 秒後顯示已進行秒數。
 * 用於串流首 token 前的等待期，與長時間分析（合盤 30 秒↑），
 * 讓使用者知道 AI 正在運作而不是頁面卡住。
 */
export default function AiThinking({
  label = 'AI 正在分析',
  color = 'var(--t-gold)',
}: {
  label?: string;
  color?: string;
}) {
  const [sec, setSec] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setSec(s => s + 1), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="flex items-center gap-2 py-0.5 text-xs animate-pulse" style={{ color }}>
      <span>✦</span>
      <span style={{ opacity: 0.85 }}>
        {label}…{sec >= 3 ? `（已進行 ${sec} 秒）` : ''}
      </span>
    </div>
  );
}
