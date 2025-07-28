import { lazy } from 'solid-js';
import { Route } from '@solidjs/router';
import PublicLayout from '../layout/PublicLayout';
import AuthenticatedLayout from '../layout/AuthenticatedLayout';
import ProtectedWrapper from '../components/wrappers/ProtectedWrapper';

// Lazy load pages
const Home = lazy(() => import('../pages/Home'));
const Login = lazy(() => import('../pages/Login'));
const Register = lazy(() => import('../pages/Register'));
const Drive = lazy(() => import('../pages/Drive'));
const Bin = lazy(() => import('../pages/Bin'));
const Storage = lazy(() => import('../pages/Storage'));
const Settings = lazy(() => import('../pages/Settings'));
const About = lazy(() => import('../pages/About'));
const VerificationPending = lazy(() => import('../pages/VerificationPending'));
const VerifyState = lazy(() => import('../pages/VerificationState'));
const ErrorPage = lazy(() => import('../pages/Error'));

export default function Router() {
  return (
    <>
      {/* Public Routes */}
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
      <Route path="/about" component={() => (
        <PublicLayout>
          <About />
        </PublicLayout>
      )} />
      <Route path="/verification-pending" component={() => (
        <PublicLayout>
          <VerificationPending />
        </PublicLayout>
      )} />
      <Route path="/verify/:token" component={() => (
        <PublicLayout>
          <VerifyState />
        </PublicLayout>
      )} />
      <Route path="/verify-email" component={() => (
        <PublicLayout>
          <VerifyState />
        </PublicLayout>
      )} />
      
      {/* Protected Routes */}
      <Route path="/drive" component={() => (
        <ProtectedWrapper>
          <AuthenticatedLayout>
            <Drive />
          </AuthenticatedLayout>
        </ProtectedWrapper>
      )} />
      <Route path="/bin" component={() => (
        <ProtectedWrapper>
          <AuthenticatedLayout>
            <Bin />
          </AuthenticatedLayout>
        </ProtectedWrapper>
      )} />
      <Route path="/storage" component={() => (
        <ProtectedWrapper>
          <AuthenticatedLayout>
            <Storage />
          </AuthenticatedLayout>
        </ProtectedWrapper>
      )} />
      <Route path="/settings" component={() => (
        <ProtectedWrapper>
          <AuthenticatedLayout>
            <Settings />
          </AuthenticatedLayout>
        </ProtectedWrapper>
      )} />
      
      {/* Error Route */}
      <Route path="*" component={() => (
        <PublicLayout>
          <ErrorPage code={404} message="Page not found" />
        </PublicLayout>
      )} />
    </>
  );
} 