import { useNavigate } from '@solidjs/router';
import Button from '../components/widgets/Button';
import { notificationService } from '../components/common/Notification';
import { onMount } from 'solid-js';

export default function VerifySuccess() {
  const navigate = useNavigate();
  
  onMount(() => {
    // Show a notification when the page loads
    notificationService.success('Email verification successful!');
  });
  
  const handleGoToLogin = () => {
    navigate('/login');
  };
  
  return (
    <div class="min-h-screen bg-background flex items-center justify-center p-4">
      <div class="w-full max-w-md">
        <div class="bg-background-darker rounded-lg shadow-lg p-8 text-center">
          <div class="flex justify-center mb-6">
            <div class="rounded-full bg-success/20 p-4">
              <svg class="h-16 w-16 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          
          <h1 class="text-3xl font-bold text-text mb-4">Verification Successful!</h1>
          
          <p class="text-text-muted mb-6">
            Your email has been successfully verified. Your account is now active,
            and you can access all features of Cloudy.
          </p>
          
          <p class="text-text-muted mb-8">
            Thank you for joining our community. We're excited to have you on board!
          </p>
          
          <Button onClick={handleGoToLogin} fullWidth>
            Go to Login
          </Button>
        </div>
      </div>
    </div>
  );
} 