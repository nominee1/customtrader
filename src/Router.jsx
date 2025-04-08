import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import LandingPage from './pages/landing/LandingPage';
import LoginPage from './pages/login/LoginPage';
import Dashboard from './pages/dashboard/DashboardPage'; 
import MainSection from './pages/dashboard/DashboardMainContent';
import TraderPage from './pages/trader/TraderPage';
import WalletPage from './components/WalletPage';
import UserProfile from './components/UserProfile';
import SettingsPage from './components/SettingPage';

function AppRoutes() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<Dashboard />}>
            <Route index element={<MainSection />} />
            <Route path="home" element={<MainSection />} />
            <Route path="trading" element={<TraderPage />} />
            <Route path="wallet" element={<WalletPage />} />
            <Route path="account" element={<UserProfile />} />
            <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default AppRoutes;