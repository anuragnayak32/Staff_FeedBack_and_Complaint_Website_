const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

// GET /api/users — admin only, get all users
router.get('/', protect, authorize('admin'), async (req, res) => {
  const { role, search } = req.query;
  let query = {};
  if (role) query.role = role;
  if (search) query.$or = [
    { name: { $regex: search, $options: 'i' } },
    { email: { $regex: search, $options: 'i' } }
  ];
  const users = await User.find(query).select('-password').sort({ createdAt: -1 });
  res.json(users);
});

// GET /api/users/case-managers — for secretariat to assign
router.get('/case-managers', protect, authorize('admin', 'secretariat'), async (req, res) => {
  const managers = await User.find({ role: 'case_manager', isActive: true }).select('name email department');
  res.json(managers);
});

// POST /api/users — admin creates secretariat or case_manager
router.post('/', protect, authorize('admin'), async (req, res) => {
  const { name, email, password, role, department } = req.body;
  if (!['secretariat', 'case_manager'].includes(role)) {
    return res.status(400).json({ message: 'Can only create secretariat or case_manager accounts' });
  }
  const exists = await User.findOne({ email });
  if (exists) return res.status(400).json({ message: 'Email already exists' });

  const user = await User.create({ name, email, password: password || 'NeoConnect@123', role, department });
  res.status(201).json(user);
});

// PUT /api/users/:id — admin updates user
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  const { name, email, role, department, isActive, password } = req.body;
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  if (user.role === 'admin') return res.status(403).json({ message: 'Cannot modify admin' });

  if (name) user.name = name;
  if (email) user.email = email;
  if (role && role !== 'admin') user.role = role;
  if (department !== undefined) user.department = department;
  if (isActive !== undefined) user.isActive = isActive;
  if (password) user.password = password;

  await user.save();
  res.json(user);
});

// DELETE /api/users/:id — admin deletes user
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  if (user.role === 'admin') return res.status(403).json({ message: 'Cannot delete admin' });
  await user.deleteOne();
  res.json({ message: 'User deleted' });
});

module.exports = router;
