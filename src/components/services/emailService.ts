import emailjs from '@emailjs/browser';

const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const USER_ID = import.meta.env.VITE_EMAILJS_USER_ID;
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const emailService = {
  /**
   * Send verification email using EmailJS
   * @param email Recipient email
   * @param username Username for personalization
   * @param verificationLink The verification link to include in the email
   */
  async sendVerificationEmail(
    email: string, 
    username: string, 
    verificationLink: string
  ): Promise<void> {
    try {
      console.log('Sending verification email with EmailJS to:', email);
      console.log('With verification link:', verificationLink);
      
      // Format the parameters to match the template
      const templateParams = {
        name: username,
        email: email,
        // This must match exactly what's in your EmailJS template
        verification_url: verificationLink
      };

      console.log('Template params:', JSON.stringify(templateParams, null, 2));
      
      // Send the email using EmailJS
      const result = await emailjs.send(
        SERVICE_ID,
        TEMPLATE_ID,
        templateParams,
        USER_ID
      );
      
      console.log('Verification email sent successfully:', result);
    } catch (error) {
      console.error('Error sending verification email with EmailJS:', error);
      throw new Error('Failed to send verification email');
    }
  },

  /**
   * Get verification token from the server
   * @param email The email of the user to get the token for
   */
  async getVerificationToken(email: string): Promise<string | null> {
    try {
      console.log('Getting verification token for:', email);
      
      const response = await fetch(`${API_URL}/api/users/verification-token/${encodeURIComponent(email)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        console.error('Failed to get verification token, status:', response.status);
        return null;
      }
      
      const data = await response.json();
      console.log('Verification token response:', data);
      
      if (data.success && data.token) {
        return data.token;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting verification token:', error);
      return null;
    }
  },

  /**
   * Generate a verification link for the given token
   */
  generateVerificationLink(token: string): string {
    // Get the frontend URL from environment variable or use a default
    const frontendUrl = import.meta.env.VITE_FRONTEND_URL || 'http://localhost:3001';
    
    // Create a fully qualified URL with the token as a query parameter
    const verificationUrl = `${frontendUrl}/verify-email?token=${encodeURIComponent(token)}`;
    
    console.log('Generated verification URL:', verificationUrl);
    return verificationUrl;
  },
  
  /**
   * Send verification email using the token from the server
   */
  async sendVerificationEmailWithToken(email: string, username: string): Promise<boolean> {
    try {
      // Get the token from the server
      const token = await this.getVerificationToken(email);
      
      if (!token) {
        console.error('No verification token found for:', email);
        return false;
      }
      
      // Generate the verification link
      const verificationLink = this.generateVerificationLink(token);
      
      // Send the email with the link
      await this.sendVerificationEmail(email, username, verificationLink);
      
      return true;
    } catch (error) {
      console.error('Failed to send verification email with token:', error);
      return false;
    }
  }
}; 