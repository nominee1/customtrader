// services/public_websocket_client.js
export class PublicWebSocket {
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
      if (this.isConnecting && this.connectionPromise) {
        return this.connectionPromise;
      }
  
      this.isConnecting = true;
      this.connectionPromise = new Promise((resolve, reject) => {
        if (this.socket) {
          this.socket.close();
          this.socket = null;
        }
  
        this.socket = new WebSocket(`wss://ws.derivws.com/websockets/v3?app_id=${this.appId}`);
  
        this.socket.onopen = (event) => {
          //console.log('[public][open] Connection established');
          this.isConnecting = false;
          this.notifySubscribers('open', event);
          this.startHeartbeat();
          resolve();
        };
  
        this.socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.pong) {
              //console.log('[public][heartbeat] Pong received');
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
          this.isConnecting = false;
          if (event.wasClean) {
            //console.log(`[public][close] Connection closed cleanly, code=${event.code} reason=${event.reason}`);
          } else {
            //console.log('[public][close] Connection died, attempting to reconnect...');
            this.reconnect();
          }
          this.notifySubscribers('close', event);
          this.stopHeartbeat();
          reject(new Error(`Public WebSocket closed: code=${event.code}, reason=${event.reason}`));
        };
  
        this.socket.onerror = (error) => {
          //console.error('[public][error] WebSocket error:', error);
          this.isConnecting = false;
          this.notifySubscribers('error', error);
          reject(new Error('Public WebSocket connection error'));
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
          throw error;
        }
      } else {
        //console.warn('[public][send] WebSocket not connected, cannot send:', data);
        throw new Error('Public WebSocket is not connected');
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
          //console.log('[public][reconnect] Attempting to reconnect...');
          this.connect();
        }, this.reconnectInterval);
      }
    }
  
    startHeartbeat() {
      this.stopHeartbeat();
      this.heartbeatInterval = setInterval(() => {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
          try {
            this.send({ ping: 1 });
            //console.log('[public][heartbeat] Ping sent');
          } catch (error) {
            console.error('[public][heartbeat] Failed to send ping:', error);
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
  
    isConnected() {
      return this.socket && this.socket.readyState === WebSocket.OPEN;
    }
  }
  
  export const publicWebSocket = new PublicWebSocket();