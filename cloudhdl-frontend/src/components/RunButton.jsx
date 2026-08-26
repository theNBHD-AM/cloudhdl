import React from 'react';

export default function RunButton({ onRun, loading, disabled }) {
  return (
    <button
      onClick={onRun}
      disabled={loading || disabled}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        background: loading ? '#238636' : '#2ea043',
        color: '#ffffff',
        border: 'none',
        padding: '8px 18px',
        borderRadius: '6px',
        fontSize: '13px',
        fontWeight: '600',
        cursor: loading || disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        transition: 'background 0.2s ease',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
      }}
    >
      {loading ? (
        <>
          <span style={{
            width: '12px',
            height: '12px',
            border: '2px solid #fff',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            display: 'inline-block',
            animation: 'spin 1s linear infinite'
          }}></span>
          <span>Simulating in Docker...</span>
        </>
      ) : (
        <>
          <span>▶</span>
          <span>Run Simulation</span>
        </>
      )}
    </button>
  );
}