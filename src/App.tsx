import React from 'react';
import './App.css';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Main from './pages/Main';
import DonghuaDetail from './pages/DonghuaDetail';
import EpisodeDetail from './pages/EpisodeDetail';
import Login from './pages/Login';
import UserProfile from './pages/UserProfile';
import AdminPanel from './pages/AdminPanel';
import { AuthProvider } from '@/hooks/useAuth';
import { Toaster } from '@/components/ui/toaster';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Main />} />
          <Route path="/donghua" element={<DonghuaDetail />} />
          <Route path="/episode" element={<EpisodeDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/user" element={<UserProfile />} />
          <Route path="/admin" element={<AdminPanel />} />
        </Routes>
      </Router>
      <Toaster />
    </AuthProvider>
  );
}

export default App;
