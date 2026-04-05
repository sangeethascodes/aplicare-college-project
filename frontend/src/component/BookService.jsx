import React, { useState } from 'react';
import {
  Container, Row, Col, Card, Form, Button, Alert, Spinner, Modal, Badge
} from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { 
  FaTools, FaSnowflake, FaTv, FaMicrophone, FaWater, 
  FaCheckCircle, FaWind, FaPlug, FaThermometerHalf 
} from 'react-icons/fa';

function BookService() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  
  const [formData, setFormData] = useState({
    appliance: '',
    issue: '',
    address: '',
    priority: 'medium',
    preferredDate: '',
    preferredTime: ''
  });

  const [step, setStep] = useState(1);

  // Appliance options with icons and base prices
  const appliances = [
    { id: 'AC', name: 'Air Conditioner', icon: <FaWind size={40} />, basePrice: 500, description: 'Cooling issues, gas refill, maintenance' },
    { id: 'Refrigerator', name: 'Refrigerator', icon: <FaSnowflake size={40} />, basePrice: 600, description: 'Cooling problems, water leakage, noise issues' },
    { id: 'Washing Machine', name: 'Washing Machine', icon: <FaWater size={40} />, basePrice: 400, description: 'Drum issues, water leakage, not spinning' },
    { id: 'TV', name: 'Television', icon: <FaTv size={40} />, basePrice: 300, description: 'Display problems, sound issues, power problems' },
    { id: 'Microwave', name: 'Microwave', icon: <FaMicrophone size={40} />, basePrice: 200, description: 'Heating issues, turntable problems' },
    { id: 'General', name: 'Other Appliances', icon: <FaPlug size={40} />, basePrice: 250, description: 'Mixer, grinder, water heater, etc.' }
  ];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const calculateTotalCost = () => {
    const selectedAppliance = appliances.find(a => a.id === formData.appliance);
    const baseCost = selectedAppliance ? selectedAppliance.basePrice : 250;
    const complexityFactor = formData.issue && formData.issue.length > 100 ? 1.5 : 1;
    const serviceCharge = 50;
    return Math.round((baseCost * complexityFactor) + serviceCharge);
  };

  const handleNext = () => {
    if (step === 1 && !formData.appliance) {
      setError('Please select an appliance');
      return;
    }
    setError('');
    setStep(step + 1);
  };

  const handleBack = () => {
    setStep(step - 1);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.issue || !formData.address) {
      setError('Please fill in all required fields');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const userData = JSON.parse(localStorage.getItem('user'));
      if (!userData) {
        navigate('/');
        return;
      }
      
      const repairData = {
        userId: userData.id,
        customerName: userData.fullName,
        customerPhone: userData.phone,
        customerEmail: userData.email,
        appliance: formData.appliance,
        issue: formData.issue,
        address: formData.address,
        priority: formData.priority,
        preferredDate: formData.preferredDate,
        preferredTime: formData.preferredTime,
        status: 'pending',
        paymentStatus: 'pending'
      };
      
      const response = await fetch('http://localhost:5000/api/repairs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(repairData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess('✅ Service request booked successfully!');
        setShowConfirmModal(true);
        setTimeout(() => {
          navigate('/home');
        }, 3000);
      } else {
        setError(data.error || 'Failed to book service');
      }
    } catch (err) {
      console.error('Booking error:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority) => {
    const colors = {
      high: 'danger',
      medium: 'warning',
      low: 'success'
    };
    return colors[priority];
  };

  return (
    <div className="bg-light min-vh-100 py-4">
      <Container>
        {/* Header */}
        <Row className="mb-4">
          <Col>
            <h2 className="fw-bold text-dark mb-1">📝 Book Service Request</h2>
            <p className="text-muted">Fill in the details to schedule a repair service</p>
          </Col>
          <Col className="text-end">
            <Button variant="outline-secondary" onClick={() => navigate('/home')}>
              ← Back to Dashboard
            </Button>
          </Col>
        </Row>

        {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
        {success && <Alert variant="success" onClose={() => setSuccess('')} dismissible>{success}</Alert>}

        {/* Progress Steps */}
        <Row className="mb-4">
          <Col>
            <div className="d-flex justify-content-between">
              {[1, 2, 3].map((s) => (
                <div key={s} className="text-center flex-grow-1">
                  <div className={`rounded-circle bg-${step >= s ? 'primary' : 'secondary'} text-white d-inline-flex justify-content-center align-items-center mb-2`} 
                       style={{ width: '40px', height: '40px' }}>
                    {step > s ? <FaCheckCircle /> : s}
                  </div>
                  <div className="small">
                    {s === 1 ? 'Select Appliance' : s === 2 ? 'Service Details' : 'Confirm & Pay'}
                  </div>
                </div>
              ))}
            </div>
          </Col>
        </Row>

        {/* Step 1: Select Appliance */}
        {step === 1 && (
          <Row>
            <Col>
              <Card className="shadow-sm">
                <Card.Body>
                  <h5 className="mb-4">Choose Appliance Type</h5>
                  <Row className="g-4">
                    {appliances.map((appliance) => (
                      <Col key={appliance.id} md={6} lg={4}>
                        <Card 
                          className={`h-100 cursor-pointer ${formData.appliance === appliance.id ? 'border-primary shadow' : ''}`}
                          style={{ cursor: 'pointer', transition: 'all 0.3s' }}
                          onClick={() => setFormData({ ...formData, appliance: appliance.id })}
                        >
                          <Card.Body className="text-center">
                            <div className="mb-3 text-primary">{appliance.icon}</div>
                            <h6 className="fw-bold mb-2">{appliance.name}</h6>
                            <p className="text-muted small mb-2">{appliance.description}</p>
                            <Badge bg="success" className="mt-2">From ₹{appliance.basePrice}</Badge>
                            {formData.appliance === appliance.id && (
                              <div className="mt-2">
                                <Badge bg="primary">✓ Selected</Badge>
                              </div>
                            )}
                          </Card.Body>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                  <div className="text-end mt-4">
                    <Button variant="primary" onClick={handleNext}>
                      Next: Service Details →
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}

        {/* Step 2: Service Details */}
        {step === 2 && (
          <Row>
            <Col>
              <Card className="shadow-sm">
                <Card.Body>
                  <h5 className="mb-4">Service Details</h5>
                  <Form>
                    <Form.Group className="mb-3">
                      <Form.Label>Selected Appliance <span className="text-danger">*</span></Form.Label>
                      <Form.Control 
                        type="text" 
                        value={appliances.find(a => a.id === formData.appliance)?.name || ''}
                        disabled
                        className="bg-light"
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Describe the Issue <span className="text-danger">*</span></Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={4}
                        name="issue"
                        placeholder="Please describe the problem in detail..."
                        value={formData.issue}
                        onChange={handleChange}
                        required
                      />
                      <Form.Text className="text-muted">
                        Be specific about the issue for better service
                      </Form.Text>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Service Address <span className="text-danger">*</span></Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={2}
                        name="address"
                        placeholder="Enter your complete address"
                        value={formData.address}
                        onChange={handleChange}
                        required
                      />
                    </Form.Group>

                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Preferred Date</Form.Label>
                          <Form.Control
                            type="date"
                            name="preferredDate"
                            value={formData.preferredDate}
                            onChange={handleChange}
                            min={new Date().toISOString().split('T')[0]}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Preferred Time</Form.Label>
                          <Form.Select
                            name="preferredTime"
                            value={formData.preferredTime}
                            onChange={handleChange}
                          >
                            <option value="">Select time slot</option>
                            <option value="9AM-12PM">9:00 AM - 12:00 PM</option>
                            <option value="12PM-3PM">12:00 PM - 3:00 PM</option>
                            <option value="3PM-6PM">3:00 PM - 6:00 PM</option>
                            <option value="6PM-9PM">6:00 PM - 9:00 PM</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                    </Row>

                    <Form.Group className="mb-3">
                      <Form.Label>Priority Level</Form.Label>
                      <div className="d-flex gap-3">
                        {['high', 'medium', 'low'].map((priority) => (
                          <Form.Check
                            key={priority}
                            type="radio"
                            label={priority.charAt(0).toUpperCase() + priority.slice(1)}
                            name="priority"
                            value={priority}
                            checked={formData.priority === priority}
                            onChange={handleChange}
                            inline
                          />
                        ))}
                      </div>
                    </Form.Group>

                    <div className="d-flex justify-content-between mt-4">
                      <Button variant="secondary" onClick={handleBack}>
                        ← Back
                      </Button>
                      <Button variant="primary" onClick={handleNext}>
                        Next: Review & Confirm →
                      </Button>
                    </div>
                  </Form>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}

        {/* Step 3: Confirm & Pay */}
        {step === 3 && (
          <Row>
            <Col>
              <Card className="shadow-sm">
                <Card.Body>
                  <h5 className="mb-4">Review Your Service Request</h5>
                  
                  <Row>
                    <Col md={6}>
                      <Card className="mb-3">
                        <Card.Header className="bg-primary text-white">
                          <strong>Service Details</strong>
                        </Card.Header>
                        <Card.Body>
                          <div className="mb-2">
                            <strong>Appliance:</strong> {appliances.find(a => a.id === formData.appliance)?.name}
                          </div>
                          <div className="mb-2">
                            <strong>Issue:</strong><br />
                            <span className="text-muted">{formData.issue}</span>
                          </div>
                          <div className="mb-2">
                            <strong>Address:</strong><br />
                            <span className="text-muted">{formData.address}</span>
                          </div>
                          <div className="mb-2">
                            <strong>Priority:</strong>{' '}
                            <Badge bg={getPriorityColor(formData.priority)}>
                              {formData.priority.toUpperCase()}
                            </Badge>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>

                    <Col md={6}>
                      <Card className="mb-3">
                        <Card.Header className="bg-success text-white">
                          <strong>Payment Summary</strong>
                        </Card.Header>
                        <Card.Body>
                          <div className="d-flex justify-content-between mb-2">
                            <span>Service Charge:</span>
                            <strong>₹{appliances.find(a => a.id === formData.appliance)?.basePrice || 250}</strong>
                          </div>
                          <div className="d-flex justify-content-between mb-2">
                            <span>Service Fee:</span>
                            <strong>₹50</strong>
                          </div>
                          <div className="d-flex justify-content-between mb-2">
                            <span>Tax (GST):</span>
                            <strong>₹0</strong>
                          </div>
                          <hr />
                          <div className="d-flex justify-content-between mb-2">
                            <strong>Total Amount:</strong>
                            <strong className="text-success fs-5">₹{calculateTotalCost()}</strong>
                          </div>
                          <small className="text-muted">
                            * Payment will be collected after service completion
                          </small>
                        </Card.Body>
                      </Card>

                      <Card className="mb-3">
                        <Card.Header className="bg-info text-white">
                          <strong>Schedule</strong>
                        </Card.Header>
                        <Card.Body>
                          <div className="mb-2">
                            <strong>Preferred Date:</strong> {formData.preferredDate || 'As soon as possible'}
                          </div>
                          <div className="mb-2">
                            <strong>Preferred Time:</strong> {formData.preferredTime || 'Any time'}
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>

                  <Alert variant="info">
                    <i className="bi bi-info-circle me-2"></i>
                    Our technician will contact you within 24 hours to confirm the appointment.
                  </Alert>

                  <div className="d-flex justify-content-between mt-4">
                    <Button variant="secondary" onClick={handleBack}>
                      ← Edit Details
                    </Button>
                    <Button variant="success" onClick={handleSubmit} disabled={loading}>
                      {loading ? <Spinner animation="border" size="sm" /> : '✓ Confirm & Book Service'}
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}

        {/* Success Modal */}
        <Modal show={showConfirmModal} onHide={() => setShowConfirmModal(false)}>
          <Modal.Header closeButton className="bg-success text-white">
            <Modal.Title>Booking Confirmed!</Modal.Title>
          </Modal.Header>
          <Modal.Body className="text-center py-4">
            <FaCheckCircle size={60} className="text-success mb-3" />
            <h5>Your service request has been booked successfully!</h5>
            <p className="text-muted">We'll notify you once a technician is assigned.</p>
            <p className="small text-muted">Redirecting to dashboard...</p>
          </Modal.Body>
        </Modal>
      </Container>

      <style jsx>{`
        .cursor-pointer {
          cursor: pointer;
        }
        .cursor-pointer:hover {
          transform: translateY(-5px);
          box-shadow: 0 0.5rem 1rem rgba(0,0,0,.15) !important;
        }
      `}</style>
    </div>
  );
}

export default BookService;