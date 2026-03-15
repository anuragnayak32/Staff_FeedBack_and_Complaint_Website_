const express = require('express');
const router = express.Router();
const Case = require('../models/Case');
const { protect, authorize } = require('../middleware/auth');
const { uploadCaseFile } = require('../middleware/upload');

// POST /api/cases — staff submits a case
router.post('/', protect, authorize('staff', 'secretariat', 'case_manager', 'admin'), uploadCaseFile.array('attachments', 5), async (req, res) => {
  const { title, description, category, department, location, severity, isAnonymous } = req.body;
  const anonymous = isAnonymous === 'true' || isAnonymous === true;

  const attachments = (req.files || []).map(f => ({
    filename: f.filename,
    originalName: f.originalname,
    mimetype: f.mimetype
  }));

  const caseData = {
    title,
    description,
    category,
    department,
    location,
    severity,
    isAnonymous: anonymous,
    attachments
  };

  if (!anonymous) {
    caseData.submittedBy = req.user._id;
    caseData.submitterName = req.user.name;
  }

  const newCase = await Case.create(caseData);
  res.status(201).json(newCase);
});

// GET /api/cases — role-based view
router.get('/', protect, async (req, res) => {
  const { status, category, department, severity, search } = req.query;
  let query = {};

  if (req.user.role === 'staff') {
    query.submittedBy = req.user._id;
  } else if (req.user.role === 'case_manager') {
    query.assignedTo = req.user._id;
  }
  // secretariat and admin see all

  if (status) query.status = status;
  if (category) query.category = category;
  if (department) query.department = department;
  if (severity) query.severity = severity;
  if (search) query.$or = [
    { title: { $regex: search, $options: 'i' } },
    { trackingId: { $regex: search, $options: 'i' } }
  ];

  const cases = await Case.find(query)
    .populate('assignedTo', 'name email')
    .populate('submittedBy', 'name email')
    .sort({ createdAt: -1 });

  res.json(cases);
});

// GET /api/cases/:id
router.get('/:id', protect, async (req, res) => {
  const c = await Case.findById(req.params.id)
    .populate('assignedTo', 'name email department')
    .populate('submittedBy', 'name email')
    .populate('notes.addedBy', 'name');

  if (!c) return res.status(404).json({ message: 'Case not found' });

  // Staff can only view own non-anonymous cases
  if (req.user.role === 'staff' && c.submittedBy?._id.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Access denied' });
  }

  res.json(c);
});

// PUT /api/cases/:id/assign — secretariat assigns case manager
router.put('/:id/assign', protect, authorize('secretariat', 'admin'), async (req, res) => {
  const { assignedTo } = req.body;
  const c = await Case.findById(req.params.id);
  if (!c) return res.status(404).json({ message: 'Case not found' });

  c.assignedTo = assignedTo;
  c.status = 'Assigned';
  c.assignedAt = new Date();
  await c.save();
  const populated = await c.populate('assignedTo', 'name email');
  res.json(populated);
});

// PUT /api/cases/:id/status — case manager updates status
router.put('/:id/status', protect, authorize('case_manager', 'secretariat', 'admin'), async (req, res) => {
  const { status, note, resolution, actionTaken, impactStatement } = req.body;
  const c = await Case.findById(req.params.id);
  if (!c) return res.status(404).json({ message: 'Case not found' });

  if (req.user.role === 'case_manager' && c.assignedTo?.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Not your case' });
  }

  c.status = status;
  c.lastResponseAt = new Date();

  if (status === 'Resolved') {
    c.resolvedAt = new Date();
    if (resolution) c.resolution = resolution;
    if (actionTaken) c.actionTaken = actionTaken;
    if (impactStatement) c.impactStatement = impactStatement;
  }

  if (note) {
    c.notes.push({ text: note, addedBy: req.user._id, addedByName: req.user.name });
  }

  await c.save();
  res.json(c);
});

// POST /api/cases/:id/notes — add a note
router.post('/:id/notes', protect, authorize('case_manager', 'secretariat', 'admin'), async (req, res) => {
  const { text } = req.body;
  const c = await Case.findById(req.params.id);
  if (!c) return res.status(404).json({ message: 'Case not found' });

  c.notes.push({ text, addedBy: req.user._id, addedByName: req.user.name });
  c.lastResponseAt = new Date();
  await c.save();
  res.json(c);
});

// PUT /api/cases/:id/publish — make case public for hub
router.put('/:id/publish', protect, authorize('secretariat', 'admin'), async (req, res) => {
  const c = await Case.findByIdAndUpdate(req.params.id, { isPublic: req.body.isPublic }, { new: true });
  res.json(c);
});

// GET /api/cases/track/:trackingId — public tracking by ID
router.get('/track/:trackingId', protect, async (req, res) => {
  const c = await Case.findOne({ trackingId: req.params.trackingId })
    .populate('assignedTo', 'name')
    .select('-notes -submittedBy');
  if (!c) return res.status(404).json({ message: 'Case not found' });
  res.json(c);
});

module.exports = router;
