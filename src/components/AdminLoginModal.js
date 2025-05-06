import React, { useState } from 'react';

const AdminLoginModal = ({ onLogin, onClose }) => {
  const [adminPassword, setAdminPassword] = useState('');
  
  const handleLogin = () => {
    if (adminPassword === 'admin123') {
      onLogin(true);
    } else {
      alert('Onjuist wachtwoord');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Admin Login</h2>
        <div className="modal-form">
          <input
            type="password"
            placeholder="Admin Wachtwoord"
            value={adminPassword}
            onChange={(e) => setAdminPassword(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleLogin()}
          />
          <div className="modal-buttons">
            <button onClick={handleLogin}>Login</button>
            <button onClick={onClose}>Annuleren</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginModal;