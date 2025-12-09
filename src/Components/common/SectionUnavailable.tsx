import React from 'react';
import { useNavigate } from 'react-router-dom';

const SectionUnavailable: React.FC<{ title?: string; description?: string }> = ({
  title = 'Sección no disponible',
  description = 'Esta sección aún no está habilitada. Vuelve más tarde o explora el catálogo.'
}) => {
  const navigate = useNavigate();
  return (
    <div style={{
      minHeight: 'calc(100vh - 96px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      color: '#fff'
    }}>
      <div style={{
        background: 'linear-gradient(180deg, rgba(20,20,24,.55), rgba(20,20,24,.35))',
        border: '1px solid rgba(124,58,237,.3)',
        borderRadius: 16,
        padding: '2rem',
        maxWidth: 640,
        width: '100%',
        textAlign: 'center',
        boxShadow: '0 18px 44px rgba(13,8,30,.45)'
      }}>
        <h2 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800 }}>{title}</h2>
        <p style={{ marginTop: '.75rem', color: '#d1d5db' }}>{description}</p>
        <div style={{ marginTop: '1.25rem' }}>
          <button
            onClick={() => navigate('/explorar')}
            style={{
              height: 42,
              padding: '0 1rem',
              borderRadius: 999,
              border: 'none',
              background: 'linear-gradient(90deg,#7c3aed,#6d28d9)',
              color: '#fff',
              fontWeight: 700,
              boxShadow: '0 8px 24px rgba(124,58,237,.25)',
              cursor: 'pointer'
            }}
            aria-label="Volver a explorar"
          >
            Volver a Explorar
          </button>
        </div>
      </div>
    </div>
  );
};

export default SectionUnavailable;

