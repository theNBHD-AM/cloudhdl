import React, { useMemo, useState } from 'react';
import { parseVCD } from '../utils/vcdParser';

export default function WaveformViewer({ vcdText }) {
  const [hoverTime, setHoverTime] = useState(null);

  const signals = useMemo(() => {
    if (!vcdText) return [];
    return parseVCD(vcdText);
  }, [vcdText]);

  if (!vcdText) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: '#8b949e', fontStyle: 'italic' }}>
        No waveform data yet. Click "Run Simulation" to generate waveforms.
      </div>
    );
  }

  if (signals.length === 0) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: '#8b949e' }}>
        Simulation completed, but no $dumpvars / signals found in VCD output.
      </div>
    );
  }

  const rowHeight = 44;
  const labelWidth = 120;
  const pxPerTimeUnit = 12;

  // Compute maximum time across all signal transitions
  const maxTime = Math.max(
    ...signals.flatMap(s => s.values.map(v => v.time)),
    10
  );

  const totalTime = maxTime + 10; // add padding at end
  const waveformWidth = totalTime * pxPerTimeUnit;
  const totalWidth = labelWidth + waveformWidth + 40;
  const totalHeight = (signals.length + 1) * rowHeight + 20;

  // Generate time ticks
  const timeStep = totalTime <= 50 ? 5 : totalTime <= 200 ? 10 : 20;
  const timeTicks = [];
  for (let t = 0; t <= totalTime; t += timeStep) {
    timeTicks.push(t);
  }

  return (
    <div style={{
      background: '#0d1117',
      borderRadius: '8px',
      border: '1px solid #30363d',
      overflowX: 'auto',
      overflowY: 'hidden',
      padding: '16px',
      boxShadow: 'inset 0 0 10px rgba(0,0,0,0.5)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h4 style={{ margin: 0, color: '#e6edf3', fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#3fb950' }}></span>
          Simulation Waveforms ({signals.length} {signals.length === 1 ? 'signal' : 'signals'})
        </h4>
        {hoverTime !== null && (
          <span style={{ color: '#58a6ff', fontSize: '12px', fontFamily: 'monospace', background: '#161b22', padding: '2px 8px', borderRadius: '4px', border: '1px solid #30363d' }}>
            Time: {hoverTime}ns
          </span>
        )}
      </div>

      <svg
        width={totalWidth}
        height={totalHeight}
        style={{ display: 'block', userSelect: 'none' }}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const mouseX = e.clientX - rect.left - labelWidth;
          if (mouseX >= 0) {
            const time = Math.round(mouseX / pxPerTimeUnit);
            setHoverTime(Math.min(Math.max(0, time), totalTime));
          }
        }}
        onMouseLeave={() => setHoverTime(null)}
      >
        {/* Grid Background & Time Axis */}
        <g id="grid">
          {timeTicks.map((t) => {
            const x = labelWidth + t * pxPerTimeUnit;
            return (
              <g key={t}>
                <line
                  x1={x}
                  y1={rowHeight}
                  x2={x}
                  y2={totalHeight}
                  stroke="#21262d"
                  strokeWidth="1"
                  strokeDasharray="2,2"
                />
                <text
                  x={x}
                  y={rowHeight - 10}
                  fill="#8b949e"
                  fontSize="10"
                  fontFamily="monospace"
                  textAnchor="middle"
                >
                  {t}ns
                </text>
                <line
                  x1={x}
                  y1={rowHeight - 6}
                  x2={x}
                  y2={rowHeight}
                  stroke="#30363d"
                  strokeWidth="1"
                />
              </g>
            );
          })}
          {/* Header bottom separator line */}
          <line
            x1={0}
            y1={rowHeight}
            x2={totalWidth}
            y2={rowHeight}
            stroke="#30363d"
            strokeWidth="1"
          />
          {/* Label column vertical separator line */}
          <line
            x1={labelWidth}
            y1={0}
            x2={labelWidth}
            y2={totalHeight}
            stroke="#30363d"
            strokeWidth="1"
          />
        </g>

        {/* Signals */}
        {signals.map((signal, idx) => {
          const rowY = (idx + 1) * rowHeight + 10;
          const centerY = rowY + rowHeight / 2;
          const highY = centerY - 10;
          const lowY = centerY + 10;

          // Build stepped path for digital signal
          let path = '';
          let lastVal = signal.values[0] ? signal.values[0].value : 0;
          let lastX = labelWidth;

          path += `M ${lastX} ${lastVal === 1 ? highY : lowY}`;

          // Sort values by time
          const sortedValues = [...signal.values].sort((a, b) => a.time - b.time);

          sortedValues.forEach(({ time, value }) => {
            const currX = labelWidth + time * pxPerTimeUnit;
            if (currX > lastX) {
              path += ` L ${currX} ${lastVal === 1 ? highY : lowY}`;
            }
            const currY = value === 1 ? highY : lowY;
            path += ` L ${currX} ${currY}`;
            lastVal = value;
            lastX = currX;
          });

          // Extend to end of timeline
          const endX = labelWidth + totalTime * pxPerTimeUnit;
          if (endX > lastX) {
            path += ` L ${endX} ${lastVal === 1 ? highY : lowY}`;
          }

          // Alternating row background for readability
          const isEven = idx % 2 === 0;

          return (
            <g key={signal.name || signal.id}>
              {isEven && (
                <rect
                  x={0}
                  y={rowY}
                  width={totalWidth}
                  height={rowHeight}
                  fill="rgba(255, 255, 255, 0.015)"
                />
              )}

              {/* Signal Name Label */}
              <text
                x="12"
                y={centerY + 4}
                fill="#58a6ff"
                fontSize="12"
                fontWeight="600"
                fontFamily="monospace"
              >
                {signal.name}
              </text>
              {signal.size > 1 && (
                <text
                  x="80"
                  y={centerY + 4}
                  fill="#8b949e"
                  fontSize="10"
                  fontFamily="monospace"
                >
                  [{signal.size - 1}:0]
                </text>
              )}

              {/* Waveform Trace */}
              <path
                d={path}
                stroke="#3fb950"
                fill="none"
                strokeWidth="2"
                strokeLinecap="square"
              />

              {/* Row Bottom Divider */}
              <line
                x1={0}
                y1={rowY + rowHeight}
                x2={totalWidth}
                y2={rowY + rowHeight}
                stroke="#21262d"
                strokeWidth="1"
              />
            </g>
          );
        })}

        {/* Hover Time Marker Vertical Bar */}
        {hoverTime !== null && (
          <g id="hover-marker">
            <line
              x1={labelWidth + hoverTime * pxPerTimeUnit}
              y1={rowHeight}
              x2={labelWidth + hoverTime * pxPerTimeUnit}
              y2={totalHeight}
              stroke="#f78166"
              strokeWidth="1.5"
              strokeDasharray="4,2"
            />
          </g>
        )}
      </svg>
    </div>
  );
}