const { db } = require('../firebase');
const fs = require('fs');
const axios = require('axios');
const sharp = require('sharp');

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function imageToBase64(filePath) {
  try {
    const resizedBuffer = await sharp(filePath)
      .resize(800, 600, { fit: 'inside' })
      .jpeg({ quality: 70 })
      .toBuffer();
    const base64 = resizedBuffer.toString('base64');
    return `data:image/jpeg;base64,${base64}`;
  } catch (err) {
    console.error('Base64 conversion error:', err.message);
    return null;
  }
}

async function analyzeImageWithGemini(imagePath) {
  try {
    console.log('Analyzing image with Gemini...');
    await sleep(2000);

    const imageData = fs.readFileSync(imagePath);
    const base64Image = imageData.toString('base64');

    const ext = imagePath.split('.').pop().toLowerCase();
    const mimeType = ext === 'png' ? 'image/png' :
                     ext === 'gif' ? 'image/gif' :
                     ext === 'webp' ? 'image/webp' : 'image/jpeg';

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [{
          parts: [
            {
              text: `You are analyzing a community issue photo.
Return ONLY a valid JSON object with exactly these fields, no extra text, no markdown:
{
  "category": "one of: Pothole, Broken Streetlight, Water Leakage, Garbage, Damaged Infrastructure, Other",
  "severity": "one of: Low, Medium, High",
  "description": "one sentence describing what you see in the photo"
}`
            },
            {
              inline_data: {
                mime_type: mimeType,
                data: base64Image
              }
            }
          ]
        }]
      },
      { timeout: 30000 }
    );

    const text = response.data.candidates[0].content.parts[0].text;
    console.log('Gemini raw response:', text);

    const clean = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);

    const validCategories = ['Pothole', 'Broken Streetlight', 'Water Leakage', 'Garbage', 'Damaged Infrastructure', 'Other'];
    const validSeverities = ['Low', 'Medium', 'High'];

    return {
      category: validCategories.includes(parsed.category) ? parsed.category : 'Other',
      severity: validSeverities.includes(parsed.severity) ? parsed.severity : 'Medium',
      description: parsed.description || 'Community issue reported by citizen'
    };

  } catch (err) {
    console.error('Gemini error:', err.message);
    if (err.response) {
      console.error('Gemini status:', err.response.status);
      console.error('Gemini data:', JSON.stringify(err.response.data));
    }
    return {
      category: 'Other',
      severity: 'Medium',
      description: 'Community issue reported by citizen'
    };
  }
}

async function getAllIssues(req, res) {
  try {
    const snapshot = await db.collection('issues')
      .orderBy('createdAt', 'desc')
      .get();

    const issues = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json(issues);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function createIssue(req, res) {
  try {
    const { title, latitude, longitude } = req.body;

    if (!title || !latitude || !longitude) {
      return res.status(400).json({
        error: 'Title, latitude and longitude are required'
      });
    }

    let category = 'Other';
    let severity = 'Medium';
    let description = title;
    let imageBase64 = null;

    if (req.file) {
      console.log('Image received, processing...');
      imageBase64 = await imageToBase64(req.file.path);
      console.log('Base64 conversion done');

      const analysis = await analyzeImageWithGemini(req.file.path);
      category = analysis.category;
      severity = analysis.severity;
      description = analysis.description;
      console.log('Gemini result:', { category, severity, description });

      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting local file:', err);
        else console.log('Local file deleted');
      });
    }

    const newIssue = {
      title,
      description,
      category,
      severity,
      status: 'Reported',
      imageBase64,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      upvotes: 0,
      votedBy: [],
      createdAt: new Date().toISOString()
    };

    const docRef = await db.collection('issues').add(newIssue);
    console.log('Issue saved to Firestore:', docRef.id);

    res.json({ id: docRef.id, ...newIssue });

  } catch (err) {
    console.error('createIssue error:', err.message);
    res.status(500).json({ error: err.message });
  }
}

async function upvoteIssue(req, res) {
  try {
    const ref = db.collection('issues').doc(req.params.id);
    const doc = await ref.get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Issue not found' });
    }

    const userId = req.user?.uid || req.ip;
    const votedBy = doc.data().votedBy || [];

    if (votedBy.includes(userId)) {
      return res.status(400).json({ error: 'Already upvoted' });
    }

    const newUpvotes = (doc.data().upvotes || 0) + 1;
    const newVotedBy = [...votedBy, userId];

    await ref.update({ upvotes: newUpvotes, votedBy: newVotedBy });

    res.json({ id: doc.id, ...doc.data(), upvotes: newUpvotes, votedBy: newVotedBy });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function updateStatus(req, res) {
  try {
    const { status } = req.body;

    const validStatuses = ['Reported', 'Verified', 'In Progress', 'Resolved'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const ref = db.collection('issues').doc(req.params.id);
    const doc = await ref.get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Issue not found' });
    }

    await ref.update({ status });
    const updated = await ref.get();
    res.json({ id: updated.id, ...updated.data() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function deleteIssue(req, res) {
  try {
    const ref = db.collection('issues').doc(req.params.id);
    const doc = await ref.get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Issue not found' });
    }

    await ref.delete();
    res.json({ message: 'Issue deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  getAllIssues,
  createIssue,
  upvoteIssue,
  updateStatus,
  deleteIssue
};