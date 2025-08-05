import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { useApiCall } from '../hooks/useApiCall';
import NotificationBadge from '../components/NotificationBadge';
import './UserDashboard.css';

const UserDashboard = () => {
    const navigate = useNavigate();
    const { user, logout, token, loading: authLoading } = useAuth();
    const apiCall = useApiCall();

    const [cards, setCards] = useState([]);
    const [filteredCards, setFilteredCards] = useState([]);
    const [cardRequests, setCardRequests] = useState([]);
    const [filteredRequests, setFilteredRequests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [cardsLoading, setCardsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [requestStatusFilter, setRequestStatusFilter] = useState('all');
    const [showCardDetails, setShowCardDetails] = useState({});
    const [activeTab, setActiveTab] = useState('overview');

    // Fetch card requests on component mount
    useEffect(() => {
        console.log('🔄 UserDashboard useEffect triggered');
        console.log('📊 Auth state - authLoading:', authLoading, 'token:', token ? 'Present' : 'None');

        // Attendre que l'authentification soit chargée et qu'on ait un token
        if (!authLoading && token) {
            console.log('✅ Auth loaded and token available, fetching requests and cards');
            fetchCardRequests();
            fetchUserCards();
        } else if (!authLoading && !token) {
            console.log('❌ Auth loaded but no token, user not authenticated');
        }
    }, [authLoading, token]); // Dépendre de authLoading et token

    // Apply filters when cards change
    useEffect(() => {
        applyFilters(searchTerm, statusFilter, categoryFilter);
    }, [cards]);

    // Apply filters when card requests change
    useEffect(() => {
        applyRequestFilters(requestStatusFilter);
    }, [cardRequests]);

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
                    setFilteredRequests(result.data.results);
                } else if (Array.isArray(result.data)) {
                    setCardRequests(result.data);
                    setFilteredRequests(result.data);
                } else {
                    console.error('Unexpected data structure:', result.data);
                    setCardRequests([]);
                    setFilteredRequests([]);
                }
            } else if (result) {
                console.error('Failed to fetch card requests:', result.status);
                setCardRequests([]);
                setFilteredRequests([]);
            }
        } catch (error) {
            console.error('Error fetching card requests:', error);
            setCardRequests([]);
            setFilteredRequests([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchUserCards = async () => {
        console.log('🔍 fetchUserCards called');
        if (!token) {
            console.error('❌ No token available for API call');
            return;
        }

        setCardsLoading(true);
        try {
            console.log('📡 Making API call to /cards/my-cards/');
            const result = await apiCall('/cards/my-cards/');
            console.log('📥 Cards API result:', result);

            if (result && result.ok) {
                // Handle paginated or direct response
                if (result.data.results && Array.isArray(result.data.results)) {
                    setCards(result.data.results);
                    setFilteredCards(result.data.results);
                } else if (Array.isArray(result.data)) {
                    setCards(result.data);
                    setFilteredCards(result.data);
                } else {
                    console.error('Unexpected cards data structure:', result.data);
                    setCards([]);
                    setFilteredCards([]);
                }
            } else if (result) {
                console.error('Failed to fetch user cards:', result.status);
                setCards([]);
                setFilteredCards([]);
            }
        } catch (error) {
            console.error('Error fetching user cards:', error);
            setCards([]);
            setFilteredCards([]);
        } finally {
            setCardsLoading(false);
        }
    };

    const handleLogout = () => {
        logout();
    };

    const handleAddNewCard = () => {
        navigate('/add-card');
    };

    // Filter and search functions
    const handleSearch = (e) => {
        const term = e.target.value.toLowerCase();
        setSearchTerm(term);
        applyFilters(term, statusFilter, categoryFilter);
    };

    const handleStatusFilter = (status) => {
        setStatusFilter(status);
        applyFilters(searchTerm, status, categoryFilter);
    };

    const handleCategoryFilter = (category) => {
        setCategoryFilter(category);
        applyFilters(searchTerm, statusFilter, category);
    };

    const applyFilters = (search, status, category) => {
        let filtered = cards;

        if (search) {
            filtered = filtered.filter(card =>
                (card.card_name || '').toLowerCase().includes(search) ||
                (card.masked_numero || '').includes(search)
            );
        }

        if (status !== 'all') {
            filtered = filtered.filter(card => card.status === status);
        }

        if (category !== 'all') {
            filtered = filtered.filter(card => card.card_category === category);
        }

        setFilteredCards(filtered);
    };

    const clearFilters = () => {
        setSearchTerm('');
        setStatusFilter('all');
        setCategoryFilter('all');
        setFilteredCards(cards);
    };

    // Request filter functions
    const handleRequestStatusFilter = (status) => {
        setRequestStatusFilter(status);
        applyRequestFilters(status);
    };

    const applyRequestFilters = (status) => {
        let filtered = cardRequests;

        if (status !== 'all') {
            filtered = filtered.filter(request => request.status === status);
        }

        setFilteredRequests(filtered);
    };

    const clearRequestFilters = () => {
        setRequestStatusFilter('all');
        setFilteredRequests(cardRequests);
    };

    // Card management functions
    const toggleCardDetails = (cardId) => {
        setShowCardDetails(prev => ({
            ...prev,
            [cardId]: !prev[cardId]
        }));
    };

    const handleBlockCard = async (cardId) => {
        if (window.confirm('Are you sure you want to block this card?')) {
            try {
                const result = await apiCall(`/cards/cards/${cardId}/deactivate/`, {
                    method: 'POST'
                });
                if (result && result.ok) {
                    alert('Card blocked successfully!');
                    fetchUserCards();
                } else {
                    alert('Failed to block card');
                }
            } catch (error) {
                console.error('Error blocking card:', error);
                alert('Error blocking card');
            }
        }
    };

    const handleActivateCard = async (cardId) => {
        try {
            console.log('Attempting to activate card:', cardId);
            const result = await apiCall(`/cards/cards/${cardId}/activate/`, {
                method: 'POST'
            });
            console.log('Activation result:', result);

            if (result && result.ok) {
                alert('Card activated successfully!');
                fetchUserCards(); // Refresh cards data
            } else {
                console.error('Failed to activate card:', result);
                const errorMessage = result?.data?.error || result?.data?.message || 'Failed to activate card. Please try again.';
                alert(errorMessage);
            }
        } catch (error) {
            console.error('Error activating card:', error);
            alert('Error activating card. Please try again.');
        }
    };

    const copyCardNumber = (cardNumber) => {
        if (cardNumber) {
            navigator.clipboard.writeText(cardNumber);
            alert('Card number copied to clipboard!');
        }
    };

    const handleShowCardDetails = (cardId) => {
        navigate(`/card-details/${cardId}`);
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
                    <div className="header-left">
                        <h1>User Dashboard</h1>
                        <p className="welcome-text">Welcome back, {user?.full_name || user?.username || 'User'}!</p>
                    </div>
                    <div className="header-actions">
                        <NotificationBadge />
                        <button className="profile-button" onClick={() => navigate('/profile')}>
                            👤 Profile
                        </button>
                        <button className="logout-button" onClick={handleLogout}>
                            Logout
                        </button>
                    </div>
                </div>
            </div>

            <div className="dashboard-content">
                {/* Enhanced Stats Grid */}
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon">💳</div>
                        <div className="stat-info">
                            <h3>Total Cards</h3>
                            <p className="stat-number">{cards.length}</p>
                            <span className="stat-subtitle">Active: {cards.filter(card => card.status === 'active').length}</span>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon">💰</div>
                        <div className="stat-info">
                            <h3>Total Balance</h3>
                            <p className="stat-number">
                                ${cards.reduce((total, card) => total + parseFloat(card.balance || 0), 0).toFixed(2)}
                            </p>
                            <span className="stat-subtitle">Across all cards</span>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon">📊</div>
                        <div className="stat-info">
                            <h3>Active Cards</h3>
                            <p className="stat-number">{cards.filter(card => card.status === 'active').length}</p>
                            <span className="stat-subtitle">Currently active</span>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon">📋</div>
                        <div className="stat-info">
                            <h3>Pending Requests</h3>
                            <p className="stat-number">{cardRequests.filter(req => req.status === 'pending').length}</p>
                            <span className="stat-subtitle">Awaiting approval</span>
                        </div>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="dashboard-tabs">
                    <button
                        className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
                        onClick={() => setActiveTab('overview')}
                    >
                        📊 Overview
                    </button>
                    <button
                        className={`tab-button ${activeTab === 'cards' ? 'active' : ''}`}
                        onClick={() => setActiveTab('cards')}
                    >
                        💳 My Cards
                    </button>
                    <button
                        className={`tab-button ${activeTab === 'requests' ? 'active' : ''}`}
                        onClick={() => setActiveTab('requests')}
                    >
                        📋 Requests
                    </button>
                </div>                {/* Tab Content */}
                {activeTab === 'overview' && (
                    <div className="overview-tab">
                        <div className="quick-actions">
                            <h3>Quick Actions</h3>
                            <div className="actions-grid">
                                <button className="quick-action-btn" onClick={handleAddNewCard}>
                                    <div className="action-icon">➕</div>
                                    <span>Request New Card</span>
                                </button>
                                <button className="quick-action-btn" onClick={() => setActiveTab('cards')}>
                                    <div className="action-icon">👁️</div>
                                    <span>View All Cards</span>
                                </button>
                                <button className="quick-action-btn" onClick={() => setActiveTab('requests')}>
                                    <div className="action-icon">�</div>
                                    <span>View Requests</span>
                                </button>
                            </div>
                        </div>

                        {/* Recent Cards Preview */}
                        <div className="recent-cards">
                            <h3>Recent Cards</h3>
                            {cards.slice(0, 2).map(card => (
                                <div key={card.id} className="card-preview">
                                    <div className="card-info">
                                        <h4>{card.card_name || 'Virtual Card'}</h4>
                                        <p>{card.masked_numero}</p>
                                    </div>
                                    <div className="card-balance">
                                        <span>${parseFloat(card.balance || 0).toFixed(2)}</span>
                                        <span className={`status ${card.status?.toLowerCase()}`}>
                                            {card.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'cards' && (
                    <div className="cards-tab">
                        {/* Enhanced Cards Section */}
                        <div className="cards-section">
                            <div className="section-header">
                                <div className="header-left">
                                    <h2>My Virtual Cards</h2>
                                    <span className="cards-count">({filteredCards.length} cards)</span>
                                </div>
                                <div className="header-actions">
                                    <button className="add-card-button" onClick={handleAddNewCard}>
                                        + Request New Card
                                    </button>
                                </div>
                            </div>

                            {/* Filters and Search */}
                            <div className="cards-filters">
                                <div className="search-bar">
                                    <input
                                        type="text"
                                        placeholder="Search cards by name or number..."
                                        value={searchTerm}
                                        onChange={handleSearch}
                                        className="search-input"
                                    />
                                </div>

                                <div className="filter-buttons">
                                    <select
                                        value={statusFilter}
                                        onChange={(e) => handleStatusFilter(e.target.value)}
                                        className="filter-select"
                                    >
                                        <option value="all">All Status</option>
                                        <option value="active">Active</option>
                                        <option value="blocked">Blocked</option>
                                        <option value="expired">Expired</option>
                                    </select>

                                    <select
                                        value={categoryFilter}
                                        onChange={(e) => handleCategoryFilter(e.target.value)}
                                        className="filter-select"
                                    >
                                        <option value="all">All Categories</option>
                                        <option value="classic">Classic</option>
                                        <option value="gold">Gold</option>
                                        <option value="platinum">Platinum</option>
                                        <option value="diamond">Diamond</option>
                                    </select>

                                    {(searchTerm || statusFilter !== 'all' || categoryFilter !== 'all') && (
                                        <button onClick={clearFilters} className="clear-filters">
                                            Clear Filters
                                        </button>
                                    )}
                                </div>
                            </div>

                            {cardsLoading ? (
                                <div className="loading-cards">
                                    <div className="loading-spinner"></div>
                                    <p>Loading your cards...</p>
                                </div>
                            ) : filteredCards.length === 0 ? (
                                <div className="no-cards">
                                    <div className="empty-state">
                                        <div className="empty-icon">💳</div>
                                        <h3>No cards found</h3>
                                        <p>
                                            {cards.length === 0
                                                ? "You don't have any virtual cards yet. Create a card request to get started!"
                                                : "No cards match your current filters. Try adjusting your search criteria."
                                            }
                                        </p>
                                        {cards.length === 0 && (
                                            <button className="cta-button" onClick={handleAddNewCard}>
                                                Request Your First Card
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="cards-grid enhanced">
                                    {filteredCards.map(card => (
                                        <div key={card.id} className="card-item enhanced">
                                            <div className="card-visual">
                                                <div className={`virtual-card ${card.card_category?.toLowerCase() || 'classic'}`}>
                                                    <div className="card-header">
                                                        <span className="card-type">Virtual Card</span>
                                                        <span className={`card-status ${card.status?.toLowerCase()}`}>
                                                            {card.status?.toUpperCase()}
                                                        </span>
                                                    </div>
                                                    <div className="card-number">
                                                        {showCardDetails[card.id]
                                                            ? card.numeroCart || '**** **** **** ****'
                                                            : card.masked_numero || '**** **** **** ****'
                                                        }
                                                    </div>
                                                    <div className="card-footer">
                                                        <div className="card-name">
                                                            {card.card_name || 'Virtual Card'}
                                                        </div>
                                                        <div className="card-expiry">
                                                            {card.dateExpiration ?
                                                                new Date(card.dateExpiration).toLocaleDateString('en-US', { month: '2-digit', year: '2-digit' })
                                                                : 'MM/YY'
                                                            }
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="card-info">
                                                <div className="card-details-grid">
                                                    <div className="detail-item">
                                                        <span className="label">Category:</span>
                                                        <span className={`value category-${card.card_category?.toLowerCase()}`}>
                                                            {card.card_category || 'Standard'}
                                                        </span>
                                                    </div>
                                                    <div className="detail-item">
                                                        <span className="label">Balance:</span>
                                                        <span className="value balance">
                                                            ${parseFloat(card.balance || 0).toFixed(2)}
                                                        </span>
                                                    </div>
                                                    <div className="detail-item">
                                                        <span className="label">Created:</span>
                                                        <span className="value">
                                                            {card.dateCreation ? new Date(card.dateCreation).toLocaleDateString() : 'N/A'}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="card-actions enhanced">
                                                    <button
                                                        className="action-btn primary"
                                                        onClick={() => handleShowCardDetails(card.id)}
                                                    >
                                                        👁️ Show Details
                                                    </button>

                                                    <button
                                                        className="action-btn secondary"
                                                        onClick={() => toggleCardDetails(card.id)}
                                                    >
                                                        {showCardDetails[card.id] ? '🙈 Hide' : '👁️ Show'} Number
                                                    </button>

                                                    {showCardDetails[card.id] && (
                                                        <button
                                                            className="action-btn secondary"
                                                            onClick={() => copyCardNumber(card.numeroCart)}
                                                        >
                                                            📋 Copy Number
                                                        </button>
                                                    )}

                                                    {card.status === 'active' ? (
                                                        <button
                                                            className="action-btn danger"
                                                            onClick={() => handleBlockCard(card.id)}
                                                        >
                                                            🚫 Block Card
                                                        </button>
                                                    ) : (
                                                        <button
                                                            className="action-btn success"
                                                            onClick={() => handleActivateCard(card.id)}
                                                        >
                                                            ✅ Activate
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'requests' && (
                    <div className="requests-tab">
                        {/* Card Requests Section */}
                        <div className="requests-section">
                            <div className="section-header">
                                <div className="header-left">
                                    <h2>My Card Requests</h2>
                                    <span className="cards-count">({filteredRequests.length} requests)</span>
                                </div>
                                {loading && <div className="loading-spinner small"></div>}
                            </div>

                            {/* Request Filters */}
                            <div className="cards-filters">
                                <div className="filter-buttons">
                                    <select
                                        value={requestStatusFilter}
                                        onChange={(e) => handleRequestStatusFilter(e.target.value)}
                                        className="filter-select"
                                    >
                                        <option value="all">All Status</option>
                                        <option value="pending">Pending</option>
                                        <option value="approved">Approved</option>
                                        <option value="rejected">Rejected</option>
                                    </select>

                                    {requestStatusFilter !== 'all' && (
                                        <button onClick={clearRequestFilters} className="clear-filters">
                                            Clear Filters
                                        </button>
                                    )}
                                </div>
                            </div>

                            {!Array.isArray(filteredRequests) || (filteredRequests.length === 0 && !loading) ? (
                                <div className="no-requests">
                                    <div className="empty-state">
                                        <div className="empty-icon">📋</div>
                                        <h3>
                                            {requestStatusFilter === 'all'
                                                ? 'No card requests found'
                                                : `No ${requestStatusFilter} requests found`
                                            }
                                        </h3>
                                        <p>
                                            {cardRequests.length === 0
                                                ? "You haven't submitted any card requests yet. Click the button below to create your first request."
                                                : `No requests match the '${requestStatusFilter}' status filter. Try selecting a different status.`
                                            }
                                        </p>
                                        {cardRequests.length === 0 && (
                                            <button className="cta-button" onClick={handleAddNewCard}>
                                                Create First Request
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="requests-grid enhanced">
                                    {filteredRequests.map(request => (
                                        <div key={request.id} className="request-item enhanced">
                                            <div className="request-header">
                                                <div className="request-title">
                                                    <h3>{request.card_name || 'Unnamed Card'}</h3>
                                                    <span className="request-id">#{request.id}</span>
                                                </div>
                                                <span className={`status ${getStatusColor(request.status)}`}>
                                                    {request.status || 'pending'}
                                                </span>
                                            </div>
                                            <div className="request-details">
                                                <div className="details-grid">
                                                    <div className="detail-row">
                                                        <span className="label">Type:</span>
                                                        <span className="value">{request.card_type || 'N/A'}</span>
                                                    </div>
                                                    <div className="detail-row">
                                                        <span className="label">Requested Limit:</span>
                                                        <span className="value">${request.requested_limit || '0'}</span>
                                                    </div>
                                                    <div className="detail-row">
                                                        <span className="label">Submitted:</span>
                                                        <span className="value">
                                                            {request.created_at ? new Date(request.created_at).toLocaleDateString() : 'N/A'}
                                                        </span>
                                                    </div>
                                                </div>
                                                {request.admin_comments && (
                                                    <div className="admin-comments">
                                                        <strong>Admin Comments:</strong>
                                                        <p>{request.admin_comments}</p>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="request-reason">
                                                <strong>Reason:</strong>
                                                <p>{request.reason || 'No reason provided'}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserDashboard;
