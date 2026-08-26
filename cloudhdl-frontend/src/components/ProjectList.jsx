import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function ProjectList({ projects }) {
  const navigate = useNavigate();

  if (!projects || projects.length === 0) {
    return (
      <div style={{
        padding: '48px 24px',
        textAlign: 'center',
        background: '#161b22',
        borderRadius: '8px',
        border: '1px dashed #30363d',
        color: '#8b949e'
      }}>
        <div style={{ fontSize: '32px', marginBottom: '12px' }}>📁</div>
        <p style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#c9d1d9' }}>No projects created yet</p>
        <p style={{ margin: 0, fontSize: '13px' }}>Create a new Verilog project above to get started.</p>
      </div>
    );
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
      gap: '16px'
    }}>
      {projects.map((project) => (
        <div
          key={project.id}
          onClick={() => navigate(`/editor/${project.id}`)}
          style={{
            background: '#161b22',
            border: '1px solid #30363d',
            borderRadius: '8px',
            padding: '20px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#58a6ff';
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#30363d';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontSize: '18px' }}>⚡</span>
              <h3 style={{ margin: 0, fontSize: '16px', color: '#58a6ff', fontWeight: '600' }}>
                {project.title}
              </h3>
            </div>
            <p style={{ margin: '0 0 16px 0', fontSize: '12px', color: '#8b949e' }}>
              Created: {new Date(project.createdAt).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTop: '1px solid #21262d',
            paddingTop: '12px'
          }}>
            <span style={{ fontSize: '12px', color: '#8b949e' }}>
              ID: <code style={{ fontFamily: 'monospace', color: '#c9d1d9' }}>{project.id.slice(0, 8)}...</code>
            </span>
            <span style={{
              fontSize: '12px',
              color: '#58a6ff',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontWeight: '500'
            }}>
              Open Editor →
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}