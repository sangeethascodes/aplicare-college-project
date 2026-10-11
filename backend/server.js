const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const app = express();

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  ...(process.env.FRONTEND_URL || '')
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean)
];

app.use(cors({
  origin: [...new Set(allowedOrigins)],
  credentials: true
}));
app.use(express.json());

// MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/aplicare')
  .then(() => console.log('✅ MongoDB Connected!'))
  .catch(err => console.log('❌ MongoDB Error:', err.message));

// User Schema
const userSchema = new mongoose.Schema({
  fullName: String,
  email: { type: String, unique: true, required: true },
  phone: String,
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'technician', 'admin'], default: 'user' }
});
const User = mongoose.model('User', userSchema);

// 👈 TECHNICIAN SCHEMA
const technicianSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  phone: { type: String, required: true },
  status: { type: String, enum: ['available', 'busy', 'offline'], default: 'available' },
  specialization: [String],
  location: { type: String, default: '' },
  experience: { type: Number, default: 0 },
  rating: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});
const Technician = mongoose.model('Technician', technicianSchema);

// 👈 orderedRepair Schema (UPDATED with completedAt, cancelledAt, cancellationReason)
const orderedRepairSchema = new mongoose.Schema({
  userId: String,
  customerName: { type: String, required: true },
  customerPhone: { type: String, required: true },
  customerEmail: String,
  appliance: { type: String, required: true },
  issue: { type: String, required: true },
  address: { type: String, required: true },
  priority: { type: String, default: 'medium' },
  status: { type: String, default: 'pending' },
  technicianId: String,
  technicianEmail: String,
  technicianName: { type: String, default: 'Not Assigned' },
  assignedAt: { type: Date, default: null },
  completedAt: { type: Date, default: null },
  cancelledAt: { type: Date, default: null },
  cancellationReason: { type: String, default: null },
  cancelledBy: { type: String, default: null }, // "Technician: Name" or "Customer: Name"
  cancelledByRole: { type: String, default: null }, // "technician" or "customer"
  // 👈 ADD THESE DATE/TIME FIELDS
  preferredDate: { type: Date, default: null },
  preferredTime: { type: String, default: null },
  scheduledDate: { type: Date, default: null },
  scheduledTime: { type: String, default: null },
  actualStartTime: { type: Date, default: null },
  actualEndTime: { type: Date, default: null },
  // Payment fields
  estimatedCost: { type: Number, default: 0 },
  finalCost: { type: Number, default: null },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'refunded'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});
const OrderedRepair = mongoose.model('orderedRepair', orderedRepairSchema);

// ============ TECHNICIAN ENDPOINTS ============

// 👈 TECHNICIAN - GET ASSIGNED REPAIRS (FIXED)
app.get('/api/orderedRepairs/technician/:techId', async (req, res) => {
  try {
    const techId = req.params.techId;
    console.log(`🔧 Fetching jobs for technician: ${techId}`);
    
    // Find technician by email
    const technician = await Technician.findOne({ email: techId });
    const technicianEmail = technician ? technician.email : techId;
    
    // Search for repairs assigned to this technician
    const repairs = await OrderedRepair.find({ 
      $or: [
        { technicianId: technicianEmail },
        { technicianEmail: technicianEmail }
      ]
    }).sort({ createdAt: -1 });
    
    // Filter only active jobs (not completed or cancelled)
    const activeRepairs = repairs.filter(r => 
      r.status !== 'completed' && r.status !== 'cancelled'
    );
    
    console.log(`✅ Found ${activeRepairs.length} active assigned repairs for ${technicianEmail}`);
    
    if (activeRepairs.length > 0) {
      console.log('📋 Active repairs:');
      activeRepairs.forEach((repair, index) => {
        console.log(`   ${index + 1}. ${repair.customerName} - ${repair.appliance} (${repair.status})`);
      });
    }
    
    res.json(activeRepairs);
  } catch (error) {
    console.error('❌ Tech repairs error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch repairs',
      details: error.message 
    });
  }
});

// TECHNICIAN - UPDATE STATUS (with cancellation reason)
app.put('/api/orderedRepairs/:id/status', async (req, res) => {
  try {
    const { status, cancellationReason } = req.body;
    const updateData = { status };
    
    if (status === 'completed') {
      updateData.completedAt = new Date();
      console.log(`✅ Job completed at: ${updateData.completedAt}`);
    }
    
    if (status === 'cancelled') {
      updateData.cancelledAt = new Date();
      updateData.cancellationReason = cancellationReason;
      // Get technician info from request (you might need to pass this from frontend)
      updateData.cancelledBy = req.body.cancelledBy || 'Technician';
      console.log(`❌ Job cancelled at: ${updateData.cancelledAt}`);
      console.log(`   Reason: ${cancellationReason}`);
      console.log(`   Cancelled by: ${updateData.cancelledBy}`);
    }
    
    const repair = await OrderedRepair.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );
    
    console.log(`🔧 Tech updated ${req.params.id} → ${status}`);
    res.json(repair);
  } catch (error) {
    console.error('❌ Status update error:', error);
    res.status(500).json({ error: 'Update failed' });
  }
});

// ============ ADMIN ENDPOINTS ============

// GET all technicians
app.get('/api/technicians', async (req, res) => {
  try {
    console.log('🔍 Fetching technicians...');
    const technicians = await Technician.find({}).sort({ createdAt: -1 });
    
    console.log(`✅ Found ${technicians.length} technicians`);
    res.json({ 
      success: true, 
      count: technicians.length,
      technicians: technicians 
    });
  } catch (error) {
    console.error('❌ Error fetching technicians:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch technicians: ' + error.message 
    });
  }
});

// POST add new technician
app.post('/api/technicians', async (req, res) => {
  try {
    console.log('📝 Adding new technician...');
    const { fullName, email, phone, specialization, status, location, password } = req.body;
    
    if (!fullName || !email || !phone) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: fullName, email, phone are required'
      });
    }
    
    const existingTech = await Technician.findOne({ email });
    if (existingTech) {
      return res.status(400).json({
        success: false,
        error: 'Technician with this email already exists'
      });
    }
    
    const technician = new Technician({
      fullName,
      email,
      phone,
      specialization: specialization ? (Array.isArray(specialization) ? specialization : [specialization]) : [],
      status: status || 'available',
      location: location || ''
    });
    
    await technician.save();
    console.log(`✅ Technician created: ${fullName} (${email})`);
    
    // 👈 ALSO CREATE USER ACCOUNT FOR THIS TECHNICIAN
    if (password) {
      const existingUser = await User.findOne({ email });
      if (!existingUser) {
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({
          fullName,
          email,
          phone,
          password: hashedPassword,
          role: 'technician'
        });
        await newUser.save();
        console.log(`✅ User account also created for technician: ${email}`);
      }
    }
    
    res.status(201).json({
      success: true,
      message: 'Technician added successfully',
      technician: technician
    });
  } catch (error) {
    console.error('❌ Error creating technician:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create technician: ' + error.message
    });
  }
});




// GET all repairs
app.get('/api/orderedRepairs', async (req, res) => {
  try {
    const repairs = await OrderedRepair.find().sort({ createdAt: -1 });
    res.json({ success: true, repairs });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch repairs' });
  }
});

// DELETE repair
app.delete('/api/orderedRepairs/:id', async (req, res) => {
  try {
    const repair = await OrderedRepair.findByIdAndDelete(req.params.id);
    if (!repair) {
      return res.status(404).json({ success: false, error: 'Repair not found' });
    }
    console.log(`🗑️ DELETED repair ${req.params.id}`);
    res.json({ success: true, message: 'Repair deleted successfully' });
  } catch (error) {
    console.error('❌ Delete error:', error);
    res.status(500).json({ success: false, error: 'Delete failed' });
  }
});

// ADMIN - ASSIGN TECHNICIAN (FIXED - No ObjectId casting)
app.put('/api/orderedRepairs/:id', async (req, res) => {
  try {
    const { status, technicianId, technicianName } = req.body;
    
    console.log(`📝 Assigning repair ${req.params.id}`);
    console.log(`   Technician Email: ${technicianId}`);
    console.log(`   Technician Name: ${technicianName}`);
    
    // Validate technician exists by email
    const technician = await Technician.findOne({ email: technicianId });
    if (!technician) {
      console.log(`⚠️ Technician not found with email: ${technicianId}`);
      return res.status(404).json({ 
        success: false, 
        error: `Technician with email "${technicianId}" not found. Please add this technician first.` 
      });
    }
    
    const updateData = {
      status: status || 'assigned',
      technicianId: technician.email,
      technicianName: technician.fullName,
      technicianEmail: technician.email,
      assignedAt: new Date()
    };
    
    const repair = await OrderedRepair.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );
    
    if (!repair) {
      return res.status(404).json({ success: false, error: 'Repair not found' });
    }
    
    console.log(`✅ Successfully assigned repair to ${technician.fullName} (${technician.email})`);
    res.json({ success: true, repair });
  } catch (error) {
    console.error('❌ Assignment error:', error);
    res.status(500).json({ success: false, error: 'Update failed: ' + error.message });
  }
});

// ============ AUTH ENDPOINTS ============

// REGISTER

// REGISTER - Creates both user and technician if role is technician
app.post('/api/auth/register', async (req, res) => {
  try {
    const { fullName, email, phone, password, role } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.json({ success: false, error: 'Email already exists' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user account
    const newUser = new User({ 
      fullName, 
      email, 
      phone, 
      password: hashedPassword,
      role: role || 'user'
    });
    
    await newUser.save();
    console.log(`✅ User account created: ${email} (${role})`);
    
    // If role is technician, also create technician record
    if (role === 'technician') {
      const existingTech = await Technician.findOne({ email });
      if (!existingTech) {
        const newTechnician = new Technician({
          fullName,
          email,
          phone,
          status: 'available',
          specialization: ['General Repairs'],
          location: ''
        });
        await newTechnician.save();
        console.log(`✅ Technician record also created: ${email}`);
      } else {
        console.log(`⚠️ Technician record already exists for: ${email}`);
      }
    }
    
    res.json({ 
      success: true, 
      token: 'token-' + Date.now(), 
      user: { 
        id: newUser._id, 
        email, 
        role: newUser.role, 
        fullName: newUser.fullName,
        phone: newUser.phone
      }
    });
  } catch (error) {
    console.error('❌ Register error:', error);
    res.status(500).json({ success: false, error: 'Registration failed' });
  }
});

// SIGNIN
app.post('/api/auth/signin', async (req, res) => {
  try {
    console.log('🔍 LOGIN ATTEMPT:', req.body.email);
    
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log('❌ NO USER FOUND');
      return res.json({ success: false, error: `User "${email}" not found` });
    }
    
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      console.log('❌ PASSWORD WRONG');
      return res.json({ success: false, error: 'Wrong password' });
    }
    
    console.log('✅ LOGIN SUCCESS:', user.email, user.role);
    
    res.json({
      success: true,
      token: 'token-' + Date.now(),
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        fullName: user.fullName,
        phone: user.phone
      }
    });
  } catch (error) {
    console.error('❌ SERVER ERROR:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// CUSTOMER BOOK REPAIR
app.post('/api/repairs', async (req, res) => {
  try {
    const repairOrder = new OrderedRepair(req.body);
    await repairOrder.save();
    console.log('🛠️ New repair:', req.body.appliance);
    res.json({ success: true, repairId: repairOrder._id });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Booking failed' });
  }
});

// ============ TEST ENDPOINTS ============

// Test endpoint for Ramesh
app.get('/api/test-ramesh', async (req, res) => {
  try {
    const ramesh = await Technician.findOne({ email: 'ramesh@123gmail.com' });
    const repairs = await OrderedRepair.find({ 
      $or: [
        { technicianId: 'ramesh@123gmail.com' },
        { technicianEmail: 'ramesh@123gmail.com' },
        { technicianName: 'Ramesh' }
      ]
    });
    
    res.json({
      success: true,
      technicianExists: ramesh ? true : false,
      technicianDetails: ramesh,
      assignedRepairsCount: repairs.length,
      assignedRepairs: repairs
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Debug endpoint to check user role
app.get('/api/debug/user-role/:email', async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email });
    if (!user) {
      return res.json({ success: false, message: 'User not found' });
    }
    res.json({
      success: true,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
      phone: user.phone
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    mongodb: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 Server running on port ${PORT}`);
  console.log('📡 Available endpoints:');
  console.log('   - GET  http://localhost:5000/api/technicians');
  console.log('   - POST http://localhost:5000/api/technicians');
  console.log('   - GET  http://localhost:5000/api/orderedRepairs');
  console.log('   - GET  http://localhost:5000/api/orderedRepairs/technician/:techId');
  console.log('   - PUT  http://localhost:5000/api/orderedRepairs/:id/status');
  console.log('   - PUT  http://localhost:5000/api/orderedRepairs/:id');
  console.log('   - POST http://localhost:5000/api/auth/signin');
  console.log('   - POST http://localhost:5000/api/auth/register');
  console.log('   - GET  http://localhost:5000/api/test-ramesh');
  console.log('   - GET  http://localhost:5000/api/debug/user-role/:email');
  console.log('   - GET  http://localhost:5000/api/health\n');
});