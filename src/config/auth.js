import { DerivAPI } from '@deriv/deriv-api';

// Initialize only when needed (after login)
let API = null;

export const initializeAPI = (token) => {
  API = new DerivAPI({
    app_id: import.meta.env.VITE_DERIV_APP_ID,
    endpoint: 'frontend.binaryws.com',
    token
  });
  return API;
};

export const getAccountInfo = () => API?.send({ get_account_info: 1 });
export const logout = () => {
  API?.send({ logout: 1 });
  API = null;
};