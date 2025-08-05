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
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import VerifyEmail from "./pages/VerifyEmail";
import MobileVerification from "./pages/MobileVerification";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import ReportIssue from "./pages/ReportIssue";
import MyIssues from "./pages/MyIssues";
import AdminDashboard from "./pages/AdminDashboard";
import TechnicianDashboard from "./pages/TechnicianDashboard";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <Provider store={store}>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
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
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </Provider>
);

export default App;
