const prisma = require('../utils/prismaClient');

// Helper: confirm a project belongs to the requesting user before touching its files
const verifyProjectOwnership = async (projectId, userId) => {
  const project = await prisma.project.findFirst({ where: { id: projectId, userId } });
  return project;
};

const addFile = async (req, res) => {
  const { id: projectId } = req.params;
  const { filename, content, fileType } = req.body;
  const userId = req.user.userId;

  if (!filename || fileType === undefined) {
    return res.status(400).json({ error: 'filename and fileType are required' });
  }
  if (!['design', 'testbench'].includes(fileType)) {
    return res.status(400).json({ error: 'fileType must be "design" or "testbench"' });
  }

  try {
    const project = await verifyProjectOwnership(projectId, userId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const file = await prisma.projectFile.create({
      data: { projectId, filename, content: content || '', fileType },
    });
    res.status(201).json(file);
  } catch (err) {
    console.error('Add file error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const listFiles = async (req, res) => {
  const { id: projectId } = req.params;
  const userId = req.user.userId;

  try {
    const project = await verifyProjectOwnership(projectId, userId);
  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }
    const files = await prisma.projectFile.findMany({
      where: { projectId },
      orderBy: { createdAt: 'asc' },
    });
    res.json(files);
  } catch (err) {
    console.error('List files error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const updateFile = async (req, res) => {
  const { id: projectId, fileId } = req.params;
  const { content, filename } = req.body;
  const userId = req.user.userId;


  try {
    // Confirm the file actually belongs to this project before updating
    const project = await verifyProjectOwnership(projectId, userId);
  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }
    const existingFile = await prisma.projectFile.findFirst({ where: { id: fileId, projectId } });
    if (!existingFile) {
      return res.status(404).json({ error: 'File not found' });
    }

    const updated = await prisma.projectFile.update({
      where: { id: fileId },
      data: {
        ...(content !== undefined && { content }),
        ...(filename !== undefined && { filename }),
      },
    });
    res.json(updated);
  } catch (err) {
    console.error('Update file error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const deleteFile = async (req, res) => {
  const { id: projectId, fileId } = req.params;
  const userId = req.user.userId;

  try {
    const project = await verifyProjectOwnership(projectId, userId);
  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }
    const existingFile = await prisma.projectFile.findFirst({ where: { id: fileId, projectId } });
    if (!existingFile) {
      return res.status(404).json({ error: 'File not found' });
    }
    await prisma.projectFile.delete({ where: { id: fileId } });
    res.status(204).send();
  } catch (err) {
    console.error('Delete file error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getFile = async (req, res) => {
  const { id: projectId, fileId } = req.params;
  const userId = req.user.userId;

  try {
    const project = await verifyProjectOwnership(projectId, userId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    const file = await prisma.projectFile.findFirst({ where: { id: fileId, projectId } });
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }
    res.json(file);
  } catch (err) {
    console.error('Get file error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { addFile, listFiles, getFile, updateFile, deleteFile };