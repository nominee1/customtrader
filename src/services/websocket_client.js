export class DerivWebSocket {
  constructor(appId = '36300') {
    this.appId = appId;
    this.socket = null;
    this.subscribers = new Set();
    this.reconnectInterval = 5000; 
    this.heartbeatInterval = null; 
  }

  connect() {
    this.socket = new WebSocket(`wss://ws.derivws.com/websockets/v3?app_id=${this.appId}`);

    this.socket.onopen = (event) => {
      console.log('[open] Connection established');
      this.notifySubscribers('open', event);
      this.startHeartbeat(); 
    };

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('[message] Data received:', data);
        this.notifySubscribers('message', data);
      } catch (error) {
        console.error('[message] Failed to parse response:', error);
        this.notifySubscribers('error', { message: 'Invalid response format', error });
      }
    };

    this.socket.onclose = (event) => {
      if (event.wasClean) {
        console.log(`[close] Connection closed cleanly, code=${event.code} reason=${event.reason}`);
      } else {
        console.log('[close] Connection died, attempting to reconnect...');
        this.reconnect(); // Attempt to reconnect
      }
      this.notifySubscribers('close', event);
      this.stopHeartbeat(); // Stop heartbeat on close
    };

    this.socket.onerror = (error) => {
      console.error('[error]', error);
      this.notifySubscribers('error', error);
    };
  }

  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  notifySubscribers(event, data) {
    this.subscribers.forEach((callback) => callback(event, data));
  }

  send(data) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(data));
    } else {
      console.warn('WebSocket not connected');
    }
  }

  close() {
    if (this.socket) {
      this.socket.close();
    }
    this.stopHeartbeat(); // Stop heartbeat when closing manually
  }

  reconnect() {
    setTimeout(() => {
      console.log('[reconnect] Attempting to reconnect...');
      this.connect();
    }, this.reconnectInterval);
  }

  startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.send({ ping: 1 });
        console.log('[heartbeat] Ping sent');
      }
    }, 30000); 
  }

  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }
}

// Create a default instance
export const derivWebSocket = new DerivWebSocket();