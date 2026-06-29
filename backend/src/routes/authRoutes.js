// backend/src/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const { db, auth } = require('../firebase');

// REGISTER
router.post('/register', async (req, res) => {
  const { uid, firstName, lastName, email, phone } = req.body;

  if (!uid || !email) {
    return res.status(400).json({ error: 'uid and email are required' });
  }

  try {
    await db.collection('users').doc(uid).set({
      uid,
      firstName: firstName || '',
      lastName: lastName || '',
      displayName: `${firstName || ''} ${lastName || ''}`.trim(),
      email,
      phone: phone || '',
      role: 'citizen',
      createdAt: new Date().toISOString(),
    });

    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Failed to save user data' });
  }
});

// LOGIN
router.post('/login', async (req, res) => {
  const { idToken, email, password } = req.body;

  // ✅ ADMIN LOGIN — check .env credentials directly, no Firebase needed
  if (
    email === process.env.ADMIN_EMAIL &&
    password === process.env.ADMIN_PASSWORD
  ) {
    return res.json({
      token: 'admin-token',
      uid: 'admin',
      email: process.env.ADMIN_EMAIL,
      role: 'admin',
      displayName: 'Admin',
    });
  }

  // 👤 CITIZEN LOGIN — verify Firebase ID token
  if (!idToken) {
    return res.status(400).json({ error: 'idToken is required' });
  }

  try {
    const decoded = await auth.verifyIdToken(idToken);
    const uid = decoded.uid;

    const userDoc = await db.collection('users').doc(uid).get();

    let userData = {
      uid,
      email: decoded.email,
      role: 'citizen',
      displayName: decoded.name || '',
    };

    if (userDoc.exists) {
      userData = { ...userData, ...userDoc.data() };
    }

    res.json({
      token: idToken,
      uid: userData.uid,
      email: userData.email,
      role: userData.role,
      displayName: userData.displayName,
    });
  } catch (err) {
    console.error('Login error:', err.code, err.message);
    res.status(401).json({ error: 'Invalid or expired token' });
  }
});

module.exports = router;