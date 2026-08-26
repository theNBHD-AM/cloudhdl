import React from 'react';
import Editor from '@monaco-editor/react';

export default function CodeEditor({ value, onChange, filename, readOnly = false }) {
  return (
    <div style={{
      borderRadius: '8px',
      overflow: 'hidden',
      border: '1px solid #30363d',
      background: '#1e1e1e'
    }}>
      <div style={{
        background: '#161b22',
        padding: '8px 16px',
        borderBottom: '1px solid #30363d',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        color: '#8b949e',
        fontSize: '12px',
        fontFamily: 'monospace'
      }}>
        <span>📄 {filename || 'editor'}</span>
        <span>Verilog / HDL</span>
      </div>
      <Editor
        height="50vh"
        defaultLanguage="cpp"
        theme="vs-dark"
        value={value || ''}
        onChange={(val) => onChange(val ?? '')}
        options={{
          fontSize: 14,
          fontFamily: "'Fira Code', 'Consolas', 'Courier New', monospace",
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          automaticLayout: true,
          readOnly: readOnly,
          lineNumbers: 'on',
          tabSize: 2,
        }}
      />
    </div>
  );
}