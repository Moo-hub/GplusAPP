import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./App.css";

// Test component for demonstration
function TestLogin() {
  return (
    <div style={{ padding: '20px' }}>
      <h2>🔐 Login Page</h2>
      <p>This is a placeholder for the login component</p>
    </div>
  );
}

function TestDashboard() {
  return (
    <div style={{ padding: '20px' }}>
      <h2>📊 Dashboard</h2>
      <p>This is a placeholder for the dashboard component</p>
    </div>
  );
}

function WorkingApp() {
  return (
    <div className="App">
      <h1 style={{ padding: '20px', color: '#2D3748' }}>GPlus Recycling App - Working Version!</h1>
      
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<TestLogin />} />
          <Route path="/dashboard" element={<TestDashboard />} />
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default WorkingApp;