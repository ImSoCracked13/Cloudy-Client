import { lazy } from 'solid-js';
import { Route } from '@solidjs/router';
import ErrorPage from '../pages/Error';
import AuthenticatedLayout from '../layout/AuthenticatedLayout';
import PublicLayout from '../layout/PublicLayout';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import { useNavigate } from '@solidjs/router';
import { createEffect } from 'solid-js';

// Lazy-loaded page components
const Home = lazy(() => import('../pages/Home'));
const Login = lazy(() => import('../pages/Login'));
const Register = lazy(() => import('../pages/Register'));
const Drive = lazy(() => import('../pages/Drive'));
const Bin = lazy(() => import('../pages/Bin'));
const VerificationPending = lazy(() => import('../pages/VerificationPending'));
const VerifyState = lazy(() => import('../pages/VerifyState'));
const About = lazy(() => import('../pages/About'));
const Settings = lazy(() => import('../pages/Settings'));
const Storage = lazy(() => import('../pages/Storage'));

export default function AppRoutes() {
  return (
    <>
      {/* Public Routes - Use PublicLayout */}
      <Route path="/" component={() => (
        <PublicLayout>
          <Home />
        </PublicLayout>
      )} />
      <Route path="/login" component={() => (
        <PublicLayout>
          <Login />
        </PublicLayout>
      )} />
      <Route path="/register" component={() => (
        <PublicLayout>
          <Register />
        </PublicLayout>
      )} />
      <Route path="/verification-pending" component={() => (
        <PublicLayout>
          <VerificationPending />
        </PublicLayout>
      )} />
      <Route path="/verify-email" component={() => (
        <PublicLayout>
          <VerifyState />
        </PublicLayout>
      )} />
      <Route path="/verify-success" component={() => (
        <PublicLayout>
          <VerifyState />
        </PublicLayout>
      )} />
      <Route path="/about" component={() => (
        <PublicLayout>
          <About />
        </PublicLayout>
      )} />
      
      {/* Protected Routes - Use AuthenticatedLayout */}
      <Route path="/drive/:folderId?" component={() => (
        <AuthenticatedLayout>
          <ProtectedRoute>
            <Drive />
          </ProtectedRoute>
        </AuthenticatedLayout>
      )} />
      
      <Route path="/bin" component={() => (
        <AuthenticatedLayout>
          <ProtectedRoute>
            <Bin />
          </ProtectedRoute>
        </AuthenticatedLayout>
      )} />
      
      <Route path="/settings" component={() => (
        <AuthenticatedLayout>
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        </AuthenticatedLayout>
      )} />
      
      <Route path="/storage" component={() => (
        <AuthenticatedLayout>
          <ProtectedRoute>
            <Storage />
          </ProtectedRoute>
        </AuthenticatedLayout>
      )} />
      
      {/* Dashboard redirect for backward compatibility */}
      <Route path="/dashboard" component={() => {
        const navigate = useNavigate();
        createEffect(() => {
          navigate('/drive', { replace: true });
        });
        return null;
      }} />
      
      {/* Fallback route for 404 */}
      <Route path="*" component={() => (
        <PublicLayout>
          <ErrorPage code={404} message="Page not found" />
        </PublicLayout>
      )} />
    </>
  );
} 