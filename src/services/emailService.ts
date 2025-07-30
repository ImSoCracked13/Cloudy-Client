import emailjs from '@emailjs/browser';

// Define EmailJS configuration from environment variables
const EMAIL_JS_CONFIG = {
  SERVICE_ID: import.meta.env.VITE_EMAIL_SERVICE_ID,
  TEMPLATE_ID: import.meta.env.VITE_EMAIL_TEMPLATE_ID,
  PUBLIC_KEY: import.meta.env.VITE_EMAIL_PUBLIC_KEY
};

// Get environment-specific URLs
const FRONTEND_URL = import.meta.env.VITE_FRONTEND_URL;
const IS_PRODUCTION = import.meta.env.VITE_IS_PRODUCTION;

// Frontend URL
const VERIFICATION_URL = FRONTEND_URL ? FRONTEND_URL : IS_PRODUCTION;

// Initialize EmailJS
try {
  emailjs.init({
    publicKey: EMAIL_JS_CONFIG.PUBLIC_KEY,
    blockHeadless: false,
    limitRate: {
      throttle: 10000,
    }
  });
} catch (error) {
  console.error('Failed to initialize EmailJS:', error);
}

// Basic email validation function
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export const emailService = {
  /**
   * Create verification email template using EmailJS
   */
  async createVerificationEmail(
    email: string, 
    name: string, 
    verificationLink: string
  ): Promise<void> {
    try {
      // Validate email format
      if (!isValidEmail(email)) {
        throw new Error('Invalid email format');
      }
      
      // Format the parameters to match the template parameters exactly
      const templateParams = {
        name: name,
        email: email,
        verification_url: verificationLink
      };
      
      // Send the email using EmailJS
      const result = await emailjs.send(
        EMAIL_JS_CONFIG.SERVICE_ID,
        EMAIL_JS_CONFIG.TEMPLATE_ID,
        // Use the template parameters directly
        templateParams,
        EMAIL_JS_CONFIG.PUBLIC_KEY
      ).catch(error => {
        console.error('EmailJS send error:', error);
        throw error;
      });
      
      console.log('EmailJS send response:', result);
      
      if (result.status !== 200) {
        throw new Error(`EmailJS returned status ${result.status}`);
      }
    } catch (error) {
      console.error('Error sending verification email:', error);
    }
  },

  /**
   * Generate a verification link for the given token
   */
  generateVerificationLink(token: string, email?: string): string {
    try {
      // Always include email in the verification link for better tracking
      const params = new URLSearchParams();
      params.append('token', token);
      
      if (email) {
        params.append('email', email);
        params.append('method', 'direct');
      }
      
      // Create the verification URL
      const verificationUrl = `${VERIFICATION_URL}/verify-email?${params.toString()}`;
      
      return verificationUrl;
    } catch (error) {
      console.error('Error generating verification link:', error);
    }
  },

  /**
   * Send verification email using a token provided by the server (for resending)
   */
  async sendVerificationEmailWithServerToken(
    email: string, 
    name: string, 
    token: string
  ): Promise<boolean> {
    try {
      // Validate email format
      if (!isValidEmail(email)) {
        console.error('Invalid email format:', email);
        return false;
      }
      
      // Generate the verification link
      const verificationLink = this.generateVerificationLink(token, email);
      
      // Send the verification email
      await this.createVerificationEmail(email, name, verificationLink);
      console.log('Verification email sent successfully with server token');
      return true;
    } catch (error) {
      console.error('Error sending verification email with server token:', error);
      return false;
    }
  }
}; 