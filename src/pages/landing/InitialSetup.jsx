import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { derivWebSocket } from '../../services/websocket_client';
import { registerUser } from '../../api/createUser';
import CreatePassword from '../login/CreatePassword';
import Notification from '../../utils/Notification';

const InitialSetup = () => {
  const [userInfo, setUserInfo] = useState(null);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState({ type: '', content: '', trigger: false });
  const [loading, setLoading] = useState(false);
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

  // Handle password submission
  const handlePasswordSubmit = async (password) => {
    setLoading(true);
    try {
      const storedTokens = JSON.parse(sessionStorage.getItem('derivTokens'));
      if (!storedTokens) throw new Error('No tokens found');

      console.log('Sending to backend:', { fullName: userInfo.fullName, email: userInfo.email, password, accounts: storedTokens }); // Debug

      const response = await registerUser({
        full_name: userInfo.fullName,
        email: userInfo.email,
        password,
        accounts: storedTokens,
      });

      sessionStorage.removeItem('derivTokens');

      if (!response.success || !response.sessionToken) {
        throw new Error(response.error || 'Registration failed');
      }

      sessionStorage.setItem('sessionToken', response.sessionToken);
      showNotification('success', 'Account setup successful!');
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
      showNotification('error', err.message);
    } finally {
      setLoading(false);
    }
  };

  if (error) return <div>Error: {error}</div>;
  if (!userInfo) return <div>Loading user details...</div>;

  return (
    <>
      <CreatePassword onSubmit={handlePasswordSubmit} loading={loading} />
      <Notification type={notification.type} content={notification.content} trigger={notification.trigger} />
    </>
  );
};

export default InitialSetup;