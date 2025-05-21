import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Layout from '@/components/Layout';
import { AppProvider, useAppContext } from '@/contexts/AppContext';
import { Loader2 } from 'lucide-react';

const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const TasksPage = lazy(() => import('@/pages/TasksPage'));
const HabitsPage = lazy(() => import('@/pages/HabitsPage'));
const LoginPage = lazy(() => import('@/pages/LoginPage'));
const SignupPage = lazy(() => import('@/pages/SignupPage'));
const TodoPage = lazy(() => import('@/pages/TodoPage'));
const ProfilePage = lazy(() => import('@/pages/ProfilePage'));

const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen bg-background">
    <Loader2 className="h-16 w-16 animate-spin text-primary" />
  </div>
);

const ProtectedRoute = ({ isAuthenticated }) => {
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
};

const AppRoutes = () => {
  const { isAuthenticated, loading } = useAppContext();

  if (loading) {
    return <div>Carregando aplicativo...</div>;
  }

  return (
    <Router>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/login" element={<Layout><LoginPage /></Layout>} />
          <Route path="/signup" element={<Layout><SignupPage /></Layout>} />
          
          <Route element={<ProtectedRoute isAuthenticated={isAuthenticated} />}>
            <Route path="/dashboard" element={<Layout><DashboardPage /></Layout>} />
            <Route path="/tasks" element={<Layout><TasksPage /></Layout>} />
            <Route path="/habits" element={<Layout><HabitsPage /></Layout>} />
            <Route path="/todos" element={<Layout><TodoPage /></Layout>} />
            <Route path="/profile" element={<Layout><ProfilePage /></Layout>} />
            
            <Route path="/" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </Suspense>
    </Router>
  );
}

function App() {
  return (
    <AppProvider>
      <AppRoutes />
    </AppProvider>
  );
}

export default App;