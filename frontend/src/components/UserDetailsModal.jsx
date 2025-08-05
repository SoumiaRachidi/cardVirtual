import React from 'react';
import './UserDetailsModal.css';

const UserDetailsModal = ({ user, isOpen, onClose }) => {
    if (!isOpen || !user) return null;

    // Debug log to check user data
    console.log('UserDetailsModal - User data:', user);

    // Helper function to safely get user display name
    const getUserDisplayName = () => {
        if (user.full_name) return user.full_name;
        if (user.first_name && user.last_name) return `${user.first_name} ${user.last_name}`;
        if (user.username) return user.username;
        return 'Unknown User';
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Not available';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const getStatusIcon = (status) => {
        switch (status.toLowerCase()) {
            case 'active': return '✅';
            case 'inactive': return '⏸️';
            case 'suspended': return '🚫';
            case 'pending': return '⏳';
            default: return '❓';
        }
    };

    const getUserTypeIcon = (userType) => {
        switch (userType.toLowerCase()) {
            case 'admin': return '👑';
            case 'user': return '👤';
            default: return '👤';
        }
    };

    return (
        <div className="modal-overlay-user" onClick={onClose}>
            <div className="modal-content-user" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header-user">
                    <div className="user-avatar-large">
                        {getUserDisplayName().charAt(0).toUpperCase()}
                    </div>
                    <div className="user-header-info">
                        <h2 className="user-name-large">
                            {getUserDisplayName()}
                        </h2>
                        <p className="user-email-large">{user.email || 'No email provided'}</p>
                        <div className="user-badges">
                            <span className={`status-badge ${(user.status || 'unknown').toLowerCase()}`}>
                                {getStatusIcon(user.status || 'unknown')} {(user.status || 'Unknown').charAt(0).toUpperCase() + (user.status || 'Unknown').slice(1)}
                            </span>
                            <span className={`type-badge ${(user.user_type || 'user').toLowerCase()}`}>
                                {getUserTypeIcon(user.user_type || 'user')} {(user.user_type || 'User').charAt(0).toUpperCase() + (user.user_type || 'User').slice(1)}
                            </span>
                        </div>
                    </div>
                    <button className="close-button-user" onClick={onClose}>×</button>
                </div>

                <div className="modal-body-user">
                    <div className="user-details-grid">
                        <div className="detail-section">
                            <h3 className="section-title">📞 Contact Information</h3>
                            <div className="detail-item">
                                <span className="detail-label">Email:</span>
                                <span className="detail-value">{user.email}</span>
                            </div>
                            <div className="detail-item">
                                <span className="detail-label">Phone:</span>
                                <span className="detail-value">{user.phone_number || 'Not provided'}</span>
                            </div>
                        </div>

                        <div className="detail-section">
                            <h3 className="section-title">👤 Account Information</h3>
                            <div className="detail-item">
                                <span className="detail-label">User Type:</span>
                                <span className="detail-value">
                                    {getUserTypeIcon(user.user_type || 'user')} {(user.user_type || 'User').charAt(0).toUpperCase() + (user.user_type || 'User').slice(1)}
                                </span>
                            </div>
                            <div className="detail-item">
                                <span className="detail-label">Status:</span>
                                <span className="detail-value">
                                    {getStatusIcon(user.status || 'unknown')} {(user.status || 'Unknown').charAt(0).toUpperCase() + (user.status || 'Unknown').slice(1)}
                                </span>
                            </div>
                            <div className="detail-item">
                                <span className="detail-label">Member Since:</span>
                                <span className="detail-value">{formatDate(user.date_created)}</span>
                            </div>
                        </div>

                        <div className="detail-section">
                            <h3 className="section-title">💳 Card Information</h3>
                            <div className="detail-item">
                                <span className="detail-label">Total Cards:</span>
                                <span className="detail-value highlight">{user.total_cards || 0}</span>
                            </div>
                            <div className="detail-item">
                                <span className="detail-label">Total Balance:</span>
                                <span className="detail-value highlight">${parseFloat(user.total_balance || 0).toFixed(2)}</span>
                            </div>
                        </div>

                        <div className="detail-section">
                            <h3 className="section-title">📊 Activity Summary</h3>
                            <div className="activity-stats">
                                <div className="activity-stat">
                                    <div className="stat-icon-small">💳</div>
                                    <div className="stat-info-small">
                                        <span className="stat-number-small">{user.total_cards || 0}</span>
                                        <span className="stat-label-small">Active Cards</span>
                                    </div>
                                </div>
                                <div className="activity-stat">
                                    <div className="stat-icon-small">💰</div>
                                    <div className="stat-info-small">
                                        <span className="stat-number-small">${parseFloat(user.total_balance || 0).toFixed(2)}</span>
                                        <span className="stat-label-small">Available Balance</span>
                                    </div>
                                </div>
                                <div className="activity-stat">
                                    <div className="stat-icon-small">📅</div>
                                    <div className="stat-info-small">
                                        <span className="stat-number-small">{formatDate(user.date_created)}</span>
                                        <span className="stat-label-small">Join Date</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="modal-footer-user">
                    <button className="action-button secondary" onClick={onClose}>
                        Close
                    </button>
                    <button className="action-button primary">
                        Edit User
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UserDetailsModal;
