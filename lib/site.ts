/**
 * 站點根地址。部署時在 .env.local 裡配置 NEXT_PUBLIC_SITE_URL（見 .env.example）；
 * 未配置時用本機開發地址，避免 fork 部署後把 sitemap、canonical 指向別人的域名。
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/+$/, '');

/** 只取域名部分，用於介面上展示（如分享卡底部） */
export const SITE_HOST = SITE_URL.replace(/^https?:\/\//, '');
