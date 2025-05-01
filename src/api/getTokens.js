export const getTokens = async () => {
    const API_URL = "http://localhost:8888/api/get_user_tokens.php";
    const sessionToken = sessionStorage.getItem('sessionToken');

    try {
        const response = await fetch(API_URL, {
            method: 'GET',
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${sessionToken}` 
            },
            credentials: "include",
        });

        let result;
        try {
            result = await response.json();
        } catch (error) {
            const text = await response.text();
            console.error("Raw Response:", error, text);
            throw new Error('Invalid JSON response: ' + text);
        }

        if (!response.ok) {
            throw new Error(result.error || 'Fetching token failed. Please try again.');
        }

        return result;
    } catch (error) {
        console.error('Fetching token Error:', error.message);
        throw error;
    }
};