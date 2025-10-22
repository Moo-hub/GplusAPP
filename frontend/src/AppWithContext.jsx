import "./i18n"; // Initialize i18n
import "./App.css";

// Import the actual components

function AppWithContext() {
  return (
    <LoadingProvider>
      <AuthProvider>
        <div className="App">
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/" element={<Navigate to="/login" replace />} />
            </Routes>
          </BrowserRouter>
        </div>
      </AuthProvider>
    </LoadingProvider>
  );
}

export default AppWithContext;