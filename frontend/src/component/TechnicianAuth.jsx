import React, { useState } from 'react';
import {
  Container, Row, Col, Card, Form, Button, Alert, Spinner
} from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { FaSignInAlt, FaEnvelope, FaLock, FaTools } from 'react-icons/fa';
import { apiUrl } from '../api';

function TechnicianAuth() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(apiUrl('/api/auth/signin'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        })
      });
      
      const data = await response.json();
      
      if (data.success && data.user.role === 'technician') {
        // Store user data
        const userData = {
          id: data.user.id,
          email: data.user.email,
          role: data.user.role,
          fullName: data.user.fullName,
          phone: data.user.phone
        };
        
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('token', data.token);
        localStorage.setItem('userRole', data.user.role);
        localStorage.setItem('userId', data.user.id);
        localStorage.setItem('userEmail', data.user.email);
        
        alert('✅ Welcome back, Technician!');
        navigate('/technician-dashboard');
      } else {
        setError(data.error || 'Invalid credentials or not a technician account');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-light min-vh-100 d-flex align-items-center py-5">
      <Container>
        <Row className="justify-content-center">
          <Col md={6} lg={5}>
            <Card className="shadow-lg border-0">
              <Card.Header className="bg-white border-0 text-center pt-4">
                <div className="mb-3">
                  <FaTools size={50} className="text-primary" />
                </div>
                <h2 className="fw-bold text-primary mb-2">🔧 Technician Portal</h2>
                <p className="text-muted">Access your assigned repairs and update status</p>
              </Card.Header>
              <Card.Body className="p-4">
                <Form onSubmit={handleLogin}>
                  <Form.Group className="mb-3">
                    <Form.Label>Email Address</Form.Label>
                    <div className="position-relative">
                      <FaEnvelope className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" />
                      <Form.Control
                        type="email"
                        placeholder="Enter your registered email"
                        className="ps-5 py-2"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        required
                      />
                    </div>
                    <Form.Text className="text-muted">
                      Example: ramesh@123gmail.com
                    </Form.Text>
                  </Form.Group>
                  
                  <Form.Group className="mb-4">
                    <Form.Label>Password</Form.Label>
                    <div className="position-relative">
                      <FaLock className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" />
                      <Form.Control
                        type="password"
                        placeholder="Enter your password"
                        className="ps-5 py-2"
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        required
                      />
                    </div>
                  </Form.Group>
                  
                  {error && <Alert variant="danger" className="mb-3">{error}</Alert>}
                  
                  <Button type="submit" variant="primary" className="w-100 py-2" disabled={loading}>
                    {loading ? <Spinner animation="border" size="sm" /> : <><FaSignInAlt className="me-2" /> Sign In</>}
                  </Button>
                </Form>
              </Card.Body>
              <Card.Footer className="bg-white border-0 text-center pb-4">
                <small className="text-muted">
                  Need help? Contact your administrator
                </small>
              </Card.Footer>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
}

export default TechnicianAuth;