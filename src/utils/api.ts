// utils/api.ts
import axios from 'axios';

// 部署時：VITE_API_URL = https://your-backend.up.railway.app
// 本地時：VITE_API_URL 不設定，用 Vite proxy（vite.config.ts 已配好）
const API_BASE = import.meta.env.VITE_API_URL || '';

const client = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

client.interceptors.response.use(
  (res) => res,
  (err) => {
    console.error('[API]', err.response?.status, err.config?.url, err.message);
    return Promise.reject(err);
  }
);

export const api = {
  // Health
  getHealth: () => client.get('/api/health').then(r => r.data),

  // Signals
  getSignals: () => client.get('/api/signals').then(r => r.data),
  getSignal: (id: string) => client.get(`/api/signals/${id}`).then(r => r.data),

  // Market
  getIndicators: (symbol: string) => client.get(`/api/market/indicators/${symbol}`).then(r => r.data),
  getAllIndicators: () => client.get('/api/market/indicators').then(r => r.data),
  getPrices: () => client.get('/api/market/prices').then(r => r.data),
  getFunding: () => client.get('/api/market/funding').then(r => r.data),

  // Smart Money
  getSmartMoneyFeed: () => client.get('/api/smartmoney/feed').then(r => r.data),
  getSmartMoneyConsensus: (symbol: string) => client.get(`/api/smartmoney/consensus/${symbol}`).then(r => r.data),
  getAllConsensus: () => client.get('/api/smartmoney/consensus').then(r => r.data),
  getSmartMoneyStats: () => client.get('/api/smartmoney/stats').then(r => r.data),

  // News & Alerts
  getNews: () => client.get('/api/news').then(r => r.data),
  getCalendar: (days = 7) => client.get(`/api/calendar?days=${days}`).then(r => r.data),
  getAlerts: () => client.get('/api/alerts').then(r => r.data),
  getActiveAlerts: () => client.get('/api/alerts/active').then(r => r.data),

  // Portfolio
  getPortfolioStats: () => client.get('/api/portfolio/stats').then(r => r.data),
  getTrades: () => client.get('/api/portfolio/trades').then(r => r.data),
};
