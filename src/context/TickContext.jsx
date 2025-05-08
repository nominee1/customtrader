import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { publicWebSocket } from '../services/public_websocket_client';

const TickContext = createContext(null);

const volatilityOptions = [
  { value: 'R_10', label: 'Volatility 10 Index' },
  { value: '1HZ10V', label: 'Volatility 10 (1s) Index' },
  { value: 'R_25', label: 'Volatility 25 Index' },
  { value: '1HZ25V', label: 'Volatility 25 (1s) Index' },
  { value: 'R_50', label: 'Volatility 50 Index' },
  { value: '1HZ50V', label: 'Volatility 50 (1s) Index' },
  { value: 'R_75', label: 'Volatility 75 Index' },
  { value: '1HZ75V', label: 'Volatility 75 Index' },
  { value: 'R_100', label: 'Volatility 100 Index' },
  { value: '1HZ100V', label: 'Volatility 100 (1s) Index' },
];

export const TickProvider = ({ children }) => {
  const [currentSymbol, setCurrentSymbol] = useState('R_10');
  const [realTimeTicks, setRealTimeTicks] = useState({});
  const [historicalTicks, setHistoricalTicks] = useState({});
  const [subscriptionStatus, setSubscriptionStatus] = useState({});
  const [error, setError] = useState(null);
  const [errorTrigger, setErrorTrigger] = useState(0);
  const wsRef = useRef(publicWebSocket);

// src/context/TickContext.js (modified snippet)
useEffect(() => {
    const ws = wsRef.current;
  
    ws.connect().catch((error) => {
      console.error('[TickProvider] Connection error:', error);
      setError(error.message);
      setErrorTrigger((prev) => prev + 1);
    });
  
    const unsubscribe = ws.subscribe((event, data) => {
      if (event === 'message') {
        if (data.tick) {
          const { symbol, epoch, quote } = data.tick;
          setRealTimeTicks((prev) => {
            const ticks = prev[symbol] || [];
            const updatedTicks = [{ quote, epoch }, ...ticks].slice(0, 100);
            return { ...prev, [symbol]: updatedTicks };
          });
          setSubscriptionStatus((prev) => ({ ...prev, [symbol]: 'subscribed' }));
        } else if (data.history) {
          const { prices, times, symbol } = data.history;
          const ticks = prices.map((price, index) => ({
            quote: price,
            epoch: times[index],
          }));
          setHistoricalTicks((prev) => ({ ...prev, [symbol]: ticks }));
        }
      } else if (event === 'error') {
        console.error('[TickProvider] WebSocket error:', data);
        setError(data.message || 'WebSocket error');
        setErrorTrigger((prev) => prev + 1);
        if (data.echo_req?.ticks) {
          setSubscriptionStatus((prev) => ({
            ...prev,
            [data.echo_req.ticks]: 'error',
          }));
        }
      }
    });
  
    volatilityOptions.forEach(({ value: symbol }, index) => {
      setTimeout(() => {
        ws.subscribeToTicks(symbol);
        ws.fetchHistoricalTicks(symbol, 60);
      }, index * 1000);
    });
  
    return () => {
      unsubscribe();
      volatilityOptions.forEach(({ value: symbol }) => ws.unsubscribe(symbol));
      ws.close();
    };
  }, []);

  const value = {
    currentSymbol,
    setCurrentSymbol,
    realTimeTicks,
    historicalTicks,
    subscriptionStatus,
    error,
    errorTrigger,
  };

  return <TickContext.Provider value={value}>{children}</TickContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useTicks = () => {
  const context = useContext(TickContext);
  if (!context) {
    throw new Error('useTicks must be used within a TickProvider');
  }
  return context;
};