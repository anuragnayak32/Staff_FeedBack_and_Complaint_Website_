const express = require('express');
const router = express.Router();
const Case = require('../models/Case');
const { protect, authorize } = require('../middleware/auth');

// GET /api/analytics/overview
router.get('/overview', protect, authorize('secretariat', 'admin'), async (req, res) => {
  const [byStatus, byCategory, byDepartment, bySeverity, total, resolved, escalated] = await Promise.all([
    Case.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Case.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }]),
    Case.aggregate([{ $group: { _id: '$department', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
    Case.aggregate([{ $group: { _id: '$severity', count: { $sum: 1 } } }]),
    Case.countDocuments(),
    Case.countDocuments({ status: 'Resolved' }),
    Case.countDocuments({ status: 'Escalated' })
  ]);

  res.json({ byStatus, byCategory, byDepartment, bySeverity, total, resolved, escalated });
});

// GET /api/analytics/hotspots — departments with 5+ same-category cases
router.get('/hotspots', protect, authorize('secretariat', 'admin'), async (req, res) => {
  const hotspots = await Case.aggregate([
    { $match: { status: { $nin: ['Resolved'] } } },
    { $group: { _id: { department: '$department', category: '$category' }, count: { $sum: 1 } } },
    { $match: { count: { $gte: 5 } } },
    { $sort: { count: -1 } }
  ]);
  res.json(hotspots);
});

// GET /api/analytics/trends — monthly case trends
router.get('/trends', protect, authorize('secretariat', 'admin'), async (req, res) => {
  const trends = await Case.aggregate([
    {
      $group: {
        _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
    { $limit: 12 }
  ]);
  res.json(trends);
});

module.exports = router;
