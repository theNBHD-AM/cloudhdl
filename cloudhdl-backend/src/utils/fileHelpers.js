const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

const TEMP_DIR = path.join(__dirname, '../../temp');

// Ensure temp directory exists
const ensureTempDir = async () => {
  try {
    await fs.mkdir(TEMP_DIR, { recursive: true });
  } catch (err) {
    console.error('Failed to create temp dir:', err);
  }
};

// Creates a unique subfolder per simulation run so concurrent requests don't clash
const createRunDir = async () => {
  await ensureTempDir();
  const runId = crypto.randomBytes(8).toString('hex');
  const runDir = path.join(TEMP_DIR, runId);
  await fs.mkdir(runDir);
  return { runId, runDir };
};

// Cleanup after a run — important, or your temp/ folder fills up over time
const cleanupRunDir = async (runDir) => {
  try {
    await fs.rm(runDir, { recursive: true, force: true });
  } catch (err) {
    console.error('Cleanup failed:', err);
  }
};

module.exports = { createRunDir, cleanupRunDir, TEMP_DIR };