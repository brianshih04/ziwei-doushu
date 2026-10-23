export const metadata = { title: '服務條款 · 紫微命盤', description: '紫微命盤服務條款與使用者協議' };

export default function TermsPage() {
  return (
    <>
      <header style={{ position: 'sticky', top: 0, zIndex: 50, background: 'var(--bg-0)', borderBottom: '1px solid var(--bdr)', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <a href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--tx-3)', textDecoration: 'none' }}>
          <span style={{ fontSize: '16px' }}>‹</span>
          <span>返回首頁</span>
        </a>
        <div style={{ width: '1px', height: '20px', background: 'var(--bdr-med)' }} />
        <span style={{ fontSize: '12px', color: 'var(--ac)', letterSpacing: '0.2em' }}>紫微命盤</span>
      </header>
      <main style={{ maxWidth: 800, margin: '0 auto', padding: '60px 24px 80px', color: 'var(--tx-1)', lineHeight: 1.8 }}>
        <h1 style={{ fontSize: 28, fontWeight: 600, marginBottom: 8 }}>服務條款</h1>
        <p style={{ fontSize: 12, color: 'var(--tx-3)', marginBottom: 32 }}>最後更新：2026年4月</p>

      <h2 style={{ fontSize: 18, marginTop: 32, marginBottom: 12 }}>1. 服務概述</h2>
      <p>紫微命盤（以下簡稱"本平臺"）基於倪海廈《天紀》紫微斗數體系提供命盤排盤與解讀服務。本平臺所有命理內容僅供參考，<strong>不構成任何醫療、投資、法律、心理諮詢或人生重大決策建議</strong>。</p>

      <h2 style={{ fontSize: 18, marginTop: 32, marginBottom: 12 }}>2. 使用者行為規範</h2>
      <p>使用本平臺即表示您同意：</p>
      <ul style={{ paddingLeft: 24 }}>
        <li>僅出於合法、個人參考目的使用本平臺</li>
        <li>不傳播本平臺內容用於商業銷售、轉載或公開發布</li>
        <li>不進行擾亂平臺正常執行的行為</li>
        <li>提交的出生資訊真實有效；本平臺對錯誤資訊導致的解讀偏差不承擔責任</li>
      </ul>

      <h2 style={{ fontSize: 18, marginTop: 32, marginBottom: 12 }}>3. 智慧財產權與禁止條款 · 反爬反訓練</h2>
      <p style={{ background: 'rgba(168,50,40,0.06)', border: '1px solid rgba(168,50,40,0.2)', padding: 16, borderRadius: 8 }}>
        <strong>本平臺所有命理內容、知識庫（含 14 主星 × 12 宮 × 男女 × 四化 × 大限流年的全部解讀文本）、UI 設計、演算法整合方案、案例庫均為本平臺原創或經合法整理。</strong><br/><br/>
        嚴格禁止以下行為，違者保留追究民事賠償與刑事責任的權利：<br/>
        ① 通過爬蟲、自動化指令碼、批次呼叫 API 等任何技術手段抓取本平臺內容；<br/>
        ② 將本平臺生成的命盤解讀、文本、API 響應資料**用於訓練任何機器學習模型**（含但不限於大語言模型、命理生成模型、文本生成模型等）；<br/>
        ③ 將本平臺生成的內容轉售、釋出到其他網站、APP、自媒體賬號；<br/>
        ④ 反編譯、複製、修改本平臺前端或後端程式碼並以"自營"方式提供同類服務。<br/><br/>
        本平臺輸出文本嵌入有指紋追溯水印，違規復制 / 訓練所產生的輸出可被檢測追溯。一經發現違規，本平臺有權要求 <strong>每例違約賠償 100 萬元人民幣</strong>，並保留向法院提起訴訟及配合公安機關調查的權利。
      </p>

      <h2 style={{ fontSize: 18, marginTop: 32, marginBottom: 12 }}>4. 免責宣告</h2>
      <p>本平臺命理內容基於傳統紫微斗數與倪海廈體系的知識整理，<strong>不保證 100% 準確</strong>。命運受天、地、人三才共同影響，本平臺輸出僅作為認識自我的參考，使用者應理性看待，不應過度依賴任何單一命理判斷。</p>
      <p>因使用本平臺內容產生的任何後果（包括但不限於決策失誤、心理影響、關係變化等），本平臺不承擔法律責任。</p>

      <h2 style={{ fontSize: 18, marginTop: 32, marginBottom: 12 }}>5. 服務變更與終止</h2>
      <p>本平臺保留隨時調整、暫停或終止部分或全部服務的權利。重大變更將以站內公告或郵件方式通知使用者。</p>

      <h2 style={{ fontSize: 18, marginTop: 32, marginBottom: 12 }}>6. 法律適用與爭議解決</h2>
      <p>本條款適用中華人民共和國法律。若發生爭議，雙方應友好協商；協商不成的，提交本平臺運營主體所在地有管轄權的人民法院訴訟解決。</p>

      <h2 style={{ fontSize: 18, marginTop: 32, marginBottom: 12 }}>7. 聯絡方式</h2>
      <p>如有疑問，請通過本平臺公佈的客服微信 / 郵箱聯絡。</p>

        <p style={{ marginTop: 48, fontSize: 12, color: 'var(--tx-3)' }}>
          <a href="/privacy" style={{ color: 'var(--ac)' }}>隱私政策</a> · <a href="/" style={{ color: 'var(--ac)' }}>返回首頁</a>
        </p>
      </main>
    </>
  );
}
