const { createRunDir, cleanupRunDir } = require('../utils/fileHelpers');
const { simulateVerilog } = require('../utils/simulator');
const prisma = require('../utils/prismaClient');

const runSimulation = async (req, res) => {
  const { projectId } = req.body;
  const userId = req.user.userId;

  if (!projectId) {
    return res.status(400).json({ error: 'projectId is required' });
  }

  try {
    // Confirm ownership
    const project = await prisma.project.findFirst({ where: { id: projectId, userId } });
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Fetch the design and testbench files for this project
    const files = await prisma.projectFile.findMany({ where: { projectId } });
    const designFile = files.find((f) => f.fileType === 'design');
    const testbenchFile = files.find((f) => f.fileType === 'testbench');

    if (!designFile || !testbenchFile) {
      return res.status(400).json({
        error: 'Project must have both a design file and a testbench file to simulate',
      });
    }

    const { runDir } = await createRunDir();

    try {
      const result = await simulateVerilog(designFile.content, testbenchFile.content, runDir);

      await prisma.simulationRun.create({
        data: {
          projectId,
          status: result.success ? 'success' : `${result.stage}_error`,
          stdout: result.stdout || null,
          vcdOutput: result.vcd || null,
          errorMessage: result.error || null,
        },
      });

      res.json(result);
    } finally {
      await cleanupRunDir(runDir);
    }
  } catch (err) {
    console.error('Simulation error:', err);
    res.status(500).json({ error: 'Internal simulation error', details: err.message });
  }
};
module.exports = { runSimulation };