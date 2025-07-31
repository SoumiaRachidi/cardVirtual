import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAuthDebug } from '../hooks/useAuthDebug';
import './Login.css';

const Login = () => {
    const [credentials, setCredentials] = useState({
        email: '',
        password: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const navigate = useNavigate();
    const location = useLocation();
    const auth = useAuthDebug(); // Debug version de useAuth

    // Récupérer l'URL de redirection depuis l'état de navigation
    const from = location.state?.from?.pathname || null;

    const handleChange = (e) => {
        setCredentials({
            ...credentials,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (credentials.email && credentials.password) {
            try {
                console.log('🔑 Tentative de connexion avec AuthContext:', credentials.email);

                await auth.login(credentials.email, credentials.password);

                console.log('✅ Connexion réussie via AuthContext');

                // Rediriger vers l'URL demandée ou le dashboard approprié
                if (from) {
                    navigate(from, { replace: true });
                } else if (auth.isAdmin()) {
                    navigate('/admin-dashboard');
                } else {
                    navigate('/user-dashboard');
                }
            } catch (error) {
                console.error('❌ Erreur de connexion:', error);
                setError(error.message || 'Invalid credentials');
            }
        } else {
            setError('Please enter both email and password');
        }
        setLoading(false);
    };

    return (
        <div className="login">
            <div className="login-container">
                <div className="login-card">
                    <h2 className="login-title">Login to CardVirtual</h2>

                    {error && <div className="error-message">{error}</div>}

                    <form onSubmit={handleSubmit} className="login-form">
                        <div className="form-group">
                            <label htmlFor="email">Email</label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={credentials.email}
                                onChange={handleChange}
                                required
                                placeholder="Enter your email"
                                disabled={loading}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="password">Password</label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                value={credentials.password}
                                onChange={handleChange}
                                required
                                placeholder="Enter your password"
                                disabled={loading}
                            />
                        </div>

                        <button type="submit" className="login-button" disabled={loading}>
                            {loading ? 'Logging in...' : 'Login'}
                        </button>
                    </form>

                    <p className="login-note">
                        Enter your credentials to access your dashboard
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
