export function parseDerivAuthTokens() {
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

  console.log('✅ Parsed Deriv Tokens:', accounts); 
  return accounts;
}