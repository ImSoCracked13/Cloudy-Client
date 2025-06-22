// Use mock websocket for development
const USE_MOCK_WEBSOCKET = import.meta.env.VITE_USE_MOCK_WEBSOCKET === 'true' || true;

type MessageHandler = (data: any) => void;

/**
 * WebSocket service for real-time updates
 */
export class WebSocketService {
  private socket: WebSocket | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout: number | null = null;
  private messageHandlers: Map<string, MessageHandler[]> = new Map();
  private url: string;
  private mockHandlers: Map<string, (() => void)[]> = new Map();

  constructor() {
    const apiUrl = import.meta.env.VITE_BACKEND_URL || 'https://cloudy-server.fly.dev';
    // Convert http:// to ws:// or https:// to wss://
    this.url = apiUrl.replace(/^http/, 'ws') + '/ws';
  }

  /**
   * Connect to WebSocket server
   */
  connect(authToken: string): Promise<void> {
    if (USE_MOCK_WEBSOCKET) {
      return this.mockConnect();
    }
    
    return new Promise((resolve, reject) => {
      try {
        this.socket = new WebSocket(`${this.url}?token=${authToken}`);
        
        this.socket.onopen = () => {
          this.isConnected = true;
          this.reconnectAttempts = 0;
          console.log('WebSocket connection established');
          resolve();
        };

        this.socket.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        this.socket.onclose = (event) => {
          this.isConnected = false;
          console.log(`WebSocket connection closed: ${event.code} ${event.reason}`);
          this.attemptReconnect();
        };

        this.socket.onerror = (error) => {
          console.error('WebSocket error:', error);
          reject(error);
        };
      } catch (error) {
        console.error('Error creating WebSocket connection:', error);
        reject(error);
      }
    });
  }

  /**
   * Create a mock WebSocket connection for development
   */
  private mockConnect(): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        this.isConnected = true;
        console.log('Mock WebSocket connection established');
        resolve();
      }, 500);
    });
  }

  /**
   * Attempt to reconnect to WebSocket server
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Maximum reconnect attempts reached');
      return;
    }

    if (this.reconnectTimeout !== null) {
      clearTimeout(this.reconnectTimeout);
    }

    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);

    this.reconnectTimeout = window.setTimeout(() => {
      this.reconnectAttempts++;
      this.connect(localStorage.getItem('authToken') || '');
    }, delay);
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (USE_MOCK_WEBSOCKET) {
      this.isConnected = false;
      return;
    }
    
    if (this.socket && this.isConnected) {
      this.socket.close();
      this.socket = null;
      this.isConnected = false;
    }

    if (this.reconnectTimeout !== null) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }

  /**
   * Register a message handler
   */
  on(event: string, handler: MessageHandler): void {
    if (!this.messageHandlers.has(event)) {
      this.messageHandlers.set(event, []);
    }
    this.messageHandlers.get(event)?.push(handler);
  }

  /**
   * Remove a message handler
   */
  off(event: string, handler: MessageHandler): void {
    if (!this.messageHandlers.has(event)) return;
    
    const handlers = this.messageHandlers.get(event);
    if (!handlers) return;
    
    const index = handlers.indexOf(handler);
    if (index !== -1) {
      handlers.splice(index, 1);
    }
  }

  /**
   * Handle incoming WebSocket message
   */
  private handleMessage(message: any): void {
    // Handle Elysia middleware response format
    if (message.beforeHandle && Array.isArray(message.beforeHandle)) {
      console.log('Detected Elysia middleware response format in WebSocket message');
      
      // Extract non-null data from beforeHandle array
      const nonNullData = message.beforeHandle.filter((item: any) => item !== null);
      if (nonNullData.length > 0) {
        // Get the last non-null item as the real response
        message = nonNullData[nonNullData.length - 1];
      }
    }
    
    if (!message.type) {
      console.error('Invalid WebSocket message format, missing type:', message);
      return;
    }

    const handlers = this.messageHandlers.get(message.type) || [];
    
    for (const handler of handlers) {
      try {
        handler(message.data);
      } catch (error) {
        console.error(`Error in WebSocket handler for ${message.type}:`, error);
      }
    }
  }

  /**
   * Send a message to the WebSocket server
   */
  send(type: string, data: any): void {
    if (USE_MOCK_WEBSOCKET) {
      console.log('Mock WebSocket message sent:', { type, data });
      
      // Simulate response for certain message types
      if (type === 'get_storage_stats') {
        setTimeout(() => {
          this.handleMessage({
            type: 'storage_stats',
            data: {
              used: 1024 * 1024 * 100, // 100MB
              limit: 1024 * 1024 * 1024 * 20, // 20GB
              percentage: 0.5
            }
          });
        }, 300);
      }
      return;
    }
    
    if (!this.socket || !this.isConnected) {
      console.error('Cannot send message: WebSocket is not connected');
      return;
    }

    try {
      const message = JSON.stringify({ type, data });
      this.socket.send(message);
    } catch (error) {
      console.error('Error sending WebSocket message:', error);
    }
  }

  /**
   * Check if WebSocket is connected
   */
  isConnectedStatus(): boolean {
    return this.isConnected;
  }
}

// Create a singleton instance
export const webSocketService = new WebSocketService(); 