const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// ==================== STATS ====================

// GET /api/admin/stats
router.get('/stats', (req, res) => {
    try {
        const db = req.app.locals.db;

        const totalCitizens = db.prepare('SELECT COUNT(*) as count FROM citizens').get().count;
        const totalLandRecords = db.prepare('SELECT COUNT(*) as count FROM land_records').get().count;
        const totalBankAccounts = db.prepare('SELECT COUNT(*) as count FROM bank_accounts').get().count;
        const totalTransactions = db.prepare('SELECT COUNT(*) as count FROM transactions').get().count;
        const totalVerifications = db.prepare('SELECT COUNT(*) as count FROM verification_log').get().count;

        const recentVerifications = db.prepare(
            'SELECT verification_id, aadhar_number, verification_type, result, created_at FROM verification_log ORDER BY created_at DESC LIMIT 5'
        ).all();

        const recentTransactions = db.prepare(
            'SELECT transaction_id, buyer_aadhar, seller_aadhar, amount, status, created_at FROM transactions ORDER BY created_at DESC LIMIT 5'
        ).all();

        const recentActivity = [
            ...recentVerifications.map(v => ({ type: 'verification', ...v })),
            ...recentTransactions.map(t => ({ type: 'transaction', ...t }))
        ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 10);

        res.json({
            totalCitizens,
            totalLandRecords,
            totalBankAccounts,
            totalTransactions,
            totalVerifications,
            recentActivity
        });
    } catch (err) {
        console.error('Stats error:', err);
        res.status(500).json({ error: 'Internal server error fetching stats' });
    }
});

// ==================== CITIZENS ====================

// GET /api/admin/citizens
router.get('/citizens', (req, res) => {
    try {
        const db = req.app.locals.db;
        const citizens = db.prepare('SELECT * FROM citizens ORDER BY id ASC').all();
        res.json(citizens);
    } catch (err) {
        console.error('List citizens error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/admin/citizens
router.post('/citizens', (req, res) => {
    try {
        const db = req.app.locals.db;
        const { aadhar_number, pan_number, name, age, dob, gender, address, city, state, phone, email, photo_url, is_verified } = req.body;

        if (!aadhar_number || !pan_number || !name || !age) {
            return res.status(400).json({ error: 'aadhar_number, pan_number, name, and age are required' });
        }

        const result = db.prepare(
            'INSERT INTO citizens (aadhar_number, pan_number, name, age, dob, gender, address, city, state, phone, email, photo_url, is_verified) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        ).run(aadhar_number, pan_number, name, age, dob || null, gender || null, address || null, city || null, state || null, phone || null, email || null, photo_url || null, is_verified !== undefined ? is_verified : 1);

        const citizen = db.prepare('SELECT * FROM citizens WHERE id = ?').get(result.lastInsertRowid);
        res.status(201).json(citizen);
    } catch (err) {
        console.error('Create citizen error:', err);
        if (err.message && err.message.includes('UNIQUE')) {
            return res.status(409).json({ error: 'Citizen with this Aadhar or PAN already exists' });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PUT /api/admin/citizens/:id
router.put('/citizens/:id', (req, res) => {
    try {
        const db = req.app.locals.db;
        const { id } = req.params;
        const { aadhar_number, pan_number, name, age, dob, gender, address, city, state, phone, email, photo_url, is_verified } = req.body;

        const existing = db.prepare('SELECT * FROM citizens WHERE id = ?').get(id);
        if (!existing) {
            return res.status(404).json({ error: 'Citizen not found' });
        }

        db.prepare(
            'UPDATE citizens SET aadhar_number = ?, pan_number = ?, name = ?, age = ?, dob = ?, gender = ?, address = ?, city = ?, state = ?, phone = ?, email = ?, photo_url = ?, is_verified = ? WHERE id = ?'
        ).run(
            aadhar_number || existing.aadhar_number,
            pan_number || existing.pan_number,
            name || existing.name,
            age !== undefined ? age : existing.age,
            dob !== undefined ? dob : existing.dob,
            gender !== undefined ? gender : existing.gender,
            address !== undefined ? address : existing.address,
            city !== undefined ? city : existing.city,
            state !== undefined ? state : existing.state,
            phone !== undefined ? phone : existing.phone,
            email !== undefined ? email : existing.email,
            photo_url !== undefined ? photo_url : existing.photo_url,
            is_verified !== undefined ? is_verified : existing.is_verified,
            id
        );

        const updated = db.prepare('SELECT * FROM citizens WHERE id = ?').get(id);
        res.json(updated);
    } catch (err) {
        console.error('Update citizen error:', err);
        if (err.message && err.message.includes('UNIQUE')) {
            return res.status(409).json({ error: 'Aadhar or PAN number already exists for another citizen' });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE /api/admin/citizens/:id
router.delete('/citizens/:id', (req, res) => {
    try {
        const db = req.app.locals.db;
        const { id } = req.params;

        const existing = db.prepare('SELECT * FROM citizens WHERE id = ?').get(id);
        if (!existing) {
            return res.status(404).json({ error: 'Citizen not found' });
        }

        db.prepare('DELETE FROM citizens WHERE id = ?').run(id);
        res.json({ success: true, message: 'Citizen deleted', id: parseInt(id) });
    } catch (err) {
        console.error('Delete citizen error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ==================== LAND RECORDS ====================

// GET /api/admin/land-records
router.get('/land-records', (req, res) => {
    try {
        const db = req.app.locals.db;
        const records = db.prepare('SELECT * FROM land_records ORDER BY id ASC').all();
        res.json(records);
    } catch (err) {
        console.error('List land records error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/admin/land-records
router.post('/land-records', (req, res) => {
    try {
        const db = req.app.locals.db;
        const { property_pid, survey_number, area, city, state, district, taluk, village, owner_name, owner_aadhar, registration_date, market_value, land_type, has_encumbrance, has_litigation, is_registered_on_chain, latitude, longitude } = req.body;

        if (!property_pid || !survey_number || !area || !city || !state || !owner_name || !owner_aadhar || !market_value) {
            return res.status(400).json({ error: 'property_pid, survey_number, area, city, state, owner_name, owner_aadhar, and market_value are required' });
        }

        const result = db.prepare(
            'INSERT INTO land_records (property_pid, survey_number, area, city, state, district, taluk, village, owner_name, owner_aadhar, registration_date, market_value, land_type, has_encumbrance, has_litigation, is_registered_on_chain, latitude, longitude) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        ).run(property_pid, survey_number, area, city, state, district || null, taluk || null, village || null, owner_name, owner_aadhar, registration_date || null, market_value, land_type || null, has_encumbrance || 0, has_litigation || 0, is_registered_on_chain || 0, latitude || null, longitude || null);

        const record = db.prepare('SELECT * FROM land_records WHERE id = ?').get(result.lastInsertRowid);
        res.status(201).json(record);
    } catch (err) {
        console.error('Create land record error:', err);
        if (err.message && err.message.includes('UNIQUE')) {
            return res.status(409).json({ error: 'Land record with this PID or survey number already exists' });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PUT /api/admin/land-records/:id
router.put('/land-records/:id', (req, res) => {
    try {
        const db = req.app.locals.db;
        const { id } = req.params;
        const { property_pid, survey_number, area, city, state, district, taluk, village, owner_name, owner_aadhar, registration_date, market_value, land_type, has_encumbrance, has_litigation, is_registered_on_chain, latitude, longitude } = req.body;

        const existing = db.prepare('SELECT * FROM land_records WHERE id = ?').get(id);
        if (!existing) {
            return res.status(404).json({ error: 'Land record not found' });
        }

        db.prepare(
            'UPDATE land_records SET property_pid = ?, survey_number = ?, area = ?, city = ?, state = ?, district = ?, taluk = ?, village = ?, owner_name = ?, owner_aadhar = ?, registration_date = ?, market_value = ?, land_type = ?, has_encumbrance = ?, has_litigation = ?, is_registered_on_chain = ?, latitude = ?, longitude = ? WHERE id = ?'
        ).run(
            property_pid || existing.property_pid,
            survey_number || existing.survey_number,
            area !== undefined ? area : existing.area,
            city || existing.city,
            state || existing.state,
            district !== undefined ? district : existing.district,
            taluk !== undefined ? taluk : existing.taluk,
            village !== undefined ? village : existing.village,
            owner_name || existing.owner_name,
            owner_aadhar || existing.owner_aadhar,
            registration_date !== undefined ? registration_date : existing.registration_date,
            market_value !== undefined ? market_value : existing.market_value,
            land_type !== undefined ? land_type : existing.land_type,
            has_encumbrance !== undefined ? has_encumbrance : existing.has_encumbrance,
            has_litigation !== undefined ? has_litigation : existing.has_litigation,
            is_registered_on_chain !== undefined ? is_registered_on_chain : existing.is_registered_on_chain,
            latitude !== undefined ? latitude : existing.latitude,
            longitude !== undefined ? longitude : existing.longitude,
            id
        );

        const updated = db.prepare('SELECT * FROM land_records WHERE id = ?').get(id);
        res.json(updated);
    } catch (err) {
        console.error('Update land record error:', err);
        if (err.message && err.message.includes('UNIQUE')) {
            return res.status(409).json({ error: 'PID or survey number already exists for another record' });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE /api/admin/land-records/:id
router.delete('/land-records/:id', (req, res) => {
    try {
        const db = req.app.locals.db;
        const { id } = req.params;

        const existing = db.prepare('SELECT * FROM land_records WHERE id = ?').get(id);
        if (!existing) {
            return res.status(404).json({ error: 'Land record not found' });
        }

        db.prepare('DELETE FROM land_records WHERE id = ?').run(id);
        res.json({ success: true, message: 'Land record deleted', id: parseInt(id) });
    } catch (err) {
        console.error('Delete land record error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ==================== BANK ACCOUNTS ====================

// GET /api/admin/bank-accounts
router.get('/bank-accounts', (req, res) => {
    try {
        const db = req.app.locals.db;
        const accounts = db.prepare('SELECT * FROM bank_accounts ORDER BY id ASC').all();
        res.json(accounts);
    } catch (err) {
        console.error('List bank accounts error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/admin/bank-accounts
router.post('/bank-accounts', (req, res) => {
    try {
        const db = req.app.locals.db;
        const { account_number, ifsc, bank_name, holder_name, aadhar_linked, pan_linked, balance, account_type, branch, is_active } = req.body;

        if (!account_number || !ifsc || !bank_name || !holder_name || !aadhar_linked || !pan_linked || balance === undefined) {
            return res.status(400).json({ error: 'account_number, ifsc, bank_name, holder_name, aadhar_linked, pan_linked, and balance are required' });
        }

        const result = db.prepare(
            'INSERT INTO bank_accounts (account_number, ifsc, bank_name, holder_name, aadhar_linked, pan_linked, balance, account_type, branch, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        ).run(account_number, ifsc, bank_name, holder_name, aadhar_linked, pan_linked, balance, account_type || 'Savings', branch || null, is_active !== undefined ? is_active : 1);

        const account = db.prepare('SELECT * FROM bank_accounts WHERE id = ?').get(result.lastInsertRowid);
        res.status(201).json(account);
    } catch (err) {
        console.error('Create bank account error:', err);
        if (err.message && err.message.includes('UNIQUE')) {
            return res.status(409).json({ error: 'Bank account with this account number already exists' });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PUT /api/admin/bank-accounts/:id
router.put('/bank-accounts/:id', (req, res) => {
    try {
        const db = req.app.locals.db;
        const { id } = req.params;
        const { account_number, ifsc, bank_name, holder_name, aadhar_linked, pan_linked, balance, account_type, branch, is_active } = req.body;

        const existing = db.prepare('SELECT * FROM bank_accounts WHERE id = ?').get(id);
        if (!existing) {
            return res.status(404).json({ error: 'Bank account not found' });
        }

        db.prepare(
            'UPDATE bank_accounts SET account_number = ?, ifsc = ?, bank_name = ?, holder_name = ?, aadhar_linked = ?, pan_linked = ?, balance = ?, account_type = ?, branch = ?, is_active = ? WHERE id = ?'
        ).run(
            account_number || existing.account_number,
            ifsc || existing.ifsc,
            bank_name || existing.bank_name,
            holder_name || existing.holder_name,
            aadhar_linked || existing.aadhar_linked,
            pan_linked || existing.pan_linked,
            balance !== undefined ? balance : existing.balance,
            account_type !== undefined ? account_type : existing.account_type,
            branch !== undefined ? branch : existing.branch,
            is_active !== undefined ? is_active : existing.is_active,
            id
        );

        const updated = db.prepare('SELECT * FROM bank_accounts WHERE id = ?').get(id);
        res.json(updated);
    } catch (err) {
        console.error('Update bank account error:', err);
        if (err.message && err.message.includes('UNIQUE')) {
            return res.status(409).json({ error: 'Account number already exists for another account' });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ==================== TRANSACTIONS (read-only) ====================

// GET /api/admin/transactions
router.get('/transactions', (req, res) => {
    try {
        const db = req.app.locals.db;
        const transactions = db.prepare('SELECT * FROM transactions ORDER BY created_at DESC').all();
        res.json(transactions);
    } catch (err) {
        console.error('List transactions error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ==================== VERIFICATIONS (read-only) ====================

// GET /api/admin/verifications
router.get('/verifications', (req, res) => {
    try {
        const db = req.app.locals.db;
        const verifications = db.prepare('SELECT * FROM verification_log ORDER BY created_at DESC').all();
        res.json(verifications);
    } catch (err) {
        console.error('List verifications error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ==================== RESET ====================

// POST /api/admin/reset
router.post('/reset', (req, res) => {
    try {
        const db = req.app.locals.db;

        const resetDb = db.transaction(() => {
            // Reset on-chain flags
            db.prepare('UPDATE land_records SET is_registered_on_chain = 0').run();

            // Clear transactions and verification logs
            db.prepare('DELETE FROM transactions').run();
            db.prepare('DELETE FROM verification_log').run();

            // Re-seed bank balances to original values
            const balances = [
                { account: 'SBI-1001-2024', balance: 5000000 },
                { account: 'HDFC-2002-2024', balance: 8500000 },
                { account: 'ICICI-3003-2024', balance: 25000000 },
                { account: 'AXIS-4004-2024', balance: 12000000 },
                { account: 'BOB-5005-2024', balance: 35000000 },
                { account: 'FED-6006-2024', balance: 3200000 },
                { account: 'PNB-7007-2024', balance: 18000000 },
                { account: 'KOTAK-8008-2024', balance: 6700000 }
            ];

            const updateBalance = db.prepare('UPDATE bank_accounts SET balance = ? WHERE account_number = ?');
            for (const b of balances) {
                updateBalance.run(b.balance, b.account);
            }
        });

        resetDb();

        res.json({
            success: true,
            message: 'Database reset complete. On-chain flags cleared, transactions/verifications wiped, bank balances restored.'
        });
    } catch (err) {
        console.error('Reset error:', err);
        res.status(500).json({ error: 'Internal server error during reset' });
    }
});

module.exports = router;
