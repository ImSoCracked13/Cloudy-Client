import { useNavigate } from '@solidjs/router';
import AuthWrapper from '../components/wrappers/AuthWrapper';

export default function Register() {
  const navigate = useNavigate();

  const handleSuccess = () => {
    navigate('/verification-pending');
  };

  return (
    <div class="min-h-screen flex items-center justify-center bg-background">
      <AuthWrapper type="register" class="w-full max-w-md" onSuccess={handleSuccess} />
    </div>
  );
} 