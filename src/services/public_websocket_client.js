// services/public_websocket_client.js
export class PublicWebSocket {
  constructor(appId = import.meta.env.VITE_DERIV_APP_ID) {
    this.appId = appId || '1089'; // Fallback app ID
    this.socket = null;
    this.subscribers = new Set();
    this.activeSubscriptions = new Set(); // Track subscribed symbols
    this.messageQueue = []; // Queue for messages when not connected
    this.isConnecting = false;
    this.connectionPromise = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.baseReconnectDelay = 5000; // Base delay for exponential backoff
    this.connectionTimeout = 10000; // 10s timeout for connection
    this.heartbeatInterval = null;
    this.heartbeatTimeout = null;
    this.heartbeatIntervalTime = 30000; // Ping every 30s
    this.heartbeatTimeoutTime = 60000; // Timeout if no pong in 60s
  }

  async connect() {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      //console.log('[public][connect] WebSocket already connected');
      return Promise.resolve();
    }
    if (this.isConnecting && this.connectionPromise) {
      //console.log('[public][connect] Connection in progress, awaiting existing promise');
      return this.connectionPromise;
    }

    this.isConnecting = true;
    this.connectionPromise = new Promise((resolve, reject) => {
      if (this.socket) {
        this.socket.close(1000, 'Reconnecting');
        this.socket = null;
      }

      this.socket = new WebSocket(`wss://ws.derivws.com/websockets/v3?app_id=${this.appId}`);
      let connectionTimeout;

      this.socket.onopen = (event) => {
        clearTimeout(connectionTimeout);
        //console.log('[public][open] Connection established');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.startHeartbeat();
        // Send queued messages
        while (this.messageQueue.length > 0) {
          const message = this.messageQueue.shift();
          this.send(message);
        }
        // Resubscribe to active symbols
        this.activeSubscriptions.forEach((symbol) => this.subscribeToTicks(symbol));
        this.notifySubscribers('open', event);
        resolve();
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.pong) {
            //console.log('[public][heartbeat] Pong received');
            clearTimeout(this.heartbeatTimeout);
            this.startHeartbeatTimeout();
          } else if (data.error) {
            //console.error('[public][message] API error:', data.error);
            this.notifySubscribers('error', { message: data.error.message, code: data.error.code });
          } else {
            //console.log('[public][message] Data received:', data);
            this.notifySubscribers('message', data);
          }
        } catch (error) {
          //console.error('[public][message] Failed to parse response:', error);
          this.notifySubscribers('error', { message: 'Invalid response format', error });
        }
      };

      this.socket.onclose = (event) => {
        clearTimeout(connectionTimeout);
        this.isConnecting = false;
        this.stopHeartbeat();
        if (event.wasClean) {
          //console.log(`[public][close] Connection closed cleanly, code=${event.code}, reason=${event.reason}`);
        } else {
          //console.log('[public][close] Connection died, attempting to reconnect...');
          this.reconnect();
        }
        this.notifySubscribers('close', event);
        reject(new Error(`WebSocket closed: code=${event.code}, reason=${event.reason}`));
      };

      this.socket.onerror = (error) => {
        clearTimeout(connectionTimeout);
        //console.error('[public][error] WebSocket error:', error);
        this.isConnecting = false;
        this.notifySubscribers('error', error);
        reject(new Error('WebSocket connection error'));
      };

      // Set connection timeout
      connectionTimeout = setTimeout(() => {
        if (this.socket && this.socket.readyState !== WebSocket.OPEN) {
          this.socket.close(1000, 'Connection timeout');
          this.isConnecting = false;
          reject(new Error('WebSocket connection timed out'));
        }
      }, this.connectionTimeout);
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
        console.error('[public][notify] Subscriber callback error:', error);
      }
    });
  }

  send(data) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      try {
        this.socket.send(JSON.stringify(data));
        //console.log('[public][send] Data sent:', data);
      } catch (error) {
        console.error('[public][send] Failed to send data:', error);
        this.messageQueue.push(data);
        this.reconnect();
      }
    } else {
      //console.log('[public][send] WebSocket not connected, queuing:', data);
      this.messageQueue.push(data);
      if (!this.isConnecting) {
        this.connect().catch((error) => {
          console.error('[public][send] Failed to connect for queued message:', error);
        });
      }
    }
  }

  subscribeToTicks(symbol) {
    if (this.activeSubscriptions.has(symbol)) {
      //console.log(`[public][subscribeToTicks] Already subscribed to ${symbol}`);
      return;
    }
    this.send({ ticks: symbol, subscribe: 1 });
    this.activeSubscriptions.add(symbol);
    //console.log(`[public][subscribeToTicks] Subscribed to ${symbol}`);
  }

  unsubscribe(symbol) {
    if (!this.activeSubscriptions.has(symbol)) {
      //console.log(`[public][unsubscribe] Not subscribed to ${symbol}`);
      return;
    }
    this.send({ forget: symbol });
    this.activeSubscriptions.delete(symbol);
    //console.log(`[public][unsubscribe] Unsubscribed from ${symbol}`);
  }

  fetchHistoricalTicks(symbol, count = 60, retries = 2) {
    const endTime = Math.floor(Date.now() / 1000);
    const startTime = endTime - 180; // 3 minutes to ensure 60 ticks
    const request = {
      ticks_history: symbol,
      end: endTime,
      start: startTime,
      count,
      style: 'ticks',
    };
    this.send(request);
    //console.log(`[public][fetchHistoricalTicks] Requested historical ticks for ${symbol}, count: ${count}`);
    
    // Handle rate limit retries
    const handleError = (error) => {
      if (error.code === 'RateLimit' && retries > 0) {
        setTimeout(() => {
          this.fetchHistoricalTicks(symbol, count, retries - 1);
        }, 2000); // 2s delay for retry
      } else {
        this.notifySubscribers('error', { message: `Failed to fetch historical ticks for ${symbol}`, error });
      }
    };
    this.subscribe((event, data) => {
      if (event === 'error' && data.code === 'RateLimit' && data.echo_req?.ticks_history === symbol) {
        handleError(data);
      }
    });
  }

  close() {
    if (this.socket) {
      this.activeSubscriptions.forEach((symbol) => this.unsubscribe(symbol));
      this.activeSubscriptions.clear();
      this.messageQueue = [];
      this.socket.close(1000, 'Manual close');
      this.socket = null;
    }
    this.stopHeartbeat();
    this.subscribers.clear();
    this.isConnecting = false;
    this.connectionPromise = null;
    //console.log('[public][close] WebSocket connection closed');
  }

  reconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[public][reconnect] Max reconnect attempts reached');
      this.notifySubscribers('error', new Error('Max reconnect attempts reached'));
      return;
    }
    if (!this.isConnecting) {
      this.reconnectAttempts += 1;
      const delay = this.baseReconnectDelay * Math.pow(2, this.reconnectAttempts);
      //console.log(`[public][reconnect] Attempting reconnect ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);
      setTimeout(() => {
        this.connect().catch(() => {
          this.reconnect();
        });
      }, delay);
    }
  }

  startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatInterval = setInterval(() => {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        try {
          this.send({ ping: 1 });
          //console.log('[public][heartbeat] Ping sent');
          this.startHeartbeatTimeout();
        } catch (error) {
          console.error('[public][heartbeat] Failed to send ping:', error);
          this.reconnect();
        }
      }
    }, this.heartbeatIntervalTime);
  }

  startHeartbeatTimeout() {
    if (this.heartbeatTimeout) {
      clearTimeout(this.heartbeatTimeout);
    }
    this.heartbeatTimeout = setTimeout(() => {
      console.warn('[public][heartbeat] No pong received, reconnecting...');
      this.reconnect();
    }, this.heartbeatTimeoutTime);
  }

  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    if (this.heartbeatTimeout) {
      clearTimeout(this.heartbeatTimeout);
      this.heartbeatTimeout = null;
    }
  }

  isConnected() {
    return this.socket && this.socket.readyState === WebSocket.OPEN;
  }
}

export const publicWebSocket = new PublicWebSocket();