import React from 'react';

export default function FileTabs({ files, activeFileId, onSelectFile, isDirty }) {
  if (!files || files.length === 0) return null;

  return (
    <div style={{
      display: 'flex',
      gap: '4px',
      borderBottom: '1px solid #30363d',
      paddingBottom: '0',
      marginBottom: '12px',
      overflowX: 'auto'
    }}>
      {files.map((file) => {
        const isActive = file.id === activeFileId;
        const isDesign = file.fileType === 'design';

        return (
          <button
            key={file.id}
            onClick={() => onSelectFile(file.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              background: isActive ? '#161b22' : '#0d1117',
              color: isActive ? '#58a6ff' : '#8b949e',
              border: '1px solid #30363d',
              borderBottom: isActive ? '2px solid #58a6ff' : '1px solid #30363d',
              borderRadius: '6px 6px 0 0',
              cursor: 'pointer',
              fontWeight: isActive ? '600' : '400',
              fontSize: '13px',
              fontFamily: 'monospace',
              transition: 'all 0.15s ease'
            }}
          >
            <span>{isDesign ? '⚡' : '🧪'}</span>
            <span>{file.filename}</span>
            <span style={{
              fontSize: '10px',
              textTransform: 'uppercase',
              background: isDesign ? 'rgba(88, 166, 255, 0.15)' : 'rgba(210, 153, 34, 0.15)',
              color: isDesign ? '#58a6ff' : '#d29922',
              padding: '1px 6px',
              borderRadius: '4px'
            }}>
              {file.fileType}
            </span>
            {isActive && isDirty && (
              <span style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: '#f0883e',
                display: 'inline-block'
              }} title="Unsaved changes"></span>
            )}
          </button>
        );
      })}
    </div>
  );
}