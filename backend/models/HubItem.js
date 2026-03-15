const mongoose = require('mongoose');

const hubItemSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['digest', 'impact', 'minutes', 'announcement'],
    required: true
  },
  title: { type: String, required: true },
  content: String,
  quarter: String,
  year: Number,
  // For impact tracking
  whatWasRaised: String,
  actionTaken: String,
  whatChanged: String,
  department: String,
  // For minutes
  meetingDate: Date,
  filename: String,
  originalName: String,
  // Meta
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isPublished: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('HubItem', hubItemSchema);
