import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './CardManagement.css';

const CardManagement = () => {
    const navigate = useNavigate();
    const [cardRequests, setCardRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        console.log('CardManagement component mounted');
        const token = localStorage.getItem('token');
        if (!token) {
            console.log('No token found, redirecting to login');
            navigate('/login');
            return;
        }
        fetchCardRequests();
    }, [navigate]);

    const fetchCardRequests = async () => {
        try {
            setLoading(true);
            setError('');
            console.log('Fetching all card requests...');

            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:8000/api/cards/admin/requests/', {
                method: 'GET',
                headers: {
                    'Authorization': `Token ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            console.log('Response status:', response.status);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('API Response:', data);

            // Handle the response data - ensure we get all requests regardless of status
            if (Array.isArray(data)) {
                setCardRequests(data);
                console.log('Card requests set successfully:', data.length, 'items');
            } else if (data && Array.isArray(data.results)) {
                setCardRequests(data.results);
                console.log('Card requests set successfully from results:', data.results.length, 'items');
            } else {
                console.error('Unexpected data format:', data);
                setCardRequests([]);
                setError('Unexpected data format received from server');
            }
        } catch (error) {
            console.error('Error fetching card requests:', error);
            setError(`Failed to fetch card requests: ${error.message}`);
            setCardRequests([]);
        } finally {
            setLoading(false);
        }
    }; const validateApprovalConditions = (request) => {
        const conditions = [];
        let canApprove = true;

        // 1. Vérifier l'âge (18 ans ou plus)
        if (request.date_of_birth) {
            const today = new Date();
            const birth = new Date(request.date_of_birth);
            const age = today.getFullYear() - birth.getFullYear();
            const monthDiff = today.getMonth() - birth.getMonth();
            const actualAge = (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) ? age - 1 : age;

            if (actualAge >= 18) {
                conditions.push({ text: "✅ L'utilisateur a 18 ans ou plus", valid: true });
            } else {
                conditions.push({ text: "❌ L'utilisateur doit avoir 18 ans ou plus", valid: false });
                canApprove = false;
            }
        } else {
            conditions.push({ text: "❌ Date de naissance manquante", valid: false });
            canApprove = false;
        }

        // 2. Vérifier le plafond demandé (≤ 10,000 MAD)
        if (request.requested_limit && request.requested_limit <= 10000) {
            conditions.push({ text: "✅ Le plafond demandé est inférieur ou égal à 10,000 MAD", valid: true });
        } else {
            conditions.push({ text: "❌ Le plafond demandé doit être inférieur ou égal à 10,000 MAD", valid: false });
            canApprove = false;
        }

        // 3. Vérifier qu'il n'y a pas déjà une demande en attente pour le même type
        const pendingRequestsOfSameType = cardRequests.filter(r =>
            r.user?.id === request.user?.id &&
            r.card_type === request.card_type &&
            r.status === 'pending' &&
            r.id !== request.id
        );

        if (pendingRequestsOfSameType.length === 0) {
            conditions.push({ text: "✅ Aucune autre demande en attente pour ce type de carte", valid: true });
        } else {
            conditions.push({ text: "❌ L'utilisateur a déjà une demande en attente pour ce type de carte", valid: false });
            canApprove = false;
        }

        // 4. Vérifier la pièce d'identité
        if (request.identity_document) {
            conditions.push({ text: "✅ Pièce d'identité fournie", valid: true });
        } else {
            conditions.push({ text: "❌ Pièce d'identité manquante", valid: false });
            canApprove = false;
        }

        // 5. Vérifier le justificatif de revenu
        if (request.income_proof) {
            conditions.push({ text: "✅ Justificatif de revenu fourni", valid: true });
        } else {
            conditions.push({ text: "❌ Justificatif de revenu manquant", valid: false });
            canApprove = false;
        }

        // 6. Vérifier la raison
        if (request.reason && request.reason.trim().length >= 10) {
            conditions.push({ text: "✅ Raison de la demande claire et remplie", valid: true });
        } else {
            conditions.push({ text: "❌ La raison de la demande doit être claire et détaillée (minimum 10 caractères)", valid: false });
            canApprove = false;
        }

        return { conditions, canApprove };
    };

    const handleUpdateStatus = async (requestId, status) => {
        try {
            setActionLoading(true);

            // Si c'est une approbation, vérifier les conditions
            if (status === 'approved') {
                const request = cardRequests.find(r => r.id === requestId);
                const validation = validateApprovalConditions(request);

                if (!validation.canApprove) {
                    alert('Cette demande ne peut pas être approuvée car toutes les conditions ne sont pas remplies. Veuillez vérifier les détails.');
                    setActionLoading(false);
                    return;
                }
            }

            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:8000/api/cards/admin/requests/${requestId}/`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Token ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const updatedRequest = await response.json();
            console.log('Updated request:', updatedRequest);

            // Si une carte a été générée lors de l'approbation
            if (status === 'approved' && updatedRequest.approved_card) {
                // Récupérer les détails de la carte générée
                const cardResponse = await fetch(`http://localhost:8000/api/cards/admin/cards/`, {
                    headers: {
                        'Authorization': `Token ${token}`,
                        'Content-Type': 'application/json',
                    }
                });

                if (cardResponse.ok) {
                    const cardsData = await cardResponse.json();
                    const generatedCard = cardsData.find(card => card.id === updatedRequest.approved_card);

                    if (generatedCard) {
                        alert(`✅ Demande approuvée avec succès!\n\n🎉 Carte virtuelle générée:\n` +
                            `💳 Numéro: ${generatedCard.masked_numero}\n` +
                            `🏷️ Catégorie: ${generatedCard.card_category.toUpperCase()}\n` +
                            `📅 Expiration: ${new Date(generatedCard.dateExpiration).toLocaleDateString()}\n` +
                            `💰 Limite: $${generatedCard.credit_limit}`);
                    }
                }
            } else {
                alert(`Demande ${status === 'approved' ? 'approuvée' : 'rejetée'} avec succès!`);
            }

            // Recharger les données après mise à jour
            await fetchCardRequests();
            setShowModal(false);
            setSelectedRequest(null);
        } catch (error) {
            console.error(`Error ${status}ing request:`, error);
            setError(`Échec lors du ${status === 'approved' ? 'approbation' : 'rejet'} de la demande: ${error.message}`);
        } finally {
            setActionLoading(false);
        }
    };

    const filteredRequests = Array.isArray(cardRequests) ? cardRequests.filter(request => {
        if (filterStatus === 'all') return true;
        return request.status === filterStatus;
    }) : [];

    const openModal = (request) => {
        setSelectedRequest(request);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setSelectedRequest(null);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return '#fbd424';
            case 'approved': return '#74645c';
            case 'rejected': return '#a69d97';
            default: return '#95a5a6';
        }
    };

    const getStatusBadgeStyle = (status) => {
        return {
            backgroundColor: getStatusColor(status),
            color: status === 'pending' ? '#74645c' : '#e2deda',
            padding: '4px 12px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
        };
    };

    if (loading) {
        return (
            <div className="card-management-container">
                <div className="loading-message">
                    <h2>Loading card requests...</h2>
                </div>
            </div>
        );
    }

    return (
        <div className="card-management-container">
            <div className="card-management-header">
                <button
                    className="back-button"
                    onClick={() => navigate('/admin-dashboard')}
                >
                    ← Back to Dashboard
                </button>
                <h1>Card Request Management</h1>
                <p>Review and manage virtual card requests</p>
            </div>

            {error && (
                <div className="error-message">
                    <p>{error}</p>
                    <button onClick={fetchCardRequests} className="retry-button">
                        Retry
                    </button>
                </div>
            )}

            <div className="card-management-controls">
                <div className="stats">
                    <span>Total Requests: {cardRequests.length}</span>
                    <span>Pending: {cardRequests.filter(r => r.status === 'pending').length}</span>
                    <span>Approved: {cardRequests.filter(r => r.status === 'approved').length}</span>
                    <span>Rejected: {cardRequests.filter(r => r.status === 'rejected').length}</span>
                </div>
                <div className="filter-controls">
                    <label>Filter by Status:</label>
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="filter-select"
                    >
                        <option value="all">All Requests</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                    </select>
                    <button onClick={fetchCardRequests} className="refresh-button">
                        🔄 Refresh
                    </button>
                </div>
            </div>

            <div className="requests-grid">
                {filteredRequests.length === 0 ? (
                    <div className="no-requests">
                        <h3>No {filterStatus === 'all' ? '' : filterStatus} requests found</h3>
                        <p>There are currently no card requests {filterStatus !== 'all' ? `with status: ${filterStatus}` : 'to display'}</p>
                        {filterStatus !== 'all' && (
                            <button onClick={() => setFilterStatus('all')} className="show-all-button">
                                Show All Requests
                            </button>
                        )}
                    </div>
                ) : (
                    filteredRequests.map((request) => (
                        <div key={request.id} className={`request-card ${request.status}`}>
                            <div className="request-header">
                                <div className="user-name">
                                    <h3>{request.user?.first_name || 'Unknown'} {request.user?.last_name || 'User'}</h3>
                                    <p className="user-email">{request.user?.email || 'No email'}</p>
                                </div>
                                <span style={getStatusBadgeStyle(request.status)}>
                                    {request.status}
                                </span>
                            </div>

                            <div className="request-details">
                                <div className="detail-row">
                                    <strong>Card Type:</strong> {request.card_type}
                                </div>
                                <div className="detail-row">
                                    <strong>Card Label:</strong> {request.card_name}
                                </div>
                                <div className="detail-row">
                                    <strong>Phone:</strong> {request.phone_number}
                                </div>
                                <div className="detail-row">
                                    <strong>Profession:</strong> {request.profession}
                                </div>
                                <div className="detail-row">
                                    <strong>Monthly Income:</strong> ${request.monthly_income}
                                </div>
                                <div className="detail-row">
                                    <strong>Requested Limit:</strong> ${request.requested_limit}
                                </div>
                                <div className="detail-row">
                                    <strong>Submitted:</strong> {new Date(request.created_at).toLocaleDateString()}
                                </div>
                            </div>

                            <div className="card-actions">
                                <button
                                    className="view-details-button"
                                    onClick={() => openModal(request)}
                                >
                                    View Full Details
                                </button>
                                {request.status === 'pending' && (
                                    <div className="approval-buttons">
                                        <button
                                            className="approve-button"
                                            onClick={() => handleUpdateStatus(request.id, 'approved')}
                                            disabled={actionLoading}
                                        >
                                            {actionLoading ? 'Processing...' : 'Approve'}
                                        </button>
                                        <button
                                            className="reject-button"
                                            onClick={() => handleUpdateStatus(request.id, 'rejected')}
                                            disabled={actionLoading}
                                        >
                                            {actionLoading ? 'Processing...' : 'Reject'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {showModal && selectedRequest && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Request Details</h2>
                            <button className="close-button" onClick={closeModal}>×</button>
                        </div>
                        <div className="modal-body">
                            <div className="user-info">
                                <h3>User Information</h3>
                                <p><strong>Name:</strong> {selectedRequest.user?.first_name} {selectedRequest.user?.last_name}</p>
                                <p><strong>Email:</strong> {selectedRequest.user?.email}</p>
                                <p><strong>Phone:</strong> {selectedRequest.phone_number}</p>
                                <p><strong>Date of Birth:</strong> {selectedRequest.date_of_birth}</p>
                                <p><strong>Profession:</strong> {selectedRequest.profession}</p>
                                <p><strong>Monthly Income:</strong> ${selectedRequest.monthly_income}</p>
                                <p><strong>Emergency Contact:</strong> {selectedRequest.emergency_contact}</p>
                            </div>
                            <div className="card-info">
                                <h3>Card Information</h3>
                                <p><strong>Card Type:</strong> {selectedRequest.card_type}</p>
                                <p><strong>Card Name:</strong> {selectedRequest.card_name}</p>
                                <p><strong>Requested Limit:</strong> ${selectedRequest.requested_limit}</p>
                                <p><strong>Reason:</strong> {selectedRequest.reason}</p>
                                <p><strong>Status:</strong>
                                    <span style={{ ...getStatusBadgeStyle(selectedRequest.status), marginLeft: '10px' }}>
                                        {selectedRequest.status}
                                    </span>
                                </p>
                                <p><strong>Submitted:</strong> {new Date(selectedRequest.created_at).toLocaleString()}</p>
                            </div>
                            <div className="documents">
                                <h3>Documents</h3>
                                {selectedRequest.identity_document && (
                                    <p><strong>Identity Document:</strong>
                                        <a href={selectedRequest.identity_document} target="_blank" rel="noopener noreferrer">
                                            View Document
                                        </a>
                                    </p>
                                )}
                                {selectedRequest.income_proof && (
                                    <p><strong>Income Proof:</strong>
                                        <a href={selectedRequest.income_proof} target="_blank" rel="noopener noreferrer">
                                            View Document
                                        </a>
                                    </p>
                                )}
                            </div>

                            {selectedRequest.status === 'pending' && (
                                <div className="validation-conditions">
                                    <h3>Conditions d'Approbation</h3>
                                    <div className="conditions-list">
                                        {validateApprovalConditions(selectedRequest).conditions.map((condition, index) => (
                                            <div key={index} className={`condition-item ${condition.valid ? 'valid' : 'invalid'}`}>
                                                {condition.text}
                                            </div>
                                        ))}
                                    </div>
                                    {!validateApprovalConditions(selectedRequest).canApprove && (
                                        <div className="approval-warning">
                                            ⚠️ Cette demande ne peut pas être approuvée car toutes les conditions ne sont pas remplies.
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        {selectedRequest.status === 'pending' && (
                            <div className="modal-actions">
                                <button
                                    className="approve-button"
                                    onClick={() => handleUpdateStatus(selectedRequest.id, 'approved')}
                                    disabled={actionLoading}
                                >
                                    {actionLoading ? 'Processing...' : 'Approve Request'}
                                </button>
                                <button
                                    className="reject-button"
                                    onClick={() => handleUpdateStatus(selectedRequest.id, 'rejected')}
                                    disabled={actionLoading}
                                >
                                    {actionLoading ? 'Processing...' : 'Reject Request'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CardManagement;
