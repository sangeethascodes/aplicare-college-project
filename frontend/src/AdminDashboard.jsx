
import React, { useState, useEffect } from 'react';
import {
  Container, Row, Col, Card, Table, Badge, Button, 
  Modal, Form, Alert, Spinner, Dropdown, InputGroup
} from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';



function AdminDashboard() {
  const navigate = useNavigate();
  const [repairs, setRepairs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingTechnicians, setLoadingTechnicians] = useState(false);
  const [error, setError] = useState('');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddTechnicianModal, setShowAddTechnicianModal] = useState(false);
  const [selectedRepair, setSelectedRepair] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [technicians, setTechnicians] = useState([]);
  const [newTechnician, setNewTechnician] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    specialization: '',
    status: 'available',
    location: '',
    experience: ''
  });

  useEffect(() => {
    fetchRepairs();
    fetchTechnicians();
  }, []);

  const fetchRepairs = async () => {
  try {
    setLoading(true);
    const response = await fetch('http://localhost:5000/api/orderedRepairs');
    const data = await response.json();
    
    if (data.success) {
      setRepairs(data.repairs.map(repair => ({
        id: repair._id,
        customerName: repair.customerName,
        customerPhone: repair.customerPhone,
        customerEmail: repair.customerEmail,
        appliance: repair.appliance,
        issue: repair.issue,
        address: repair.address,
        status: repair.status,
        priority: repair.priority,
        technicianId: repair.technicianId,
        technicianName: repair.technicianName || 'Not Assigned',
        // 👈 ADD THESE FIELDS
        preferredDate: repair.preferredDate,
        preferredTime: repair.preferredTime,
        cancellationReason: repair.cancellationReason || null,
        cancelledBy: repair.cancelledBy || null,
        cancelledAt: repair.cancelledAt || null,
        createdAt: new Date(repair.createdAt).toLocaleString()
      })));
    }
  } catch (err) {
    setError('Failed to load repairs. Check backend (localhost:5000)');
  } finally {
    setLoading(false);
  }
};

  const fetchTechnicians = async () => {
    try {
      setLoadingTechnicians(true);
      const response = await fetch('http://localhost:5000/api/technicians');
      const data = await response.json();
      
      if (data.success && data.technicians) {
        const formattedTechnicians = data.technicians.map(tech => ({
          id: tech._id,
          email: tech.email,
          name: tech.fullName,
          phone: tech.phone,
          status: tech.status || 'available',
          specialization: tech.specialization || [],
          location: tech.location || 'Not specified',
          experience: tech.experience || Math.floor(Math.random() * 10) + 1,
          rating: tech.rating || Math.floor(Math.random() * 5) + 1,
          joinedDate: tech.createdAt,
          role: tech.role
        }));
        setTechnicians(formattedTechnicians);
      } else {
        setTechnicians([]);
      }
    } catch (error) {
      console.error('Failed to fetch technicians:', error);
      setError('Failed to connect to technicians API');
      setTechnicians([]);
    } finally {
      setLoadingTechnicians(false);
    }
  };

  const addTechnician = async (e) => {
    e.preventDefault();
    
    if (!newTechnician.fullName || !newTechnician.email || !newTechnician.phone || !newTechnician.password) {
      alert('❌ Please fill in all required fields');
      return;
    }
    
    try {
      const specializationArray = newTechnician.specialization 
        ? newTechnician.specialization.split(',').map(s => s.trim())
        : [];
      
      const technicianData = {
        ...newTechnician,
        specialization: specializationArray
      };
      
      const response = await fetch('http://localhost:5000/api/technicians', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(technicianData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert('✅ Technician added successfully!');
        setShowAddTechnicianModal(false);
        setNewTechnician({
          fullName: '',
          email: '',
          phone: '',
          password: '',
          specialization: '',
          status: 'available',
          location: '',
          experience: ''
        });
        fetchTechnicians();
      } else {
        alert('❌ Failed to add technician: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error adding technician:', error);
      alert('❌ Failed to add technician');
    }
  };

  const assignTech = async (repairId, techEmail) => {
    if (!techEmail) return;
    
    try {
      const technician = technicians.find(t => t.email === techEmail);
      if (!technician) {
        alert('❌ Technician not found');
        return;
      }
      
      const response = await fetch(`http://localhost:5000/api/orderedRepairs/${repairId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: 'assigned', 
          technicianId: techEmail,
          technicianName: technician.name 
        })
      });
      
      const data = await response.json();
      if (data.success) {
        setRepairs(repairs.map(r => 
          r.id === repairId 
            ? { ...r, status: 'assigned', technicianId: techEmail, technicianName: technician.name }
            : r
        ));
        alert('✅ Tech assigned successfully!');
        fetchRepairs();
      } else {
        alert('❌ Failed to assign technician: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Assign error:', error);
      alert('❌ Failed to assign technician');
    }
  };

  const deleteRepair = async (repairId) => {
    if (!window.confirm('Delete this repair permanently?')) return;
    
    try {
      const response = await fetch(`http://localhost:5000/api/orderedRepairs/${repairId}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (data.success) {
        setRepairs(repairs.filter(repair => repair.id !== repairId));
        alert('✅ Repair deleted!');
        fetchRepairs();
      } else {
        alert('❌ Delete failed: ' + data.error);
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('❌ Delete failed');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: <Badge bg="warning">⏳ Pending</Badge>,
      assigned: <Badge bg="info">📋 Assigned</Badge>,
      'in-progress': <Badge bg="primary">🔧 In Progress</Badge>,
      completed: <Badge bg="success">✅ Completed</Badge>,
      cancelled: <Badge bg="danger">❌ Cancelled</Badge>
    };
    return badges[status] || <Badge bg="secondary">Unknown</Badge>;
  };

  const renderStars = (rating) => {
    return '⭐'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  const getSpecializationColor = (spec) => {
    const colors = {
      'AC': 'danger',
      'Refrigerator': 'info',
      'Washing Machine': 'primary',
      'TV': 'success',
      'Microwave': 'warning',
      'General': 'secondary'
    };
    return colors[spec] || 'secondary';
  };

  const filteredRepairs = repairs
    .filter(repair => 
      repair.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      repair.appliance?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter(repair => filterStatus === 'all' || repair.status === filterStatus);

  const assignToTechnician = async (techEmail) => {
    try {
      const technician = technicians.find(t => t.email === techEmail);
      if (!technician) {
        alert('❌ Technician not found');
        return;
      }
      
      const response = await fetch(`http://localhost:5000/api/orderedRepairs/${selectedRepair.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'assigned',
          technicianId: technician.email,
          technicianName: technician.name
        })
      });
      
      const data = await response.json();
      if (data.success) {
        setRepairs(prev => 
          prev.map(r => 
            r.id === selectedRepair.id 
              ? { ...r, technicianId: technician.email, technicianName: technician.name, status: 'assigned' }
              : r
          )
        );
        setShowAssignModal(false);
        alert('✅ Technician assigned successfully!');
        fetchRepairs();
      } else {
        alert('❌ Failed to assign technician: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      console.error('Assign error:', err);
      alert('Failed to assign technician');
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <Spinner animation="border" variant="primary" />
        <div className="ms-3">Loading repairs...</div>
      </div>
    );
  }

  return (
    <div className="bg-light min-vh-100 py-4">
      <Container fluid>
        {/* Header */}
        <Row className="mb-4">
          <Col>
            <h2 className="fw-bold text-dark mb-1">👨‍💼 Admin Dashboard</h2>
            <p className="text-muted">Manage {repairs.length} repair orders</p>
          </Col>
          <Col className="text-end">
            <Button variant="outline-danger" onClick={handleLogout}>🚪 Logout</Button>
            <Button variant="primary" className="ms-2" onClick={fetchRepairs}>🔄 Refresh</Button>
            <Button variant="info" className="ms-2" onClick={fetchTechnicians}>🔄 Techs</Button>
          </Col>
        </Row>

        {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}

        {/* Stats Cards */}
        <Row className="mb-4 g-3">
          <Col md={3}>
            <Card className="shadow-sm"><Card.Body><div className="d-flex align-items-center"><div className="bg-warning p-3 rounded-circle me-3"><i className="bi bi-clock-history fs-4 text-white"></i></div><div><h5 className="fw-bold text-warning mb-1">{repairs.filter(r => r.status === 'pending').length}</h5><small>Pending</small></div></div></Card.Body></Card>
          </Col>
          <Col md={3}>
            <Card className="shadow-sm"><Card.Body><div className="d-flex align-items-center"><div className="bg-info p-3 rounded-circle me-3"><i className="bi bi-person-check fs-4 text-white"></i></div><div><h5 className="fw-bold text-info mb-1">{repairs.filter(r => r.status === 'assigned').length}</h5><small>Assigned</small></div></div></Card.Body></Card>
          </Col>
          <Col md={3}>
            <Card className="shadow-sm"><Card.Body><div className="d-flex align-items-center"><div className="bg-primary p-3 rounded-circle me-3"><i className="bi bi-gear fs-4 text-white"></i></div><div><h5 className="fw-bold text-primary mb-1">{repairs.filter(r => r.status === 'in-progress').length}</h5><small>In Progress</small></div></div></Card.Body></Card>
          </Col>
          <Col md={3}>
            <Card className="shadow-sm"><Card.Body className="text-center"><Button variant="primary" className="w-100 mb-2" onClick={() => setShowCreateModal(true)}>➕ New Repair</Button><Button variant="success" className="w-100" onClick={() => setShowAddTechnicianModal(true)}>👨‍🔧 Add Tech</Button></Card.Body></Card>
          </Col>
        </Row>

        {/* Technicians Section */}
        <Row className="mb-4">
          <Col>
            <Card className="shadow-sm">
              <Card.Header className="bg-white"><h5 className="mb-0 fw-bold">🔧 Technicians ({technicians.length})</h5></Card.Header>
              <Card.Body>
                {loadingTechnicians ? (
                  <div className="text-center py-4"><Spinner animation="border" /></div>
                ) : technicians.length === 0 ? (
                  <div className="text-center py-4"><p className="text-muted">No technicians found</p><Button onClick={() => setShowAddTechnicianModal(true)}>Add First Technician</Button></div>
                ) : (
                  <Row className="g-4">
                    {technicians.map((tech) => (
                      <Col key={tech.id} md={4} lg={3}>
                        <Card className="h-100 shadow-sm text-center">
                          <div className="mt-4">
                            <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(tech.name)}&background=0D8F72&color=fff&size=100&bold=true`} alt={tech.name} style={{ width: '100px', height: '100px', borderRadius: '50%', border: '3px solid #0d6efd', objectFit: 'cover' }} />
                          </div>
                          <Card.Body>
                            <h5 className="fw-bold mb-1">{tech.name}</h5>
                            <Badge bg={tech.status === 'available' ? 'success' : 'warning'} className="mb-3">{tech.status === 'available' ? '🟢 Available' : '🟡 Busy'}</Badge>
                            <div className="text-start mb-3">
                              <p className="small text-muted mb-1"><i className="bi bi-envelope me-2"></i>{tech.email}</p>
                              <p className="small text-muted mb-1"><i className="bi bi-telephone me-2"></i>{tech.phone}</p>
                              <p className="small text-muted mb-1"><i className="bi bi-geo-alt me-2"></i>{tech.location}</p>
                              <p className="small text-muted"><i className="bi bi-briefcase me-2"></i>{tech.experience} years exp</p>
                            </div>
                            <div className="mb-3">
                              <small className="text-muted d-block mb-2 fw-bold">🔧 Specializes In:</small>
                              <div className="d-flex flex-wrap justify-content-center gap-2">
                                {tech.specialization && tech.specialization.length > 0 ? (
                                  tech.specialization.map((spec, idx) => (
                                    <Badge key={idx} bg={getSpecializationColor(spec)} className="px-3 py-2"><i className="bi bi-tools me-1"></i>{spec}</Badge>
                                  ))
                                ) : (
                                  <Badge bg="secondary" className="px-3 py-2"><i className="bi bi-tools me-1"></i>General Repairs</Badge>
                                )}
                              </div>
                            </div>
                            <div className="mb-2"><small className="text-warning">{renderStars(tech.rating || 4)}</small><small className="text-muted ms-1">({tech.rating || 4}/5)</small></div>
                            <small className="text-muted"><i className="bi bi-calendar me-1"></i>Joined: {tech.joinedDate ? new Date(tech.joinedDate).toLocaleDateString() : 'Recently'}</small>
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

        {/* Search & Filter */}
        <Row className="mb-4">
          <Col md={6}>
            <InputGroup>
              <Form.Control placeholder="Search customer or appliance..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </InputGroup>
          </Col>
          <Col md={3}>
            <Dropdown>
              <Dropdown.Toggle variant="outline-secondary" className="w-100">Status: {filterStatus}</Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item onClick={() => setFilterStatus('all')}>All</Dropdown.Item>
                <Dropdown.Item onClick={() => setFilterStatus('pending')}>Pending</Dropdown.Item>
                <Dropdown.Item onClick={() => setFilterStatus('assigned')}>Assigned</Dropdown.Item>
                <Dropdown.Item onClick={() => setFilterStatus('in-progress')}>In Progress</Dropdown.Item>
                <Dropdown.Item onClick={() => setFilterStatus('completed')}>Completed</Dropdown.Item>
                <Dropdown.Item onClick={() => setFilterStatus('cancelled')}>Cancelled</Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </Col>
        </Row>

        {/* Repairs Table */}
        <Row>
          <Col>
            <Card className="shadow-sm">
              <Card.Header className="bg-white"><h5 className="mb-0 fw-bold">📋 All Repairs ({filteredRepairs.length})</h5></Card.Header>
              <Card.Body className="p-0">
                <div className="table-responsive">
                 <Table hover className="mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>ID</th>
                        <th>Customer</th>
                        <th>Appliance</th>
                        <th>Issue</th>
                        <th>Preferred Date & Time</th>  {/* Make sure this header exists */}
                        <th>Status</th>
                        <th>Technician</th>
                        <th>Cancelled By</th>
                        <th>Cancellation Reason</th>
                        <th>Actions</th>
                        </tr>
                      </thead>
                    <tbody>
                      {filteredRepairs.map((repair) => (
                        <tr key={repair.id}>
                          {/* ID Column */}
                          <td><Badge bg="primary">#{repair.id.slice(-6)}</Badge></td>
                          
                          {/* Customer Column */}
                          <td>
                            <strong>{repair.customerName}</strong><br />
                            <small className="text-muted">{repair.customerPhone}</small>
                          </td>
                          
                          {/* Appliance Column */}
                          <td>{repair.appliance}</td>
                          
                          {/* Issue Column */}
                          <td className="text-truncate" style={{ maxWidth: '200px' }}>
                            {repair.issue}
                          </td>
                          
                          {/* 👈 PREFERRED DATE & TIME COLUMN - PUT CODE HERE */}
                          <td>
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
                                  <div className="text-muted">
                                    <i className="bi bi-clock me-1"></i>
                                    <small>{repair.preferredTime}</small>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted">
                                <i className="bi bi-calendar-x me-1"></i>Not specified
                              </span>
                            )}
                          </td>
                          
                          {/* Status Column */}
                          <td>{getStatusBadge(repair.status)}</td>
                          
                          {/* Technician Column */}
                          <td>
                            <Badge bg={repair.technicianId ? 'success' : 'secondary'}>
                              {repair.technicianName}
                            </Badge>
                          </td>
                          
                          {/* Cancelled By Column */}
                          <td>
                            {repair.status === 'cancelled' && repair.cancelledBy ? (
                              <Badge bg="danger">{repair.cancelledBy}</Badge>
                            ) : (
                              <span className="text-muted">—</span>
                            )}
                          </td>
                          
                          {/* Cancellation Reason Column */}
                          <td>
                            {repair.status === 'cancelled' && repair.cancellationReason ? (
                              <div>
                                <small className="text-danger">{repair.cancellationReason}</small>
                                {repair.cancelledAt && (
                                  <div>
                                    <small className="text-muted">on {new Date(repair.cancelledAt).toLocaleString()}</small>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted">—</span>
                            )}
                          </td>
                          
                          {/* Actions Column */}
                          <td>
                            {!repair.technicianId && repair.status !== 'completed' && repair.status !== 'cancelled' && (
                              <>
                                <Button 
                                  size="sm" 
                                  variant="outline-success" 
                                  onClick={() => { setSelectedRepair(repair); setShowAssignModal(true); }} 
                                  className="me-2"
                                >
                                  Assign
                                </Button>
                                <select 
                                  onChange={(e) => assignTech(repair.id, e.target.value)} 
                                  className="form-select form-select-sm d-inline-block" 
                                  style={{ width: '140px' }} 
                                  value=""
                                >
                                  <option value="">Quick Assign</option>
                                  {technicians.map((tech) => (
                                    <option key={tech.id} value={tech.email}>{tech.name}</option>
                                  ))}
                                </select>
                              </>
                            )}
                            <Button 
                              size="sm" 
                              variant="danger" 
                              onClick={() => deleteRepair(repair.id)}
                              className="ms-2"
                            >
                              Delete
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                                  </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* Assign Modal */}
      <Modal show={showAssignModal} onHide={() => setShowAssignModal(false)}>
        <Modal.Header closeButton><Modal.Title>Assign Technician</Modal.Title></Modal.Header>
        <Modal.Body>
          <p><strong>Customer:</strong> {selectedRepair?.customerName}</p>
          <p><strong>Appliance:</strong> {selectedRepair?.appliance}</p>
          <Form.Label>Select Technician:</Form.Label>
          {technicians.map(tech => (
            <div key={tech.id} className="d-flex justify-content-between align-items-center p-2 border rounded mb-2">
              <div>
                <strong>{tech.name}</strong><br />
                <small>{tech.email}</small>
              </div>
              <Button variant="primary" size="sm" onClick={() => assignToTechnician(tech.email)}>Assign</Button>
            </div>
          ))}
        </Modal.Body>
      </Modal>

      {/* Add Technician Modal */}
      <Modal show={showAddTechnicianModal} onHide={() => setShowAddTechnicianModal(false)} size="lg">
        <Modal.Header closeButton><Modal.Title>Add Technician</Modal.Title></Modal.Header>
        <Form onSubmit={addTechnician}>
          <Modal.Body>
            <Row>
              <Col md={6}><Form.Group className="mb-3"><Form.Label>Full Name *</Form.Label><Form.Control type="text" required value={newTechnician.fullName} onChange={(e) => setNewTechnician({...newTechnician, fullName: e.target.value})} /></Form.Group></Col>
              <Col md={6}><Form.Group className="mb-3"><Form.Label>Email *</Form.Label><Form.Control type="email" required value={newTechnician.email} onChange={(e) => setNewTechnician({...newTechnician, email: e.target.value})} /></Form.Group></Col>
            </Row>
            <Row>
              <Col md={6}><Form.Group className="mb-3"><Form.Label>Phone *</Form.Label><Form.Control type="tel" required value={newTechnician.phone} onChange={(e) => setNewTechnician({...newTechnician, phone: e.target.value})} /></Form.Group></Col>
              <Col md={6}><Form.Group className="mb-3"><Form.Label>Password *</Form.Label><Form.Control type="password" required value={newTechnician.password} onChange={(e) => setNewTechnician({...newTechnician, password: e.target.value})} /></Form.Group></Col>
            </Row>
            <Form.Group className="mb-3"><Form.Label>Specialization (comma-separated)</Form.Label><Form.Control type="text" value={newTechnician.specialization} onChange={(e) => setNewTechnician({...newTechnician, specialization: e.target.value})} placeholder="e.g., AC Repair, Refrigerator, Washing Machine" /></Form.Group>
            <Row>
              <Col md={6}><Form.Group className="mb-3"><Form.Label>Location</Form.Label><Form.Control type="text" value={newTechnician.location} onChange={(e) => setNewTechnician({...newTechnician, location: e.target.value})} /></Form.Group></Col>
              <Col md={6}><Form.Group className="mb-3"><Form.Label>Experience (years)</Form.Label><Form.Control type="number" value={newTechnician.experience} onChange={(e) => setNewTechnician({...newTechnician, experience: e.target.value})} /></Form.Group></Col>
            </Row>
            <Form.Group className="mb-3"><Form.Label>Status</Form.Label><Form.Select value={newTechnician.status} onChange={(e) => setNewTechnician({...newTechnician, status: e.target.value})}><option value="available">Available</option><option value="busy">Busy</option><option value="offline">Offline</option></Form.Select></Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowAddTechnicianModal(false)}>Cancel</Button>
            <Button variant="primary" type="submit">Add Technician</Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
}

export default AdminDashboard;