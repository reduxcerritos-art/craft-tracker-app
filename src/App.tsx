import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import Login from './pages/Login';
import TechDashboard from './pages/TechDashboard';
import AdminDashboard from './pages/AdminDashboard';
import BulkOrderDashboard from './pages/BulkOrderDashboard';
import { useAuth } from './hooks/useAuth';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AppRoutes />
      </Router>
      <Toaster />
    </QueryClientProvider>
  );
}

function AppRoutes() {
  const { user, loading, userRole } = useAuth();
  
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <Routes>
      <Route path="/login" element={!user ? <Login /> : <Navigate to={getDefaultRoute(userRole)} replace />} />
      <Route path="/tech" element={<ProtectedRoute><TechDashboard /></ProtectedRoute>} />
      <Route path="/bulk" element={<BulkOrderRoute><BulkOrderDashboard /></BulkOrderRoute>} />
      <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
      <Route path="/" element={user ? <Navigate to={getDefaultRoute(userRole)} replace /> : <Navigate to="/login" replace />} />
    </Routes>
  );
}

function getDefaultRoute(userRole: string | null) {
  if (userRole === 'admin') return '/admin';
  if (userRole === 'qa_tech' || userRole === 'packer') return '/bulk';
  return '/tech';
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}

function BulkOrderRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, userRole } = useAuth();
  
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (userRole !== 'qa_tech' && userRole !== 'packer') {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, isAdmin } = useAuth();
  
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
}

export default App;
