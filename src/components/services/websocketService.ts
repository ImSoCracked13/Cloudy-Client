// Use mock websocket for development
const USE_MOCK_WEBSOCKET = true;

type MessageHandler = (data: any) => void;

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
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    // Convert http:// to ws:// or https:// to wss://
    this.url = apiUrl.replace(/^http/, 'ws') + '/ws';
  }

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

  private mockConnect(): Promise<void> {
    return new Promise((resolve) => {
      // Simulate connection delay
      setTimeout(() => {
        this.isConnected = true;
        console.log('Mock WebSocket connection established');
        resolve();
      }, 500);
    });
  }

  private attemptReconnect(): void {
    if (USE_MOCK_WEBSOCKET) {
      this.mockConnect();
      return;
    }
    
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Maximum reconnect attempts reached');
      return;
    }

    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    this.reconnectAttempts++;

    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    if (this.reconnectTimeout !== null) {
      clearTimeout(this.reconnectTimeout);
    }
    
    this.reconnectTimeout = window.setTimeout(() => {
      const authToken = localStorage.getItem('authToken') || '';
      this.connect(authToken).catch(error => {
        console.error('Reconnect failed:', error);
      });
    }, delay);
  }

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

  on(event: string, handler: MessageHandler): void {
    if (!this.messageHandlers.has(event)) {
      this.messageHandlers.set(event, []);
    }
    this.messageHandlers.get(event)?.push(handler);
  }

  off(event: string, handler: MessageHandler): void {
    if (!this.messageHandlers.has(event)) return;
    
    const handlers = this.messageHandlers.get(event) || [];
    const index = handlers.indexOf(handler);
    
    if (index !== -1) {
      handlers.splice(index, 1);
    }
  }

  private handleMessage(message: any): void {
    const { type, data } = message;
    
    if (this.messageHandlers.has(type)) {
      const handlers = this.messageHandlers.get(type) || [];
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in handler for event ${type}:`, error);
        }
      });
    }
  }

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

  isConnectedStatus(): boolean {
    return this.isConnected;
  }
}

// Create a singleton instance
export const websocketService = new WebSocketService(); 