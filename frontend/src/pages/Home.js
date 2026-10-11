import { useState } from 'react';
import { Container, Row, Col, Card, Button, Modal, Form, Alert } from 'react-bootstrap';
import { apiUrl } from '../api';

const services = [
  { id: 1, title: '🧊 Refrigerator', desc: 'Cooling issues, leaks, noise', img: 'https://images.unsplash.com/photo-1583288454700-3e2421b71573?w=400' },
  { id: 2, title: '💨 AC Service', desc: 'Not cooling, gas refill, cleaning', img: 'https://images.unsplash.com/photo-1596532824148-485f75fc6b40?w=400' },
  { id: 3, title: '🧺 Washing Machine', desc: 'Not spinning, leaks, error codes', img: 'https://images.unsplash.com/photo-1583382577048-5ce6f5fe8970?w=400' },
  { id: 4, title: '📺 TV Repair', desc: 'No sound, no picture, smart issues', img: 'https://images.unsplash.com/photo-1574236633795-ea5dc5a8ab74?w=400' },
];

function Home() {
  const [show, setShow] = useState(false);
  const [formData, setFormData] = useState({ appliance: '', issue: '', address: '', phone: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const bookService = async (service) => {
    setFormData({ ...formData, appliance: service.title });
    setShow(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const res = await fetch(apiUrl('/api/repairs'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      setMessage(data.message || data.error);
      if (data.success) setTimeout(() => setShow(false), 2000);
    } catch (e) {
      setMessage('Network error');
    }
    setLoading(false);
  };

  return (
    <>
      {/* Hero Carousel */}
      <div className="bg-primary text-white py-5 mb-5">
        <Container>
          <h1 className="display-4 fw-bold text-center mb-4">Professional Appliance Repair</h1>
          <p className="lead text-center">Fast • Reliable • Affordable • Same Day Service</p>
        </Container>
      </div>

      <Container>
        <h2 className="text-center mb-5">Our Services</h2>
        <Row>
          {services.map(service => (
            <Col md={6} lg={3} key={service.id} className="mb-4">
              <Card className="h-100 shadow-sm border-0" onClick={() => bookService(service)} style={{ cursor: 'pointer' }}>
                <Card.Img variant="top" src={service.img} style={{ height: '200px', objectFit: 'cover' }} />
                <Card.Body className="d-flex flex-column">
                  <Card.Title>{service.title}</Card.Title>
                  <Card.Text>{service.desc}</Card.Text>
                  <Button variant="primary" className="mt-auto w-100">Book Now</Button>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </Container>

      {/* Repair Modal */}
      <Modal show={show} onHide={() => setShow(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>Book {formData.appliance} Repair</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            {message && <Alert variant={message.includes('success') ? 'success' : 'danger'}>{message}</Alert>}
            <Form.Group className="mb-3">
              <Form.Label>Issue Description *</Form.Label>
              <Form.Control as="textarea" rows={3} required value={formData.issue} onChange={e => setFormData({ ...formData, issue: e.target.value })} />
            </Form.Group>
            <Row>
              <Form.Group as={Col} className="mb-3">
                <Form.Label>Phone *</Form.Label>
                <Form.Control required value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
              </Form.Group>
              <Form.Group as={Col} className="mb-3">
                <Form.Label>Service Address *</Form.Label>
                <Form.Control as="textarea" required value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
              </Form.Group>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShow(false)}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? 'Booking...' : 'Confirm Booking'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </>
  );
}

export default Home;
