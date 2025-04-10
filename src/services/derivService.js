import { derivWebSocket } from './DerivWebSocket';

export const fetchActiveSymbols = () => {
    return new Promise((resolve, reject) => {
      const unsubscribe = derivWebSocket.subscribe((event, data) => {
        if (event === 'message' && data.msg_type === 'active_symbols') {
          console.log('✅ Received active symbols from Deriv:', data.active_symbols);
  
          unsubscribe();
  
          try {
            const formattedSymbols = formatActiveSymbols(data.active_symbols);
            resolve(formattedSymbols);
          } catch (formatError) {
            console.error('⚠️ Error formatting active symbols:', formatError);
            reject(formatError);
          }
  
        } else if (event === 'error') {
          console.error('❌ Deriv WebSocket error while fetching active symbols:', data);
          unsubscribe();
          reject(data);
        }
      });
  
      // Connect and send the request
      derivWebSocket.connect();
      derivWebSocket.send({
        active_symbols: 'brief',
        product_type: 'basic',
        passthrough: {
          action: 'get_active_symbols'
        }
      });
    });
};


const formatActiveSymbols = (symbols) => {
  return symbols.map((symbol, index) => ({
    id: index + 1,
    asset: symbol.display_name,
    type: getAssetType(symbol.market),
    amount: Math.floor(Math.random() * 5000) + 1000, 
    change: (Math.random() * 10 - 5).toFixed(1), 
    status: 'active'
  }));
};

export const subscribeToExchangeRates = (onUpdate, onError) => {
    const unsubscribe = derivWebSocket.subscribe((event, data) => {
      if (event === 'message' && data.msg_type === 'exchange_rates') {
        console.log('📈 Live exchange rates update:', data.exchange_rates);
  
        if (typeof onUpdate === 'function') {
          onUpdate(data.exchange_rates);
        }
      } else if (event === 'error') {
        console.error('❌ Error receiving exchange rates:', data);
        if (typeof onError === 'function') {
          onError(data);
        }
      }
    });
  
    derivWebSocket.connect();
    derivWebSocket.send({
      exchange_rates: 1,
      subscribe: 1,
      passthrough: {
        action: 'subscribe_exchange_rates',
      },
    });
  
    return unsubscribe; // you can call this later to stop listening
};


const getAssetType = (market) => {
  const types = {
    forex: 'Forex',
    cryptocurrency: 'Crypto',
    indices: 'Indices',
    commodities: 'Commodities',
    synthetic: 'Synthetic'
  };
  return types[market] || 'Other';
};