const multer = require('multer');
const path = require('path');
const fs = require('fs');

const ensureDir = (dir) => { if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); };

const caseStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/cases';
    ensureDir(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`);
  }
});

const minutesStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/minutes';
    ensureDir(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|gif|pdf/;
  const ext = allowed.test(path.extname(file.originalname).toLowerCase());
  const mime = allowed.test(file.mimetype);
  if (ext && mime) cb(null, true);
  else cb(new Error('Only images and PDFs are allowed'));
};

exports.uploadCaseFile = multer({ storage: caseStorage, fileFilter, limits: { fileSize: 10 * 1024 * 1024 } });
exports.uploadMinutes = multer({ storage: minutesStorage, fileFilter: (req, file, cb) => {
  if (file.mimetype === 'application/pdf') cb(null, true);
  else cb(new Error('Only PDFs allowed for minutes'));
}, limits: { fileSize: 20 * 1024 * 1024 } });
