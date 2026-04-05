import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { UserProvider } from './stores/LoginPage';
import CustomerAuth from './component/CustomerAuth';
import TechnicianAuth from './component/TechnicianAuth';
import AdminAuth from './component/AdminAuth';
import AdminDashboard from './AdminDashboard'; // 👈 ADD THIS LINE!
import UserHomePage from './component/UserHomepage';
import TechnicianDashboard from './TechnicianDashboard';
import BookService from './component/BookService';

function App() {
  return (
    <UserProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/technician-dashboard" element={<TechnicianDashboard />} />
          <Route path="/admin-dashboard" element={<AdminDashboard />} />  {/* 👈 Admin route */}
          <Route path="/home" element={<UserHomePage/>} />
          <Route path="/book-service" element={<BookService/>} />
          <Route path="/" element={<CustomerAuth />} />
          <Route path="/technician" element={<TechnicianAuth />} />
          <Route path="/admin" element={<AdminAuth />} />

        </Routes>
      </BrowserRouter>
    </UserProvider>
  );
}

export default App;
