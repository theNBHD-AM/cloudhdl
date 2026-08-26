const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/authMiddleware');
const { createProject, listProjects, getProject } = require('../controllers/projectController');
const { addFile, listFiles, getFile, updateFile, deleteFile } = require('../controllers/fileController');

router.use(requireAuth);

router.post('/', createProject);
router.get('/', listProjects);
router.get('/:id', getProject);

router.post('/:id/files', addFile);
router.get('/:id/files', listFiles);
router.get('/:id/files/:fileId', getFile);
router.put('/:id/files/:fileId', updateFile);
router.delete('/:id/files/:fileId', deleteFile);

module.exports = router; 