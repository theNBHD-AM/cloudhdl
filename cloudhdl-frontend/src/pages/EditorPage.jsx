import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import CodeEditor from '../components/CodeEditor';
import FileTabs from '../components/FileTabs';
import WaveformViewer from '../components/WaveformViewer';
import RunButton from '../components/RunButton';

export default function EditorPage() {
  const { id: projectId } = useParams();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [project, setProject] = useState(null);
  const [files, setFiles] = useState([]);
  const [activeFileId, setActiveFileId] = useState(null);
  const [fileContents, setFileContents] = useState({}); // fileId -> string content
  const [isDirty, setIsDirty] = useState({}); // fileId -> boolean
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [simResult, setSimResult] = useState(null);
  const [bottomTab, setBottomTab] = useState('waveform'); // 'waveform' | 'console'
  const [statusMsg, setStatusMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Load project and its files
  const loadProject = useCallback(async () => {
    try {
      setLoading(true);
      const res = await client.get(`/projects/${projectId}`);
      const proj = res.data;
      setProject(proj);

      if (proj.files && proj.files.length > 0) {
        setFiles(proj.files);
        const contents = {};
        const dirty = {};
        proj.files.forEach((f) => {
          contents[f.id] = f.content || '';
          dirty[f.id] = false;
        });
        setFileContents(contents);
        setIsDirty(dirty);

        // Select design file first, or the first file
        const designFile = proj.files.find((f) => f.fileType === 'design');
        setActiveFileId(designFile ? designFile.id : proj.files[0].id);
      }

      // If past simulation runs exist, load the latest VCD
      if (proj.simulationRuns && proj.simulationRuns.length > 0) {
        const latest = proj.simulationRuns[0];
        setSimResult({
          success: latest.status === 'success',
          stdout: latest.stdout,
          vcd: latest.vcdOutput,
          error: latest.errorMessage,
        });
      }
    } catch (err) {
      if (err.response?.status === 401) {
        logout();
        navigate('/login');
      } else {
        setErrorMsg(err.response?.data?.error || 'Failed to load project');
      }
    } finally {
      setLoading(false);
    }
  }, [projectId, logout, navigate]);

  useEffect(() => {
    loadProject();
  }, [loadProject]);

  // Handle active file editor content change
  const handleContentChange = (newVal) => {
    if (!activeFileId) return;
    setFileContents((prev) => ({ ...prev, [activeFileId]: newVal }));
    setIsDirty((prev) => ({ ...prev, [activeFileId]: true }));
  };

  // Save current active file (or all dirty files)
  const handleSave = async (fileIdToSave = activeFileId) => {
    if (!fileIdToSave) return;
    const content = fileContents[fileIdToSave];

    try {
      setSaving(true);
      setStatusMsg('Saving...');
      await client.put(`/projects/${projectId}/files/${fileIdToSave}`, { content });
      setIsDirty((prev) => ({ ...prev, [fileIdToSave]: false }));
      setStatusMsg('Saved');
      setTimeout(() => setStatusMsg(''), 2000);
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Failed to save file');
      setTimeout(() => setErrorMsg(''), 3000);
    } finally {
      setSaving(false);
    }
  };

  // Run Docker Simulation
  const handleRunSimulation = async () => {
    setErrorMsg('');
    setStatusMsg('');

    // Auto-save any modified files before running simulation
    const dirtyFileIds = Object.keys(isDirty).filter((fid) => isDirty[fid]);
    if (dirtyFileIds.length > 0) {
      for (const fid of dirtyFileIds) {
        await handleSave(fid);
      }
    }

    try {
      setSimulating(true);
      const res = await client.post('/simulate', { projectId });
      setSimResult(res.data);

      if (res.data.success) {
        setBottomTab('waveform');
        setStatusMsg('Simulation completed successfully!');
      } else {
        setBottomTab('console');
        setErrorMsg(`Simulation ${res.data.stage || 'execution'} error`);
      }
    } catch (err) {
      const errDetail = err.response?.data?.error || err.message || 'Simulation execution failed';
      setErrorMsg(errDetail);
      setSimResult({
        success: false,
        stage: 'system',
        error: errDetail,
        stdout: err.response?.data?.details || '',
      });
      setBottomTab('console');
    } finally {
      setSimulating(false);
    }
  };

  // Keyboard shortcut: Ctrl+S or Cmd+S to save
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeFileId, fileContents]);

  const activeFile = files.find((f) => f.id === activeFileId);
  const currentDirty = activeFileId ? isDirty[activeFileId] : false;

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#0d1117',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#8b949e'
      }}>
        Loading project editor...
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0d1117', color: '#c9d1d9', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navbar */}
      <header style={{
        background: '#161b22',
        borderBottom: '1px solid #30363d',
        padding: '10px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link
            to="/dashboard"
            style={{
              color: '#8b949e',
              textDecoration: 'none',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 8px',
              borderRadius: '6px',
              border: '1px solid #30363d'
            }}
          >
            ← Dashboard
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '18px' }}>⚡</span>
            <h2 style={{ margin: 0, fontSize: '16px', color: '#e6edf3', fontWeight: '600' }}>
              {project?.title || 'Verilog Project'}
            </h2>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {statusMsg && (
            <span style={{ fontSize: '12px', color: '#3fb950', fontFamily: 'monospace' }}>
              ✓ {statusMsg}
            </span>
          )}
          {errorMsg && (
            <span style={{ fontSize: '12px', color: '#f85149', fontFamily: 'monospace' }}>
              ⚠ {errorMsg}
            </span>
          )}

          <button
            onClick={() => handleSave()}
            disabled={saving || !currentDirty}
            style={{
              background: currentDirty ? '#1f6feb' : '#21262d',
              border: '1px solid #30363d',
              color: currentDirty ? '#ffffff' : '#8b949e',
              padding: '7px 14px',
              borderRadius: '6px',
              fontSize: '13px',
              cursor: currentDirty ? 'pointer' : 'default',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            💾 {saving ? 'Saving...' : currentDirty ? 'Save (Ctrl+S)*' : 'Saved'}
          </button>

          <RunButton
            onRun={handleRunSimulation}
            loading={simulating}
            disabled={files.length === 0}
          />
        </div>
      </header>

      {/* Main Workspace: Editor + Waveform/Console Bottom Pane */}
      <div style={{ flex: 1, padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Editor Section */}
        <section>
          <FileTabs
            files={files}
            activeFileId={activeFileId}
            onSelectFile={(id) => setActiveFileId(id)}
            isDirty={currentDirty}
          />

          <CodeEditor
            filename={activeFile?.filename}
            value={activeFileId ? fileContents[activeFileId] : ''}
            onChange={handleContentChange}
          />
        </section>

        {/* Bottom Panel: Waveform & Console */}
        <section style={{
          background: '#161b22',
          border: '1px solid #30363d',
          borderRadius: '8px',
          overflow: 'hidden'
        }}>
          {/* Subheader / Tabs */}
          <div style={{
            background: '#0d1117',
            borderBottom: '1px solid #30363d',
            padding: '8px 16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setBottomTab('waveform')}
                style={{
                  background: bottomTab === 'waveform' ? '#21262d' : 'transparent',
                  border: '1px solid',
                  borderColor: bottomTab === 'waveform' ? '#30363d' : 'transparent',
                  color: bottomTab === 'waveform' ? '#58a6ff' : '#8b949e',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                📊 Waveform Viewer
              </button>

              <button
                onClick={() => setBottomTab('console')}
                style={{
                  background: bottomTab === 'console' ? '#21262d' : 'transparent',
                  border: '1px solid',
                  borderColor: bottomTab === 'console' ? '#30363d' : 'transparent',
                  color: bottomTab === 'console' ? '#58a6ff' : '#8b949e',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                💻 Simulation Console / Log
                {simResult?.success === false && (
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#f85149' }}></span>
                )}
              </button>
            </div>

            {simResult && (
              <span style={{
                fontSize: '11px',
                fontFamily: 'monospace',
                padding: '2px 8px',
                borderRadius: '4px',
                background: simResult.success ? 'rgba(63, 185, 80, 0.15)' : 'rgba(248, 81, 73, 0.15)',
                color: simResult.success ? '#3fb950' : '#f85149',
                border: `1px solid ${simResult.success ? '#238636' : '#f85149'}`
              }}>
                Status: {simResult.success ? 'SUCCESS (Docker/Icarus)' : `ERROR (${simResult.stage || 'Run'})`}
              </span>
            )}
          </div>

          {/* Panel Body */}
          <div style={{ padding: '16px' }}>
            {bottomTab === 'waveform' ? (
              <WaveformViewer vcdText={simResult?.vcd} />
            ) : (
              <div>
                {simResult?.error && (
                  <div style={{
                    background: 'rgba(248, 81, 73, 0.1)',
                    border: '1px solid #f85149',
                    borderRadius: '6px',
                    padding: '12px',
                    marginBottom: '12px',
                    color: '#f85149',
                    fontFamily: 'monospace',
                    fontSize: '13px',
                    whiteSpace: 'pre-wrap'
                  }}>
                    <strong>Compilation / Execution Error ({simResult.stage}):</strong>
                    <div style={{ marginTop: '6px' }}>{simResult.error}</div>
                  </div>
                )}

                <div style={{
                  background: '#0d1117',
                  border: '1px solid #30363d',
                  borderRadius: '6px',
                  padding: '12px',
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  color: '#c9d1d9',
                  minHeight: '120px',
                  maxHeight: '300px',
                  overflowY: 'auto',
                  whiteSpace: 'pre-wrap'
                }}>
                  {simResult?.stdout || (
                    <span style={{ color: '#8b949e', fontStyle: 'italic' }}>
                      No console output. Run simulation to see Icarus Verilog output.
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}