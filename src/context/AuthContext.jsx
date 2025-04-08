import { createContext, useState, useEffect, useContext } from 'react';
import userData from '../pages/dashboard/data/UserData';


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
    const [loading, setLoading] = useState(true); 
    useEffect(() => {
        const fetchUserData = () => {
            try {
                setUser(userData);
            } catch (error) {
                console.error("Error fetching user data:", error);
            } finally {
                setLoading(false); 
            }
        };

        fetchUserData();
    }, []);

    return (
        <UserContext.Provider value={{ user, loading }}>
            {children}
        </UserContext.Provider>
    );
};