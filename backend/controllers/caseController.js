const Case = require('../models/Case');

const WORKING_DAYS_LIMIT = 7;

function addWorkingDays(date, days) {
  let count = 0;
  let current = new Date(date);
  while (count < days) {
    current.setDate(current.getDate() + 1);
    const day = current.getDay();
    if (day !== 0 && day !== 6) count++;
  }
  return current;
}

exports.checkEscalations = async () => {
  const assignedCases = await Case.find({
    status: { $in: ['Assigned', 'In Progress'] },
    assignedAt: { $exists: true }
  });

  const now = new Date();
  for (const c of assignedCases) {
    const deadline = addWorkingDays(c.assignedAt, WORKING_DAYS_LIMIT);
    const lastActivity = c.lastResponseAt || c.assignedAt;
    const activityDeadline = addWorkingDays(lastActivity, WORKING_DAYS_LIMIT);

    if (now > activityDeadline && c.status !== 'Escalated') {
      c.status = 'Escalated';
      c.escalatedAt = now;
      await c.save();
      console.log(`Case ${c.trackingId} escalated`);
    }
  }
};
