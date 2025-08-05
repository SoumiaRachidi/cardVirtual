import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useApiCall } from '../hooks/useApiCall';
import './Profile.css';

const Profile = () => {
    const navigate = useNavigate();
    const { user, token, updateUser } = useAuth();
    const apiCall = useApiCall();

    const [profileData, setProfileData] = useState({
        username: '',
        email: '',
        full_name: '',
        phone: '',
        address: '',
        date_of_birth: '',
    });
    const [passwordData, setPasswordData] = useState({
        current_password: '',
        new_password: '',
        confirm_password: '',
    });
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('profile');
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        if (user) {
            setProfileData({
                username: user.username || '',
                email: user.email || '',
                full_name: user.full_name || '',
                phone: user.phone || '',
                address: user.address || '',
                date_of_birth: user.date_of_birth || '',
            });
        }
    }, [user]);

    const handleProfileChange = (e) => {
        const { name, value } = e.target;
        setProfileData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const result = await apiCall('/auth/profile/', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(profileData)
            });

            if (result && result.ok) {
                alert('Profile updated successfully!');
                setIsEditing(false);
                if (updateUser) {
                    updateUser(result.data);
                }
            } else {
                alert('Failed to update profile. Please try again.');
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            alert('Error updating profile. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();

        if (passwordData.new_password !== passwordData.confirm_password) {
            alert('New passwords do not match!');
            return;
        }

        if (passwordData.new_password.length < 8) {
            alert('New password must be at least 8 characters long!');
            return;
        }

        setLoading(true);

        try {
            const result = await apiCall('/auth/change-password/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    current_password: passwordData.current_password,
                    new_password: passwordData.new_password,
                })
            });

            if (result && result.ok) {
                alert('Password changed successfully!');
                setPasswordData({
                    current_password: '',
                    new_password: '',
                    confirm_password: '',
                });
            } else {
                alert('Failed to change password. Please check your current password.');
            }
        } catch (error) {
            console.error('Error changing password:', error);
            alert('Error changing password. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="profile-page">
            <div className="profile-header">
                <button onClick={() => navigate('/user-dashboard')} className="back-button">
                    ← Back to Dashboard
                </button>
                <div className="profile-title">
                    <h1>My Profile</h1>
                    <p>Manage your account information and settings</p>
                </div>
            </div>

            <div className="profile-content">
                {/* Profile Summary Card */}
                <div className="profile-summary">
                    <div className="profile-avatar">
                        <div className="avatar-circle">
                            {(user?.full_name || user?.username || 'U').charAt(0).toUpperCase()}
                        </div>
                    </div>
                    <div className="profile-info">
                        <h2>{user?.full_name || user?.username}</h2>
                        <p>{user?.email}</p>
                        <span className="user-role">User Account</span>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="profile-tabs">
                    <button
                        className={`tab-button ${activeTab === 'profile' ? 'active' : ''}`}
                        onClick={() => setActiveTab('profile')}
                    >
                        👤 Profile Information
                    </button>
                    <button
                        className={`tab-button ${activeTab === 'security' ? 'active' : ''}`}
                        onClick={() => setActiveTab('security')}
                    >
                        🔒 Security & Password
                    </button>
                </div>

                {/* Tab Content */}
                {activeTab === 'profile' && (
                    <div className="tab-content">
                        <div className="profile-section">
                            <div className="section-header">
                                <h3>Personal Information</h3>
                                <button
                                    onClick={() => setIsEditing(!isEditing)}
                                    className={`edit-button ${isEditing ? 'cancel' : 'edit'}`}
                                >
                                    {isEditing ? '✕ Cancel' : '✏️ Edit'}
                                </button>
                            </div>

                            <form onSubmit={handleProfileSubmit} className="profile-form">
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label htmlFor="username">Username</label>
                                        <input
                                            type="text"
                                            id="username"
                                            name="username"
                                            value={profileData.username}
                                            onChange={handleProfileChange}
                                            disabled={!isEditing}
                                            className="form-input"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="email">Email Address</label>
                                        <input
                                            type="email"
                                            id="email"
                                            name="email"
                                            value={profileData.email}
                                            onChange={handleProfileChange}
                                            disabled={!isEditing}
                                            className="form-input"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="full_name">Full Name</label>
                                        <input
                                            type="text"
                                            id="full_name"
                                            name="full_name"
                                            value={profileData.full_name}
                                            onChange={handleProfileChange}
                                            disabled={!isEditing}
                                            className="form-input"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="phone">Phone Number</label>
                                        <input
                                            type="tel"
                                            id="phone"
                                            name="phone"
                                            value={profileData.phone}
                                            onChange={handleProfileChange}
                                            disabled={!isEditing}
                                            className="form-input"
                                        />
                                    </div>

                                    <div className="form-group full-width">
                                        <label htmlFor="address">Address</label>
                                        <input
                                            type="text"
                                            id="address"
                                            name="address"
                                            value={profileData.address}
                                            onChange={handleProfileChange}
                                            disabled={!isEditing}
                                            className="form-input"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="date_of_birth">Date of Birth</label>
                                        <input
                                            type="date"
                                            id="date_of_birth"
                                            name="date_of_birth"
                                            value={profileData.date_of_birth}
                                            onChange={handleProfileChange}
                                            disabled={!isEditing}
                                            className="form-input"
                                        />
                                    </div>
                                </div>

                                {isEditing && (
                                    <div className="form-actions">
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="save-button"
                                        >
                                            {loading ? 'Saving...' : '💾 Save Changes'}
                                        </button>
                                    </div>
                                )}
                            </form>
                        </div>
                    </div>
                )}

                {activeTab === 'security' && (
                    <div className="tab-content">
                        <div className="profile-section">
                            <div className="section-header">
                                <h3>Change Password</h3>
                                <p className="section-description">
                                    Keep your account secure by using a strong password
                                </p>
                            </div>

                            <form onSubmit={handlePasswordSubmit} className="password-form">
                                <div className="form-group">
                                    <label htmlFor="current_password">Current Password</label>
                                    <input
                                        type="password"
                                        id="current_password"
                                        name="current_password"
                                        value={passwordData.current_password}
                                        onChange={handlePasswordChange}
                                        required
                                        className="form-input"
                                        placeholder="Enter your current password"
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="new_password">New Password</label>
                                    <input
                                        type="password"
                                        id="new_password"
                                        name="new_password"
                                        value={passwordData.new_password}
                                        onChange={handlePasswordChange}
                                        required
                                        minLength="8"
                                        className="form-input"
                                        placeholder="Enter your new password"
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="confirm_password">Confirm New Password</label>
                                    <input
                                        type="password"
                                        id="confirm_password"
                                        name="confirm_password"
                                        value={passwordData.confirm_password}
                                        onChange={handlePasswordChange}
                                        required
                                        minLength="8"
                                        className="form-input"
                                        placeholder="Confirm your new password"
                                    />
                                </div>

                                <div className="password-requirements">
                                    <h4>Password Requirements:</h4>
                                    <ul>
                                        <li>At least 8 characters long</li>
                                        <li>Include both letters and numbers</li>
                                        <li>Use special characters for better security</li>
                                    </ul>
                                </div>

                                <div className="form-actions">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="save-button"
                                    >
                                        {loading ? 'Changing...' : '🔒 Change Password'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Profile;
