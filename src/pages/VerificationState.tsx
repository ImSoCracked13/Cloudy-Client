import AuthWrapper from '../components/wrappers/AuthWrapper';

export default function VerifyState() {
  return (
    <div class="min-h-screen flex items-center justify-center bg-background">
      <AuthWrapper type="verification-state" class="w-full max-w-md" />
    </div>
  );
}