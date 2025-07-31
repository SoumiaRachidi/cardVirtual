import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
    const navigate = useNavigate();

    const handleLogin = () => {
        // Navigate to login page (we'll create this later)
        navigate('/login');
    };

    return (
        <nav className="navbar">
            <div className="navbar-container">
                <Link to="/" className="navbar-logo">
                    CardVirtual
                </Link>

                <div className="navbar-menu">
                    <Link to="/" className="navbar-link">
                        Home
                    </Link>
                    <button className="login-button" onClick={handleLogin}>
                        Login
                    </button>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
