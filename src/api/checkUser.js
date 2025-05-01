export const checkUser = async ({ email }) => {
    const API_URL = "http://localhost:8888/login/check_user.php";

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include", 
            body: JSON.stringify({ email })
        });

        let result;
        try {
            result = await response.json();
        } catch (error) {
            const text = await response.text();
            console.error("Raw response:", error, text);
            throw new Error('Invalid JSON response: ' + text);
        }

        if (!response.ok) {
            throw new Error(result.error || 'Check User failed. Please try again.');
        }

        return result;
    } catch (error) {
        console.error("User check error:", error.message);
        throw error;
    }
};