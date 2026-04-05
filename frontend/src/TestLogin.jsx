import React, { useState } from 'react';
import { Container, Card, Form, Button, Alert } from 'react-bootstrap';

function TestLogin() {
  const [email, setEmail] = useState('ramesh@123gmail.com');
  const [password, setPassword] = useState('');
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      console.log('Attempting login with:', email);
      
      const res = await fetch('http://localhost:5000/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const data = await res.json();
      console.log('Login response:', data);
      setResponse(data);
      
      if (data.success) {
        localStorage.setItem('user', JSON.stringify(data.user));
        console.log('Stored user in localStorage:', data.user);
        alert('Login successful! Check console for stored data');
      }
    } catch (error) {
      console.error('Login error:', error);
      setResponse({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="mt-5" style={{ maxWidth: '500px' }}>
      <Card className="shadow">
        <Card.Body>
          <h4 className="text-center mb-4">Test Technician Login</h4>
          
          <Form onSubmit={handleLogin}>
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Password</Form.Label>
              <Form.Control
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter password"
              />
            </Form.Group>
            
            <Button type="submit" variant="primary" className="w-100" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </Button>
          </Form>
          
          {response && (
            <div className="mt-4">
              <h6>Response from server:</h6>
              <pre style={{ background: '#f5f5f5', padding: '10px', borderRadius: '5px', fontSize: '12px' }}>
                {JSON.stringify(response, null, 2)}
              </pre>
            </div>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
}

export default TestLogin;