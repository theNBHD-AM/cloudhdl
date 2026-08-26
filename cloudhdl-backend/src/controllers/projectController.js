const prisma = require('../utils/prismaClient');
const createProject = async (req, res) => {
  const { title } = req.body;
  const userId = req.user.userId; // comes from the JWT, set by requireAuth middleware
  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }
  try {
    const project = await prisma.project.create({
      data: { title, userId },
    });
    res.status(201).json(project);
  } catch (err) {
    console.error('Create project error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
const listProjects = async (req, res) => {
  const userId = req.user.userId;
  try {
    const projects = await prisma.project.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    res.json(projects);
  } catch (err) {
    console.error('List projects error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
const getProject = async (req, res) => {
  const userId = req.user.userId;
  const { id } = req.params;
  try {
    const project = await prisma.project.findFirst({
      where: { id, userId }, // important: filter by userId too, so users can't fetch someone else's project by guessing an ID
      include: {
        files: { orderBy: { createdAt: 'asc' } },
        simulationRuns: { orderBy: { runAt: 'desc' } },
      },
    });
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json(project);
  } catch (err) {
    console.error('Get project error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { createProject, listProjects, getProject };