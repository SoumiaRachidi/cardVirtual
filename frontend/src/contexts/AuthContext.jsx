import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Créer le contexte d'authentification
const AuthContext = createContext();

// Hook personnalisé pour utiliser le contexte
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

// Provider d'authentification
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    // Vérifier l'authentification au chargement
    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = () => {
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        console.log('Checking auth - Token:', storedToken ? 'exists' : 'none');
        console.log('Checking auth - User:', storedUser ? 'exists' : 'none');

        if (storedToken && storedUser) {
            setToken(storedToken);
            try {
                const parsedUser = JSON.parse(storedUser);
                setUser(parsedUser);
                console.log('User restored from localStorage:', parsedUser);
            } catch (error) {
                console.error('Error parsing stored user:', error);
                clearAuth();
            }
        } else {
            clearAuth();
        }
        setLoading(false);
    };

    const clearAuth = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
    };

    const login = async (email, password) => {
        console.log('Login called with email:', email);

        try {
            const response = await fetch('http://localhost:8000/api/users/login/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: email,
                    password: password
                })
            });

            const data = await response.json();
            console.log('Login API response:', data);

            if (response.ok) {
                // Stocker le vrai token et les données utilisateur
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                setToken(data.token);
                setUser(data.user);
                console.log('✅ Login successful, token and user set');
            } else {
                console.error('❌ Login failed:', data);
                throw new Error(data.message || 'Login failed');
            }
        } catch (error) {
            console.error('❌ Login error:', error);
            throw error;
        }
    };

    const logout = () => {
        console.log('Logout called');
        clearAuth();
        // Rediriger vers la page de login
        window.location.href = '/login';
    };

    const updateUser = (userData) => {
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
    };

    // Fonctions de vérification des permissions
    const isAuthenticated = () => {
        const result = !!(user && token);
        console.log('isAuthenticated check:', { user: !!user, token: !!token, result });
        return result;
    };

    const isAdmin = () => {
        if (!isAuthenticated()) return false;
        const result = user?.user_type === 'admin' || user?.is_superuser;
        console.log('isAdmin check:', { user_type: user?.user_type, is_superuser: user?.is_superuser, result });
        return result;
    };

    const isUser = () => {
        if (!isAuthenticated()) return false;
        return !isAdmin();
    };

    const hasPermission = (permission) => {
        if (!isAuthenticated()) return false;

        switch (permission) {
            case 'admin':
                return isAdmin();
            case 'user':
                return isUser();
            case 'card_management':
                return isAdmin();
            case 'card_request':
                return isAuthenticated();
            case 'user_dashboard':
                return isUser();
            case 'admin_dashboard':
                return isAdmin();
            default:
                return false;
        }
    };

    const value = {
        user,
        token,
        loading,
        login,
        logout,
        updateUser,
        isAuthenticated,
        isAdmin,
        isUser,
        hasPermission
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
