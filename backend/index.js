const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

if (!fs.existsSync('./uploads')) {
  fs.mkdirSync('./uploads');
}

const issueRoutes = require('./src/routes/issueRoutes');
const authRoutes = require('./src/routes/authRoutes');

app.use('/api/issues', issueRoutes);
app.use('/api/auth', authRoutes);
// Health check / keep-alive endpoint — used by uptime monitor
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', time: new Date().toISOString() });
});
app.get('/', (req, res) => {
  res.json({ message: 'Community Hero API running' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});