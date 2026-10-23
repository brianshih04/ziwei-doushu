import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { SITE_URL } from '@/lib/site';

export const metadata: Metadata = {
  title: '紫微命盤 · 倪海廈正宗紫微斗數',
  description: '基於倪海廈正宗紫微斗數體系，AI深度解讀您的命盤格局、大限流年、感情事業財富健康全方位解析',
  keywords: '紫微斗數, 倪海廈, 紫微斗數全集, 紫微斗數全書, 骨髓賦, 命盤, 命理, 14主星, 12宮位',
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: '紫微命盤 · 倪海廈正宗紫微斗數',
    description: '基於倪海廈正宗紫微斗數體系，AI深度解讀您的命盤格局、大限流年、感情事業財富健康全方位解析',
    url: SITE_URL,
    siteName: '紫微研究',
    locale: 'zh_CN',
    type: 'website',
  },
  // 站長平臺驗證（拿到 verification code 後填入對應欄位，重新部署即可）
  verification: {
    // Google Search Console: 在 https://search.google.com/search-console 新增站點後獲取
    google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION || undefined,
    // Bing Webmaster Tools: 在 https://www.bing.com/webmasters 新增站點後獲取
    other: {
      'msvalidate.01': process.env.NEXT_PUBLIC_BING_VERIFICATION || '808FFC6023A2C359B375DD860FEDA856',
      // 百度站長（等執照下來後）
      'baidu-site-verification': process.env.NEXT_PUBLIC_BAIDU_VERIFICATION || '',
      // 360 站長（等執照下來後）
      '360-site-verification': process.env.NEXT_PUBLIC_360_VERIFICATION || '',
    },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-TW" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem('ziwei-theme');if(t==='light'||t==='dark')document.documentElement.setAttribute('data-theme',t);else document.documentElement.setAttribute('data-theme','dark');}catch(e){}})();` }} />
      </head>
      <body className="min-h-screen">
        <ThemeProvider>
          {children}
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
