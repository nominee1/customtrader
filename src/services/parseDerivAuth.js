export function parseDerivAuthTokens() {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const accounts = [];

    for (let i = 1; i <= 5; i++) {
      const token = urlParams.get(`token${i}`);
      const loginid = urlParams.get(`acct${i}`);
      const currency = urlParams.get(`cur${i}`);

      if (token && loginid) {
        accounts.push({ loginid, token, currency: currency || null });
      }
    }

    if (accounts.length > 0) {
      sessionStorage.setItem('derivTokens', JSON.stringify(accounts));
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    return accounts;
  } catch (error) {
    console.error('Error parsing Deriv tokens:', error.message);
    return [];
  }
}