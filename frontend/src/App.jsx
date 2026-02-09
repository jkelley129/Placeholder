import { useState } from 'react';
import { AuthProvider, useAuth } from './hooks/useAuth';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardApp from './pages/DashboardApp';

function AppRouter() {
  const { user, loading } = useAuth();
  const [page, setPage] = useState('landing');

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (user) {
    return <DashboardApp />;
  }

  switch (page) {
    case 'login':
      return <LoginPage onNavigate={setPage} />;
    case 'register':
      return <RegisterPage onNavigate={setPage} />;
    default:
      return <LandingPage onNavigate={setPage} />;
  }
}

export default function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}
