import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

// Hook de debug pour l'authentification
export const useAuthDebug = () => {
    const auth = useAuth();

    useEffect(() => {
        console.group('🔐 Auth Debug Info');
        console.log('Loading:', auth.loading);
        console.log('User:', auth.user);
        console.log('Token:', auth.token ? 'Present' : 'None');
        console.log('isAuthenticated():', auth.isAuthenticated());
        console.log('isAdmin():', auth.isAdmin());
        console.log('isUser():', auth.isUser());

        // Vérifier localStorage
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');
        console.log('LocalStorage Token:', storedToken ? 'Present' : 'None');
        console.log('LocalStorage User:', storedUser ? 'Present' : 'None');

        if (storedUser) {
            try {
                const parsedUser = JSON.parse(storedUser);
                console.log('Parsed User from localStorage:', parsedUser);
            } catch (e) {
                console.error('Error parsing stored user:', e);
            }
        }
        console.groupEnd();
    }, [auth.loading, auth.user, auth.token]);

    return auth;
};
