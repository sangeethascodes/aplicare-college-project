import { useState } from 'react';
import { Container, Form, Button, Alert, Card } from 'react-bootstrap';
import { useNavigate, Link } from 'react-router-dom';
import { apiUrl } from '../api';

function Login() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const res = await fetch(apiUrl('/api/auth/signin'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      
      if (data.success) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('userRole', data.user.role);
        navigate('/');
      } else {
        setMessage(data.error);
      }
    } catch (e) {
      setMessage('Network error');
    }
    setLoading(false);
  };

  return (
    <Container className="min-vh-100 d-flex align-items-center justify-content-center py-5">
      <Card style={{ maxWidth: '450px', width: '100%' }} className="shadow-lg">
        <Card.Body className="p-5">
          <h2 className="text-center mb-4">Login</h2>
          {message && <Alert variant="danger">{message}</Alert>}
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required />
            </Form.Group>
            <Form.Group className="mb-4">
              <Form.Label>Password</Form.Label>
              <Form.Control type="password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} required />
            </Form.Group>
            <Button type="submit" className="w-100 mb-3" disabled={loading}>Login</Button>
            <p className="text-center">
              No account? <Link to="/signup">Sign up here</Link>
            </p>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default Login;
