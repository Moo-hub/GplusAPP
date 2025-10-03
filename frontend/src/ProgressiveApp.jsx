import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./App.css";

// Import contexts progressively
import { AuthProvider } from "./contexts/AuthContext";
import { LoadingProvider } from "./contexts/LoadingContext";

// Import basic components
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";

function ProgressiveApp() {
  return (
    <div className="App">
      <BrowserRouter>
        <LoadingProvider>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/" element={<Navigate to="/login" replace />} />
            </Routes>
          </AuthProvider>
        </LoadingProvider>
      </BrowserRouter>
    </div>
  );
}

export default ProgressiveApp;