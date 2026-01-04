import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

// Pages
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import PurchaserDashboard from "./pages/purchaser/PurchaserDashboard";
import PurchaserPlots from "./pages/purchaser/PurchaserPlots";
import PlotApplication from "./pages/purchaser/PlotApplication";
import PurchaserPayments from "./pages/purchaser/PurchaserPayments";
import PurchaserDocuments from "./pages/purchaser/PurchaserDocuments";
import PurchaserCases from "./pages/purchaser/PurchaserCases";
import ServiceProviderDashboard from "./pages/serviceProvider/ServiceProviderDashboard";
import WorkQueue from "./pages/serviceProvider/WorkQueue";
import PaymentsMonitor from "./pages/serviceProvider/PaymentsMonitor";
import CasesPanel from "./pages/serviceProvider/CasesPanel";
import DocumentsIssuance from "./pages/serviceProvider/DocumentsIssuance";
import AuditLogPage from "./pages/serviceProvider/AuditLogPage";
import PlotManagement from "./pages/serviceProvider/PlotManagement";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const getDefaultRoute = () => {
    if (!user) return '/';
    // Align with UserRole: 'purchaser' | 'service_provider' | 'admin' | 'legal'
    return user.role === 'purchaser' ? '/purchaser' : '/service-provider';
  };

  return (
    <Routes>
      <Route path="/" element={isAuthenticated ? <Navigate to={getDefaultRoute()} /> : <LoginPage />} />
      <Route path="/register" element={isAuthenticated ? <Navigate to={getDefaultRoute()} /> : <RegisterPage />} />

      {/* Purchaser Routes */}
      <Route path="/purchaser" element={<ProtectedRoute allowedRoles={['purchaser']}><PurchaserDashboard /></ProtectedRoute>} />
      <Route path="/purchaser/plots" element={<ProtectedRoute allowedRoles={['purchaser']}><PurchaserPlots /></ProtectedRoute>} />
      <Route path="/purchaser/apply/:plotId" element={<ProtectedRoute allowedRoles={['purchaser']}><PlotApplication /></ProtectedRoute>} />
      <Route path="/purchaser/payments" element={<ProtectedRoute allowedRoles={['purchaser']}><PurchaserPayments /></ProtectedRoute>} />
      <Route path="/purchaser/documents" element={<ProtectedRoute allowedRoles={['purchaser']}><PurchaserDocuments /></ProtectedRoute>} />
      <Route path="/purchaser/cases" element={<ProtectedRoute allowedRoles={['purchaser']}><PurchaserCases /></ProtectedRoute>} />

      {/* Service Provider Routes (Merged Admin Panel) */}
      <Route path="/service-provider" element={<ProtectedRoute allowedRoles={['service_provider', 'legal', 'admin']}><ServiceProviderDashboard /></ProtectedRoute>} />
      <Route path="/service-provider/plots" element={<ProtectedRoute allowedRoles={['service_provider', 'legal', 'admin']}><PlotManagement /></ProtectedRoute>} />
      <Route path="/service-provider/work-queue" element={<ProtectedRoute allowedRoles={['service_provider', 'legal', 'admin']}><WorkQueue /></ProtectedRoute>} />
      <Route path="/service-provider/payments" element={<ProtectedRoute allowedRoles={['service_provider', 'legal', 'admin']}><PaymentsMonitor /></ProtectedRoute>} />
      <Route path="/service-provider/cases" element={<ProtectedRoute allowedRoles={['service_provider', 'legal', 'admin']}><CasesPanel /></ProtectedRoute>} />
      <Route path="/service-provider/documents" element={<ProtectedRoute allowedRoles={['service_provider', 'legal', 'admin']}><DocumentsIssuance /></ProtectedRoute>} />
      <Route path="/service-provider/audit-log" element={<ProtectedRoute allowedRoles={['service_provider', 'legal', 'admin']}><AuditLogPage /></ProtectedRoute>} />

      {/* Legacy admin routes redirect */}
      <Route path="/admin/*" element={<Navigate to="/service-provider" replace />} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

import { MockDataProvider } from "@/contexts/MockDataContext";

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <MockDataProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </TooltipProvider>
      </MockDataProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
