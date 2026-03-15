const express = require('express');
const router = express.Router();
const Poll = require('../models/Poll');
const { protect, authorize } = require('../middleware/auth');

// GET /api/polls
router.get('/', protect, async (req, res) => {
  const polls = await Poll.find().sort({ createdAt: -1 });
  res.json(polls);
});

// POST /api/polls — secretariat/admin creates
router.post('/', protect, authorize('secretariat', 'admin'), async (req, res) => {
  const { question, options, endsAt } = req.body;
  if (!question || !options || options.length < 2) {
    return res.status(400).json({ message: 'Question and at least 2 options required' });
  }
  const poll = await Poll.create({
    question,
    options: options.map(text => ({ text, votes: [] })),
    createdBy: req.user._id,
    endsAt
  });
  res.status(201).json(poll);
});

// POST /api/polls/:id/vote — staff votes
router.post('/:id/vote', protect, async (req, res) => {
  const { optionIndex } = req.body;
  const poll = await Poll.findById(req.params.id);
  if (!poll) return res.status(404).json({ message: 'Poll not found' });
  if (!poll.isActive) return res.status(400).json({ message: 'Poll is closed' });

  // Check if already voted
  const alreadyVoted = poll.options.some(opt => opt.votes.some(v => v.toString() === req.user._id.toString()));
  if (alreadyVoted) return res.status(400).json({ message: 'Already voted' });

  if (optionIndex < 0 || optionIndex >= poll.options.length) {
    return res.status(400).json({ message: 'Invalid option' });
  }

  poll.options[optionIndex].votes.push(req.user._id);
  await poll.save();
  res.json(poll);
});

// PUT /api/polls/:id — toggle active
router.put('/:id', protect, authorize('secretariat', 'admin'), async (req, res) => {
  const poll = await Poll.findByIdAndUpdate(req.params.id, { isActive: req.body.isActive }, { new: true });
  res.json(poll);
});

// DELETE /api/polls/:id
router.delete('/:id', protect, authorize('secretariat', 'admin'), async (req, res) => {
  await Poll.findByIdAndDelete(req.params.id);
  res.json({ message: 'Poll deleted' });
});

module.exports = router;
