import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { derivWebSocket } from '../../services/websocket_client';
import CreatePassword from '../login/CreatePassword';
import Notification from '../../utils/Notification';

const InitialSetup = () => {
  const [userInfo, setUserInfo] = useState(null);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState({ type: '', content: '', trigger: false });
  const navigate = useNavigate();

  const showNotification = (type, content) => {
    setNotification({ type, content, trigger: true });
    setTimeout(() => setNotification((prev) => ({ ...prev, trigger: false })), 3000);
  };

  // Fetch user details using WebSocket
  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const storedTokens = sessionStorage.getItem('derivTokens');
        if (!storedTokens) throw new Error('No tokens found');
        const tokens = JSON.parse(storedTokens);
        if (!tokens.length) throw new Error('Invalid token data');

        await derivWebSocket.connect();
        const response = await new Promise((resolve, reject) => {
          const unsubscribe = derivWebSocket.subscribe((event, data) => {
            if (event === 'message' && data.authorize) {
              unsubscribe();
              resolve(data.authorize);
            } else if (event === 'message' && data.error) {
              unsubscribe();
              reject(new Error(data.error.message));
            }
          });
          derivWebSocket.send({ authorize: tokens[0].token });
        });

        setUserInfo({
          email: response.email,
          fullName: response.fullname,
        });
      } catch (err) {
        setError(err.message);
        showNotification('error', err.message);
      }
    };
    fetchUserDetails();
  }, []);

  // Handle password submission and backend registration
  const handlePasswordSubmit = async (password) => {
    try {
      const storedTokens = JSON.parse(sessionStorage.getItem('derivTokens'));
      if (!storedTokens) throw new Error('No tokens found');

      const response = await fetch('/api/initial-setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userInfo.email,
          fullName: userInfo.fullName,
          accounts: storedTokens,
          password,
        }),
      });

      if (!response.ok) throw new Error('Failed to register user');

      // Clear temporary tokens
      sessionStorage.removeItem('derivTokens');

      // Set a session token (example)
      const data = await response.json();
      sessionStorage.setItem('sessionToken', data.sessionToken || 'temp-token');

      showNotification('success', 'Account setup successful!');
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
      showNotification('error', err.message);
    }
  };

  if (error) return <div>Error: {error}</div>;
  if (!userInfo) return <div>Loading user details...</div>;

  return (
    <>
      <CreatePassword onSubmit={handlePasswordSubmit} />
      <Notification type={notification.type} content={notification.content} trigger={notification.trigger} />
    </>
  );
};

export default InitialSetup;