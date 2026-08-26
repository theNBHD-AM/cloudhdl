// src/utils/vcdParser.js
export function parseVCD(vcdText) {
  if (!vcdText || typeof vcdText !== 'string') return [];

  const lines = vcdText.split('\n');
  const signals = {}; // id -> { id, name, type, size, values: [{time, value}] }
  let currentTime = 0;

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (!trimmed) continue;

    // $var wire 1 ! y $end OR $var reg 1 " a $end
    if (trimmed.startsWith('$var')) {
      const parts = trimmed.split(/\s+/);
      // $var type size id name [index] $end
      if (parts.length >= 5) {
        const type = parts[1];
        const size = parseInt(parts[2], 10) || 1;
        const id = parts[3];
        const name = parts[4];
        if (!signals[id]) {
          signals[id] = { id, name, type, size, values: [] };
        }
      }
      continue;
    }

    // #10 -> advances simulation time
    if (trimmed.startsWith('#')) {
      currentTime = parseInt(trimmed.slice(1), 10) || 0;
      continue;
    }

    // Scalar change: 0! or 1" or x#
    const scalarMatch = trimmed.match(/^([01xzXZ])(\S+)$/);
    if (scalarMatch) {
      const [, valStr, id] = scalarMatch;
      if (signals[id]) {
        const numVal = (valStr === '1') ? 1 : 0;
        signals[id].values.push({ time: currentTime, value: numVal, raw: valStr });
      }
      continue;
    }

    // Vector change: b101 ! or b0 !
    const vecMatch = trimmed.match(/^b([01xzXZ]+)\s+(\S+)$/i);
    if (vecMatch) {
      const [, valStr, id] = vecMatch;
      if (signals[id]) {
        const numVal = parseInt(valStr, 2) || 0;
        signals[id].values.push({ time: currentTime, value: numVal, raw: valStr });
      }
      continue;
    }
  }

  // Ensure every signal has an initial value at time 0
  const result = Object.values(signals);
  result.forEach(s => {
    if (s.values.length === 0 || s.values[0].time > 0) {
      s.values.unshift({ time: 0, value: s.values[0] ? s.values[0].value : 0, raw: '0' });
    }
  });

  return result;
}