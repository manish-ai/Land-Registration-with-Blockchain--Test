const express = require('express');
const router = express.Router();

// POST /api/land/lookup
router.post('/lookup', (req, res) => {
    try {
        const { propertyPID } = req.body;
        const db = req.app.locals.db;

        if (!propertyPID) {
            return res.status(400).json({ found: false, message: 'Property PID is required' });
        }

        const record = db.prepare('SELECT * FROM land_records WHERE property_pid = ?').get(propertyPID);

        if (!record) {
            return res.json({
                found: false,
                message: 'No land record found with this PID in State Revenue Department'
            });
        }

        res.json({
            found: true,
            record: {
                property_pid: record.property_pid,
                survey_number: record.survey_number,
                area: record.area,
                city: record.city,
                state: record.state,
                district: record.district,
                taluk: record.taluk,
                village: record.village,
                owner_name: record.owner_name,
                owner_aadhar: record.owner_aadhar,
                registration_date: record.registration_date,
                market_value: record.market_value,
                land_type: record.land_type,
                has_encumbrance: record.has_encumbrance,
                has_litigation: record.has_litigation,
                is_registered_on_chain: record.is_registered_on_chain,
                latitude: record.latitude,
                longitude: record.longitude
            },
            message: 'Land record found in State Revenue Department'
        });
    } catch (err) {
        console.error('Land lookup error:', err);
        res.status(500).json({ found: false, message: 'Internal server error during land lookup' });
    }
});

// POST /api/land/check-duplicate
router.post('/check-duplicate', (req, res) => {
    try {
        const { propertyPID, surveyNumber } = req.body;
        const db = req.app.locals.db;

        if (!propertyPID) {
            return res.status(400).json({ error: 'Property PID is required' });
        }

        const record = db.prepare('SELECT is_registered_on_chain FROM land_records WHERE property_pid = ?').get(propertyPID);

        if (!record) {
            return res.json({
                isDuplicate: false,
                message: 'Land record not found in government database'
            });
        }

        if (record.is_registered_on_chain) {
            return res.json({
                isDuplicate: true,
                message: 'This land is already registered on the blockchain'
            });
        }

        // Also check by survey number if provided
        if (surveyNumber) {
            const surveyRecord = db.prepare('SELECT is_registered_on_chain FROM land_records WHERE survey_number = ? AND property_pid != ?').get(surveyNumber, propertyPID);
            if (surveyRecord && surveyRecord.is_registered_on_chain) {
                return res.json({
                    isDuplicate: true,
                    message: 'A land with this survey number is already registered on the blockchain'
                });
            }
        }

        res.json({
            isDuplicate: false,
            message: 'Land is not yet registered on blockchain'
        });
    } catch (err) {
        console.error('Duplicate check error:', err);
        res.status(500).json({ error: 'Internal server error during duplicate check' });
    }
});

// POST /api/land/mark-registered
router.post('/mark-registered', (req, res) => {
    try {
        const { propertyPID, blockchainTxHash } = req.body;
        const db = req.app.locals.db;

        if (!propertyPID) {
            return res.status(400).json({ success: false, message: 'Property PID is required' });
        }

        const result = db.prepare('UPDATE land_records SET is_registered_on_chain = 1 WHERE property_pid = ?').run(propertyPID);

        if (result.changes === 0) {
            return res.status(404).json({
                success: false,
                message: 'Land record not found with this PID'
            });
        }

        res.json({
            success: true,
            message: 'Land record marked as registered on blockchain',
            propertyPID,
            blockchainTxHash: blockchainTxHash || null
        });
    } catch (err) {
        console.error('Mark registered error:', err);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

module.exports = router;
