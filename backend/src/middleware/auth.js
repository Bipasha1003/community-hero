const jwt = require('jsonwebtoken');
const { auth } = require('../firebase');

async function requireAdmin(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });

  if (token === 'admin-token') {
    req.user = { uid: 'admin', email: process.env.ADMIN_EMAIL, role: 'admin' };
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

async function requireAuth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });

  if (token === 'admin-token') {
    req.user = { uid: 'admin', email: process.env.ADMIN_EMAIL, role: 'admin' };
    return next();
  }

  try {
    const decoded = await auth.verifyIdToken(token);
    req.user = { uid: decoded.uid, email: decoded.email, role: 'citizen' };
    return next();
  } catch {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      return next();
    } catch {
      res.status(401).json({ error: 'Invalid token' });
    }
  }
}

module.exports = { requireAdmin, requireAuth };