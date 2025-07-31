import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Composant de protection pour les routes qui nécessitent une authentification
export const ProtectedRoute = ({ children, requiredPermission = null, fallbackPath = '/login' }) => {
    const { isAuthenticated, hasPermission, loading, user, token } = useAuth();
    const location = useLocation();

    console.log('ProtectedRoute - State:', {
        loading,
        isAuthenticated: isAuthenticated(),
        user: !!user,
        token: !!token,
        requiredPermission,
        path: location.pathname
    });

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner">
                    <div className="spinner"></div>
                    <p>Vérification des permissions...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated()) {
        console.log('Not authenticated, redirecting to:', fallbackPath);
        // Rediriger vers la page de connexion avec l'URL de retour
        return <Navigate to={fallbackPath} state={{ from: location }} replace />;
    }

    if (requiredPermission && !hasPermission(requiredPermission)) {
        console.log('Permission denied for:', requiredPermission);
        // Rediriger vers une page d'accès refusé ou le dashboard approprié
        return <Navigate to="/access-denied" replace />;
    }

    return children;
};

// Composant de protection spécifique pour les admins
export const AdminRoute = ({ children }) => {
    const { isAuthenticated, isAdmin, loading } = useAuth();

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner">
                    <div className="spinner"></div>
                    <p>Vérification des permissions...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated()) {
        return <Navigate to="/login" replace />;
    }

    if (!isAdmin()) {
        return <Navigate to="/access-denied" replace />;
    }

    return children;
};

// Composant de protection spécifique pour les utilisateurs normaux
export const UserRoute = ({ children }) => {
    const { isAuthenticated, isUser, loading } = useAuth();

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner">
                    <div className="spinner"></div>
                    <p>Vérification des permissions...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated()) {
        return <Navigate to="/login" replace />;
    }

    if (!isUser()) {
        return <Navigate to="/access-denied" replace />;
    }

    return children;
};

// Composant de redirection conditionnelle (si déjà connecté)
export const PublicRoute = ({ children }) => {
    const { isAuthenticated, isAdmin, loading } = useAuth();

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner">
                    <div className="spinner"></div>
                    <p>Chargement...</p>
                </div>
            </div>
        );
    }

    if (isAuthenticated()) {
        // Rediriger vers le dashboard approprié si déjà connecté
        return <Navigate to={isAdmin() ? '/admin-dashboard' : '/user-dashboard'} replace />;
    }

    return children;
};

// Composant de page d'accès refusé
export const AccessDenied = () => {
    const { isAuthenticated, isAdmin } = useAuth();

    return (
        <div className="access-denied-container">
            <div className="access-denied-content">
                <h1>🚫 Accès Refusé</h1>
                <p>Vous n'avez pas les permissions nécessaires pour accéder à cette page.</p>
                {isAuthenticated() && (
                    <div className="redirect-links">
                        <button
                            onClick={() => window.location.href = isAdmin() ? '/admin-dashboard' : '/user-dashboard'}
                            className="btn-primary"
                        >
                            Retour au tableau de bord
                        </button>
                    </div>
                )}
                {!isAuthenticated() && (
                    <div className="redirect-links">
                        <button
                            onClick={() => window.location.href = '/login'}
                            className="btn-primary"
                        >
                            Se connecter
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
