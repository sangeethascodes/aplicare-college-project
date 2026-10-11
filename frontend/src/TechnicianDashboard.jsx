import React, { useState, useEffect } from 'react';
import {
  Container, Row, Col, Card, Table, Badge, Button, 
  Modal, Form, Alert, Spinner, Dropdown
} from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { apiUrl } from './api';

function TechnicianDashboard() {
  const navigate = useNavigate();
  const [repairs, setRepairs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedRepair, setSelectedRepair] = useState(null);
  const [status, setStatus] = useState('');
  const [cancellationReason, setCancellationReason] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [error, setError] = useState('');
  const [technicianEmail, setTechnicianEmail] = useState('');
  const [technicianName, setTechnicianName] = useState('');

  // useEffect(() => {
  //   fetchAssignedRepairs();
  //   const interval = setInterval(fetchAssignedRepairs, 30000);
  //   return () => clearInterval(interval);
  // }, []);
useEffect(() => {
  fetchAssignedRepairs();
  const interval = setInterval(fetchAssignedRepairs, 30000);
  return () => clearInterval(interval);
}, [fetchAssignedRepairs]);


  const fetchAssignedRepairs = async () => {
    try {
      setLoading(true);
      
      const userData = localStorage.getItem('user');
      if (!userData) {
        setError('Please login to continue');
        setTimeout(() => navigate('/'), 2000);
        return;
      }
      
      const user = JSON.parse(userData);
      if (user.role !== 'technician') {
        setError('Access denied');
        setTimeout(() => navigate('/'), 2000);
        return;
      }
      
      setTechnicianEmail(user.email);
      setTechnicianName(user.fullName || user.email);
      
      const response = await fetch(apiUrl(`/api/orderedRepairs/technician/${user.email}`));
      const data = await response.json();
      
      if (Array.isArray(data)) {
        setRepairs(data.map(repair => ({
          _id: repair._id,
          id: repair._id.slice(-6),
          customerName: repair.customerName,
          customerPhone: repair.customerPhone,
          customerEmail: repair.customerEmail,
          appliance: repair.appliance,
          issue: repair.issue,
          address: repair.address,
          status: repair.status || 'assigned',
          priority: repair.priority || 'medium',
          preferredDate: repair.preferredDate,
          preferredTime: repair.preferredTime,
          createdAt: new Date(repair.createdAt).toLocaleString(),
          cancellationReason: repair.cancellationReason || null,
          cancelledBy: repair.cancelledBy || null,
          cancelledAt: repair.cancelledAt ? new Date(repair.cancelledAt).toLocaleString() : null
        })));
        console.log(`✅ Loaded ${data.length} assigned jobs`);
      } else {
        setRepairs([]);
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Failed to load assigned jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    try {
      const updateData = { status };
      
      if (status === 'cancelled') {
        if (!cancellationReason.trim()) {
          alert('❌ Please provide a reason for cancellation');
          return;
        }
        updateData.cancellationReason = cancellationReason;
        updateData.cancelledBy = `${technicianName} (${technicianEmail})`;
        updateData.cancelledByRole = 'technician';
      }
      
      const response = await fetch(
        apiUrl(`/api/orderedRepairs/${selectedRepair._id}/status`),
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updateData)
        }
      );
      
      if (response.ok) {
        if (status === 'completed') {
          alert('✅ Job marked as COMPLETED!');
        } else if (status === 'cancelled') {
          alert(`❌ Job cancelled. Reason: ${cancellationReason}`);
        } else {
          alert(`✅ Job status updated to "${status}" successfully!`);
        }
        setShowModal(false);
        setCancellationReason('');
        fetchAssignedRepairs();
      } else {
        alert('❌ Status update failed');
      }
    } catch (err) {
      console.error('Update error:', err);
      alert('❌ Network error');
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: <Badge bg="warning">⏳ Pending</Badge>,
      assigned: <Badge bg="info">📋 Assigned</Badge>,
      'in-progress': <Badge bg="primary">🔧 In Progress</Badge>,
      completed: <Badge bg="success">✅ Completed</Badge>,
      cancelled: <Badge bg="danger">❌ Cancelled</Badge>
    };
    return badges[status] || <Badge bg="secondary">{status}</Badge>;
  };

  const getPriorityBadge = (priority) => {
    const badges = {
      high: <Badge bg="danger">High</Badge>,
      medium: <Badge bg="warning">Medium</Badge>,
      low: <Badge bg="success">Low</Badge>
    };
    return badges[priority] || <Badge bg="secondary">{priority}</Badge>;
  };

  const filteredRepairs = repairs.filter(repair => 
    filterStatus === 'all' || repair.status === filterStatus
  );

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100 bg-light">
        <Spinner animation="border" variant="primary" />
        <span className="ms-2">Loading your assigned jobs...</span>
      </div>
    );
  }

  return (
    <div className="bg-light min-vh-100 py-4">
      <Container fluid>
        {/* Header */}
        <Row className="mb-4">
          <Col>
            <h2 className="fw-bold text-dark mb-1">🔧 Technician Dashboard</h2>
            <p className="text-muted mb-0">
              Welcome back! You have {repairs.length} assigned job{repairs.length !== 1 ? 's' : ''}
            </p>
            {technicianEmail && (
              <small className="text-success">
                ✓ Logged in as: {technicianEmail}
              </small>
            )}
          </Col>
          <Col className="text-end">
            <Button variant="outline-danger me-2" onClick={handleLogout}>
              🚪 Logout
            </Button>
            <Button variant="primary" onClick={fetchAssignedRepairs}>
              🔄 Refresh
            </Button>
          </Col>
        </Row>

        {error && <Alert variant="danger" className="mb-4">{error}</Alert>}

        {/* Stats Cards */}
        <Row className="mb-4 g-3">
          <Col md={3}>
            <Card className="shadow-sm border-0">
              <Card.Body>
                <div className="d-flex align-items-center">
                  <div className="bg-info p-3 rounded-circle me-3">
                    <i className="bi bi-clock-history fs-4 text-white"></i>
                  </div>
                  <div>
                    <h5 className="fw-bold text-info mb-1">
                      {repairs.filter(r => r.status === 'assigned').length}
                    </h5>
                    <small className="text-muted">Assigned</small>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="shadow-sm border-0">
              <Card.Body>
                <div className="d-flex align-items-center">
                  <div className="bg-primary p-3 rounded-circle me-3">
                    <i className="bi bi-gear fs-4 text-white"></i>
                  </div>
                  <div>
                    <h5 className="fw-bold text-primary mb-1">
                      {repairs.filter(r => r.status === 'in-progress').length}
                    </h5>
                    <small className="text-muted">In Progress</small>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="shadow-sm border-0">
              <Card.Body>
                <div className="d-flex align-items-center">
                  <div className="bg-success p-3 rounded-circle me-3">
                    <i className="bi bi-check-circle fs-4 text-white"></i>
                  </div>
                  <div>
                    <h5 className="fw-bold text-success mb-1">
                      {repairs.filter(r => r.status === 'completed').length}
                    </h5>
                    <small className="text-muted">Completed</small>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="shadow-sm border-0">
              <Card.Body>
                <div className="d-flex align-items-center">
                  <div className="bg-danger p-3 rounded-circle me-3">
                    <i className="bi bi-x-circle fs-4 text-white"></i>
                  </div>
                  <div>
                    <h5 className="fw-bold text-danger mb-1">
                      {repairs.filter(r => r.status === 'cancelled').length}
                    </h5>
                    <small className="text-muted">Cancelled</small>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Filter */}
        <Row className="mb-4">
          <Col md={3} className="ms-auto">
            <Dropdown>
              <Dropdown.Toggle variant="outline-secondary" className="w-100">
                Filter: {filterStatus === 'all' ? 'All Jobs' : filterStatus}
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item onClick={() => setFilterStatus('all')}>All Jobs</Dropdown.Item>
                <Dropdown.Item onClick={() => setFilterStatus('assigned')}>Assigned</Dropdown.Item>
                <Dropdown.Item onClick={() => setFilterStatus('in-progress')}>In Progress</Dropdown.Item>
                <Dropdown.Item onClick={() => setFilterStatus('completed')}>Completed</Dropdown.Item>
                <Dropdown.Item onClick={() => setFilterStatus('cancelled')}>Cancelled</Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </Col>
        </Row>

        {/* Jobs Table */}
        <Row>
          <Col>
            <Card className="shadow-sm border-0">
              <Card.Header className="bg-white border-0 pb-0">
                <h5 className="mb-0 fw-bold">📋 Your Assigned Jobs ({filteredRepairs.length})</h5>
              </Card.Header>
              <Card.Body className="p-0">
                <div className="table-responsive">
                  <Table hover responsive className="mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Job ID</th>
                        <th>Customer</th>
                        <th>Appliance</th>
                        <th>Issue</th>
                        <th>Preferred Schedule</th>
                        <th>Priority</th>
                        <th>Status</th>
                        <th>Address</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRepairs.map((repair) => (
                        <tr key={repair._id}>
                          <td>
                            <Badge bg="secondary">#{repair.id}</Badge>
                          </td>
                          <td>
                            <strong>{repair.customerName}</strong><br />
                            <small className="text-muted">{repair.customerPhone}</small>
                          </td>
                          <td>
                            <Badge bg="info">{repair.appliance}</Badge>
                          </td>
                          <td style={{ maxWidth: '200px' }}>
                            <div className="text-truncate" title={repair.issue}>
                              {repair.issue}
                            </div>
                          </td>
                          
                          {/* Preferred Schedule Column */}
                          <td style={{ minWidth: '150px' }}>
                            {repair.preferredDate ? (
                              <div>
                                <div className="mb-1">
                                  <i className="bi bi-calendar3 me-1 text-primary"></i>
                                  <strong>{new Date(repair.preferredDate).toLocaleDateString('en-IN', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric'
                                  })}</strong>
                                  {new Date(repair.preferredDate) - new Date() < 2 * 24 * 60 * 60 * 1000 && (
                                    <Badge bg="danger" className="ms-2" size="sm">Urgent</Badge>
                                  )}
                                </div>
                                {repair.preferredTime && (
                                  <div className="text-muted small">
                                    <i className="bi bi-clock me-1"></i>
                                    {repair.preferredTime}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted small">
                                <i className="bi bi-calendar-x me-1"></i>Not specified
                              </span>
                            )}
                          </td>
                          
                          <td>{getPriorityBadge(repair.priority)}</td>
                          <td>{getStatusBadge(repair.status)}</td>
                          <td style={{ maxWidth: '150px' }}>
                            <div className="text-truncate" title={repair.address}>
                              {repair.address}
                            </div>
                          </td>
                          <td>
                            {repair.status === 'assigned' && (
                              <Button 
                                size="sm" 
                                variant="success"
                                onClick={() => {
                                  setSelectedRepair(repair);
                                  setStatus('in-progress');
                                  setShowModal(true);
                                }}
                              >
                                Start Job
                              </Button>
                            )}
                            {repair.status === 'in-progress' && (
                              <>
                                <Button 
                                  size="sm" 
                                  variant="primary"
                                  onClick={() => {
                                    setSelectedRepair(repair);
                                    setStatus('completed');
                                    setShowModal(true);
                                  }}
                                  className="me-2"
                                >
                                  Complete
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="danger"
                                  onClick={() => {
                                    setSelectedRepair(repair);
                                    setStatus('cancelled');
                                    setShowModal(true);
                                  }}
                                >
                                  Cancel
                                </Button>
                              </>
                            )}
                            {repair.status === 'completed' && (
                              <Badge bg="success">✓ Done</Badge>
                            )}
                          </td>
                        </tr>
                      ))}
                      {filteredRepairs.length === 0 && (
                        <tr>
                          <td colSpan="9" className="text-center py-5">
                            <i className="bi bi-inbox display-1 text-muted mb-3"></i>
                            <h5 className="text-muted">No jobs assigned yet</h5>
                            <p className="text-muted">
                              Admin will assign jobs to you. Check back later!
                            </p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </Table>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* Update Status Modal */}
      <Modal show={showModal} onHide={() => { setShowModal(false); setCancellationReason(''); }} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {status === 'cancelled' ? 'Cancel Job' : status === 'completed' ? 'Complete Job' : 'Start Job'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="info">
            <strong>Job Details:</strong><br />
            Customer: {selectedRepair?.customerName}<br />
            Appliance: {selectedRepair?.appliance}<br />
            Issue: {selectedRepair?.issue}
            {selectedRepair?.preferredDate && (
              <>
                <br /><strong>Preferred Date:</strong> {new Date(selectedRepair.preferredDate).toLocaleDateString()}
                {selectedRepair?.preferredTime && ` at ${selectedRepair.preferredTime}`}
              </>
            )}
          </Alert>
          
          {status === 'cancelled' && (
            <>
              <Form.Group className="mb-3">
                <Form.Label>Cancellation Reason *</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={4}
                  placeholder="Please explain why this job is being cancelled..."
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  required
                />
                <Form.Text className="text-muted">
                  This reason will be visible to the admin
                </Form.Text>
              </Form.Group>
              <Alert variant="danger">
                ⚠️ Warning: This action will cancel the job and cannot be undone.
              </Alert>
            </>
          )}
          
          {status === 'completed' && (
            <Alert variant="success">
              ✅ Marking as completed will notify the customer to provide feedback.
            </Alert>
          )}
          
          {status === 'in-progress' && (
            <Alert variant="primary">
              🔧 You're about to start working on this job.
            </Alert>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => { setShowModal(false); setCancellationReason(''); }}>
            Cancel
          </Button>
          <Button 
            variant={status === 'cancelled' ? 'danger' : status === 'completed' ? 'success' : 'primary'} 
            onClick={handleStatusUpdate}
          >
            {status === 'cancelled' ? 'Confirm Cancellation' : status === 'completed' ? 'Mark as Completed' : 'Start Job'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default TechnicianDashboard;