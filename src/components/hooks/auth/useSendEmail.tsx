import { authService } from '../../../services/authService';
import { emailService } from '../../../services/emailService';
import { authStore } from '../../store/AuthStore';

export function useSendEmail() {
    
    const sendVerificationEmail = async (email: string) => {
        if (authStore.state.sendEmailLoading) return false;
    
        authStore.setSendEmailLoading(true);
        authStore.setSendEmailError(null);
        authStore.setSendEmailSuccess(false);
    
        try {
            // Call server API to generate new token
            const result = await authService.sendVerificationEmail(email);
    
            if (result && result.success && result.token) {
                // Use EmailJS to send the verification email with the server-provided token
                const emailSent = await emailService.sendVerificationEmailWithServerToken(
                    email,
                    'User',
                    result.token
                );
    
                if (emailSent) {
                    authStore.setSendEmailSuccess(true);
                    return true;
                } else {
                    throw new Error('Failed to send verification email via EmailJS');
                }
            } else {
                throw new Error('Failed to generate verification token');
            }
        } catch (err) {
            authStore.setSendEmailError(err instanceof Error ? err.message : 'Failed to resend verification email');
            return false;
        } finally {
            authStore.setSendEmailLoading(false);
        }
    };
    
    return { 
        sendVerificationEmail, 
        loading: () => authStore.state.sendEmailLoading,
        error: () => authStore.state.sendEmailError,
        success: () => authStore.state.sendEmailSuccess
    };
}