const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

// In-memory stores (demo — reset on server restart)
const otpStore = new Map();    // identifier -> { otp, expiresAt }
const sessionStore = new Map(); // token -> { walletAddress, role, name, aadharNumber }

// POST /api/auth/send-otp
// Body: { identifier: '123456789012', type: 'aadhar' | 'pan' }
router.post('/send-otp', (req, res) => {
    const { identifier, type } = req.body;
    if (!identifier || !type) {
        return res.status(400).json({ error: 'identifier and type are required' });
    }

    const db = req.app.locals.db;
    let citizen;
    if (type === 'aadhar') {
        citizen = db.prepare('SELECT * FROM citizens WHERE aadhar_number = ?').get(identifier);
    } else if (type === 'pan') {
        citizen = db.prepare('SELECT * FROM citizens WHERE pan_number = ?').get(identifier.toUpperCase());
    } else {
        return res.status(400).json({ error: 'type must be aadhar or pan' });
    }

    if (!citizen || !citizen.is_verified) {
        return res.status(404).json({ error: 'Citizen not found in government records' });
    }

    if (!citizen.wallet_address) {
        return res.status(403).json({ error: 'This identity is not linked to a blockchain account yet. Please register first.' });
    }

    // OTP hardcoded to 1234 for demo
    const otp = '1234';
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes
    otpStore.set(identifier, { otp, expiresAt });

    const maskedPhone = citizen.phone ? `XXXXXX${citizen.phone.slice(-4)}` : 'registered mobile';
    console.log(`[Auth] OTP for ${citizen.name}: ${otp}`);

    return res.json({
        success: true,
        name: citizen.name,
        message: `OTP sent to ${maskedPhone}`,
    });
});

// POST /api/auth/verify-otp
// Body: { identifier, type, otp }
router.post('/verify-otp', (req, res) => {
    const { identifier, type, otp } = req.body;
    if (!identifier || !type || !otp) {
        return res.status(400).json({ error: 'identifier, type and otp are required' });
    }

    const stored = otpStore.get(identifier);
    if (!stored) {
        return res.status(400).json({ error: 'No OTP found. Please request a new one.' });
    }
    if (Date.now() > stored.expiresAt) {
        otpStore.delete(identifier);
        return res.status(400).json({ error: 'OTP expired. Please request a new one.' });
    }
    if (stored.otp !== otp) {
        return res.status(400).json({ error: 'Invalid OTP. Please try again.' });
    }

    const db = req.app.locals.db;
    let citizen;
    if (type === 'aadhar') {
        citizen = db.prepare('SELECT * FROM citizens WHERE aadhar_number = ?').get(identifier);
    } else {
        citizen = db.prepare('SELECT * FROM citizens WHERE pan_number = ?').get(identifier.toUpperCase());
    }

    if (!citizen || !citizen.wallet_address) {
        return res.status(400).json({ error: 'Citizen data incomplete' });
    }

    otpStore.delete(identifier);

    const token = uuidv4();
    const sessionData = {
        walletAddress: citizen.wallet_address,
        role: citizen.role,
        name: citizen.name,
        aadharNumber: citizen.aadhar_number,
    };
    sessionStore.set(token, sessionData);

    console.log(`[Auth] Login: ${citizen.name} (${citizen.role}) at ${citizen.wallet_address}`);

    return res.json({
        success: true,
        token,
        walletAddress: citizen.wallet_address,
        role: citizen.role,
        name: citizen.name,
    });
});

// GET /api/auth/me  (pass token as query param or x-auth-token header)
router.get('/me', (req, res) => {
    const token = req.headers['x-auth-token'] || req.query.token;
    if (!token || !sessionStore.has(token)) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    return res.json({ ...sessionStore.get(token), token });
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
    const token = req.headers['x-auth-token'] || req.body.token;
    if (token) sessionStore.delete(token);
    return res.json({ success: true });
});

module.exports = router;
