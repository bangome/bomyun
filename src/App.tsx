import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, useParams } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ComplexProvider } from './contexts/ComplexContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { SuperAdminRoute } from './components/auth/SuperAdminRoute';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { JoinPage } from './pages/JoinPage';
import { ComplexSetupPage } from './pages/ComplexSetupPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { SharedViewer } from './pages/SharedViewer';
import { AppLayout } from './components/layout/AppLayout';
import { PDFViewer } from './components/pdf/PDFViewer';
import { useComplex } from './hooks/useComplex';
import { Loader2 } from 'lucide-react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5분
      retry: 1,
    },
  },
});

function MainApp() {
  const { hasComplex, isLoading } = useComplex();
  const { documentId } = useParams<{ documentId?: string }>();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  // 단지가 없으면 단지 설정 페이지로
  if (!hasComplex) {
    return <ComplexSetupPage />;
  }

  return (
    <AppLayout>
      <PDFViewer className="h-full" initialDocumentId={documentId} />
    </AppLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route
              path="/join/:inviteCode"
              element={
                <ProtectedRoute>
                  <JoinPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <SuperAdminRoute>
                  <AdminDashboard />
                </SuperAdminRoute>
              }
            />
            {/* 공유 링크 (비인증 접근 가능) */}
            <Route path="/s/:shortCode" element={<SharedViewer />} />
            {/* 문서 뷰어 (인증 필요) */}
            <Route
              path="/doc/:documentId"
              element={
                <ProtectedRoute>
                  <ComplexProvider>
                    <MainApp />
                  </ComplexProvider>
                </ProtectedRoute>
              }
            />
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <ComplexProvider>
                    <MainApp />
                  </ComplexProvider>
                </ProtectedRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
