import React from 'react';

const SimpleApp: React.FC = () => {
  return (
    <div style={{
      padding: '2rem',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
      color: 'white',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{ fontSize: '3rem', fontWeight: 'bold', marginBottom: '1rem' }}>
        🏥 Kleara Clinic Management
      </h1>
      <h2 style={{ fontSize: '1.5rem', marginBottom: '2rem', textAlign: 'center' }}>
        ระบบจัดการคลินิกความงาม
      </h2>
      <div style={{ 
        background: 'rgba(255,255,255,0.1)', 
        padding: '1rem 2rem', 
        borderRadius: '8px',
        fontSize: '1.2rem',
        fontWeight: 'bold',
        color: '#4caf50'
      }}>
        ✅ แอปโหลดสำเร็จแล้ว!
      </div>
      <p style={{ marginTop: '1rem', opacity: 0.9 }}>
        หากเห็นข้อความนี้แสดงว่าระบบทำงานปกติ
      </p>
    </div>
  );
};

export default SimpleApp;