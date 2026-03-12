import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Register from './components/Register';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import CreateJob from './components/CreateJob';
import JobList from './components/JobList';
import JobDetail from './components/JobDetail';
import EditJob from './components/EditJob';
import MyApplications from './components/candidate/MyApplications';
import HRApplications from './components/hr/HRApplications';
import Assessment from './components/assessment/Assessment';
import InterviewRoom from './components/interview/InterviewRoom';
import HRAssessment from './components/hr/HRAssessment';

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

        {/* ATS Routes */}
        <Route path="/my-applications" element={<MyApplications />} />
        <Route path="/hr/applications/:jobId" element={<HRApplications />} />
        {/* Assesement and interview Routes */}
        <Route path="/assessment/:jobId/:applicationId" element={<Assessment />} />
        <Route path="/interview/:roomName" element={<InterviewRoom />} />
        <Route path="/hr/assessment/:jobId" element={<HRAssessment />} />
      </Routes>
    </Router>
  );
}

export default App;
