const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  text: { type: String, required: true },
  addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  addedByName: String,
  createdAt: { type: Date, default: Date.now }
});

const caseSchema = new mongoose.Schema({
  trackingId: { type: String, unique: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: {
    type: String,
    enum: ['Safety', 'Policy', 'Facilities', 'HR', 'Other'],
    required: true
  },
  department: { type: String, required: true },
  location: { type: String },
  severity: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    required: true
  },
  status: {
    type: String,
    enum: ['New', 'Assigned', 'In Progress', 'Pending', 'Resolved', 'Escalated'],
    default: 'New'
  },
  isAnonymous: { type: Boolean, default: false },
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  submitterName: String,
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assignedAt: Date,
  lastResponseAt: Date,
  resolvedAt: Date,
  escalatedAt: Date,
  reminderSentAt: Date,
  attachments: [{ filename: String, originalName: String, mimetype: String }],
  notes: [noteSchema],
  resolution: String,
  impactStatement: String,
  actionTaken: String,
  isPublic: { type: Boolean, default: false }
}, { timestamps: true });

// Auto-generate tracking ID
caseSchema.pre('save', async function (next) {
  if (!this.trackingId) {
    const year = new Date().getFullYear();
    const count = await mongoose.model('Case').countDocuments();
    this.trackingId = `NEO-${year}-${String(count + 1).padStart(3, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Case', caseSchema);
