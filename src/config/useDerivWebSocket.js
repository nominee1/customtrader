import { useEffect, useState } from 'react';

const useDerivWebSocket = () => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const apiKey = import.meta.env.VITE_DERIV_API_KEY;
    const socket = new WebSocket('wss://ws.binaryws.com/websockets/v3?app_id=YOUR_APP_ID');

    socket.onopen = () => {
      console.log('WebSocket connection established');
      socket.send(JSON.stringify({ 
        "ticks": "R_10",  // Change the market as needed
        "ticks_history": "R_10",
        "adjust_starttime": 1 
      }));
    };

    socket.onmessage = (event) => {
      const response = JSON.parse(event.data);
      setData(response);
    };

    socket.onerror = (err) => {
      setError('WebSocket error: ' + err);
    };

    socket.onclose = () => {
      console.log('WebSocket connection closed');
    };

    return () => {
      socket.close();
    };
  }, []);

  return { data, error };
};

export default useDerivWebSocket;
