import { DerivAPI } from '@deriv/deriv-api';

class DerivApiService {
  constructor(appId) {
    this.appId = appId;
    this.api = null;
    this.connection = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 3000; // 3 seconds
    this.subscribers = new Set();
  }

  async initialize() {
    try {
      this.api = new DerivAPI({ app_id: this.appId });
      this.connection = await this.api.connection.connect();
      
      // Setup connection event listeners
      this.connection.addEventListener('open', this.handleConnectionOpen.bind(this));
      this.connection.addEventListener('close', this.handleConnectionClose.bind(this));
      this.connection.addEventListener('error', this.handleConnectionError.bind(this));
      
      return this.api;
    } catch (error) {
      console.error('Initialization error:', error);
      throw new Error('Failed to initialize Deriv API');
    }
  }

  handleConnectionOpen() {
    this.reconnectAttempts = 0;
    console.log('Deriv API connection established');
    this.notifySubscribers('connected');
  }

  handleConnectionClose() {
    console.log('Deriv API connection closed');
    this.notifySubscribers('disconnected');
    this.attemptReconnect();
  }

  handleConnectionError(error) {
    console.error('Deriv API connection error:', error);
    this.notifySubscribers('error', error);
  }

  attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      
      setTimeout(async () => {
        try {
          await this.initialize();
        } catch (error) {
          this.attemptReconnect();
          console.error('Reconnection attempt failed:', error);
        }
      }, this.reconnectDelay);
    } else {
      console.error('Max reconnection attempts reached');
      this.notifySubscribers('reconnect_failed');
    }
  }

  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  notifySubscribers(event, data = null) {
    this.subscribers.forEach(callback => callback(event, data));
  }

  async getAccountInfo() {
    try {
      if (!this.api) throw new Error('API not initialized');
      const account = await this.api.account();
      return await account.getAccountInfo();
    } catch (error) {
      console.error('Error getting account info:', error);
      throw error;
    }
  }

  async buyContract(params) {
    try {
      if (!this.api) throw new Error('API not initialized');
      
      const buy = await this.api.buy({
        proposal: 1,
        amount: params.amount.toString(),
        basis: 'stake',
        contract_type: params.direction === 'rise' ? 'CALL' : 'PUT',
        currency: 'USD',
        duration: params.duration.toString(),
        duration_unit: 't',
        symbol: params.symbol
      });

      return buy;
    } catch (error) {
      console.error('Error buying contract:', error);
      throw error;
    }
  }

  // Add more API methods as needed
  async getActiveSymbols() {
    try {
      if (!this.api) throw new Error('API not initialized');
      const activeSymbols = await this.api.activeSymbols();
      return await activeSymbols.getActiveSymbols();
    } catch (error) {
      console.error('Error getting active symbols:', error);
      throw error;
    }
  }

  async disconnect() {
    if (this.connection) {
      await this.connection.close();
    }
  }
}

// Create a default instance (can still create others when needed)
const defaultDerivApiService = new DerivApiService('YOUR_VALID_APP_ID');

export { DerivApiService, defaultDerivApiService };

export const getAccountBalance = async () => {
    // Simulate API call
    return new Promise((resolve) => {
        setTimeout(() => resolve(1234.56), 1000); // Example balance
    });
};

export const getTransactionHistory = async () => {
    // Simulate API call
    return new Promise((resolve) => {
        setTimeout(() => resolve([
            { id: 1, date: '2025-04-01', type: 'Deposit', amount: 500, description: 'Bank transfer' },
            { id: 2, date: '2025-04-03', type: 'Withdrawal', amount: -200, description: 'Card withdrawal' },
            { id: 3, date: '2025-04-05', type: 'Profit', amount: 150, description: 'Trading profit' },
        ]), 1000);
    });
};