import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './CreateUser.css';

const CreateUser = () => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        firstName: '',
        lastName: '',
        phoneNumber: '',
        password: '',
        confirmPassword: '',
        userType: 'user',
        status: 'active'
    });
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation
        if (formData.password !== formData.confirmPassword) {
            alert('Passwords do not match');
            return;
        }

        if (formData.password.length < 8) {
            alert('Password must be at least 8 characters long');
            return;
        }

        console.log('Form data before submission:', formData);
        setLoading(true);

        try {
            // Generate unique username if current one might exist
            let uniqueUsername = formData.username;
            if (!uniqueUsername) {
                uniqueUsername = `${formData.firstName.toLowerCase()}${formData.lastName.toLowerCase()}${Date.now()}`;
            }

            const requestData = {
                username: uniqueUsername,
                email: formData.email,
                first_name: formData.firstName,
                last_name: formData.lastName,
                phone_number: formData.phoneNumber,
                password: formData.password,
                password_confirm: formData.confirmPassword,
                user_type: formData.userType
            };

            console.log('Sending data to server:', requestData);

            const response = await fetch('http://localhost:8000/api/users/register/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData)
            }); const data = await response.json();
            console.log('Server response:', data);

            if (response.ok) {
                alert('User created successfully!');
                // Store a flag to indicate user was created
                localStorage.setItem('userCreated', 'true');
                // Navigate back to admin dashboard after successful creation
                setTimeout(() => {
                    navigate('/admin-dashboard');
                }, 1500); // Give user time to see the success message
            } else {
                console.error('Server error response:', data);
                let errorMessage = 'Failed to create user: ';

                if (data.email) {
                    errorMessage += 'Email: ' + data.email.join(', ') + '. ';
                }
                if (data.username) {
                    errorMessage += 'Username: ' + data.username.join(', ') + '. ';
                }
                if (data.password) {
                    errorMessage += 'Password: ' + data.password.join(', ') + '. ';
                }
                if (data.non_field_errors) {
                    errorMessage += data.non_field_errors.join(', ') + '. ';
                }
                if (!data.email && !data.username && !data.password && !data.non_field_errors) {
                    errorMessage += data.message || 'Unknown error';
                }

                alert(errorMessage);
            }
        } catch (error) {
            console.error('Error creating user:', error);
            alert('Network error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleBackToAdmin = () => {
        navigate('/admin-dashboard');
    };

    return (
        <div className="create-user">
            <div className="create-user-container">
                <div className="create-user-card">
                    <div className="card-header">
                        <h2 className="create-user-title">Create New User Account</h2>
                        <button
                            type="button"
                            className="back-button"
                            onClick={handleBackToAdmin}
                        >
                            ← Back to Admin Dashboard
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="create-user-form">
                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="firstName">First Name *</label>
                                <input
                                    type="text"
                                    id="firstName"
                                    name="firstName"
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    required
                                    placeholder="Enter first name"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="lastName">Last Name *</label>
                                <input
                                    type="text"
                                    id="lastName"
                                    name="lastName"
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    required
                                    placeholder="Enter last name"
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="username">Username *</label>
                                <input
                                    type="text"
                                    id="username"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleChange}
                                    required
                                    placeholder="Enter username"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="email">Email *</label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    placeholder="Enter email address"
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="phoneNumber">Phone Number</label>
                            <input
                                type="tel"
                                id="phoneNumber"
                                name="phoneNumber"
                                value={formData.phoneNumber}
                                onChange={handleChange}
                                placeholder="Enter phone number"
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="password">Password *</label>
                                <input
                                    type="password"
                                    id="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    placeholder="Enter password"
                                    minLength="8"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="confirmPassword">Confirm Password *</label>
                                <input
                                    type="password"
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    required
                                    placeholder="Confirm password"
                                    minLength="8"
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="userType">User Role *</label>
                                <select
                                    id="userType"
                                    name="userType"
                                    value={formData.userType}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="user">Regular User</option>
                                    <option value="admin">Administrator</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label htmlFor="status">Account Status</label>
                                <select
                                    id="status"
                                    name="status"
                                    value={formData.status}
                                    onChange={handleChange}
                                >
                                    <option value="active">Active</option>
                                    <option value="pending">Pending</option>
                                    <option value="suspended">Suspended</option>
                                </select>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="create-user-button"
                            disabled={loading}
                        >
                            {loading ? 'Creating Account...' : 'Create User Account'}
                        </button>
                    </form>

                    <div className="form-footer">
                        <p>* Required fields</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateUser;
