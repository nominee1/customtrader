export function parseDerivAuthTokens() {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const accounts = [];

    // Parse up to 5 accounts from URL parameters
    for (let i = 1; i <= 5; i++) {
      const token = urlParams.get(`token${i}`);
      const loginid = urlParams.get(`acct${i}`);
      const currency = urlParams.get(`cur${i}`);

      if (token && loginid) {
        accounts.push({ loginid, token, currency: currency || null });
      }
    }

    if (accounts.length > 0) {
      // Save valid tokens to localStorage
      localStorage.setItem('derivTokens', JSON.stringify(accounts));
      console.log('✅ Saved Deriv Tokens to localStorage:', accounts);
      // Clear URL parameters to avoid exposing tokens
      //window.history.replaceState({}, document.title, window.location.pathname);
    }

    console.log('✅ Parsed Deriv Tokens:', accounts);
    return accounts;
  } catch (error) {
    console.error('📌 Error parsing Deriv tokens:', error.message);
    return [];
  }
}