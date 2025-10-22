import "./App.css";

// Import contexts progressively

// Import basic components

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