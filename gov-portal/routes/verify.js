const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

// POST /api/verify/aadhar
router.post('/aadhar', (req, res) => {
    try {
        const { aadharNumber, name, requestedBy } = req.body;
        const db = req.app.locals.db;

        if (!aadharNumber) {
            return res.status(400).json({ verified: false, reason: 'Aadhar number is required' });
        }

        const citizen = db.prepare('SELECT * FROM citizens WHERE aadhar_number = ?').get(aadharNumber);
        const verificationId = 'VRF-' + uuidv4().substring(0, 8).toUpperCase();

        if (!citizen) {
            // Log failed verification
            db.prepare(
                'INSERT INTO verification_log (verification_id, aadhar_number, verification_type, result, details, requested_by) VALUES (?, ?, ?, ?, ?, ?)'
            ).run(verificationId, aadharNumber, 'AADHAR', 'REJECTED', JSON.stringify({ reason: 'Aadhar number not found in UIDAI records' }), requestedBy || null);

            return res.status(404).json({
                verified: false,
                verificationId,
                reason: 'Aadhar number not found in UIDAI records'
            });
        }

        // Check if citizen is verified (not flagged)
        if (!citizen.is_verified) {
            db.prepare(
                'INSERT INTO verification_log (verification_id, aadhar_number, verification_type, result, details, requested_by) VALUES (?, ?, ?, ?, ?, ?)'
            ).run(verificationId, aadharNumber, 'AADHAR', 'REJECTED', JSON.stringify({ reason: 'Citizen flagged in government records' }), requestedBy || null);

            return res.json({
                verified: false,
                verificationId,
                reason: 'Citizen flagged in government records'
            });
        }

        // Cross-check name if provided
        if (name && name.trim().toLowerCase() !== citizen.name.trim().toLowerCase()) {
            db.prepare(
                'INSERT INTO verification_log (verification_id, aadhar_number, verification_type, result, details, requested_by) VALUES (?, ?, ?, ?, ?, ?)'
            ).run(verificationId, aadharNumber, 'AADHAR', 'REJECTED', JSON.stringify({ reason: 'Name does not match Aadhar records', provided: name, expected: citizen.name }), requestedBy || null);

            return res.json({
                verified: false,
                verificationId,
                reason: 'Name does not match Aadhar records'
            });
        }

        // Verification successful
        db.prepare(
            'INSERT INTO verification_log (verification_id, aadhar_number, verification_type, result, details, requested_by) VALUES (?, ?, ?, ?, ?, ?)'
        ).run(verificationId, aadharNumber, 'AADHAR', 'VERIFIED', JSON.stringify({ name: citizen.name, city: citizen.city }), requestedBy || null);

        res.json({
            verified: true,
            verificationId,
            citizen: {
                name: citizen.name,
                age: citizen.age,
                gender: citizen.gender,
                city: citizen.city,
                state: citizen.state,
                photo_url: citizen.photo_url
            },
            message: 'Identity verified against UIDAI records'
        });
    } catch (err) {
        console.error('Aadhar verification error:', err);
        res.status(500).json({ verified: false, reason: 'Internal server error during verification' });
    }
});

// POST /api/verify/pan
router.post('/pan', (req, res) => {
    try {
        const { panNumber, name, requestedBy } = req.body;
        const db = req.app.locals.db;

        if (!panNumber) {
            return res.status(400).json({ verified: false, reason: 'PAN number is required' });
        }

        const citizen = db.prepare('SELECT * FROM citizens WHERE pan_number = ?').get(panNumber);
        const verificationId = 'VRF-' + uuidv4().substring(0, 8).toUpperCase();

        if (!citizen) {
            db.prepare(
                'INSERT INTO verification_log (verification_id, aadhar_number, verification_type, result, details, requested_by) VALUES (?, ?, ?, ?, ?, ?)'
            ).run(verificationId, panNumber, 'PAN', 'REJECTED', JSON.stringify({ reason: 'PAN number not found in Income Tax records' }), requestedBy || null);

            return res.status(404).json({
                verified: false,
                verificationId,
                reason: 'PAN number not found in Income Tax records'
            });
        }

        // Cross-check name if provided
        if (name && name.trim().toLowerCase() !== citizen.name.trim().toLowerCase()) {
            db.prepare(
                'INSERT INTO verification_log (verification_id, aadhar_number, verification_type, result, details, requested_by) VALUES (?, ?, ?, ?, ?, ?)'
            ).run(verificationId, citizen.aadhar_number, 'PAN', 'REJECTED', JSON.stringify({ reason: 'Name does not match PAN records', provided: name, expected: citizen.name }), requestedBy || null);

            return res.json({
                verified: false,
                verificationId,
                reason: 'Name does not match PAN records'
            });
        }

        // Verification successful
        db.prepare(
            'INSERT INTO verification_log (verification_id, aadhar_number, verification_type, result, details, requested_by) VALUES (?, ?, ?, ?, ?, ?)'
        ).run(verificationId, citizen.aadhar_number, 'PAN', 'VERIFIED', JSON.stringify({ name: citizen.name, panStatus: 'Active' }), requestedBy || null);

        res.json({
            verified: true,
            verificationId,
            panStatus: 'Active',
            citizen: {
                name: citizen.name,
                pan_number: citizen.pan_number
            },
            message: 'PAN verified against Income Tax Department records'
        });
    } catch (err) {
        console.error('PAN verification error:', err);
        res.status(500).json({ verified: false, reason: 'Internal server error during verification' });
    }
});

// GET /api/verify/aadhar-by-id/:verificationId
router.get('/aadhar-by-id/:verificationId', (req, res) => {
    try {
        const { verificationId } = req.params;
        const db = req.app.locals.db;

        const log = db.prepare(
            "SELECT aadhar_number FROM verification_log WHERE verification_id = ? AND verification_type = 'AADHAR' AND result = 'VERIFIED' ORDER BY created_at DESC LIMIT 1"
        ).get(verificationId);

        if (!log) {
            return res.status(404).json({ found: false, reason: 'Verification ID not found' });
        }

        res.json({ found: true, aadharNumber: log.aadhar_number });
    } catch (err) {
        console.error('Aadhar-by-id lookup error:', err);
        res.status(500).json({ found: false, reason: 'Internal server error' });
    }
});

module.exports = router;
