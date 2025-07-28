import { Component, JSX, Match, Switch } from 'solid-js';
import { useNavigate, useParams, useLocation } from '@solidjs/router';
import Card from '../widgets/Card';
import SettingsManager from '../interfaces/managers/SettingsManager';
import LoginForm from '../interfaces/forms/LoginForm';
import RegisterForm from '../interfaces/forms/RegisterForm';
import VerificationPendingForm from '../interfaces/forms/VerificationPendingForm';
import VerificationStateForm from '../interfaces/forms/VerificationStateForm';

interface AuthWrapperProps {
  type: 'settings' | 'login' | 'register' | 'verification-pending' | 'verification-state';
  class?: string;
  children?: JSX.Element;  
  onSuccess?: () => void;
}

const AuthWrapper: Component<AuthWrapperProps> = (props) => {
  const navigate = useNavigate();
  const params = useParams();
  const location = useLocation();

  // Common navigation handlers
  const handleNavigateToLogin = () => {
    navigate('/login');
  };

  const handleNavigateToVerificationPending = () => {
    navigate('/verification-pending');
  };

  // Handlers for verification pending
  const handleResendSuccess = () => {
    console.log('Verification email resent successfully');
  };

  const handleResendError = (error: string) => {
    console.error('Failed to resend verification email:', error);
  };

  // Handlers for verify state
  const handleVerificationStart = () => {
    console.log('Verification process started');
  };

  const handleVerificationSuccess = (verifiedEmail?: string) => {
    console.log('Verification successful for email:', verifiedEmail);
  };

  const handleVerificationError = (error: string) => {
    console.error('Verification failed:', error);
  };

  // Parse query parameters for verify state
  const getQueryParams = () => {
    const searchParams = new URLSearchParams(location.search);
    return {
      token: searchParams.get('token'),
      email: searchParams.get('email'),
      method: searchParams.get('method')
    };
  };

  // Get token and email for verify state
  const getVerificationData = () => {
    const queryParams = getQueryParams();
    const token = params.token || queryParams.token;
    const email = queryParams.email;
    return { token, email };
  };

  const renderContent = () => {
    return (
      <Switch>
        <Match when={props.type === 'settings'}>
          <div class="w-full"><SettingsManager /></div>
        </Match>
        <Match when={props.type === 'login'}>
          <LoginForm onSuccess={props.onSuccess} />
        </Match>
        <Match when={props.type === 'register'}>
          <RegisterForm onSuccess={props.onSuccess} />
        </Match>
        <Match when={props.type === 'verification-pending'}>
          <VerificationPendingForm
            onNavigateToLogin={handleNavigateToLogin}
            onResendSuccess={handleResendSuccess}
            onResendError={handleResendError}
          />
        </Match>
        <Match when={props.type === 'verification-state'}>
          {(() => {
            const { token, email } = getVerificationData();
            return (
              <VerificationStateForm
                token={token || undefined}
                email={email || undefined}
                onVerificationStart={handleVerificationStart}
                onVerificationSuccess={handleVerificationSuccess}
                onVerificationError={handleVerificationError}
                onNavigateToLogin={handleNavigateToLogin}
                onNavigateToVerificationPending={handleNavigateToVerificationPending}
              />
            );
          })()}
        </Match>
      </Switch>
    );
  };

  return (
    <Card class={`${props.type === 'settings' ? 'p-0 shadow-none border-0 bg-transparent' : ''} ${props.class || ''}`}>
      {renderContent() || props.children}
    </Card>
  );
};

export default AuthWrapper;
