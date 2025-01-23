const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3002;

// Ensure upload directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Use CORS middleware to allow all domains
app.use(cors());

// Serve the 'uploads' directory as static
app.use('/uploads', express.static(uploadDir));

// Set storage engine
const storage = multer.diskStorage({
  destination: uploadDir,
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  },
});

// Initialize upload without file type restrictions
const upload = multer({
  storage: storage,
  limits: { fileSize: 10000000 }, // Optional: Limit file size to 10MB
}).single('myFile');

// Route to list uploaded files
app.get('/files', (req, res) => {
  fs.readdir(uploadDir, (err, files) => {
    if (err) {
      return res.status(500).send('Unable to scan directory');
    }
    const fileUrls = files.map(file => `${req.protocol}://${req.get('host')}/uploads/${file}`);
    res.status(200).json({ files: fileUrls });
  });
});

// Upload endpoint
app.post('/upload', (req, res) => {
  upload(req, res, (err) => {
    if (err) {
      res.status(400).send(err.message || 'An error occurred during upload');
    } else {
      if (!req.file) {
        res.status(400).send('No file selected');
      } else {
        const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
        res.status(200).json({ message: 'File uploaded successfully', file: fileUrl });
      }
    }
  });
});

// Start server
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
