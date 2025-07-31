import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import './UserInfo.css';

const UserInfo = ({ showLogout = true }) => {
    const { user, logout, isAdmin } = useAuth();

    if (!user) return null;

    return (
        <div className="user-info">
            <div className="user-details">
                <span className="user-name">{user.first_name} {user.last_name}</span>
                <span className="user-role">
                    {isAdmin() ? '👑 Admin' : '👤 User'}
                </span>
            </div>
            {showLogout && (
                <button className="logout-btn" onClick={logout}>
                    Logout
                </button>
            )}
        </div>
    );
};

export default UserInfo;
