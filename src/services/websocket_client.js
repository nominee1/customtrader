export class DerivWebSocket {
  constructor(appId = '36300') {
    this.appId = appId;
    this.socket = null;
    this.subscribers = new Set();
  }

  connect() {
    this.socket = new WebSocket(`wss://ws.derivws.com/websockets/v3?app_id=${this.appId}`);

    this.socket.onopen = (event) => {
      console.log('[open] Connection established');
      this.notifySubscribers('open', event);
      this.send({ ping: 1 });
    };

    this.socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('[message] Data received:', data);
      this.notifySubscribers('message', data);
    };

    this.socket.onclose = (event) => {
      if (event.wasClean) {
        console.log(`[close] Connection closed cleanly, code=${event.code} reason=${event.reason}`);
      } else {
        console.log('[close] Connection died');
      }
      this.notifySubscribers('close', event);
    };

    this.socket.onerror = (error) => {
      console.log(`[error]`, error);
      this.notifySubscribers('error', error);
    };
  }

  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  notifySubscribers(event, data) {
    this.subscribers.forEach(callback => callback(event, data));
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
  }
}

// Create a default instance
export const derivWebSocket = new DerivWebSocket();