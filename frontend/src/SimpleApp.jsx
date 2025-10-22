import "./App.css";

function SimpleApp() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ color: '#2D3748' }}>GPlus Recycling App</h1>
      <p>🎉 Application is loading successfully!</p>
      <div style={{ 
        background: '#E2F8F0', 
        padding: '15px', 
        borderRadius: '8px',
        border: '1px solid #48BB78',
        marginTop: '20px'
      }}>
        <h2>✅ System Status</h2>
        <ul>
          <li>✅ React Application: Running</li>
          <li>✅ Vite Development Server: Active</li>
          <li>✅ CSS Styles: Loaded</li>
        </ul>
      </div>
      
      <div style={{ marginTop: '20px' }}>
        <h3>🌍 Bilingual Support Test</h3>
        <p>English: Welcome to GPlus Recycling App</p>
        <p style={{ direction: 'rtl' }}>العربية: مرحباً بكم في تطبيق جي بلس لإعادة التدوير</p>
      </div>
    </div>
  );
}

export default SimpleApp;