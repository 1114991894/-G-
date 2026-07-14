import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import Login from './pages/Login';
import OAuthCallback from './pages/OAuthCallback';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Goals from './pages/Goals';
import Performance from './pages/Performance';
import ScoreManagement from './pages/ScoreManagement';
import PerformanceCalibration from './pages/PerformanceCalibration';
import PerformanceImprovement from './pages/PerformanceImprovement';
import Talent from './pages/Talent';
import SystemSettings from './pages/SystemSettings';
import Profile from './pages/Profile';
import MainLayout from './layouts/MainLayout';

function App() {
  const { isAuthenticated } = useAuthStore();

  return (
    <Routes>
      <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" />} />
      <Route path="/oauth/callback" element={<OAuthCallback />} />
      <Route element={isAuthenticated ? <MainLayout /> : <Navigate to="/login" />}>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/goals" element={<Goals />} />
        <Route path="/performance" element={<Performance />} />
        <Route path="/score" element={<ScoreManagement />} />
        <Route path="/calibration" element={<PerformanceCalibration />} />
        <Route path="/improvement" element={<PerformanceImprovement />} />
        <Route path="/talent" element={<Talent />} />
        <Route path="/system" element={<SystemSettings />} />
        <Route path="/profile" element={<Profile />} />
      </Route>
    </Routes>
  );
}

export default App;