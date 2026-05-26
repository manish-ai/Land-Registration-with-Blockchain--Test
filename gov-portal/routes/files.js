const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

// Configure multer storage
const uploadsDir = path.join(__dirname, '..', 'uploads');
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const uniqueName = uuidv4() + path.extname(file.originalname);
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB max
});

// POST /api/files/upload
router.post('/upload', upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded. Use field name "file".' });
        }

        const db = req.app.locals.db;
        const fileId = 'FILE-' + uuidv4().substring(0, 4).toUpperCase();

        // Compute SHA-256 hash of the file
        const fileBuffer = fs.readFileSync(req.file.path);
        const sha256Hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

        // Save to database
        db.prepare(
            'INSERT INTO uploaded_files (file_id, original_name, file_path, file_size, mime_type, sha256_hash, uploaded_by) VALUES (?, ?, ?, ?, ?, ?, ?)'
        ).run(
            fileId,
            req.file.originalname,
            req.file.path,
            req.file.size,
            req.file.mimetype,
            sha256Hash,
            req.body.uploadedBy || null
        );

        res.json({
            fileId,
            url: `http://localhost:4002/api/files/${fileId}`,
            sha256Hash,
            originalName: req.file.originalname,
            size: req.file.size,
            mimeType: req.file.mimetype
        });
    } catch (err) {
        console.error('File upload error:', err);
        res.status(500).json({ error: 'Internal server error during file upload' });
    }
});

// GET /api/files/:fileId
router.get('/:fileId', (req, res) => {
    try {
        const { fileId } = req.params;
        const db = req.app.locals.db;

        const file = db.prepare('SELECT * FROM uploaded_files WHERE file_id = ?').get(fileId);

        if (!file) {
            return res.status(404).json({ error: 'File not found' });
        }

        if (!fs.existsSync(file.file_path)) {
            return res.status(404).json({ error: 'File not found on disk' });
        }

        res.setHeader('Content-Type', file.mime_type || 'application/octet-stream');
        res.setHeader('Content-Disposition', `inline; filename="${file.original_name}"`);
        res.sendFile(file.file_path);
    } catch (err) {
        console.error('File serve error:', err);
        res.status(500).json({ error: 'Internal server error serving file' });
    }
});

module.exports = router;
