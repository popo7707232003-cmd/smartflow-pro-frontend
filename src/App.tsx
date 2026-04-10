import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Dashboard from './pages/Dashboard';
import SignalsPage from './pages/SignalsPage';
import SmartMoneyPage from './pages/SmartMoneyPage';
import AlertsPage from './pages/AlertsPage';
import PortfolioPage from './pages/PortfolioPage';
import { useWebSocket } from './hooks/useWebSocket';

function AppInner() {
  useWebSocket();
  return (
    <div className="min-h-screen bg-[#0A0E1A] text-[#C8CCD8]" style={{ fontFamily: "'Noto Sans TC', sans-serif" }}>
      <Navbar />
      <main className="px-4 py-4 md:px-6 max-w-[1600px] mx-auto pb-16">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/signals" element={<SignalsPage />} />
          <Route path="/smartmoney" element={<SmartMoneyPage />} />
          <Route path="/alerts" element={<AlertsPage />} />
          <Route path="/portfolio" element={<PortfolioPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return <BrowserRouter><AppInner /></BrowserRouter>;
}
