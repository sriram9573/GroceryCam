import { auth } from './firebase';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export const apiClient = async (endpoint: string, options: RequestInit = {}) => {
    const user = auth.currentUser;
    const token = user ? await user.getIdToken() : null;

    const headers = {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true', // Bypasses ngrok free tier warning page
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
    };

    const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || `Request failed: ${response.statusText}`);
    }

    return response.json();
};
