import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Register from './components/Register';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import CreateJob from './components/CreateJob';
import JobList from './components/JobList';
import JobDetail from './components/JobDetail';
import EditJob from './components/EditJob';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/create-job" element={<CreateJob />} />
        <Route path="/jobs" element={<JobList />} />
        <Route path="/jobs/:jobId" element={<JobDetail />} />
        <Route path="/jobs/:jobId/edit" element={<EditJob />} />
      </Routes>
    </Router>
  );
}

export default App; 

