import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useApiCall } from '../hooks/useApiCall';
import './CardDetails.css';

const CardDetails = () => {
    const { cardId } = useParams();
    const navigate = useNavigate();
    const { token } = useAuth();
    const apiCall = useApiCall();

    const [card, setCard] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showFullNumber, setShowFullNumber] = useState(false);

    useEffect(() => {
        if (token && cardId) {
            fetchCardDetails();
        }
    }, [token, cardId]);

    const fetchCardDetails = async () => {
        setLoading(true);
        try {
            const result = await apiCall(`/cards/cards/${cardId}/`);
            if (result && result.ok) {
                setCard(result.data);
            } else {
                console.error('Failed to fetch card details');
                navigate('/user-dashboard');
            }
        } catch (error) {
            console.error('Error fetching card details:', error);
            navigate('/user-dashboard');
        } finally {
            setLoading(false);
        }
    };

    const handleActivateCard = async () => {
        try {
            console.log('Attempting to activate card:', cardId);
            const result = await apiCall(`/cards/cards/${cardId}/activate/`, {
                method: 'POST'
            });
            console.log('Activation result:', result);

            if (result && result.ok) {
                alert('Card activated successfully!');
                fetchCardDetails(); // Refresh card data
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

    const handleBlockCard = async () => {
        if (window.confirm('Are you sure you want to block this card?')) {
            try {
                const result = await apiCall(`/cards/cards/${cardId}/deactivate/`, {
                    method: 'POST'
                });
                if (result && result.ok) {
                    alert('Card blocked successfully!');
                    fetchCardDetails(); // Refresh card data
                } else {
                    alert('Failed to block card');
                }
            } catch (error) {
                console.error('Error blocking card:', error);
                alert('Error blocking card');
            }
        }
    };

    const copyToClipboard = (text, label) => {
        if (text) {
            navigator.clipboard.writeText(text);
            alert(`${label} copied to clipboard!`);
        }
    };

    const formatCardNumber = (number) => {
        if (!number) return '**** **** **** ****';
        return number.match(/.{1,4}/g)?.join(' ') || number;
    };

    if (loading) {
        return (
            <div className="card-details-page">
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Loading card details...</p>
                </div>
            </div>
        );
    }

    if (!card) {
        return (
            <div className="card-details-page">
                <div className="error-container">
                    <h2>Card not found</h2>
                    <button onClick={() => navigate('/user-dashboard')} className="back-button">
                        Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="card-details-page">
            <div className="card-details-header">
                <button onClick={() => navigate('/user-dashboard')} className="back-button">
                    ← Back to Dashboard
                </button>
                <h1>Card Details</h1>
            </div>

            <div className="card-details-content">
                {/* Virtual Card Visual */}
                <div className="card-visual-section">
                    <div className={`virtual-card-large ${card.card_category?.toLowerCase() || 'classic'}`}>
                        <div className="card-header">
                            <span className="card-type">Virtual Card</span>
                            <span className={`card-status ${card.status?.toLowerCase()}`}>
                                {card.status?.toUpperCase()}
                            </span>
                        </div>
                        <div className="card-number">
                            {showFullNumber
                                ? formatCardNumber(card.numeroCart)
                                : formatCardNumber(card.masked_numero)
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

                {/* Card Information */}
                <div className="card-info-section">
                    <div className="info-grid">
                        <div className="info-card">
                            <h3>Card Information</h3>
                            <div className="info-item">
                                <span className="label">Card Name:</span>
                                <span className="value">{card.card_name || 'Virtual Card'}</span>
                            </div>
                            <div className="info-item">
                                <span className="label">Card Number:</span>
                                <div className="secure-field">
                                    <span className="value">
                                        {showFullNumber
                                            ? formatCardNumber(card.numeroCart)
                                            : formatCardNumber(card.masked_numero)
                                        }
                                    </span>
                                    <div className="field-actions">
                                        <button
                                            onClick={() => setShowFullNumber(!showFullNumber)}
                                            className="toggle-button"
                                        >
                                            {showFullNumber ? '🙈 Hide' : '👁️ Show'}
                                        </button>
                                        {showFullNumber && (
                                            <button
                                                onClick={() => copyToClipboard(card.numeroCart, 'Card number')}
                                                className="copy-button"
                                            >
                                                📋 Copy
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="info-item">
                                <span className="label">Expiry Date:</span>
                                <span className="value">
                                    {card.dateExpiration ?
                                        new Date(card.dateExpiration).toLocaleDateString() : 'N/A'
                                    }
                                </span>
                            </div>
                        </div>

                        <div className="info-card">
                            <h3>Account Details</h3>
                            <div className="info-item">
                                <span className="label">Category:</span>
                                <span className={`value category-${card.card_category?.toLowerCase()}`}>
                                    {card.card_category || 'Standard'}
                                </span>
                            </div>
                            <div className="info-item">
                                <span className="label">Current Balance:</span>
                                <span className="value balance">
                                    ${parseFloat(card.balance || 0).toFixed(2)}
                                </span>
                            </div>
                            <div className="info-item">
                                <span className="label">Status:</span>
                                <span className={`value status-${card.status?.toLowerCase()}`}>
                                    {card.status}
                                </span>
                            </div>
                            <div className="info-item">
                                <span className="label">Created:</span>
                                <span className="value">
                                    {card.dateCreation ?
                                        new Date(card.dateCreation).toLocaleDateString() : 'N/A'
                                    }
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Card Actions */}
                <div className="card-actions-section">
                    <h3>Card Actions</h3>
                    <div className="actions-grid">
                        {card.status === 'active' ? (
                            <button
                                onClick={handleBlockCard}
                                className="action-button danger"
                            >
                                🚫 Block Card
                            </button>
                        ) : card.status === 'blocked' ? (
                            <button
                                onClick={handleActivateCard}
                                className="action-button success"
                            >
                                ✅ Activate Card
                            </button>
                        ) : null}

                        <button
                            onClick={() => copyToClipboard(
                                `Card: ${formatCardNumber(card.masked_numero)}\nExpiry: ${card.dateExpiration ? new Date(card.dateExpiration).toLocaleDateString('en-US', { month: '2-digit', year: '2-digit' }) : 'MM/YY'}`,
                                'Card details'
                            )}
                            className="action-button secondary"
                        >
                            📋 Copy Card Info
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CardDetails;
