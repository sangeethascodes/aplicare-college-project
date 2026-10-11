import React, { useState, useEffect } from 'react';
import {
  Container, Row, Col, Card, Button, Modal, Form, Alert, Spinner, Badge
} from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { FaStar } from 'react-icons/fa';
import { apiUrl } from './api';

function HomePage2() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [activeRepairs, setActiveRepairs] = useState([]);
  const [completedRepairs, setCompletedRepairs] = useState([]);
  const [pendingFeedbacks, setPendingFeedbacks] = useState([]);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedRepair, setSelectedRepair] = useState(null);
  const [cancellationReason, setCancellationReason] = useState('');
  const [feedbackText, setFeedbackText] = useState('');
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/');
      return;
    }
    
    const parsedUser = JSON.parse(userData);
    if (parsedUser.role !== 'user') {
      navigate('/');
      return;
    }
    
    setUser(parsedUser);
    fetchUserRepairs(parsedUser.id);
    fetchPendingFeedbacks(parsedUser.id);
  }, [navigate]);

  const fetchUserRepairs = async (userId) => {
    try {
      setLoading(true);
      const response = await fetch(apiUrl('/api/orderedRepairs'));
      const data = await response.json();
      
      if (data.success) {
        const userRepairs = data.repairs.filter(r => r.userId === userId);
        
        // Separate active and completed repairs
        const active = userRepairs.filter(r => 
          r.status !== 'completed' && r.status !== 'cancelled'
        );
        const completed = userRepairs.filter(r => r.status === 'completed');
        
        setActiveRepairs(active);
        setCompletedRepairs(completed);
      }
    } catch (error) {
      console.error('Error fetching repairs:', error);
      setError('Failed to load your repairs');
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingFeedbacks = async (userId) => {
    try {
      const response = await fetch(apiUrl(`/api/user/pending-feedback/${userId}`));
      const data = await response.json();
      
      if (data.success) {
        setPendingFeedbacks(data.pendingRepairs);
        if (data.pendingRepairs.length > 0) {
          setSuccessMessage(`🎉 You have ${data.pendingRepairs.length} completed service${data.pendingRepairs.length > 1 ? 's' : ''} waiting for your feedback!`);
          setTimeout(() => setSuccessMessage(''), 5000);
        }
      }
    } catch (error) {
      console.error('Error fetching pending feedbacks:', error);
    }
  };

  const handleCancelRepair = async () => {
    if (!cancellationReason.trim()) {
      setError('Please provide a reason for cancellation');
      return;
    }
    
    setSubmitting(true);
    setError('');
    
    try {
      const response = await fetch(apiUrl(`/api/orderedRepairs/${selectedRepair._id}/status`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'cancelled',
          cancellationReason: cancellationReason,
          cancelledBy: `${user.fullName} (${user.email})`,
          cancelledByRole: 'customer'
        })
      });
      
      if (response.ok) {
        alert('✅ Service cancelled successfully!');
        setShowCancelModal(false);
        setCancellationReason('');
        fetchUserRepairs(user.id);
      } else {
        alert('❌ Failed to cancel service');
      }
    } catch (error) {
      console.error('Error cancelling repair:', error);
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    
    if (!feedbackText.trim()) {
      setError('Please enter your feedback');
      return;
    }
    
    setSubmitting(true);
    setError('');
    
    try {
      const response = await fetch(apiUrl('/api/user/submit-feedback'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repairId: selectedRepair._id,
          userId: user.id,
          technicianId: selectedRepair.technicianId,
          technicianName: selectedRepair.technicianName,
          customerName: selectedRepair.customerName,
          customerEmail: user.email,
          appliance: selectedRepair.appliance,
          feedback: feedbackText,
          rating: rating
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert('✅ Thank you for your feedback!');
        setShowFeedbackModal(false);
        setFeedbackText('');
        setRating(5);
        setPendingFeedbacks(prev => prev.filter(r => r.id !== selectedRepair._id));
        fetchUserRepairs(user.id);
      } else {
        setError(data.error || 'Failed to submit feedback');
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const calculateCost = (appliance, issue) => {
    // Base costs by appliance type
    const baseCosts = {
      'AC': 500,
      'Refrigerator': 600,
      'Washing Machine': 400,
      'TV': 300,
      'Microwave': 200,
      'General': 250
    };
    
    const baseCost = baseCosts[appliance] || 250;
    // Complexity factor based on issue length
    const complexity = issue && issue.length > 50 ? 1.5 : 1;
    return Math.round(baseCost * complexity);
  };

  const getPaymentStatusBadge = (status) => {
    const badges = {
      pending: <Badge bg="warning">⏳ Pending</Badge>,
      paid: <Badge bg="success">✅ Paid</Badge>,
      refunded: <Badge bg="info">🔄 Refunded</Badge>
    };
    return badges[status] || <Badge bg="secondary">{status}</Badge>;
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  return (
    <div className="bg-light min-vh-100 py-4">
      <Container>
        {/* Header */}
        <Row className="mb-4">
          <Col>
            <h2 className="fw-bold text-dark mb-1">🏠 Welcome, {user?.fullName || 'Customer'}!</h2>
            <p className="text-muted">Manage your service requests</p>
          </Col>
          <Col className="text-end">
            <Button variant="outline-danger" onClick={() => { localStorage.clear(); navigate('/'); }}>
              🚪 Logout
            </Button>
            <Button variant="primary" className="ms-2" onClick={() => navigate('/book-service')}>
              📝 Book New Service
            </Button>
          </Col>
        </Row>

        {successMessage && (
          <Alert variant="success" dismissible onClose={() => setSuccessMessage('')}>
            {successMessage}
          </Alert>
        )}

        {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}

        {/* Active Repairs Section */}
        <Row className="mb-4">
          <Col>
            <Card className="shadow-sm">
              <Card.Header className="bg-white">
                <h5 className="mb-0 fw-bold">🔧 Active Service Requests ({activeRepairs.length})</h5>
              </Card.Header>
              <Card.Body>
                {activeRepairs.length === 0 ? (
                  <div className="text-center py-4">
                    <i className="bi bi-tools display-1 text-muted mb-3"></i>
                    <p className="text-muted">No active service requests</p>
                    <Button variant="primary" onClick={() => navigate('/book-service')}>
                      Book New Service
                    </Button>
                  </div>
                ) : (
                  <Row className="g-4">
                    {activeRepairs.map((repair) => (
                      <Col key={repair._id} md={6} lg={4}>
                        <Card className="h-100 shadow-sm">
                          <Card.Body>
                            <div className="d-flex justify-content-between align-items-start mb-3">
                              <Badge bg={repair.status === 'assigned' ? 'info' : 'primary'}>
                                {repair.status === 'assigned' ? '📋 Assigned' : '🔧 In Progress'}
                              </Badge>
                              {repair.status !== 'cancelled' && repair.status !== 'completed' && (
                                <Button 
                                  variant="danger" 
                                  size="sm"
                                  onClick={() => {
                                    setSelectedRepair(repair);
                                    setShowCancelModal(true);
                                  }}
                                >
                                  Cancel
                                </Button>
                              )}
                            </div>
                            
                            <h6 className="fw-bold mb-2">{repair.appliance}</h6>
                            <p className="text-muted small mb-2">{repair.issue}</p>
                            
                            {/* Technician Info - Shows assigned technician */}
                            {repair.technicianName && repair.technicianName !== 'Not Assigned' && (
                              <div className="mb-2 p-2 bg-light rounded">
                                <small className="text-muted d-block mb-1">
                                  <i className="bi bi-person-check me-1"></i> Assigned Technician:
                                </small>
                                <p className="mb-0 fw-bold text-primary">{repair.technicianName}</p>
                                {repair.technicianId && (
                                  <small className="text-muted">📧 {repair.technicianId}</small>
                                )}
                              </div>
                            )}
                            
                            {/* Payment Section */}
                            <div className="mt-3 pt-2 border-top">
                              <div className="d-flex justify-content-between mb-2">
                                <small className="text-muted">Estimated Cost:</small>
                                <strong className="text-success fs-5">₹{calculateCost(repair.appliance, repair.issue)}</strong>
                              </div>
                              <div className="d-flex justify-content-between mb-2">
                                <small className="text-muted">Service Charge:</small>
                                <small className="text-muted">₹50</small>
                              </div>
                              <div className="d-flex justify-content-between mb-2">
                                <small className="text-muted">Total:</small>
                                <strong className="text-success">₹{calculateCost(repair.appliance, repair.issue) + 50}</strong>
                              </div>
                              <div className="d-flex justify-content-between align-items-center mt-2">
                                <small className="text-muted">Payment Status:</small>
                                {getPaymentStatusBadge(repair.paymentStatus || 'pending')}
                              </div>
                              {repair.paymentStatus === 'pending' && (
                                <Button variant="success" size="sm" className="w-100 mt-3">
                                  <i className="bi bi-credit-card me-2"></i>
                                  Pay Now ₹{calculateCost(repair.appliance, repair.issue) + 50}
                                </Button>
                              )}
                            </div>
                            
                            <small className="text-muted d-block mt-3">
                              <i className="bi bi-calendar me-1"></i>
                              Booked: {new Date(repair.createdAt).toLocaleDateString()}
                            </small>
                          </Card.Body>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Completed Services Section */}
        <Row className="mb-4">
          <Col>
            <Card className="shadow-sm">
              <Card.Header className="bg-white">
                <h5 className="mb-0 fw-bold">✅ Completed Services ({completedRepairs.length})</h5>
              </Card.Header>
              <Card.Body>
                {completedRepairs.length === 0 ? (
                  <div className="text-center py-4">
                    <i className="bi bi-check-circle display-1 text-muted mb-3"></i>
                    <p className="text-muted">No completed services yet</p>
                  </div>
                ) : (
                  <Row className="g-4">
                    {completedRepairs.map((repair) => (
                      <Col key={repair._id} md={6} lg={4}>
                        <Card className="h-100 shadow-sm border-success">
                          <Card.Body>
                            <Badge bg="success" className="mb-3">✅ Completed</Badge>
                            <h6 className="fw-bold mb-2">{repair.appliance}</h6>
                            <p className="text-muted small mb-2">{repair.issue}</p>
                            
                            <div className="mb-2">
                              <small className="text-muted">👨‍🔧 Technician:</small>
                              <p className="mb-0 fw-bold text-primary">{repair.technicianName}</p>
                            </div>
                            
                            <div className="mt-2 pt-2 border-top">
                              <div className="d-flex justify-content-between">
                                <small className="text-muted">Total Paid:</small>
                                <strong className="text-success">₹{calculateCost(repair.appliance, repair.issue) + 50}</strong>
                              </div>
                              <div className="d-flex justify-content-between">
                                <small className="text-muted">Completed on:</small>
                                <small>{new Date(repair.completedAt || repair.createdAt).toLocaleDateString()}</small>
                              </div>
                            </div>
                            
                            {pendingFeedbacks.some(p => p.id === repair._id) && (
                              <Button 
                                variant="primary" 
                                size="sm" 
                                className="w-100 mt-3"
                                onClick={() => {
                                  setSelectedRepair({
                                    ...repair,
                                    _id: repair._id
                                  });
                                  setShowFeedbackModal(true);
                                }}
                              >
                                <i className="bi bi-star-fill me-2"></i>
                                Rate & Feedback
                              </Button>
                            )}
                          </Card.Body>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* Cancel Repair Modal */}
      <Modal show={showCancelModal} onHide={() => { setShowCancelModal(false); setCancellationReason(''); setError(''); }}>
        <Modal.Header closeButton>
          <Modal.Title>Cancel Service Request</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="danger">
            <strong>⚠️ Warning:</strong> This action cannot be undone.
          </Alert>
          
          <p><strong>Appliance:</strong> {selectedRepair?.appliance}</p>
          <p><strong>Issue:</strong> {selectedRepair?.issue}</p>
          {selectedRepair?.technicianName && selectedRepair?.technicianName !== 'Not Assigned' && (
            <p><strong>Assigned Technician:</strong> {selectedRepair?.technicianName}</p>
          )}
          <p><strong>Estimated Refund:</strong> <span className="text-success">₹{calculateCost(selectedRepair?.appliance, selectedRepair?.issue) + 50}</span></p>
          
          <Form.Group className="mt-3">
            <Form.Label>Cancellation Reason *</Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              placeholder="Please explain why you want to cancel this service..."
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
              required
            />
            <Form.Text className="text-muted">
              This reason will be shared with the service provider
            </Form.Text>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => { setShowCancelModal(false); setCancellationReason(''); }}>
            Keep Service
          </Button>
          <Button variant="danger" onClick={handleCancelRepair} disabled={submitting}>
            {submitting ? <Spinner animation="border" size="sm" /> : 'Confirm Cancellation'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Feedback Modal */}
      <Modal show={showFeedbackModal} onHide={() => setShowFeedbackModal(false)} size="lg">
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title>📝 Share Your Feedback</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedRepair && (
            <>
              <Alert variant="info">
                <strong>Service Details:</strong><br />
                Appliance: {selectedRepair.appliance}<br />
                Issue: {selectedRepair.issue}<br />
                Technician: {selectedRepair.technicianName}
              </Alert>

              <Form onSubmit={handleSubmitFeedback}>
                <Form.Group className="mb-4">
                  <Form.Label>How would you rate the service?</Form.Label>
                  <div className="d-flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <FaStar
                        key={star}
                        size={30}
                        style={{ cursor: 'pointer' }}
                        color={(hoverRating || rating) >= star ? '#ffc107' : '#e4e5e9'}
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                      />
                    ))}
                  </div>
                  <Form.Text className="text-muted">
                    Click on stars to rate (1 = Poor, 5 = Excellent)
                  </Form.Text>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Your Feedback *</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={5}
                    required
                    placeholder="Please share your experience with the technician..."
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                  />
                </Form.Group>

                {error && <Alert variant="danger">{error}</Alert>}

                <div className="d-flex justify-content-end gap-2">
                  <Button variant="secondary" onClick={() => setShowFeedbackModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" disabled={submitting}>
                    {submitting ? <Spinner animation="border" size="sm" /> : 'Submit Feedback'}
                  </Button>
                </div>
              </Form>
            </>
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
}

export default HomePage2;