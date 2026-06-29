const express = require('express');
const router = express.Router();
const multer = require('multer');
const { requireAdmin, requireAuth } = require('../middleware/auth');
const {
  getAllIssues,
  createIssue,
  upvoteIssue,
  updateStatus,
  deleteIssue
} = require('../controllers/issueController');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }
});

router.get('/', getAllIssues);
router.post('/', requireAuth, upload.single('image'), createIssue);
router.patch('/:id/upvote', requireAuth, upvoteIssue);
router.patch('/:id/status', requireAdmin, updateStatus);
router.delete('/:id', requireAdmin, deleteIssue);

module.exports = router;