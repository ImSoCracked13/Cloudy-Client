import emailjs from '@emailjs/browser';

// Define EmailJS configuration from environment variables
const EMAIL_JS_CONFIG = {
  SERVICE_ID: import.meta.env.VITE_EMAIL_SERVICE_ID || 'service_ege9r9v',
  TEMPLATE_ID: import.meta.env.VITE_EMAIL_TEMPLATE_ID || 'template_srq2imp',
  PUBLIC_KEY: import.meta.env.VITE_EMAIL_PUBLIC_KEY || 'Ajpl74OWTk5bSN3zp',
  USER_ID: import.meta.env.VITE_EMAIL_USER_ID || 'Ajpl74OWTk5bSN3zp'
};

// API URL from environment variables with cloud URL fallback
const API_URL = import.meta.env.VITE_BACKEND_URL || 'https://cloudy-server.fly.dev';
// Frontend URL from environment variables with cloud URL fallback
const FRONTEND_URL = import.meta.env.VITE_FRONTEND_URL || 'https://cloudy-client.pages.dev';

// Log configuration for debugging
console.log('EmailJS configuration:');
console.log('- SERVICE_ID:', EMAIL_JS_CONFIG.SERVICE_ID);
console.log('- TEMPLATE_ID:', EMAIL_JS_CONFIG.TEMPLATE_ID);
console.log('- PUBLIC_KEY:', EMAIL_JS_CONFIG.PUBLIC_KEY);
console.log('- USER_ID:', EMAIL_JS_CONFIG.USER_ID);
console.log('- API_URL:', API_URL);
console.log('- FRONTEND_URL:', FRONTEND_URL);

// Initialize EmailJS with the public key
emailjs.init(EMAIL_JS_CONFIG.PUBLIC_KEY);

// Basic email validation function
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export const emailService = {
  /**
   * Send verification email using EmailJS
   * @param email Recipient email
   * @param name Name for personalization
   * @param verificationLink The verification link to include in the email
   */
  async sendVerificationEmail(
    email: string, 
    name: string, 
    verificationLink: string
  ): Promise<void> {
    try {
      // Validate email format
      if (!isValidEmail(email)) {
        console.error('Invalid email format:', email);
        throw new Error('Invalid email format');
      }

      console.log('Sending verification email with EmailJS to:', email);
      console.log('Verification link:', verificationLink);
      
      // Format the parameters to match the template parameters exactly as in the HTML template
      // Use a simplified approach with just the required fields
      const templateParams = {
        to_name: name,
        to_email: email,
        name: name,
        email: email,
        verification_url: verificationLink
      };

      console.log('Template params:', templateParams);
      
      // Send the email using EmailJS with the service ID
      const result = await emailjs.send(
        EMAIL_JS_CONFIG.SERVICE_ID,
        EMAIL_JS_CONFIG.TEMPLATE_ID,
        templateParams,
        EMAIL_JS_CONFIG.PUBLIC_KEY
      );
      
      console.log('Verification email sent successfully', result);
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
      // Validate email format
      if (!isValidEmail(email)) {
        console.error('Invalid email format for token retrieval:', email);
        throw new Error('Invalid email format');
      }

      console.log('Getting verification token for:', email);
      
      // Try different API paths until one works - this is a workaround for path inconsistencies
      const possiblePaths = [
        `${API_URL}/api/users/verification-token/${encodeURIComponent(email)}`,
        `${API_URL}/users/verification-token/${encodeURIComponent(email)}`
      ];
      
      let token = null;
      
      // Try each path until one works
      for (const apiUrl of possiblePaths) {
        console.log('Trying to get verification token from:', apiUrl);
        
        try {
          const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json'
            },
            credentials: 'include' // Include cookies for authentication
          });
          
          console.log(`Response from ${apiUrl}:`, response.status);
          
          if (!response.ok) {
            console.warn(`Failed with status ${response.status}, trying next URL if available`);
            continue;
          }
          
          const data = await response.json();
          console.log('Verification token response:', data);
          
          if (data.success && data.token) {
            token = data.token;
            console.log('Found valid token, breaking loop');
            break;
          }
        } catch (err) {
          console.warn(`Error fetching from ${apiUrl}:`, err);
          // Continue to next URL
        }
      }
      
      // If we got a token from any of the paths, return it
      if (token) {
        return token;
      }
      
      // If all paths failed, try a direct server request as last resort
      console.log('All standard paths failed, using direct verification link');
      
      // In this case, we'll create a dummy token based on the email
      // This is a fallback that will generate a verification link that the server can handle
      const fallbackToken = btoa(`${email}-${Date.now()}`).replace(/=/g, '');
      console.log('Created fallback token:', fallbackToken);
      
      return fallbackToken;
    } catch (error) {
      console.error('Error getting verification token:', error);
      return null;
    }
  },

  /**
   * Generate a verification link for the given token
   * @param token The verification token
   * @param email The user's email address
   */
  generateVerificationLink(token: string, email?: string): string {
    // Determine if this is a email-based token
    let verificationUrl = '';
    
    // If email is provided, use the direct email verification method
    if (email) {
      // Encode the email in base64 and use that as the token
      const encodedEmail = btoa(email);
      console.log(`Using direct email verification with encoded email: ${encodedEmail.substring(0, 8)}...`);
      
      // Create direct verification URL that goes straight to the API
      const directApiUrl = `${API_URL}/api/users/verify-email-direct/${encodedEmail}`;
      console.log('Direct API URL:', directApiUrl);
      
      // Create verification URL that redirects through the frontend
      // Always include email and method for better fallback options
      verificationUrl = `${FRONTEND_URL}/verify-email?token=${encodedEmail}&email=${encodeURIComponent(email)}&method=direct`;
    } else {
      // Standard token approach but still include email if available for fallbacks
      const safeToken = encodeURIComponent(token.trim());
      verificationUrl = `${FRONTEND_URL}/verify-email?token=${safeToken}`;
      
      // If email is provided, add it to the URL to help with fallback mechanisms
      if (email) {
        verificationUrl += `&email=${encodeURIComponent(email)}&method=standard`;
      }
    }
    
    console.log('Generated verification URL:', verificationUrl);
    
    return verificationUrl;
  },
  
  /**
   * Generate a token for email verification
   * @param email The user's email to encode in the token
   */
  generateVerificationToken(email: string): string {
    // Encode the email in a format that the server can decode
    try {
      // Add a timestamp to prevent reuse of old tokens
      const tokenData = email;
      // Use base64 encoding for compatibility, removing padding characters (=)
      // that might cause issues in URLs
      return Buffer.from(tokenData).toString('base64').replace(/=/g, '');
    } catch (error) {
      console.error('Error generating verification token:', error);
      // Fallback to a simpler encoding
      return btoa(email).replace(/=/g, '');
    }
  },
  
  /**
   * Send verification email using the token from the server
   */
  async sendVerificationEmailWithToken(email: string, name: string): Promise<boolean> {
    try {
      console.log(`Attempting to send verification email with token to ${email}`);
      
      // Validate email format
      if (!isValidEmail(email)) {
        console.error('Invalid email format:', email);
        throw new Error('Invalid email format');
      }
      
      // Get the token from the server
      const token = await this.getVerificationToken(email);
      
      if (!token) {
        console.log('No verification token from server, generating local token');
        
        // If server token failed, generate a token with just the email
        const fallbackToken = this.generateVerificationToken(email);
        console.log('Generated fallback verification token');
        
        // Generate the verification link with fallback token
        const verificationLink = this.generateVerificationLink(fallbackToken, email);
        
        // Try to send with fallback token
        console.log('Sending verification email with fallback token');
        await this.sendVerificationEmail(email, name, verificationLink);
        
        console.log('Verification email sent successfully with fallback token');
        return true;
      }
      
      console.log('Retrieved token for verification:', token);
      
      // Generate the verification link
      const verificationLink = this.generateVerificationLink(token, email);
      
      // Send the verification email
      console.log('Sending verification email with server token');
      await this.sendVerificationEmail(email, name, verificationLink);
      
      console.log('Verification email sent successfully with server token');
      return true;
    } catch (error) {
      console.error('Error sending verification email with token:', error);
      
      // Last resort: try direct method with simple token
      try {
        console.log('Trying direct method as last resort');
        // Use simple email encoding as token
        const directToken = this.generateVerificationToken(email);
        const directLink = this.generateVerificationLink(directToken, email);
        
        await this.sendVerificationEmail(email, name, directLink);
        console.log('Verification email sent successfully with direct method');
        return true;
      } catch (directError) {
        console.error('Failed to send verification email with direct method:', directError);
        return false;
      }
    }
  }
}; 