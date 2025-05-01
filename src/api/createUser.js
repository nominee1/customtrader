export const registerUser = async ({ full_name, email, password, accounts }) => {
    const API_URL = "http://localhost:8888/api/initial_setup.php";

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify({ fullName: full_name, email, password, accounts }),
        });

        let result;
        try {
            result = await response.json();
        } catch (e) {
            const text = await response.text();
            console.error('Raw response:',e, text);
            throw new Error('Invalid JSON response: ' + text);
        }

        if (!response.ok) {
            throw new Error(result.error || 'User registration failed. Please try again.');
        }

        return result;
    } catch (error) {
        console.error("User registration error:", error.message);
        throw error;
    }
};