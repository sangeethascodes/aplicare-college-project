import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Accordion from 'react-bootstrap/Accordion';
import Card from 'react-bootstrap/Card';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Container from 'react-bootstrap/Container';
import Alert from 'react-bootstrap/Alert';
import './LoginPage.css';

function LoginPage() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // All state at top
    const [customerData, setCustomerData] = useState({ email: '', password: '' });
    const [technicianData, setTechnicianData] = useState({ email: '', password: '' });
    const [adminData, setAdminData] = useState({ email: '', password: '' });
    const [registerData, setRegisterData] = useState({
        fullName: '',
        email: '',
        phone: '',
        password: '',
        role: 'user'
    });

    // 👈 UNIVERSAL LOGIN - Backend determines role
    const loginUser = async (email, password) => {
        setLoading(true);
        setError('');
        try {
            console.log('🔍 Login attempt for:', email);
            
            const response = await fetch('http://localhost:5000/api/auth/signin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();
            console.log('📡 Login response:', data);

                        // In your LoginPage.jsx, inside the loginUser function
            if (data.success) {
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
            localStorage.setItem('userFullName', data.user.fullName);

            console.log('✅ Login success:', data.user.role, '→', email);

            // 👈 ROLE BASED ROUTING
            if (data.user.role === 'user') {
                console.log('➡️ Redirecting CUSTOMER to /home');
                navigate('/home');  // This should point to UserHomePage
            } else if (data.user.role === 'technician') {
                console.log('➡️ Redirecting TECHNICIAN to /technician-dashboard');
                navigate('/technician-dashboard');
            } else if (data.user.role === 'admin') {
                console.log('➡️ Redirecting ADMIN to /admin-dashboard');
                navigate('/admin-dashboard');
            } else {
                setError(`Unknown role: ${data.user.role}`);
            }
            }
        } catch (err) {
            console.error('❌ Login error:', err);
            setError('Network error. Backend must be running on localhost:5000');
        } finally {
            setLoading(false);
        }
    };

    // 👈 Handlers for each role
    const handleCustomerLogin = (e) => {
        e.preventDefault();
        console.log('👤 Customer login attempt with:', customerData.email);
        loginUser(customerData.email, customerData.password);
    };

    const handleTechnicianLogin = (e) => {
        e.preventDefault();
        console.log('🔧 Technician login attempt with:', technicianData.email);
        loginUser(technicianData.email, technicianData.password);
    };

    const handleAdminLogin = (e) => {
        e.preventDefault();
        console.log('👨‍💼 Admin login attempt with:', adminData.email);
        loginUser(adminData.email, adminData.password);
    };

    // 👈 REGISTER FUNCTION
    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            console.log('📝 Registration attempt for:', registerData.email);
            
            const response = await fetch('http://localhost:5000/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(registerData)
            });
            
            const data = await response.json();
            console.log('📡 Registration response:', data);
            
            if (data.success) {
                console.log('✅ Registration successful! Auto-logging in...');
                // Auto-login after register
                loginUser(registerData.email, registerData.password);
            } else {
                setError(data.error || 'Registration failed');
            }
        } catch (err) {
            console.error('❌ Registration error:', err);
            setError('Network error. Backend must be running on localhost:5000');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            {/* Background & Header */}
            <div className="bg-image"></div>
            <div className="header-content">
                <h1 className="app-header">Applicare</h1>
                <p className="app-subtitle">Your Assistant for home appliance service</p>
            </div>

            {error && (
                <Alert variant="danger" className="error-alert">
                    {error}
                </Alert>
            )}

            {/* 👈 3 CLEARLY LABELED Login Forms */}
            <Container className="mt-4">
                <Row className="justify-content-center">
                    <Col md={10}>
                        <Accordion defaultActiveKey="0" className="shadow-lg">
                            {/* CUSTOMER LOGIN */}
                            <Accordion.Item eventKey="0">
                                <Accordion.Header>
                                    <div className="w-100 text-center">
                                        <span className="me-2">👤</span>
                                        <strong>Customer Login</strong>
                                    </div>
                                </Accordion.Header>
                                <Accordion.Body>
                                    <Form onSubmit={handleCustomerLogin}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Email</Form.Label>
                                            <Form.Control 
                                                type="email" 
                                                placeholder="customer@test.com"
                                                value={customerData.email}
                                                onChange={(e) => setCustomerData({...customerData, email: e.target.value})}
                                                required
                                            />
                                            <Form.Text className="text-muted">
                                                Use: customer@test.com
                                            </Form.Text>
                                        </Form.Group>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Password</Form.Label>
                                            <Form.Control 
                                                type="password" 
                                                placeholder="123456"
                                                value={customerData.password}
                                                onChange={(e) => setCustomerData({...customerData, password: e.target.value})}
                                                required
                                            />
                                            <Form.Text className="text-muted">
                                                Password: 123456
                                            </Form.Text>
                                        </Form.Group>
                                        <Button className="w-100" type="submit" disabled={loading}>
                                            {loading ? 'Logging in...' : '👤 Customer Login'}
                                        </Button>
                                    </Form>
                                </Accordion.Body>
                            </Accordion.Item>

                            {/* TECHNICIAN LOGIN */}
                            <Accordion.Item eventKey="1">
                                <Accordion.Header>
                                    <div className="w-100 text-center">
                                        <span className="me-2">🔧</span>
                                        <strong>Technician Login</strong>
                                    </div>
                                </Accordion.Header>
                                <Accordion.Body>
                                    <Form onSubmit={handleTechnicianLogin}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Email</Form.Label>
                                            <Form.Control 
                                                type="email" 
                                                placeholder="ramesh@123gmail.com"
                                                value={technicianData.email}
                                                onChange={(e) => setTechnicianData({...technicianData, email: e.target.value})}
                                                required
                                            />
                                            <Form.Text className="text-muted">
                                                Use: ramesh@123gmail.com
                                            </Form.Text>
                                        </Form.Group>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Password</Form.Label>
                                            <Form.Control 
                                                type="password" 
                                                placeholder="123456"
                                                value={technicianData.password}
                                                onChange={(e) => setTechnicianData({...technicianData, password: e.target.value})}
                                                required
                                            />
                                            <Form.Text className="text-muted">
                                                Password: 123456
                                            </Form.Text>
                                        </Form.Group>
                                        <Button className="w-100" type="submit" disabled={loading}>
                                            {loading ? 'Logging in...' : '🔧 Technician Login'}
                                        </Button>
                                    </Form>
                                </Accordion.Body>
                            </Accordion.Item>

                            {/* ADMIN LOGIN */}
                            <Accordion.Item eventKey="2">
                                <Accordion.Header>
                                    <div className="w-100 text-center">
                                        <span className="me-2">👨‍💼</span>
                                        <strong>Admin Login</strong>
                                    </div>
                                </Accordion.Header>
                                <Accordion.Body>
                                    <Form onSubmit={handleAdminLogin}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Email</Form.Label>
                                            <Form.Control 
                                                type="email" 
                                                placeholder="admin@test.com"
                                                value={adminData.email}
                                                onChange={(e) => setAdminData({...adminData, email: e.target.value})}
                                                required
                                            />
                                            <Form.Text className="text-muted">
                                                Use: admin@test.com
                                            </Form.Text>
                                        </Form.Group>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Password</Form.Label>
                                            <Form.Control 
                                                type="password" 
                                                placeholder="123456"
                                                value={adminData.password}
                                                onChange={(e) => setAdminData({...adminData, password: e.target.value})}
                                                required
                                            />
                                            <Form.Text className="text-muted">
                                                Password: 123456
                                            </Form.Text>
                                        </Form.Group>
                                        <Button className="w-100" type="submit" disabled={loading}>
                                            {loading ? 'Logging in...' : '👨‍💼 Admin Login'}
                                        </Button>
                                    </Form>
                                </Accordion.Body>
                            </Accordion.Item>
                        </Accordion>
                    </Col>
                </Row>
            </Container>

            {/* REGISTER NEW USER */}
            <Container className="mt-5">
                <Card className="p-4 mx-auto shadow-lg" style={{ maxWidth: '600px' }}>
                    <Card.Body>
                        <h5 className="mb-4 text-center fw-bold">➕ New User Registration</h5>
                        <Form onSubmit={handleRegister}>
                            <Form.Group className="mb-3">
                                <Form.Label>Full Name *</Form.Label>
                                <Form.Control 
                                    required 
                                    placeholder="John Doe"
                                    value={registerData.fullName}
                                    onChange={(e) => setRegisterData({...registerData, fullName: e.target.value})}
                                />
                            </Form.Group>
                            <Row>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Email *</Form.Label>
                                        <Form.Control 
                                            type="email" 
                                            required 
                                            placeholder="your-email@example.com"
                                            value={registerData.email}
                                            onChange={(e) => setRegisterData({...registerData, email: e.target.value})}
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Phone</Form.Label>
                                        <Form.Control 
                                            type="tel" 
                                            placeholder="9876543210"
                                            value={registerData.phone}
                                            onChange={(e) => setRegisterData({...registerData, phone: e.target.value})}
                                        />
                                    </Form.Group>
                                </Col>
                            </Row>
                            <Form.Group className="mb-3">
                                <Form.Label>Password *</Form.Label>
                                <Form.Control 
                                    type="password" 
                                    required 
                                    placeholder="Minimum 6 characters"
                                    value={registerData.password}
                                    onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
                                />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>Role *</Form.Label>
                                <Form.Select 
                                    required 
                                    value={registerData.role}
                                    onChange={(e) => setRegisterData({...registerData, role: e.target.value})}
                                >
                                    <option value="user">👤 Customer</option>
                                    <option value="technician">🔧 Technician</option>
                                    <option value="admin">👨‍💼 Admin</option>
                                </Form.Select>
                            </Form.Group>
                            <Button className="w-100 btn-lg" type="submit" disabled={loading}>
                                {loading ? 'Creating Account...' : 'Create Account & Login'}
                            </Button>
                        </Form>
                    </Card.Body>
                </Card>
            </Container>
        </div>
    );
}

export default LoginPage;