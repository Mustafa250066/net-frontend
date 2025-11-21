import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '@/App.css';
import HomePage from './pages/HomePage';
import ShowDetailPage from './pages/ShowDetailPage';
import VideoPlayerPage from './pages/VideoPlayerPage';
import AdminDashboard from './pages/AdminDashboard';
import { Toaster } from '@/components/ui/sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

// Create axios instance with auth
export const axiosInstance = axios.create({
  baseURL: API,
});

// Add token to requests
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// User session for watch progress
export const getUserSession = () => {
  let session = localStorage.getItem('userSession');
  if (!session) {
    session = 'user_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('userSession', session);
  }
  return session;
};

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/show/:showId" element={<ShowDetailPage />} />
          <Route path="/watch/:episodeId" element={<VideoPlayerPage />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" richColors />
    </div>
  );
}

export default App;