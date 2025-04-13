import { derivWebSocket } from '../../services/websocket_client';

export const setupWebSocketSubscriptions = (messageHandler) => {
  return derivWebSocket.subscribe((event, data) => {
    if (event === 'message') {
      messageHandler(data);
    }
  });
};

export const authorizeAccount = (token) => {
  derivWebSocket.send({ authorize: token });
};

export const subscribeToBalance = (loginid) => {
  derivWebSocket.send({ 
    balance: 1, 
    account: loginid, 
    subscribe: 1 
  });
};

export const unsubscribeFromBalance = (loginid) => {
  derivWebSocket.send({ 
    balance: 0, 
    account: loginid, 
    subscribe: 0 
  });
};

export const subscribeToRealityCheck = () => {
  derivWebSocket.send({ reality_check: 1 });
};

export const subscribeToStatements = (limit = 50) => {
  derivWebSocket.send({ statement: 1, limit });
};

export const subscribeToTransactions = () => {
  derivWebSocket.send({ transaction: 1, subscribe: 1 });
};