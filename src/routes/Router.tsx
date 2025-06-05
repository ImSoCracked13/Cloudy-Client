import { lazy } from 'solid-js';
import { Route } from '@solidjs/router';
import ErrorPage from '../pages/Error';
import Layout from '../layout/Layout';
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
const VerifyEmail = lazy(() => import('../pages/VerifyEmail'));
const VerifySuccess = lazy(() => import('../pages/VerifySuccess'));
const About = lazy(() => import('../pages/About'));
const Settings = lazy(() => import('../pages/Settings'));
const Storage = lazy(() => import('../pages/Storage'));

export default function AppRoutes() {
  return (
    <>
      <Route path="/" component={() => (
        <Layout>
          <Home />
        </Layout>
      )} />
      <Route path="/login" component={() => (
        <Layout>
          <Login />
        </Layout>
      )} />
      <Route path="/register" component={() => (
        <Layout>
          <Register />
        </Layout>
      )} />
      <Route path="/verification-pending" component={() => (
        <Layout>
          <VerificationPending />
        </Layout>
      )} />
      <Route path="/verify-email" component={() => (
        <Layout>
          <VerifyEmail />
        </Layout>
      )} />
      <Route path="/verify-success" component={() => (
        <Layout>
          <VerifySuccess />
        </Layout>
      )} />
      <Route path="/about" component={() => (
        <Layout>
          <About />
        </Layout>
      )} />
      
      {/* Protected Routes */}
      <Route path="/drive/:folderId?" component={() => (
        <Layout>
          <ProtectedRoute>
            <Drive />
          </ProtectedRoute>
        </Layout>
      )} />
      
      <Route path="/bin" component={() => (
        <Layout>
          <ProtectedRoute>
            <Bin />
          </ProtectedRoute>
        </Layout>
      )} />
      
      <Route path="/settings" component={() => (
        <Layout>
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        </Layout>
      )} />
      
      <Route path="/storage" component={() => (
        <Layout>
          <ProtectedRoute>
            <Storage />
          </ProtectedRoute>
        </Layout>
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
        <Layout>
          <ErrorPage code={404} message="Page not found" />
        </Layout>
      )} />
    </>
  );
} 