import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useApiCall } from '../hooks/useApiCall';
import './UserDashboard.css';

const UserDashboard = () => {
    const navigate = useNavigate();
    const { user, logout, token, loading: authLoading } = useAuth();
    const apiCall = useApiCall();

    const [cards] = useState([
        { id: 1, name: 'Shopping Card', balance: '$1,250.00', status: 'Active' },
        { id: 2, name: 'Travel Card', balance: '$850.00', status: 'Active' },
        { id: 3, name: 'Business Card', balance: '$2,100.00', status: 'Blocked' }
    ]);
    const [cardRequests, setCardRequests] = useState([]);
    const [loading, setLoading] = useState(false);

    // Fetch card requests on component mount
    useEffect(() => {
        console.log('🔄 UserDashboard useEffect triggered');
        console.log('📊 Auth state - authLoading:', authLoading, 'token:', token ? 'Present' : 'None');

        // Attendre que l'authentification soit chargée et qu'on ait un token
        if (!authLoading && token) {
            console.log('✅ Auth loaded and token available, fetching requests');
            fetchCardRequests();
        } else if (!authLoading && !token) {
            console.log('❌ Auth loaded but no token, user not authenticated');
        }
    }, [authLoading, token]); // Dépendre de authLoading et token

    const fetchCardRequests = async () => {
        console.log('🔍 fetchCardRequests called');
        console.log('🔑 Current token:', token ? 'Present' : 'None');
        console.log('👤 Current user:', user);

        if (!token) {
            console.error('❌ No token available for API call');
            return;
        }

        setLoading(true);
        try {
            console.log('📡 Making API call to /cards/my-requests/');
            const result = await apiCall('/cards/my-requests/');
            console.log('📥 API result:', result);

            if (result && result.ok) {
                // Gérer la structure paginée de Django REST Framework
                if (result.data.results && Array.isArray(result.data.results)) {
                    setCardRequests(result.data.results);
                } else if (Array.isArray(result.data)) {
                    setCardRequests(result.data);
                } else {
                    console.error('Unexpected data structure:', result.data);
                    setCardRequests([]);
                }
            } else if (result) {
                console.error('Failed to fetch card requests:', result.status);
                setCardRequests([]);
            }
        } catch (error) {
            console.error('Error fetching card requests:', error);
            setCardRequests([]);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        logout();
    };

    const handleAddNewCard = () => {
        navigate('/add-card');
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'approved': return 'success';
            case 'rejected': return 'danger';
            case 'pending': return 'warning';
            default: return 'secondary';
        }
    };

    return (
        <div className="dashboard">
            <div className="dashboard-header">
                <div className="header-content">
                    <h1>User Dashboard</h1>
                    <button className="logout-button" onClick={handleLogout}>
                        Logout
                    </button>
                </div>
            </div>

            <div className="dashboard-content">
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon">💳</div>
                        <div className="stat-info">
                            <h3>Total Cards</h3>
                            <p className="stat-number">{cards.length}</p>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon">💰</div>
                        <div className="stat-info">
                            <h3>Total Balance</h3>
                            <p className="stat-number">$4,200.00</p>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon">✅</div>
                        <div className="stat-info">
                            <h3>Active Cards</h3>
                            <p className="stat-number">{cards.filter(card => card.status === 'Active').length}</p>
                        </div>
                    </div>
                </div>

                <div className="cards-section">
                    <div className="section-header">
                        <h2>My Virtual Cards</h2>
                        <button className="add-card-button" onClick={handleAddNewCard}>
                            + Add New Card
                        </button>
                    </div>

                    <div className="cards-grid">
                        {cards.map(card => (
                            <div key={card.id} className="card-item">
                                <div className="card-header">
                                    <h3>{card.name}</h3>
                                    <span className={`status ${card.status.toLowerCase()}`}>
                                        {card.status}
                                    </span>
                                </div>
                                <div className="card-balance">
                                    <p className="balance-label">Current Balance</p>
                                    <p className="balance-amount">{card.balance}</p>
                                </div>
                                <div className="card-actions">
                                    <button className="action-button view">View Details</button>
                                    <button className="action-button manage">Manage</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Card Requests Section */}
                <div className="requests-section">
                    <div className="section-header">
                        <h2>My Card Requests</h2>
                        {loading && <span className="loading-text">Loading...</span>}
                    </div>

                    {!Array.isArray(cardRequests) || (cardRequests.length === 0 && !loading) ? (
                        <div className="no-requests">
                            <p>No card requests found. Click "Add New Card" to create your first request.</p>
                        </div>
                    ) : (
                        <div className="requests-grid">
                            {cardRequests.map(request => (
                                <div key={request.id} className="request-item">
                                    <div className="request-header">
                                        <h3>{request.card_name || 'Unnamed Card'}</h3>
                                        <span className={`status ${getStatusColor(request.status)}`}>
                                            {request.status || 'pending'}
                                        </span>
                                    </div>
                                    <div className="request-details">
                                        <p><strong>Type:</strong> {request.card_type || 'N/A'}</p>
                                        <p><strong>Requested Limit:</strong> ${request.requested_limit || '0'}</p>
                                        <p><strong>Submitted:</strong> {request.created_at ? new Date(request.created_at).toLocaleDateString() : 'N/A'}</p>
                                        {request.admin_comments && (
                                            <p><strong>Admin Comments:</strong> {request.admin_comments}</p>
                                        )}
                                    </div>
                                    <div className="request-reason">
                                        <p><strong>Reason:</strong> {request.reason || 'No reason provided'}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserDashboard;
