const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/authMiddleware');
const { runSimulation } = require('../controllers/simulateController');

router.post('/', requireAuth, runSimulation);

module.exports = router;