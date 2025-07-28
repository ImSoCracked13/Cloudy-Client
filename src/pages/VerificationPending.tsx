import AuthWrapper from '../components/wrappers/AuthWrapper';

export default function VerificationPending() {
  return (
    <div class="min-h-screen flex items-center justify-center bg-background">
      <AuthWrapper type="verification-pending" class="w-full max-w-md" />
    </div>
  );
}