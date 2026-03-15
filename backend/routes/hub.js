const express = require('express');
const router = express.Router();
const HubItem = require('../models/HubItem');
const { protect, authorize } = require('../middleware/auth');
const { uploadMinutes } = require('../middleware/upload');

// GET /api/hub — all published hub items
router.get('/', protect, async (req, res) => {
  const { type, search } = req.query;
  let query = { isPublished: true };
  if (type) query.type = type;
  if (search) query.$or = [
    { title: { $regex: search, $options: 'i' } },
    { content: { $regex: search, $options: 'i' } }
  ];
  const items = await HubItem.find(query).populate('createdBy', 'name').sort({ createdAt: -1 });
  res.json(items);
});

// POST /api/hub/digest — quarterly digest
router.post('/digest', protect, authorize('secretariat', 'admin'), async (req, res) => {
  const { title, content, quarter, year } = req.body;
  const item = await HubItem.create({ type: 'digest', title, content, quarter, year, createdBy: req.user._id });
  res.status(201).json(item);
});

// POST /api/hub/impact — impact entry
router.post('/impact', protect, authorize('secretariat', 'admin'), async (req, res) => {
  const { title, whatWasRaised, actionTaken, whatChanged, department } = req.body;
  const item = await HubItem.create({ type: 'impact', title, whatWasRaised, actionTaken, whatChanged, department, createdBy: req.user._id });
  res.status(201).json(item);
});

// POST /api/hub/minutes — upload meeting minutes PDF
router.post('/minutes', protect, authorize('secretariat', 'admin'), uploadMinutes.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'PDF file required' });
  const { title, meetingDate } = req.body;
  const item = await HubItem.create({
    type: 'minutes',
    title,
    meetingDate,
    filename: req.file.filename,
    originalName: req.file.originalname,
    createdBy: req.user._id
  });
  res.status(201).json(item);
});

// DELETE /api/hub/:id
router.delete('/:id', protect, authorize('secretariat', 'admin'), async (req, res) => {
  await HubItem.findByIdAndDelete(req.params.id);
  res.json({ message: 'Deleted' });
});

module.exports = router;
