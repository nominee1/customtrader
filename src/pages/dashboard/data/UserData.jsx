const userData = {
    account_list: [
      {
        account_type: "trading",
        created_at: 1647509550,
        currency: "USD",
        is_disabled: 0,
        is_virtual: 0,
        landing_company_name: "svg",
        loginid: "CR799393",
        trading: {}
      },
      {
        account_type: "trading",
        created_at: 1664132232,
        currency: "ETH",
        is_disabled: 0,
        is_virtual: 0,
        landing_company_name: "svg",
        loginid: "VRTC1859315",
        trading: {}
      },
    ],
    balance: 700,
    country: "Kenya",
    currency: "USD",
    email: "naxhonokeyo@gmail.com",
    fullname: " Nashon Okeyo",
    is_virtual: 0,
    landing_company_fullname: "Deriv (SVG) LLC",
    landing_company_name: "svg",
    local_currencies: {
      IDR: {
        fractional_digits: 2
      }
    },
    loginid: "CR799393",
    preferred_language: "EN",
    scopes: [
      "read",
      "trade",
      "trading_information",
      "payments",
      "admin"
    ],
    trading: {},
    upgradeable_landing_companies: [
      "svg"
    ],
    user_id: 1876745678
};

export default userData;


/*
const getUserData = async () => {
    return {
      account_list: [...],
      balance: 0,
      ...
    };
  };
  
  export default getUserData;
*/
// DerivApiData.js

// Volatility Indices supported on the platform
const volatilityOptions = [
  { value: "R_10", label: "Volatility 10 Index", payout: "95%" },
  { value: "1HZ10V", label: "Volatility 10 (1s) Index", payout: "95%" },
  { value: "R_25", label: "Volatility 25 Index", payout: "92%" },
  { value: "1HZ25V", label: "Volatility 25 (1s) Index", payout: "92%" },
  { value: "R_50", label: "Volatility 50 Index", payout: "89%" },
  { value: "1HZ50V", label: "Volatility 50 (1s) Index", payout: "89%" },
  { value: "R_75", label: "Volatility 75 Index", payout: "87%" },
  { value: "1HZ75V", label: "Volatility 75 (1s) Index", payout: "87%" },
  { value: "R_100", label: "Volatility 100 Index", payout: "85%" },
  { value: "1HZ100V", label: "Volatility 100 (1s) Index", payout: "85%" },
];

// Data Structures for Deriv API Responses

// 1. Reality Check Response
// Summary of trading activity for the session (not index-specific, but includes all trades)
const realityCheckResponse = {
  reality_check: {
    currency: "USD",
    loginid: "CR123456",
    start_time: 1681234567,       // Unix timestamp of session start
    total_purchases: 2500.75,     // Total spent on buying contracts (e.g., on R_10, R_100, etc.)
    total_payouts: 2800.00,       // Total payouts received
    total_profit_loss: 299.25,    // Net profit/loss
    num_transactions: 30,         // Number of trades (across all indices)
    session_duration: 7200        // Session duration in seconds
  },
  echo_req: {
    reality_check: 1
  },
  msg_type: "reality_check"
};

// 2. Statement Response
// Detailed history of account activity, including trades on volatility indices
const statementResponse = {
  statement: {
    count: 50,
    transactions: [
      {
        action_type: "buy",
        amount: -100.00,          // Amount spent
        balance_after: 900.00,
        contract_id: 123456789,
        app_id: 1234,
        longcode: "Win payout if Volatility 10 Index rises after 5 ticks", // Using R_10
        payout: 195.00,           // Reflects 95% payout for R_10
        purchase_time: 1681234500,
        shortcode: "CALL_R_10_5t_195", // Contract for Volatility 10 Index
        symbol: "R_10",           // Matches volatilityOptions value
        transaction_id: 987654321,
        transaction_time: 1681234500
      },
      {
        action_type: "sell",
        amount: 190.00,           // Amount received from selling
        balance_after: 1090.00,
        contract_id: 123456789,
        app_id: 1234,
        longcode: "Sold contract Volatility 10 Index after 4 ticks",
        payout: 0.00,
        purchase_time: 1681234500,
        sell_time: 1681234600,
        shortcode: "CALL_R_10_5t_195",
        symbol: "R_10",
        transaction_id: 987654322
      },
      {
        action_type: "buy",
        amount: -200.00,
        balance_after: 890.00,
        contract_id: 123456790,
        app_id: 1234,
        longcode: "Win payout if Volatility 100 (1s) Index rises after 1 second", // Using 1HZ100V
        payout: 370.00,           // Reflects 85% payout for 1HZ100V
        purchase_time: 1681234700,
        shortcode: "CALL_1HZ100V_1s_370",
        symbol: "1HZ100V",
        transaction_id: 987654323,
        transaction_time: 1681234700
      },
      // ... more transactions for other indices like R_25, 1HZ50V, etc.
    ]
  },
  echo_req: {
    statement: 1,
    limit: 50
  },
  msg_type: "statement"
};

// 3. Transaction Response (Real-time WebSocket Stream)
// Real-time updates on transactions for the session, tied to volatility indices
const transactionResponse = {
  transaction: {
    action: "buy",
    amount: -150.00,
    balance: 740.00,
    barrier: null,              // Volatility indices often don’t use barriers
    contract_id: 123456791,
    currency: "USD",
    id: "987654324",
    purchase_time: 1681234900,
    symbol: "R_75",             // Matches Volatility 75 Index
    longcode: "Win payout if Volatility 75 Index rises after 5 ticks"
  },
  echo_req: {
    subscribe: 1,
    transaction: 1
  },
  msg_type: "transaction",
  subscription: {
    id: "xyz789-abc123"
  }
};
export {
  volatilityOptions,
  realityCheckResponse,
  statementResponse,
  transactionResponse
};
// DerivApiData.js

// Functions to Fetch/Subscribe to Data via WebSocket

let ws;

// 1. Fetch Reality Check Data
export const fetchRealityCheck = async () => {
  const request = {
    reality_check: 1
  };
  return new Promise((resolve, reject) => {
    ws.send(JSON.stringify(request));
    ws.onmessage = (event) => {
      const response = JSON.parse(event.data);
      if (response.msg_type === "reality_check") {
        resolve(response);
      }
    };
    ws.onerror = (error) => reject(error);
  });
};

// 2. Fetch Statement Data
export const fetchStatement = async (limit = 50, offset = 0, symbol = null) => {
  const request = {
    statement: 1,
    limit: limit,
    offset: offset,
    description: 1,             // Include longcode for index details
    ...(symbol && { symbol })   // Filter by symbol (e.g., R_10) if provided
  };
  return new Promise((resolve, reject) => {
    ws.send(JSON.stringify(request));
    ws.onmessage = (event) => {
      const response = JSON.parse(event.data);
      if (response.msg_type === "statement") {
        resolve(response);
      }
    };
    ws.onerror = (error) => reject(error);
  });
};

// 3. Subscribe to Transaction Stream
export const subscribeToTransactions = (callback) => {
  const request = {
    transaction: 1,
    subscribe: 1
  };
  ws.send(JSON.stringify(request));
  ws.onmessage = (event) => {
    const response = JSON.parse(event.data);
    if (response.msg_type === "transaction") {
      // Filter for supported volatility indices
      const isValidIndex = volatilityOptions.some(
        (option) => option.value === response.transaction.symbol
      );
      if (isValidIndex) {
        callback(response);
      }
    }
  };
};

// Set WebSocket connection
export const setWebSocket = (websocket) => {
  ws = websocket;
};

// Notes for Integration into userContext:
/*
  In your React userContext, you can structure it like this:

  import { createContext, useState, useEffect } from 'react';
  import { setWebSocket, fetchRealityCheck, fetchStatement, subscribeToTransactions, volatilityOptions } from './DerivApiData';

  const UserContext = createContext();

  const UserProvider = ({ children }) => {
    const [realityCheck, setRealityCheck] = useState(null);
    const [statement, setStatement] = useState([]);
    const [transactions, setTransactions] = useState([]);

    useEffect(() => {
      const ws = new WebSocket('wss://ws.deriv.com/websockets/v3?app_id=YOUR_APP_ID');
      setWebSocket(ws);

      // Fetch initial data
      fetchRealityCheck().then((data) => setRealityCheck(data.reality_check));
      fetchStatement().then((data) => setStatement(data.statement.transactions));

      // Subscribe to transaction stream
      subscribeToTransactions((data) => {
        setTransactions((prev) => [...prev, data.transaction]);
      });

      return () => ws.close();
    }, []);

    // Helper to get index label and payout
    const getIndexInfo = (symbol) => {
      const option = volatilityOptions.find((opt) => opt.value === symbol);
      return option ? { label: option.label, payout: option.payout } : { label: symbol, payout: 'N/A' };
    };

    return (
      <UserContext.Provider value={{ realityCheck, statement, transactions, getIndexInfo }}>
        {children}
      </UserContext.Provider>
    );
  };

  Display Example:
  - Reality Check: Show totals (e.g., total_profit_loss, num_transactions) in a dashboard.
  - Statement: Map transactions to a table, e.g.:
    statement.map((tx) => (
      <tr key={tx.transaction_id}>
        <td>{getIndexInfo(tx.symbol).label}</td>
        <td>{tx.action_type}</td>
        <td>{tx.amount}</td>
        <td>{new Date(tx.transaction_time * 1000).toLocaleString()}</td>
        <td>{getIndexInfo(tx.symbol).payout}</td>
      </tr>
    ))
  - Transactions: Real-time feed, filter buy/sell:
    transactions
      .filter((tx) => ['buy', 'sell'].includes(tx.action))
      .map((tx) => (
        <div key={tx.id}>
          {getIndexInfo(tx.symbol).label}: {tx.action} {tx.amount} USD
        </div>
      ))
*/