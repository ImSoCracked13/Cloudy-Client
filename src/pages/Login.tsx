import { useNavigate } from '@solidjs/router';
import AuthWrapper from '../components/wrappers/AuthWrapper';

export default function Login() {
  const navigate = useNavigate();

  const handleSuccess = () => {
    navigate('/drive');
  };

  return (
    <div class="min-h-screen flex items-center justify-center bg-background">
      <AuthWrapper type="login" class="w-full max-w-md" onSuccess={handleSuccess} />
    </div>
  );
} 