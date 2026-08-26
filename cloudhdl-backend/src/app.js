const express = require('express');
const cors = require('cors');
const simulateRoutes = require('./routes/simulate');

const app = express();
const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
app.use(cors());
app.use(express.json({ limit: '1mb' })); // Verilog code as JSON body

app.use('/api/simulate', simulateRoutes);

app.use('/api/auth', authRoutes);

app.use('/api/projects', projectRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

module.exports = app;