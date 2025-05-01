export const login = async ({ email, password }) => {
    const API_URL = "http://localhost:8888/login/login_user.php";

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json", 
            },
            credentials: "include",
            body: JSON.stringify({ email, password }),
        });

        let result;
        try {
            result = await response.json();
        } catch (error) {
            const text = await response.text();
            console.error('Raw response:', error, text);
            throw new Error('Invalid JSON response: ' + text);
        }

        if (!response.ok) {
            throw new Error(result.error || 'Login failed. Please try again.');
        }

        return result;
    } catch (error) {
        console.error("Login error:", error.message);
        throw error;
    }
};