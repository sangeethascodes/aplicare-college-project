import React, { useState } from 'react';
import {
  Container, Row, Col, Card, Form, Button, Alert, Spinner, Tab, Nav
} from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { FaUserPlus, FaSignInAlt, FaEnvelope, FaLock, FaPhone, FaUser } from 'react-icons/fa';
import { apiUrl } from '../api';

function CustomerAuth() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('signin');

  // Sign In State
  const [signInData, setSignInData] = useState({
    email: '',
    password: ''
  });

  // Sign Up State
  const [signUpData, setSignUpData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });

  const handleSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(apiUrl('/api/auth/signin'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: signInData.email,
          password: signInData.password
        })
      });
      
      const data = await response.json();
      
      if (data.success && data.user.role === 'user') {
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
        
        alert('✅ Login successful! Redirecting to dashboard...');
        navigate('/home');
      } else {
        setError(data.error || 'Invalid credentials or not a customer account');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    
    // Validation
    if (signUpData.password !== signUpData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }
    
    if (signUpData.password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }
    
    try {
      const response = await fetch(apiUrl('/api/auth/register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: signUpData.fullName,
          email: signUpData.email,
          phone: signUpData.phone,
          password: signUpData.password,
          role: 'user'
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess('✅ Account created successfully! Please sign in.');
        setSignUpData({
          fullName: '',
          email: '',
          phone: '',
          password: '',
          confirmPassword: ''
        });
        setActiveTab('signin');
      } else {
        setError(data.error || 'Registration failed');
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
          <Col md={8} lg={6}>
            <Card className="shadow-lg border-0">
              <Card.Header className="bg-white border-0 text-center pt-4">
                <h2 className="fw-bold text-primary mb-2">👤 Customer Portal</h2>
                <p className="text-muted">Book and manage your home appliance services</p>
              </Card.Header>
              <Card.Body className="p-4">
                <Tab.Container activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
                  <Nav variant="pills" className="mb-4 justify-content-center">
                    <Nav.Item>
                      <Nav.Link eventKey="signin" className="mx-2">
                        <FaSignInAlt className="me-2" /> Sign In
                      </Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                      <Nav.Link eventKey="signup" className="mx-2">
                        <FaUserPlus className="me-2" /> Sign Up
                      </Nav.Link>
                    </Nav.Item>
                  </Nav>
                  
                  <Tab.Content>
                    {/* Sign In Tab */}
                    <Tab.Pane eventKey="signin">
                      <Form onSubmit={handleSignIn}>
                        <Form.Group className="mb-3">
                          <Form.Label>Email Address</Form.Label>
                          <div className="position-relative">
                            <FaEnvelope className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" />
                            <Form.Control
                              type="email"
                              placeholder="Enter your email"
                              className="ps-5 py-2"
                              value={signInData.email}
                              onChange={(e) => setSignInData({...signInData, email: e.target.value})}
                              required
                            />
                          </div>
                        </Form.Group>
                        
                        <Form.Group className="mb-4">
                          <Form.Label>Password</Form.Label>
                          <div className="position-relative">
                            <FaLock className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" />
                            <Form.Control
                              type="password"
                              placeholder="Enter your password"
                              className="ps-5 py-2"
                              value={signInData.password}
                              onChange={(e) => setSignInData({...signInData, password: e.target.value})}
                              required
                            />
                          </div>
                        </Form.Group>
                        
                        {error && <Alert variant="danger" className="mb-3">{error}</Alert>}
                        
                        <Button type="submit" variant="primary" className="w-100 py-2" disabled={loading}>
                          {loading ? <Spinner animation="border" size="sm" /> : 'Sign In'}
                        </Button>
                      </Form>
                    </Tab.Pane>
                    
                    {/* Sign Up Tab */}
                    <Tab.Pane eventKey="signup">
                      <Form onSubmit={handleSignUp}>
                        <Form.Group className="mb-3">
                          <Form.Label>Full Name</Form.Label>
                          <div className="position-relative">
                            <FaUser className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" />
                            <Form.Control
                              type="text"
                              placeholder="Enter your full name"
                              className="ps-5 py-2"
                              value={signUpData.fullName}
                              onChange={(e) => setSignUpData({...signUpData, fullName: e.target.value})}
                              required
                            />
                          </div>
                        </Form.Group>
                        
                        <Form.Group className="mb-3">
                          <Form.Label>Email Address</Form.Label>
                          <div className="position-relative">
                            <FaEnvelope className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" />
                            <Form.Control
                              type="email"
                              placeholder="Enter your email"
                              className="ps-5 py-2"
                              value={signUpData.email}
                              onChange={(e) => setSignUpData({...signUpData, email: e.target.value})}
                              required
                            />
                          </div>
                        </Form.Group>
                        
                        <Form.Group className="mb-3">
                          <Form.Label>Phone Number</Form.Label>
                          <div className="position-relative">
                            <FaPhone className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" />
                            <Form.Control
                              type="tel"
                              placeholder="Enter your phone number"
                              className="ps-5 py-2"
                              value={signUpData.phone}
                              onChange={(e) => setSignUpData({...signUpData, phone: e.target.value})}
                              required
                            />
                          </div>
                        </Form.Group>
                        
                        <Form.Group className="mb-3">
                          <Form.Label>Password</Form.Label>
                          <div className="position-relative">
                            <FaLock className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" />
                            <Form.Control
                              type="password"
                              placeholder="Create a password (min. 6 characters)"
                              className="ps-5 py-2"
                              value={signUpData.password}
                              onChange={(e) => setSignUpData({...signUpData, password: e.target.value})}
                              required
                            />
                          </div>
                        </Form.Group>
                        
                        <Form.Group className="mb-4">
                          <Form.Label>Confirm Password</Form.Label>
                          <div className="position-relative">
                            <FaLock className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" />
                            <Form.Control
                              type="password"
                              placeholder="Confirm your password"
                              className="ps-5 py-2"
                              value={signUpData.confirmPassword}
                              onChange={(e) => setSignUpData({...signUpData, confirmPassword: e.target.value})}
                              required
                            />
                          </div>
                        </Form.Group>
                        
                        {error && <Alert variant="danger" className="mb-3">{error}</Alert>}
                        {success && <Alert variant="success" className="mb-3">{success}</Alert>}
                        
                        <Button type="submit" variant="success" className="w-100 py-2" disabled={loading}>
                          {loading ? <Spinner animation="border" size="sm" /> : 'Create Account'}
                        </Button>
                      </Form>
                    </Tab.Pane>
                  </Tab.Content>
                </Tab.Container>
              </Card.Body>
              <Card.Footer className="bg-white border-0 text-center pb-4">
                <small className="text-muted">
                  By continuing, you agree to our Terms of Service and Privacy Policy
                </small>
              </Card.Footer>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
}

export default CustomerAuth;