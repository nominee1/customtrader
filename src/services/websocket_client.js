export class DerivWebSocket {
  constructor(appId = import.meta.env.VITE_DERIV_APP_ID) {
    this.appId = appId;
    this.socket = null;
    this.subscribers = new Set();
    this.reconnectInterval = 5000;
    this.heartbeatInterval = null;
    this.isConnecting = false; 
    this.connectionPromise = null; 
  }

  connect() {
    // Return existing connection Promise if already connecting
    if (this.isConnecting && this.connectionPromise) {
      return this.connectionPromise;
    }

    // Create a new Promise for the connection
    this.isConnecting = true;
    this.connectionPromise = new Promise((resolve, reject) => {
      // Clean up any existing socket
      if (this.socket) {
        this.socket.close();
        this.socket = null;
      }

      this.socket = new WebSocket(`wss://ws.derivws.com/websockets/v3?app_id=${this.appId}`);

      this.socket.onopen = (event) => {
        this.isConnecting = false;
        this.notifySubscribers('open', event);
        this.startHeartbeat();
        resolve();
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.pong) {
            console.log('[heartbeat] Pong received');
          } else {
            this.notifySubscribers('message', data);
          }
        } catch (error) {
          console.error('[message] Failed to parse response:', error);
          this.notifySubscribers('error', { message: 'Invalid response format', error });
        }
      };

      this.socket.onclose = (event) => {
        this.isConnecting = false;
        if (event.wasClean) {
          console.log(`[close] Connection closed cleanly, code=${event.code} reason=${event.reason}`);
        } else {
          this.reconnect();
        }
        this.notifySubscribers('close', event);
        this.stopHeartbeat();
        reject(new Error(`WebSocket closed: code=${event.code}, reason=${event.reason}`));
      };

      this.socket.onerror = (error) => {
        console.error('[error] WebSocket error:', error);
        this.isConnecting = false;
        this.notifySubscribers('error', error);
        reject(new Error('WebSocket connection error'));
      };
    });

    return this.connectionPromise;
  }

  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  notifySubscribers(event, data) {
    this.subscribers.forEach((callback) => {
      try {
        callback(event, data);
      } catch (error) {
        console.error('[notify] Subscriber callback error:', error);
      }
    });
  }

  send(data) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      try {
        this.socket.send(JSON.stringify(data));
      } catch (error) {
        console.error('[send] Failed to send data:', error);
      }
    } else {
      console.warn('[send] WebSocket not connected, cannot send:', data);
      throw new Error('WebSocket is not connected');
    }
  }

  close() {
    if (this.socket) {
      this.socket.close(1000, 'Manual close');
      this.socket = null;
    }
    this.stopHeartbeat();
    this.subscribers.clear(); 
    this.isConnecting = false;
    this.connectionPromise = null;
  }

  reconnect() {
    if (!this.isConnecting) {
      setTimeout(() => {
        console.log('[reconnect] Attempting to reconnect...');
        this.connect();
      }, this.reconnectInterval);
    }
  }

  startHeartbeat() {
    this.stopHeartbeat(); // Clear any existing heartbeat
    this.heartbeatInterval = setInterval(() => {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        try {
          this.send({ ping: 1 });
        } catch (error) {
          console.error('[heartbeat] Failed to send ping:', error);
        }
      }
    }, 30000);
  }

  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  // Utility to check connection status
  isConnected() {
    return this.socket && this.socket.readyState === WebSocket.OPEN;
  }
}

// Create a default instance
export const derivWebSocket = new DerivWebSocket();