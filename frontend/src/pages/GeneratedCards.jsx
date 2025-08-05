import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './GeneratedCards.css';

const GeneratedCards = () => {
    const { token, logout } = useAuth();
    const [cards, setCards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Modal states
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState(''); // 'view' or 'manage'
    const [selectedCard, setSelectedCard] = useState(null);

    useEffect(() => {
        if (token) {
            fetchAllCards();
        }
    }, [token]);

    const fetchAllCards = async () => {
        if (!token) {
            setError('No authentication token available');
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            console.log('Fetching cards with token:', token ? 'Present' : 'None');
            const response = await fetch('http://localhost:8000/api/cards/admin/cards/', {
                headers: {
                    'Authorization': `Token ${token}`,
                    'Content-Type': 'application/json',
                }
            });

            if (response.ok) {
                const data = await response.json();
                console.log('API Response:', data);

                // Handle different response formats
                if (Array.isArray(data)) {
                    setCards(data);
                } else if (data && Array.isArray(data.results)) {
                    setCards(data.results);
                } else {
                    console.error('Unexpected data format:', data);
                    setCards([]);
                    setError('Unexpected data format from server');
                }
            } else {
                setError('Failed to fetch cards');
            }
        } catch (error) {
            setError('Network error');
            console.error('Error fetching cards:', error);
        } finally {
            setLoading(false);
        }
    };

    // Modal functions
    const openModal = (type, card) => {
        setModalType(type);
        setSelectedCard(card);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setModalType('');
        setSelectedCard(null);
    };

    // Admin actions for manage modal
    const handleCardAction = async (action, cardId) => {
        try {
            let endpoint = '';
            let method = 'POST';
            let body = {};

            switch (action) {
                case 'activate':
                    endpoint = `http://localhost:8000/api/cards/${cardId}/activer/`;
                    break;
                case 'block':
                    endpoint = `http://localhost:8000/api/cards/${cardId}/bloquer/`;
                    break;
                case 'freeze':
                    // Add your freeze endpoint
                    endpoint = `http://localhost:8000/api/cards/${cardId}/freeze/`;
                    break;
                case 'terminate':
                    // Add your terminate endpoint
                    endpoint = `http://localhost:8000/api/cards/${cardId}/terminate/`;
                    break;
                case 'reset-pin':
                    // Add your reset PIN endpoint
                    endpoint = `http://localhost:8000/api/cards/${cardId}/reset-pin/`;
                    break;
                case 'adjust-limits':
                    // Add your adjust limits endpoint - this might need additional parameters
                    endpoint = `http://localhost:8000/api/cards/${cardId}/adjust-limits/`;
                    break;
                default:
                    console.error('Unknown action:', action);
                    return;
            }

            const response = await fetch(endpoint, {
                method: method,
                headers: {
                    'Authorization': `Token ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body)
            });

            if (response.ok) {
                // Refresh the cards list
                fetchAllCards();
                closeModal();
                alert(`Card ${action} successful!`);
            } else {
                const errorData = await response.json();
                alert(`Failed to ${action} card: ${errorData.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error(`Error performing ${action}:`, error);
            alert(`Network error while performing ${action}`);
        }
    };

    const navigateTo = (path) => {
        window.location.href = path;
    };

    const handleLogout = () => {
        logout();
        window.location.href = '/';
    };

    const getCardCategoryColor = (category) => {
        switch (category) {
            case 'diamond': return '#b8860b';  // Gold color
            case 'platinum': return '#c0c0c0'; // Silver color
            case 'gold': return '#ffd700';     // Gold color
            case 'classic': return '#74645c';  // Brown color
            default: return '#74645c';
        }
    };

    const getCardCategoryIcon = (category) => {
        switch (category) {
            case 'diamond': return '💎';
            case 'platinum': return '🥈';
            case 'gold': return '🥇';
            case 'classic': return '🏷️';
            default: return '💳';
        }
    };

    if (loading) return <div className="loading">Loading cards...</div>;
    if (error) return <div className="error">{error}</div>;

    return (
        <div className="generated-cards-page">
            {/* Admin Navbar */}
            <nav className="admin-navbar">
                <div className="navbar-content">
                    <div className="navbar-left">
                        <h1>Admin Panel</h1>
                        <p>Virtual Card Management System</p>
                    </div>
                    <div className="navbar-actions">
                        <button
                            className="nav-button secondary"
                            onClick={() => navigateTo('/admin-dashboard')}
                        >
                            Dashboard
                        </button>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <div className="page-content">
                {/* Statistics Header */}
                <div className="stats-header">
                    <div className="stat-item">
                        <span className="stat-label">Total Cards</span>
                        <span className="stat-value">{Array.isArray(cards) ? cards.length : 0}</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-label">Active Cards</span>
                        <span className="stat-value">{Array.isArray(cards) ? cards.filter(c => c.status === 'active').length : 0}</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-label">Blocked Cards</span>
                        <span className="stat-value">{Array.isArray(cards) ? cards.filter(c => c.status === 'blocked').length : 0}</span>
                    </div>
                </div>

                {/* Cards Grid */}
                <div className="cards-grid">
                    {Array.isArray(cards) && cards.map(card => (
                        <div key={card.id} className="card-container">
                            {/* Card Visual */}
                            <div className="card-visual">
                                <div className="card-logo">
                                    <span className="bank-name">Virtual Bank</span>
                                    <span className="card-type">{card.card_category.toUpperCase()}</span>
                                </div>
                                <div className="card-number">
                                    {card.masked_numero || '**** **** **** ****'}
                                </div>
                                <div className="card-footer">
                                    <span className="card-holder">{card.utilisateur_name}</span>
                                    <span className="card-expiry">
                                        {new Date(card.dateExpiration).toLocaleDateString('en-US', {
                                            month: '2-digit',
                                            year: '2-digit'
                                        })}
                                    </span>
                                </div>
                            </div>

                            {/* Card Info */}
                            <div className="card-info">
                                <div className={`card-status status-${card.status}`}>
                                    {card.status.toUpperCase()}
                                </div>

                                <div className="card-details">
                                    <div className="detail-item">
                                        <span className="detail-label">Card Name</span>
                                        <span className="detail-value">{card.card_name}</span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">Balance</span>
                                        <span className="detail-value">${card.balance}</span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">Created</span>
                                        <span className="detail-value">
                                            {new Date(card.dateCreation).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>

                                <div className="card-actions">
                                    <button
                                        className="action-button primary"
                                        onClick={() => openModal('view', card)}
                                    >
                                        View Details
                                    </button>
                                    <button
                                        className="action-button secondary"
                                        onClick={() => openModal('manage', card)}
                                    >
                                        Manage
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {(!Array.isArray(cards) || cards.length === 0) && !loading && (
                    <div className="no-cards">
                        <p>No cards have been generated yet.</p>
                        <p>Cards are automatically created when admin approves card requests.</p>
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && selectedCard && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">
                                {modalType === 'view' ? 'Card Details' : 'Manage Card'}
                            </h2>
                            <button className="close-button" onClick={closeModal}>
                                ×
                            </button>
                        </div>

                        <div className="modal-body">
                            {modalType === 'view' ? (
                                <>
                                    {/* Card Visual in Modal */}
                                    <div className="modal-card-visual">
                                        <div className="modal-card-content">
                                            <div className="modal-card-header">
                                                <span className="modal-bank-name">Virtual Bank</span>
                                                <span className="modal-card-type">{selectedCard.card_category.toUpperCase()}</span>
                                            </div>
                                            <div className="modal-card-number">
                                                {selectedCard.numero || '**** **** **** ****'}
                                            </div>
                                            <div className="modal-card-footer">
                                                <span className="modal-card-holder">{selectedCard.utilisateur_name}</span>
                                                <span className="modal-card-expiry">
                                                    {new Date(selectedCard.dateExpiration).toLocaleDateString('en-US', {
                                                        month: '2-digit',
                                                        year: '2-digit'
                                                    })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Card Information */}
                                    <div className="info-section">
                                        <h3 className="section-title">Card Information</h3>
                                        <div className="info-grid">
                                            <div className="info-item">
                                                <span className="info-label">Status</span>
                                                <div className={`status-indicator status-${selectedCard.status}`}>
                                                    <span className="status-dot"></span>
                                                    {selectedCard.status.toUpperCase()}
                                                </div>
                                            </div>
                                            <div className="info-item">
                                                <span className="info-label">Card Name</span>
                                                <span className="info-value">{selectedCard.card_name}</span>
                                            </div>
                                            <div className="info-item">
                                                <span className="info-label">Card Type</span>
                                                <span className="info-value">{selectedCard.card_type}</span>
                                            </div>
                                            <div className="info-item">
                                                <span className="info-label">Category</span>
                                                <span className="info-value">{selectedCard.card_category}</span>
                                            </div>
                                            <div className="info-item">
                                                <span className="info-label">Balance</span>
                                                <span className="info-value">${selectedCard.balance}</span>
                                            </div>
                                            <div className="info-item">
                                                <span className="info-label">Credit Limit</span>
                                                <span className="info-value">${selectedCard.credit_limit}</span>
                                            </div>
                                            <div className="info-item">
                                                <span className="info-label">Created Date</span>
                                                <span className="info-value">
                                                    {new Date(selectedCard.dateCreation).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <div className="info-item">
                                                <span className="info-label">Expiry Date</span>
                                                <span className="info-value">
                                                    {new Date(selectedCard.dateExpiration).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <div className="info-item">
                                                <span className="info-label">RIB</span>
                                                <span className="info-value">{selectedCard.rib || 'Not Available'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Owner Information */}
                                    <div className="info-section">
                                        <h3 className="section-title">Card Owner Information</h3>
                                        <div className="info-grid">
                                            <div className="info-item">
                                                <span className="info-label">Owner Name</span>
                                                <span className="info-value">{selectedCard.utilisateur_name}</span>
                                            </div>
                                            <div className="info-item">
                                                <span className="info-label">User ID</span>
                                                <span className="info-value">{selectedCard.utilisateur}</span>
                                            </div>
                                            {selectedCard.utilisateur_email && (
                                                <div className="info-item">
                                                    <span className="info-label">Email</span>
                                                    <span className="info-value">{selectedCard.utilisateur_email}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </>
                            ) : (
                                /* Manage Modal - Actions Only */
                                <div className="manage-actions-container">
                                    <div className="actions-grid">
                                        {selectedCard.status === 'blocked' && (
                                            <button
                                                className="modal-action-button action-unblock"
                                                onClick={() => handleCardAction('activate', selectedCard.id)}
                                            >
                                                Unblock Card
                                            </button>
                                        )}
                                        {selectedCard.status === 'active' && (
                                            <button
                                                className="modal-action-button action-freeze"
                                                onClick={() => handleCardAction('block', selectedCard.id)}
                                            >
                                                Block Card
                                            </button>
                                        )}
                                        <button
                                            className="modal-action-button action-freeze"
                                            onClick={() => handleCardAction('freeze', selectedCard.id)}
                                        >
                                            Freeze Card
                                        </button>
                                        <button
                                            className="modal-action-button action-terminate"
                                            onClick={() => handleCardAction('terminate', selectedCard.id)}
                                        >
                                            Terminate Card
                                        </button>
                                        <button
                                            className="modal-action-button action-limits"
                                            onClick={() => handleCardAction('adjust-limits', selectedCard.id)}
                                        >
                                            Adjust Limits
                                        </button>
                                    </div>
                                    <div className="fraud-button-container">
                                        <button
                                            className="modal-action-button action-fraud"
                                            onClick={() => alert('Fraud review initiated for this card')}
                                        >
                                            Fraud Review
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GeneratedCards;
