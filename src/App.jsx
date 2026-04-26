import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AppShell from './components/layout/AppShell';

// Pages
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import DashboardExpert from './pages/DashboardExpert';
import Diagnosis from './pages/Diagnosis';
import AdminDashboard from './pages/AdminDashboard';
import Kamus from './pages/Kamus';
import Konsultasi from './pages/Konsultasi';
import Riwayat from './pages/Riwayat';
import Profile from './pages/Profile';
import ProfileExpert from './pages/ProfileExpert';
import News from './pages/News';
import ExpertResearch from './pages/ExpertResearch';
import TreeManager from './pages/TreeManager';
import ConsultationHistory from './pages/ConsultationHistory';
import KnowledgeManager from './pages/KnowledgeManager';
import FuzzyAssessment from './pages/FuzzyAssessment';

// Helper Component for Role-Based Dashboard
const RoleBasedDashboard = () => {
  const { user } = useAuth();
  if (user?.role === 'expert') {
    return <DashboardExpert />;
  }
  return <Dashboard />;
};

const App = () => {
  return (
    <AuthProvider>
      <Routes>
        {/* Public Route */}
        <Route path="/login" element={<AuthPage />} />

        {/* Protected Routes (Patient & Expert) */}
        <Route path="/" element={
          <ProtectedRoute allowedRoles={['patient', 'expert']}>
            <AppShell>
              <RoleBasedDashboard />
            </AppShell>
          </ProtectedRoute>
        } />

        <Route path="/diagnosa" element={
          <ProtectedRoute allowedRoles={['patient']}>
            <AppShell>
              <Diagnosis />
            </AppShell>
          </ProtectedRoute>
        } />

        <Route path="/riwayat" element={
          <ProtectedRoute allowedRoles={['patient']}>
            <AppShell>
              <Riwayat />
            </AppShell>
          </ProtectedRoute>
        } />

        <Route path="/fuzzy-assessment" element={
          <ProtectedRoute allowedRoles={['patient']}>
            <AppShell>
              <FuzzyAssessment />
            </AppShell>
          </ProtectedRoute>
        } />

        <Route path="/kamus" element={
          <ProtectedRoute allowedRoles={['patient', 'expert']}>
            <AppShell>
              <Kamus />
            </AppShell>
          </ProtectedRoute>
        } />

        <Route path="/konsultasi" element={
          <ProtectedRoute allowedRoles={['patient']}>
            <AppShell>
              <Konsultasi />
            </AppShell>
          </ProtectedRoute>
        } />

        <Route path="/profile" element={
          <ProtectedRoute allowedRoles={['patient', 'expert']}>
            <AppShell>
              <Profile />
            </AppShell>
          </ProtectedRoute>
        } />

        <Route path="/news" element={
          <ProtectedRoute allowedRoles={['patient', 'expert']}>
            <AppShell>
              <News />
            </AppShell>
          </ProtectedRoute>
        } />


        {/* Expert Only Routes */}
        <Route path="/expert/profile" element={
          <ProtectedRoute allowedRoles={['expert']}>
            <AppShell>
              <ProfileExpert />
            </AppShell>
          </ProtectedRoute>
        } />

        <Route path="/expert/history" element={
          <ProtectedRoute allowedRoles={['expert']}>
            <AppShell>
              <ConsultationHistory />
            </AppShell>
          </ProtectedRoute>
        } />

        <Route path="/expert/knowledge" element={
          <ProtectedRoute allowedRoles={['expert']}>
            <AppShell>
              <KnowledgeManager />
            </AppShell>
          </ProtectedRoute>
        } />


        {/* Catch all - Redirect to Home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
};

export default App;
