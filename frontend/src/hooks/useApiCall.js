import { useAuth } from '../contexts/AuthContext';

// Hook personnalisé pour les appels API avec authentification
export const useApiCall = () => {
    const { token, logout } = useAuth();

    const apiCall = async (endpoint, options = {}) => {
        const url = `http://localhost:8000/api${endpoint}`;

        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Token ${token}` }),
                ...options.headers,
            },
            ...options,
        };

        try {
            const response = await fetch(url, config);

            // Si non autorisé, déconnecter l'utilisateur
            if (response.status === 401) {
                logout();
                window.location.href = '/login';
                return null;
            }

            // Si erreur de permission
            if (response.status === 403) {
                window.location.href = '/access-denied';
                return null;
            }

            const data = await response.json();

            return {
                ok: response.ok,
                status: response.status,
                data: data
            };
        } catch (error) {
            console.error('API call error:', error);
            return {
                ok: false,
                status: 0,
                data: { error: 'Network error' }
            };
        }
    };

    return apiCall;
};
