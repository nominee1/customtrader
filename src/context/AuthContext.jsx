import { createContext, useState, useEffect, useContext } from 'react';
import userData from '../pages/dashboard/data/UserData';
import { realityCheckResponse, statementResponse, transactionResponse } from '../pages/dashboard/data/UserData';

const UserContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useUser = () => {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error("useUser must be used within a UserProvider");
    }
    return context;
};

export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [realityCheck, setRealityCheck] = useState(null);
    const [statement, setStatement] = useState(null);
    const [transactions, setTransactions] = useState(null);
    const [recentTrades, setRecentTrades] = useState([]);
    const [loading, setLoading] = useState(true);

    // Load recent trades from local storage on initialization
    useEffect(() => {
        const storedTrades = JSON.parse(localStorage.getItem('recentTrades')) || [];
        setRecentTrades(storedTrades);
    }, []);

    // Save recent trades to local storage whenever they change
    useEffect(() => {
        localStorage.setItem('recentTrades', JSON.stringify(recentTrades));
    }, [recentTrades]);

    // Clear recent trades when the session ends
    const clearRecentTrades = () => {
        setRecentTrades([]);
        localStorage.removeItem('recentTrades');
    };

    useEffect(() => {
        const fetchUserData = () => {
            try {
                // Set user data
                setUser(userData);

                // Set additional responses
                setRealityCheck(realityCheckResponse);
                setStatement(statementResponse);
                setTransactions(transactionResponse);

                // Add the latest transaction to recent trades
                if (transactionResponse?.transaction) {
                    const newTrade = {
                        id: transactionResponse.transaction.id,
                        type: transactionResponse.transaction.action,
                        amount: Math.abs(transactionResponse.transaction.amount),
                        profit: transactionResponse.transaction.amount > 0 ? transactionResponse.transaction.amount : 0,
                        symbol: transactionResponse.transaction.symbol,
                        time: new Date(transactionResponse.transaction.purchase_time * 1000).toLocaleString(),
                    };
                    setRecentTrades((prev) => [newTrade, ...prev.slice(0, 4)]); // Keep only the last 5 trades
                }
            } catch (error) {
                console.error("Error fetching user data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, []);

    return (
        <UserContext.Provider value={{ user, realityCheck, statement, transactions, recentTrades, clearRecentTrades, loading }}>
            {children}
        </UserContext.Provider>
    );
};