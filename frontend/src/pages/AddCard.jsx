import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AddCard.css';

const AddCard = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        card_type: 'personal',
        card_name: '',
        date_of_birth: '',
        identity_document: null,
        income_proof: null,
        phone_number: '',
        emergency_contact: '',
        profession: '',
        monthly_income: '',
        requested_limit: 1000,
        reason: 'I need this virtual card for personal online transactions and purchases.'
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Check authentication on component mount
    useEffect(() => {
        console.log('AddCard component mounted');
        const token = localStorage.getItem('token');
        if (!token) {
            console.log('No token found, redirecting to login');
            alert('Please log in first');
            navigate('/login');
            return;
        }
        console.log('Token found, user is authenticated');
    }, [navigate]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleFileChange = (e) => {
        const { name, files } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: files[0]
        }));
    };

    const validateAge = (birthDate) => {
        const today = new Date();
        const birth = new Date(birthDate);
        const age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();

        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            return age - 1;
        }
        return age;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        // Validate age
        if (!formData.date_of_birth) {
            setError('Date of birth is required');
            return;
        }

        const age = validateAge(formData.date_of_birth);
        if (age < 18) {
            setError('You must be at least 18 years old to request a virtual card');
            return;
        }

        // Validate required fields
        if (!formData.card_name || !formData.reason || !formData.date_of_birth) {
            setError('Please fill in all required fields (Card Name, Reason, Date of Birth)');
            return;
        }

        // Validate documents
        if (!formData.identity_document || !formData.income_proof) {
            setError('Please upload both identity document and income proof');
            return;
        }

        // Validate requested_limit
        if (!formData.requested_limit || formData.requested_limit < 100 || formData.requested_limit > 10000) {
            setError('Credit limit must be between 100 and 10,000');
            return;
        }

        setLoading(true);

        try {
            const token = localStorage.getItem('token');
            const formDataToSend = new FormData();

            // Only append fields that the backend expects

            const backendFields = [
                'card_type', 'card_name', 'requested_limit',
                'identity_document', 'income_proof', 'reason',
                'date_of_birth', 'phone_number', 'emergency_contact',
                'profession', 'monthly_income'
            ];


            backendFields.forEach(key => {
                if (formData[key] !== null && formData[key] !== '') {
                    formDataToSend.append(key, formData[key]);
                }
            }); const response = await fetch('http://localhost:8000/api/cards/request/', {
                method: 'POST',
                headers: {
                    'Authorization': `Token ${token}`,
                },
                body: formDataToSend
            });

            if (response.ok) {
                const data = await response.json();
                setSuccess('Card request submitted successfully! It will be reviewed by an administrator.');
                setTimeout(() => {
                    navigate('/user-dashboard');
                }, 3000);
            } else {
                const errorData = await response.json();
                setError(errorData.detail || 'Failed to submit card request');
            }
        } catch (error) {
            console.error('Error submitting card request:', error);
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="add-card-container">
            <div className="add-card-header">
                <button
                    className="back-button"
                    onClick={() => navigate('/user-dashboard')}
                >
                    ← Back to Dashboard
                </button>
                <h1>Request Virtual Card</h1>
                <p>Please fill out the form below to request a new virtual card. All requests require admin approval.</p>
            </div>

            <div className="add-card-form-container">
                {error && <div className="error-message">{error}</div>}
                {success && <div className="success-message">{success}</div>}

                <form onSubmit={handleSubmit} className="add-card-form">
                    <div className="form-section">
                        <h3>Card Information</h3>

                        <div className="form-group">
                            <label htmlFor="card_type">Card Type *</label>
                            <select
                                id="card_type"
                                name="card_type"
                                value={formData.card_type}
                                onChange={handleInputChange}
                                required
                            >
                                <option value="personal">Personal Card</option>
                                <option value="shopping">Shopping Card</option>
                                <option value="travel">Travel Card</option>
                                <option value="business">Business Card</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label htmlFor="card_name">Card Label/Name *</label>
                            <input
                                type="text"
                                id="card_name"
                                name="card_name"
                                value={formData.card_name}
                                onChange={handleInputChange}
                                placeholder="e.g., Personal Card, Business Expenses"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="requested_limit">Credit Limit *</label>
                            <input
                                type="number"
                                id="requested_limit"
                                name="requested_limit"
                                value={formData.requested_limit}
                                onChange={handleInputChange}
                                placeholder="Enter requested credit limit"
                                min="100"
                                max="10000"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="reason">Purpose/Reason *</label>
                            <textarea
                                id="reason"
                                name="reason"
                                value={formData.reason}
                                onChange={handleInputChange}
                                placeholder="Please explain why you need this card"
                                required
                                rows="3"
                            />
                        </div>
                    </div>

                    <div className="form-section">
                        <h3>Personal Information</h3>

                        <div className="form-group">
                            <label htmlFor="date_of_birth">Date of Birth * (Must be 18+)</label>
                            <input
                                type="date"
                                id="date_of_birth"
                                name="date_of_birth"
                                value={formData.date_of_birth}
                                onChange={handleInputChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="phone_number">Phone Number *</label>
                            <input
                                type="tel"
                                id="phone_number"
                                name="phone_number"
                                value={formData.phone_number}
                                onChange={handleInputChange}
                                placeholder="+1234567890"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="emergency_contact">Emergency Contact</label>
                            <input
                                type="tel"
                                id="emergency_contact"
                                name="emergency_contact"
                                value={formData.emergency_contact}
                                onChange={handleInputChange}
                                placeholder="+1234567890"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="profession">Profession *</label>
                            <input
                                type="text"
                                id="profession"
                                name="profession"
                                value={formData.profession}
                                onChange={handleInputChange}
                                placeholder="e.g., Software Engineer, Teacher"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="monthly_income">Monthly Income (Optional)</label>
                            <input
                                type="number"
                                id="monthly_income"
                                name="monthly_income"
                                value={formData.monthly_income}
                                onChange={handleInputChange}
                                placeholder="Enter amount"
                                min="0"
                            />
                        </div>
                    </div>

                    <div className="form-section">
                        <h3>Required Documents</h3>

                        <div className="form-group">
                            <label htmlFor="identity_document">Identity Document * (ID, Passport, etc.)</label>
                            <input
                                type="file"
                                id="identity_document"
                                name="identity_document"
                                onChange={handleFileChange}
                                accept=".pdf,.jpg,.jpeg,.png"
                                required
                            />
                            <small>Accepted formats: PDF, JPG, PNG (Max 5MB)</small>
                        </div>

                        <div className="form-group">
                            <label htmlFor="income_proof">Income Proof * (Salary Slip, Bank Statement, etc.)</label>
                            <input
                                type="file"
                                id="income_proof"
                                name="income_proof"
                                onChange={handleFileChange}
                                accept=".pdf,.jpg,.jpeg,.png"
                                required
                            />
                            <small>Accepted formats: PDF, JPG, PNG (Max 5MB)</small>
                        </div>
                    </div>

                    <div className="form-actions">
                        <button
                            type="button"
                            className="cancel-button"
                            onClick={() => navigate('/user-dashboard')}
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="submit-button"
                            disabled={loading}
                        >
                            {loading ? 'Submitting...' : 'Submit Request'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddCard;
