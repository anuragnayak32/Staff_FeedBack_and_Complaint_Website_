const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const User = require('./models/User');

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  // Create admin if not exists
  const adminExists = await User.findOne({ role: 'admin' });
  if (!adminExists) {
    await User.create({
      name: 'System_Admin',
      email: 'admin@neoconnect.com',
      password: 'Admin@NeoConnect123',
      role: 'admin',
      department: 'IT'
    });
    console.log('✅ Admin created: admin@neoconnect.com / Admin@NeoConnect123');
  } else {
    console.log('ℹ️ Admin already exists');
  }

  // Optionally create sample secretariat
  const secExists = await User.findOne({ role: 'secretariat' });
  if (!secExists) {
    await User.create({
      name: 'Anurag Sah',
      email: 'secretariat@neoconnect.com',
      password: 'Secretariat@123',
      role: 'secretariat',
      department: 'HR'
    });
    console.log('✅ Secretariat created: secretariat@neoconnect.com / Secretariat@123');
  }

  // Sample case manager
  const cmExists = await User.findOne({ role: 'case_manager' });
  if (!cmExists) {
    await User.create({
      name: 'Subhash Nayak',
      email: 'casemanager@neoconnect.com',
      password: 'CaseManager@123',
      role: 'case_manager',
      department: 'Operations'
    });
    console.log('✅ Case Manager created: casemanager@neoconnect.com / CaseManager@123');
  }

  await mongoose.disconnect();
  console.log('Done!');
}

seed().catch(console.error);
