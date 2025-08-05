import React, { useState } from 'react';
import './EditUserModal.css';

const EditUserModal = ({ user, isOpen, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        first_name: user?.first_name || '',
        last_name: user?.last_name || '',
        email: user?.email || '',
        phone_number: user?.phone_number || '',
        user_type: user?.user_type || 'user',
        status: user?.status || 'active'
    });

    if (!isOpen || !user) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(user.id, formData);
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
        <div className="modal-overlay-edit" onClick={onClose}>
            <div className="modal-content-edit" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header-edit">
                    <div className="user-avatar-edit">
                        {(user.full_name || `${user.first_name} ${user.last_name}` || user.username).charAt(0).toUpperCase()}
                    </div>
                    <div className="edit-header-info">
                        <h2 className="edit-title">Edit User</h2>
                        <p className="edit-subtitle">Update user information and settings</p>
                    </div>
                    <button className="close-button-edit" onClick={onClose}>×</button>
                </div>

                <form onSubmit={handleSubmit} className="edit-form">
                    <div className="form-body">
                        <div className="form-section">
                            <h3 className="form-section-title">👤 Personal Information</h3>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label className="form-label">First Name</label>
                                    <input
                                        type="text"
                                        name="first_name"
                                        value={formData.first_name}
                                        onChange={handleChange}
                                        className="form-input"
                                        placeholder="Enter first name"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Last Name</label>
                                    <input
                                        type="text"
                                        name="last_name"
                                        value={formData.last_name}
                                        onChange={handleChange}
                                        className="form-input"
                                        placeholder="Enter last name"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="form-section">
                            <h3 className="form-section-title">📞 Contact Information</h3>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label className="form-label">Email</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="form-input"
                                        placeholder="Enter email address"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Phone Number</label>
                                    <input
                                        type="tel"
                                        name="phone_number"
                                        value={formData.phone_number}
                                        onChange={handleChange}
                                        className="form-input"
                                        placeholder="Enter phone number"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="form-section">
                            <h3 className="form-section-title">⚙️ Account Settings</h3>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label className="form-label">User Type</label>
                                    <select
                                        name="user_type"
                                        value={formData.user_type}
                                        onChange={handleChange}
                                        className="form-select"
                                    >
                                        <option value="user">{getUserTypeIcon('user')} Regular User</option>
                                        <option value="admin">{getUserTypeIcon('admin')} Administrator</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Account Status</label>
                                    <select
                                        name="status"
                                        value={formData.status}
                                        onChange={handleChange}
                                        className="form-select"
                                    >
                                        <option value="active">{getStatusIcon('active')} Active</option>
                                        <option value="inactive">{getStatusIcon('inactive')} Inactive</option>
                                        <option value="suspended">{getStatusIcon('suspended')} Suspended</option>
                                        <option value="pending">{getStatusIcon('pending')} Pending</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="form-section">
                            <h3 className="form-section-title">📊 Current Stats</h3>
                            <div className="stats-display">
                                <div className="stat-item">
                                    <div className="stat-icon">💳</div>
                                    <div className="stat-details">
                                        <span className="stat-value">{user.total_cards || 0}</span>
                                        <span className="stat-label">Total Cards</span>
                                    </div>
                                </div>
                                <div className="stat-item">
                                    <div className="stat-icon">💰</div>
                                    <div className="stat-details">
                                        <span className="stat-value">${parseFloat(user.total_balance || 0).toFixed(2)}</span>
                                        <span className="stat-label">Total Balance</span>
                                    </div>
                                </div>
                                <div className="stat-item">
                                    <div className="stat-icon">📅</div>
                                    <div className="stat-details">
                                        <span className="stat-value">{new Date(user.date_created).toLocaleDateString()}</span>
                                        <span className="stat-label">Member Since</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="form-footer">
                        <button type="button" className="btn-secondary" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="btn-primary">
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditUserModal;
