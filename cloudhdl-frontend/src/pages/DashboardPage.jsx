import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import ProjectList from '../components/ProjectList';

const DEFAULT_DESIGN = `module and_gate(
  input wire a,
  input wire b,
  output wire y
);
  assign y = a & b;
endmodule
`;

const DEFAULT_TESTBENCH = `module tb;
  reg a;
  reg b;
  wire y;

  // Instantiate the Unit Under Test (UUT)
  and_gate uut (
    .a(a),
    .b(b),
    .y(y)
  );

  initial begin
    $dumpfile("output.vcd");
    $dumpvars(0, tb);

    // Test cases
    a = 0; b = 0; #10;
    a = 0; b = 1; #10;
    a = 1; b = 0; #10;
    a = 1; b = 1; #10;

    $finish;
  end
endmodule
`;

export default function DashboardPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [projectTitle, setProjectTitle] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res = await client.get('/projects');
      setProjects(res.data);
    } catch (err) {
      if (err.response?.status === 401) {
        logout();
        navigate('/login');
      } else {
        setError('Failed to load projects');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!projectTitle.trim()) return;

    setCreating(true);
    setError('');

    try {
      // 1. Create project
      const projRes = await client.post('/projects', { title: projectTitle.trim() });
      const projectId = projRes.data.id;

      // 2. Attach default design.v and testbench.v
      await client.post(`/projects/${projectId}/files`, {
        filename: 'design.v',
        content: DEFAULT_DESIGN,
        fileType: 'design'
      });

      await client.post(`/projects/${projectId}/files`, {
        filename: 'testbench.v',
        content: DEFAULT_TESTBENCH,
        fileType: 'testbench'
      });

      setShowModal(false);
      setProjectTitle('');
      navigate(`/editor/${projectId}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create project');
      setCreating(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0d1117', color: '#c9d1d9' }}>
      {/* Top Navigation */}
      <header style={{
        background: '#161b22',
        borderBottom: '1px solid #30363d',
        padding: '16px 32px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '24px' }}>⚡</span>
          <div>
            <h1 style={{ margin: 0, fontSize: '18px', color: '#e6edf3', fontWeight: '700' }}>CloudHDL</h1>
            <span style={{ fontSize: '11px', color: '#8b949e' }}>HDL Workspace</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '13px', color: '#8b949e' }}>
            Signed in as <strong style={{ color: '#e6edf3' }}>{user?.name || user?.email}</strong>
          </span>
          <button
            onClick={() => { logout(); navigate('/login'); }}
            style={{
              background: '#21262d',
              border: '1px solid #30363d',
              color: '#c9d1d9',
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px'
        }}>
          <div>
            <h2 style={{ margin: '0 0 4px 0', fontSize: '20px', color: '#e6edf3', fontWeight: '600' }}>
              Your HDL Projects
            </h2>
            <p style={{ margin: 0, fontSize: '13px', color: '#8b949e' }}>
              Create, simulate, and inspect Verilog designs in isolated Docker environments
            </p>
          </div>

          <button
            onClick={() => setShowModal(true)}
            style={{
              background: '#238636',
              color: '#ffffff',
              border: 'none',
              padding: '10px 18px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
            }}
          >
            <span>+</span>
            <span>New Project</span>
          </button>
        </div>

        {error && (
          <div style={{
            background: 'rgba(248, 81, 73, 0.1)',
            border: '1px solid #f85149',
            color: '#f85149',
            padding: '12px 16px',
            borderRadius: '6px',
            marginBottom: '24px',
            fontSize: '13px'
          }}>
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px', color: '#8b949e' }}>
            Loading projects...
          </div>
        ) : (
          <ProjectList projects={projects} />
        )}
      </main>

      {/* New Project Modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            background: '#161b22',
            border: '1px solid #30363d',
            borderRadius: '10px',
            width: '100%',
            maxWidth: '440px',
            padding: '24px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.6)'
          }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', color: '#e6edf3' }}>
              Create New Verilog Project
            </h3>
            <form onSubmit={handleCreateProject}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', color: '#c9d1d9', marginBottom: '8px' }}>
                  Project Title
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                  placeholder="e.g. 4-bit Ripple Carry Adder"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: '#0d1117',
                    border: '1px solid #30363d',
                    borderRadius: '6px',
                    color: '#e6edf3',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={creating}
                  style={{
                    padding: '8px 16px',
                    background: '#21262d',
                    border: '1px solid #30363d',
                    color: '#c9d1d9',
                    borderRadius: '6px',
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  style={{
                    padding: '8px 16px',
                    background: '#238636',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: creating ? 'not-allowed' : 'pointer',
                    opacity: creating ? 0.7 : 1
                  }}
                >
                  {creating ? 'Creating...' : 'Create & Open'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}