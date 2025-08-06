import './i18n'; // Import i18n configuration
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Provider } from "react-redux";
import { store } from "@/store";
import AuthGuard from "@/components/auth/AuthGuard";
import Layout from "@/components/layout/Layout";
import { lazy, Suspense } from "react";

// Lazy load components for better performance
const Index = lazy(() => import("./pages/Index"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const VerifyEmail = lazy(() => import("./pages/VerifyEmail"));
const MobileVerification = lazy(() => import("./pages/MobileVerification"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const ReportIssue = lazy(() => import("./pages/ReportIssue"));
const MyIssues = lazy(() => import("./pages/MyIssues"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const TechnicianDashboard = lazy(() => import("./pages/TechnicianDashboard"));
const Profile = lazy(() => import("./pages/Profile"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const App = () => (
  <Provider store={store}>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
            </div>
          }>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/mobile-verification" element={<MobileVerification />} />
              <Route path="/" element={
                <AuthGuard>
                  <Layout>
                    <Index />
                  </Layout>
                </AuthGuard>
              } />
              <Route path="/dashboard" element={
                <AuthGuard>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </AuthGuard>
              } />
              <Route path="/report-issue" element={
                <AuthGuard roles={['resident', 'committee']}>
                  <Layout>
                    <ReportIssue />
                  </Layout>
                </AuthGuard>
              } />
              <Route path="/my-issues" element={
                <AuthGuard>
                  <Layout>
                    <MyIssues />
                  </Layout>
                </AuthGuard>
              } />
              <Route path="/admin-dashboard" element={
                <AuthGuard roles={['committee']}>
                  <Layout>
                    <AdminDashboard />
                  </Layout>
                </AuthGuard>
              } />
              <Route path="/technician-dashboard" element={
                <AuthGuard roles={['technician']}>
                  <Layout>
                    <TechnicianDashboard />
                  </Layout>
                </AuthGuard>
              } />
              <Route path="/profile" element={
                <AuthGuard>
                  <Layout>
                    <Profile />
                  </Layout>
                </AuthGuard>
              } />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </Provider>
);

export default App;
