import React from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaTools, FaUserShield } from 'react-icons/fa';

function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="bg-light min-vh-100 d-flex align-items-center">
      <Container>
        <div className="text-center mb-5">
          <h1 className="display-3 fw-bold text-primary">Applicare</h1>
          <p className="lead">Your trusted home appliance service partner</p>
        </div>
        
        <Row className="justify-content-center g-4">
          <Col md={4}>
            <Card className="text-center shadow-lg h-100 cursor-pointer" onClick={() => navigate('/customer')}>
              <Card.Body className="py-5">
                <FaUser size={60} className="text-primary mb-3" />
                <h3>Customer</h3>
                <p className="text-muted">Book services, track repairs, and provide feedback</p>
                <Button variant="primary">Login / Sign Up</Button>
              </Card.Body>
            </Card>
          </Col>
          
          <Col md={4}>
            <Card className="text-center shadow-lg h-100 cursor-pointer" onClick={() => navigate('/technician')}>
              <Card.Body className="py-5">
                <FaTools size={60} className="text-success mb-3" />
                <h3>Technician</h3>
                <p className="text-muted">View assigned jobs and update repair status</p>
                <Button variant="success">Technician Login</Button>
              </Card.Body>
            </Card>
          </Col>
          
          <Col md={4}>
            <Card className="text-center shadow-lg h-100 cursor-pointer" onClick={() => navigate('/admin')}>
              <Card.Body className="py-5">
                <FaUserShield size={60} className="text-danger mb-3" />
                <h3>Administrator</h3>
                <p className="text-muted">Manage technicians, repairs, and feedback</p>
                <Button variant="danger">Admin Login</Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
      
      <style jsx>{`
        .cursor-pointer {
          cursor: pointer;
          transition: transform 0.3s;
        }
        .cursor-pointer:hover {
          transform: translateY(-10px);
        }
      `}</style>
    </div>
  );
}

export default LandingPage;