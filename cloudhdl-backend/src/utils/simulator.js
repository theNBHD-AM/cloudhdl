const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const { promisify } = require('util');
const execAsync = promisify(exec);

const SIMULATION_TIMEOUT_MS = 15000; // slightly higher than before — Docker container startup adds a little overhead
const DOCKER_IMAGE = 'cloudhdl-simulator';

const simulateVerilog = async (code, testbench, runDir) => {
  const designPath = path.join(runDir, 'design.v');
  const testbenchPath = path.join(runDir, 'testbench.v');
  const vcdPath = path.join(runDir, 'output.vcd');

  // Write both files to the run's temp folder (same as before)
  await fs.writeFile(designPath, code);
  await fs.writeFile(testbenchPath, testbench);

  // Build the docker run command:
  // -v mounts the runDir into /sim/work inside the container
  // --rm automatically removes the container after it exits (no manual cleanup needed)
  // --memory and --cpus cap resource usage — real sandboxing, enforced by the OS
  // --network none — the container gets NO network access at all, so user code
  //   can't phone home, download things, or attack other services
  const dockerCmd = [
    'docker run --rm',
    `-v "${runDir}:/sim/work"`,
    '--memory=128m',
    '--cpus=0.5',
    '--network none',
    DOCKER_IMAGE,
    'sh -c "cd /sim/work && iverilog -o sim.out design.v testbench.v && vvp sim.out"',
  ].join(' ');

  try {
    const { stdout } = await execAsync(dockerCmd, { timeout: SIMULATION_TIMEOUT_MS });

    let vcdContent = null;
    try {
      vcdContent = await fs.readFile(vcdPath, 'utf-8');
    } catch {
      // No VCD generated — fine if testbench doesn't dump
    }

    return {
      success: true,
      stdout,
      vcd: vcdContent,
    };
  } catch (err) {
    const isCompileError = (err.stderr || '').includes('error') && !(err.stderr || '').includes('vvp');

    return {
      success: false,
      stage: isCompileError ? 'compile' : 'runtime',
      error: err.stderr || err.message,
    };
  }
};

module.exports = { simulateVerilog };